import { parsePreferredLanguage } from "@/lib/utils/profileValidation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function getProfileByUsername(
  username: string
): Promise<Profile | null> {
  const normalized = username.trim();
  if (!normalized) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", normalized)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export function profileIsComplete(profile: Profile | null): boolean {
  return Boolean(profile?.username?.trim());
}

export async function updatePreferredLanguage(
  userId: string,
  preferredLanguage: Profile["preferred_language"]
): Promise<{ error?: string }> {
  const language = parsePreferredLanguage(preferredLanguage);
  if (language !== preferredLanguage) {
    return { error: "Choose a valid language." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      preferred_language: language,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { error: error.message };
  return {};
}
