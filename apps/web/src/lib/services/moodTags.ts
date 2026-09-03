import { createClient } from "@/lib/supabase/client";
import {
  type CustomMoodTag,
  validateCustomMoodTagName,
} from "@bookmarked/utils/customMoodTags";

function mapRow(row: { id: string; name: string; archived_at?: string | null }): CustomMoodTag {
  return { id: row.id, name: row.name, archivedAt: row.archived_at ?? null };
}

export async function listMyMoodTags(): Promise<CustomMoodTag[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_mood_tags")
    .select("id, name, archived_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function createMoodTag(name: string): Promise<{ tag?: CustomMoodTag; error?: string }> {
  const validated = validateCustomMoodTagName(name);
  if (!validated.ok) return { error: validated.error };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data, error } = await supabase
    .from("user_mood_tags")
    .insert({ user_id: user.id, name: validated.name })
    .select("id, name, archived_at")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "You already have that mood tag." };
    return { error: error.message };
  }
  return { tag: mapRow(data) };
}

export async function renameMoodTag(
  tagId: string,
  name: string
): Promise<{ tag?: CustomMoodTag; error?: string }> {
  const validated = validateCustomMoodTagName(name);
  if (!validated.ok) return { error: validated.error };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_mood_tags")
    .update({ name: validated.name, updated_at: new Date().toISOString() })
    .eq("id", tagId)
    .select("id, name, archived_at")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "You already have that mood tag." };
    return { error: error.message };
  }
  return { tag: mapRow(data) };
}

/** Archive only — historical session mood strings stay as-is. */
export async function archiveMoodTag(tagId: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_mood_tags")
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", tagId);

  if (error) return { error: error.message };
  return {};
}
