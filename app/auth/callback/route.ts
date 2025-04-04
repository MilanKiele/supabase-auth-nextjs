import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // add things here :)
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError || !data?.user) {
        console.error("Error fetching user data:", userError?.message);
        return NextResponse.redirect(`${origin}/error`);
      }

      // ✅ Check if profile already exists using user_id
      const { data: existingUser, error: checkError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing user:", checkError.message);
        return NextResponse.redirect(`${origin}/error`);
      }

      // ❌ Not found → create profile
      if (!existingUser) {
        let baseUsername = data.user.user_metadata?.user_name ?? "user";

        baseUsername = baseUsername
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-_]/g, "")
          .slice(0, 20);

        let finalUsername = baseUsername;
        let usernameExists = true;

        while (usernameExists) {
          const { data: userCheck } = await supabase
            .from("user_profiles")
            .select("id")
            .eq("username", finalUsername)
            .maybeSingle();

          if (!userCheck) {
            usernameExists = false;
          } else {
            finalUsername = `${baseUsername}-${Math.floor(
              1000 + Math.random() * 9000
            )}`;
          }
        }

        const { error: dbError } = await supabase.from("user_profiles").insert({
          email: data.user.email,
          username: finalUsername,
          user_id: data.user.id, // ✅ KEY: this links the profile to the auth user
        });

        if (dbError) {
          console.error("Error inserting user data:", dbError.message);
          return NextResponse.redirect(`${origin}/error`);
        }
      }
      // :)

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
