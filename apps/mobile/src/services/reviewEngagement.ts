import { supabase } from "./supabase";
import type { ReviewReplyWithAuthor } from "../types";

/**
 * Minimal review reactions for the feed like button. Mirrors the "like" path of
 * apps/web/src/lib/services/reviewEngagement.ts against `review_reactions`.
 */

export async function toggleReviewLike(
  reviewId: string
): Promise<{ liked?: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: existing } = await supabase
    .from("review_reactions")
    .select("reaction")
    .eq("review_id", reviewId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.reaction === "like") {
    const { error } = await supabase
      .from("review_reactions")
      .delete()
      .eq("review_id", reviewId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    return { liked: false };
  }

  if (existing) {
    const { error } = await supabase
      .from("review_reactions")
      .update({ reaction: "like" })
      .eq("review_id", reviewId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    return { liked: true };
  }

  const { error } = await supabase
    .from("review_reactions")
    .insert({ review_id: reviewId, user_id: user.id, reaction: "like" });
  if (error) return { error: error.message };
  return { liked: true };
}

export async function listReviewReplies(reviewId: string): Promise<ReviewReplyWithAuthor[]> {
  const { data, error } = await supabase
    .from("review_replies")
    .select("id, review_id, user_id, parent_reply_id, body, attachment_url, created_at, updated_at")
    .eq("review_id", reviewId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  const userIds = [...new Set(rows.map((row) => row.user_id as string))];
  const authors = new Map<string, ReviewReplyWithAuthor["author"]>();
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);
    for (const profile of profiles ?? []) {
      authors.set(profile.id as string, {
        id: profile.id as string,
        username: profile.username as string | null,
        display_name: profile.display_name as string | null,
        avatar_url: profile.avatar_url as string | null,
      });
    }
  }
  return rows.map((row) => ({
    id: row.id as string,
    review_id: row.review_id as string,
    user_id: row.user_id as string,
    parent_reply_id: (row.parent_reply_id as string | null) ?? null,
    body: row.body as string,
    attachment_url: (row.attachment_url as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    author: authors.get(row.user_id as string) ?? {
      id: row.user_id as string,
      username: null,
      display_name: null,
      avatar_url: null,
    },
  }));
}

export async function addReviewReply(
  reviewId: string,
  body: string
): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };
  const trimmed = body.trim();
  if (!trimmed) return { error: "Write a comment first." };
  const { error } = await supabase.from("review_replies").insert({
    review_id: reviewId,
    user_id: user.id,
    body: trimmed,
  });
  if (error) return { error: error.message };
  return {};
}
