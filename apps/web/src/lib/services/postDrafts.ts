import { createClient } from "@/lib/supabase/client";
import type { PostDraft } from "@/types";

const DRAFT_SELECT = "id, user_id, body, image_url, book_id, created_at, updated_at";

export type SaveDraftInput = {
  id?: string | null;
  body: string;
  imageUrl?: string | null;
  bookId?: string | null;
};

export type ComposerAutosaveState = {
  body: string;
  bookInput: string;
  selectedBookId: string | null;
  gifUrl: string | null;
  gifInput: string;
  remoteImageUrl: string | null;
  activeDraftId: string | null;
};

function autosaveKey(userId: string): string {
  return `bookmarked:post-composer:${userId}`;
}

async function getViewerId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export function loadComposerAutosave(userId: string): ComposerAutosaveState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(autosaveKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as ComposerAutosaveState;
  } catch {
    return null;
  }
}

export function saveComposerAutosave(userId: string, state: ComposerAutosaveState): void {
  if (typeof window === "undefined") return;

  const hasContent =
    state.body.trim().length > 0 ||
    Boolean(state.gifUrl) ||
    Boolean(state.remoteImageUrl) ||
    Boolean(state.selectedBookId) ||
    state.bookInput.trim().length > 0;

  if (!hasContent) {
    window.localStorage.removeItem(autosaveKey(userId));
    return;
  }

  window.localStorage.setItem(autosaveKey(userId), JSON.stringify(state));
}

export function clearComposerAutosave(userId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(autosaveKey(userId));
}

export async function listDrafts(): Promise<PostDraft[]> {
  const viewerId = await getViewerId();
  if (!viewerId) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("post_drafts")
    .select(DRAFT_SELECT)
    .eq("user_id", viewerId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as PostDraft[];
}

export async function getDraft(id: string): Promise<PostDraft | null> {
  const viewerId = await getViewerId();
  if (!viewerId) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("post_drafts")
    .select(DRAFT_SELECT)
    .eq("id", id)
    .eq("user_id", viewerId)
    .maybeSingle();

  if (error) throw error;
  return (data as PostDraft | null) ?? null;
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
    return { error: "Add something to save a draft." };
  }

  const supabase = createClient();
  const payload = {
    body,
    image_url: imageUrl,
    book_id: bookId,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("post_drafts")
      .update(payload)
      .eq("id", input.id)
      .eq("user_id", viewerId)
      .select(DRAFT_SELECT)
      .single();

    if (error) return { error: error.message };
    return { draft: data as PostDraft };
  }

  const { data, error } = await supabase
    .from("post_drafts")
    .insert({
      user_id: viewerId,
      ...payload,
    })
    .select(DRAFT_SELECT)
    .single();

  if (error) return { error: error.message };
  return { draft: data as PostDraft };
}

export async function deleteDraft(id: string): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const supabase = createClient();
  const { error } = await supabase
    .from("post_drafts")
    .delete()
    .eq("id", id)
    .eq("user_id", viewerId);

  if (error) return { error: error.message };
  return {};
}

export async function publishDraft(
  id: string
): Promise<{ error?: string }> {
  const draft = await getDraft(id);
  if (!draft) return { error: "Draft not found." };

  const { createPost } = await import("@/lib/services/posts");
  const result = await createPost({
    body: draft.body,
    bookId: draft.book_id,
    imageUrl: draft.image_url,
  });

  if (result.error) return { error: result.error };

  const deleted = await deleteDraft(id);
  if (deleted.error) return { error: deleted.error };

  return {};
}
