import { createClient, resetBrowserClient } from "@/lib/supabase/client";
import {
  applyRememberMePreference,
  parseRememberMeFromForm,
  persistRememberedEmail,
} from "@/lib/auth/rememberMe";
import { authRedirectUrl } from "@/lib/auth/siteUrl";
import {
  parseFavoriteGenres,
  parsePreferredLanguage,
  validateBio,
  validateDisplayName,
  validateUsername,
} from "@/lib/utils/profileValidation";

function normalizeAppPath(path: string): string {
  if (!path.startsWith("/")) return path;
  return path.endsWith("/") ? path : `${path}/`;
}

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

  const remember = parseRememberMeFromForm(formData);
  applyRememberMePreference(remember);
  resetBrowserClient();

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  persistRememberedEmail(remember, email);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      error: "Sign-in succeeded but your session could not be saved. Please try again.",
    };
  }

  const redirectTo = String(formData.get("redirect") ?? "").trim();
  return {
    redirect:
      redirectTo && redirectTo.startsWith("/")
        ? normalizeAppPath(redirectTo)
        : "/reading-room/",
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

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (password.length > 128) {
    return { error: "Password must be 128 characters or fewer." };
  }

  applyRememberMePreference(parseRememberMeFromForm(formData));
  resetBrowserClient();

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: authRedirectUrl("/profile/setup/"),
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    return { redirect: "/profile/setup/" };
  }

  return {
    success: "Check your email to confirm your account, then log in.",
  };
}

export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authRedirectUrl("/reset-password/"),
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success:
      "If an account exists for this email, you will receive reset instructions shortly.",
  };
}

export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!password || !confirm) {
    return { error: "Enter and confirm your new password." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (password.length > 128) {
    return { error: "Password must be 128 characters or fewer." };
  }

  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      error:
        "This reset link is invalid or has expired. Request a new password reset email.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return { redirect: "/reading-room/" };
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

  const usernameResult = validateUsername(String(formData.get("username") ?? ""));
  if (!usernameResult.ok) return { error: usernameResult.error };

  const displayNameResult = validateDisplayName(String(formData.get("display_name") ?? ""));
  if (!displayNameResult.ok) return { error: displayNameResult.error };

  const bioResult = validateBio(String(formData.get("bio") ?? ""));
  if (!bioResult.ok) return { error: bioResult.error };

  if (bioResult.value) {
    const { requireModeration } = await import("@/lib/services/moderateUgc");
    const gate = await requireModeration({
      text: bioResult.value,
      contentType: "PROFILE_BIO",
      contentId: user.id,
    });
    if (gate.error) return { error: gate.error };
  }

  const favorite_genres = parseFavoriteGenres(String(formData.get("favorite_genres") ?? ""));
  const preferred_language = parsePreferredLanguage(
    String(formData.get("preferred_language") ?? "")
  );

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username: usernameResult.value,
      display_name: displayNameResult.value,
      bio: bioResult.value,
      favorite_genres,
      preferred_language,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    return { error: error.message };
  }

  const redirectTo = String(formData.get("redirect") ?? "").trim();
  return {
    success: "Profile saved.",
    redirect: redirectTo.startsWith("/") ? normalizeAppPath(redirectTo) : "/reading-room/",
  };
}
