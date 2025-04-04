"use server";

import { createClient } from "@/utils/supabase/server";

export async function getOwnProfileId() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  return profile.id;
}

export async function createPost(formData: FormData) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "error", message: "Nicht eingeloggt" };
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { status: "error", message: "Profil nicht gefunden" };
  }

  // Get form values
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || !content) {
    return { status: "error", message: "Titel und Inhalt sind erforderlich." };
  }

  // Insert into posts
  const { error: insertError } = await supabase.from("posts").insert({
    title,
    content,
    profile_id: profile.id,
  });

  if (insertError) {
    return { status: "error", message: insertError.message };
  }

  return { status: "success" };
}

// ALLE POSTS LADEN (öffentlich)
export async function getAllPosts() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, content, profile_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "success", posts: data };
}

// EIGENEN POST BEARBEITEN
export async function updateOwnPost(
  postId: number,
  title: string,
  content: string
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "error", message: "Nicht eingeloggt" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { status: "error", message: "Profil nicht gefunden" };
  }

  const { error: updateError } = await supabase
    .from("posts")
    .update({ title, content })
    .eq("id", postId)
    .eq("profile_id", profile.id);

  if (updateError) {
    return { status: "error", message: updateError.message };
  }

  return { status: "success" };
}

// EIGENEN POST LÖSCHEN
export async function deleteOwnPost(postId: number) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { status: "error", message: "Nicht eingeloggt" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { status: "error", message: "Profil nicht gefunden" };
  }

  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("profile_id", profile.id);

  if (deleteError) {
    return { status: "error", message: deleteError.message };
  }

  return { status: "success" };
}
