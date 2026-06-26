import { createClient } from "@/lib/supabase/client";
import {
  applyRememberMePreference,
  parseRememberMeFromForm,
} from "@/lib/auth/rememberMe";

export type AuthActionState = {
  error?: string;
  success?: string;
  redirect?: string;
};

export async function login(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  applyRememberMePreference(parseRememberMeFromForm(formData));

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const redirectTo = String(formData.get("redirect") ?? "").trim();
  return {
    redirect: redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard",
  };
}

export async function signup(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  applyRememberMePreference(parseRememberMeFromForm(formData));

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    return { redirect: "/profile/setup" };
  }

  return {
    success: "Check your email to confirm your account, then log in.",
  };
}

export async function saveProfile(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const username = String(formData.get("username") ?? "").trim();
  if (!username) {
    return { error: "Username is required." };
  }

  const display_name = String(formData.get("display_name") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const genresRaw = String(formData.get("favorite_genres") ?? "");
  const favorite_genres = genresRaw
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username,
      display_name,
      bio,
      favorite_genres,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    return { error: error.message };
  }

  const redirectTo = String(formData.get("redirect") ?? "").trim();
  return {
    redirect: redirectTo.startsWith("/") ? redirectTo : "/dashboard",
  };
}
