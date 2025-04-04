"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";

export async function getUserSession() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return { status: "success", user: data?.user };
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const credentials = {
    username: formData.get("username") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const sanitizedUsername = credentials.username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // Leerzeichen zu Bindestrich
    .replace(/[^a-z0-9-_]/g, "") // nur erlaubte Zeichen
    .slice(0, 30); // max Länge

  // 1. Prüfen, ob Username bereits vergeben ist
  const { data: existingUser } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("username", sanitizedUsername)
    .maybeSingle();

  if (existingUser) {
    return {
      status: "Username already taken",
      user: null,
    };
  }

  const { error, data } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        username: sanitizedUsername,
      },
    },
  });

  if (error) {
    return { status: error.message, user: null };
  } else if (data?.user?.identities?.length === 0) {
    return {
      status: "User with this email already exists.",
      user: null,
    };
  }

  revalidatePath("/", "layout");

  return { status: "success", user: data.user };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const credentials = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error, data } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    return { status: error.message, user: null };
  }

  // Prüfen ob user_profiles-Eintrag schon existiert
  const { data: existingUser, error: fetchError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("email", credentials.email)
    .maybeSingle();

  if (fetchError) {
    return { status: fetchError.message, user: null };
  }

  if (!existingUser) {
    // optional: username bereinigen
    let baseUsername = data?.user?.user_metadata?.username ?? "user";
    baseUsername = baseUsername
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-_]/g, "")
      .slice(0, 20);

    let finalUsername = baseUsername;
    let usernameExists = true;

    while (usernameExists) {
      const { data: check } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("username", finalUsername)
        .maybeSingle();

      if (!check) {
        usernameExists = false;
      } else {
        finalUsername = `${baseUsername}-${Math.floor(
          1000 + Math.random() * 9000
        )}`;
      }
    }

    const { error: insertError } = await supabase.from("user_profiles").insert({
      email: credentials.email,
      username: finalUsername,
      user_id: data.user.id,
    });

    if (insertError) {
      return {
        status: insertError.message,
        user: null,
      };
    }
  }

  revalidatePath("/", "layout");

  return { status: "success", user: data.user };
}

export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

export async function signInWithGithub() {
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect("/error");
  } else if (data?.url) {
    redirect(data.url);
  }
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { error, data } = await supabase.auth.resetPasswordForEmail(
    formData.get("email") as string,
    {
      redirectTo: `${origin}/reset-password`,
    }
  );

  if (error) {
    return {
      status: error?.message,
    };
  }
  return { status: "success" };
}

export async function resetPassword(formData: FormData, code: string) {
  const supabase = await createClient();
  const { error: CodeError } = await supabase.auth.exchangeCodeForSession(code);

  if (CodeError) {
    return { status: CodeError?.message };
  }

  const { error } = await supabase.auth.updateUser({
    password: formData.get("password") as string,
  });

  if (error) {
    return { status: error?.message };
  }

  return { status: "success" };
}

export async function deleteUserAccount() {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { status: "error", message: "User not found." };
  }

  // 1. Profil aus user_profiles löschen (wenn vorhanden)
  const { error: profileDeleteError } = await supabase
    .from("user_profiles")
    .delete()
    .eq("email", user.email); // oder .eq("user_id", user.id), je nach Struktur

  if (profileDeleteError) {
    return { status: "error", message: "Profile deletion error." };
  }

  // 2. User aus auth.users löschen
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    user.id
  );

  if (deleteError) {
    return { status: "error", message: "Delete user error." };
  }

  return { status: "success" };
}
