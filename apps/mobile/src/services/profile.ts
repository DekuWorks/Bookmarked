import { supabase } from "./supabase";
import type { Profile } from "../types";
import {
  validateBio,
  validateDisplayName,
  validateReadingGoal,
  validateUsername,
} from "../../../../packages/utils/profileValidation";

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
  username?: string;
  display_name?: string | null;
  bio?: string | null;
  favorite_genres?: string[] | null;
  yearly_reading_goal?: number | null;
  avatar_url?: string | null;
};

export async function updateProfile(
  userId: string,
  patch: ProfileUpdate
): Promise<{ error?: string }> {
  if (patch.yearly_reading_goal != null) {
    const goalResult = validateReadingGoal(patch.yearly_reading_goal);
    if (!goalResult.ok) return { error: goalResult.error };
    patch = { ...patch, yearly_reading_goal: goalResult.value };
  }

  if (patch.username != null) {
    const usernameResult = validateUsername(patch.username);
    if (!usernameResult.ok) return { error: usernameResult.error };
    patch = { ...patch, username: usernameResult.value };
  }

  if (patch.display_name !== undefined) {
    const displayNameResult = validateDisplayName(patch.display_name ?? "");
    if (!displayNameResult.ok) return { error: displayNameResult.error };
    patch = { ...patch, display_name: displayNameResult.value };
  }

  if (patch.bio !== undefined) {
    const bioResult = validateBio(patch.bio ?? "");
    if (!bioResult.ok) return { error: bioResult.error };
    patch = { ...patch, bio: bioResult.value };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: error.message };
  return {};
}

export async function upsertProfile(
  userId: string,
  patch: ProfileUpdate
): Promise<{ error?: string }> {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      ...patch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) return { error: error.message };
  return {};
}

export type ProfileFieldsInput = {
  username: string;
  display_name: string;
  bio: string;
  favorite_genres: string[];
};

export function validateProfileFields(
  input: ProfileFieldsInput
): { ok: true; value: ProfileFieldsInput } | { ok: false; error: string } {
  const usernameResult = validateUsername(input.username);
  if (!usernameResult.ok) return usernameResult;

  const displayNameResult = validateDisplayName(input.display_name);
  if (!displayNameResult.ok) return displayNameResult;

  const bioResult = validateBio(input.bio);
  if (!bioResult.ok) return bioResult;

  return {
    ok: true,
    value: {
      username: usernameResult.value!,
      display_name: displayNameResult.value ?? "",
      bio: bioResult.value ?? "",
      favorite_genres: input.favorite_genres,
    },
  };
}
