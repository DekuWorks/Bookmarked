import { supabase } from "./supabase";
import type { PostDraft } from "../types";

/**
 * Post drafts. Mirrors the server-side of apps/web/src/lib/services/postDrafts.ts
 * against the `post_drafts` table + RLS (own drafts only). The web localStorage
 * autosave is web-only and intentionally omitted.
 */

const DRAFT_SELECT = "id, user_id, body, image_url, book_id, created_at, updated_at";

export type SaveDraftInput = {
  id?: string | null;
  body: string;
  imageUrl?: string | null;
  bookId?: string | null;
};

async function getViewerId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function listDrafts(): Promise<PostDraft[]> {
  const viewerId = await getViewerId();
  if (!viewerId) return [];
  const { data, error } = await supabase
    .from("post_drafts")
    .select(DRAFT_SELECT)
    .eq("user_id", viewerId)
    .order("updated_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as PostDraft[];
}

export async function saveDraft(
  input: SaveDraftInput
): Promise<{ draft?: PostDraft; error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const body = input.body.trim();
  const imageUrl = input.imageUrl?.trim() || null;
  const bookId = input.bookId ?? null;
  if (!body && !imageUrl && !bookId) {
    return { error: "Nothing to save." };
  }

  if (input.id) {
    const { data, error } = await supabase
      .from("post_drafts")
      .update({ body, image_url: imageUrl, book_id: bookId, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .eq("user_id", viewerId)
      .select(DRAFT_SELECT)
      .single();
    if (error) return { error: error.message };
    return { draft: data as PostDraft };
  }

  const { data, error } = await supabase
    .from("post_drafts")
    .insert({ user_id: viewerId, body, image_url: imageUrl, book_id: bookId })
    .select(DRAFT_SELECT)
    .single();
  if (error) return { error: error.message };
  return { draft: data as PostDraft };
}

export async function deleteDraft(id: string): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };
  const { error } = await supabase
    .from("post_drafts")
    .delete()
    .eq("id", id)
    .eq("user_id", viewerId);
  if (error) return { error: error.message };
  return {};
}
