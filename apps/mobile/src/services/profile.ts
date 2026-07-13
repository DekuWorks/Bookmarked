import { supabase } from "./supabase";
import type { Profile } from "../types";

/** Mobile profile service — mirrors apps/web/src/lib/services/profile.ts. */

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const normalized = username.trim();
  if (!normalized) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", normalized)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export type ProfileSearchResult = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

/** Search people by username or display name (Search → People). */
export async function searchProfiles(
  query: string,
  excludeId?: string,
  limit = 20
): Promise<ProfileSearchResult[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as ProfileSearchResult[]).filter((p) => p.id !== excludeId);
}

export type ProfileUpdate = {
  display_name?: string | null;
  bio?: string | null;
  favorite_genres?: string[] | null;
  yearly_reading_goal?: number | null;
};

export async function updateProfile(
  userId: string,
  patch: ProfileUpdate
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: error.message };
  return {};
}
