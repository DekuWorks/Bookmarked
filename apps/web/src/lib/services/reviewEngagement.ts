import { createClient } from "@/lib/supabase/client";
import { bookDetailsReviewsPath } from "@/lib/routes/book";
import {
  createMentionNotification,
  createReviewReactionNotification,
  createReviewReplyNotification,
} from "@/lib/services/notifications";
import type { ContentReaction, ReactionCounts, ReviewReplyWithAuthor } from "@/types";
import { extractMentionUsernames } from "@/lib/utils/mentions";
import { buildReplyThread, type ThreadNode } from "@/lib/utils/threadReplies";

const AUTHOR_SELECT = "id, username, display_name, avatar_url";

async function getViewerId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function fetchAuthors(userIds: string[]) {
  if (!userIds.length) return new Map<string, ReviewReplyWithAuthor["author"]>();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(AUTHOR_SELECT)
    .in("id", userIds);

  if (error) throw error;

  return new Map(
    (data ?? []).map((profile) => [
      profile.id as string,
      {
        id: profile.id as string,
        username: profile.username as string | null,
        display_name: profile.display_name as string | null,
        avatar_url: profile.avatar_url as string | null,
      },
    ])
  );
}

export async function getReviewReactionCounts(
  reviewIds: string[],
  viewerId: string | null
): Promise<Map<string, ReactionCounts>> {
  const map = new Map<string, ReactionCounts>();
  if (!reviewIds.length) return map;

  const supabase = createClient();

  const [reactionsResult, viewerResult] = await Promise.all([
    supabase.from("review_reactions").select("review_id, reaction").in("review_id", reviewIds),
    viewerId
      ? supabase
          .from("review_reactions")
          .select("review_id, reaction")
          .eq("user_id", viewerId)
          .in("review_id", reviewIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (reactionsResult.error) throw reactionsResult.error;
  if (viewerResult.error) throw viewerResult.error;

  const viewerByReview = new Map<string, ContentReaction>();
  for (const row of viewerResult.data ?? []) {
    viewerByReview.set(row.review_id as string, row.reaction as ContentReaction);
  }

  for (const reviewId of reviewIds) {
    map.set(reviewId, {
      like_count: 0,
      dislike_count: 0,
      viewer_reaction: viewerByReview.get(reviewId) ?? null,
    });
  }

  for (const row of reactionsResult.data ?? []) {
    const reviewId = row.review_id as string;
    const counts = map.get(reviewId);
    if (!counts) continue;
    if (row.reaction === "like") counts.like_count += 1;
    if (row.reaction === "dislike") counts.dislike_count += 1;
  }

  return map;
}

async function setReviewReaction(
  reviewId: string,
  reaction: ContentReaction
): Promise<{ counts?: ReactionCounts; error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const supabase = createClient();

  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select("id, user_id, book_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (reviewError) return { error: reviewError.message };
  if (!review) return { error: "Review not found." };

  const { data: existing } = await supabase
    .from("review_reactions")
    .select("reaction")
    .eq("review_id", reviewId)
    .eq("user_id", viewerId)
    .maybeSingle();

  if (existing?.reaction === reaction) {
    const { error } = await supabase
      .from("review_reactions")
      .delete()
      .eq("review_id", reviewId)
      .eq("user_id", viewerId);

    if (error) return { error: error.message };
  } else if (existing) {
    const { error } = await supabase
      .from("review_reactions")
      .update({ reaction })
      .eq("review_id", reviewId)
      .eq("user_id", viewerId);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("review_reactions").insert({
      review_id: reviewId,
      user_id: viewerId,
      reaction,
    });

    if (error) return { error: error.message };
  }

  const countsMap = await getReviewReactionCounts([reviewId], viewerId);
  const counts = countsMap.get(reviewId);

  if (review.user_id !== viewerId && counts?.viewer_reaction) {
    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", viewerId)
      .maybeSingle();

    void createReviewReactionNotification({
      recipientId: review.user_id as string,
      actorId: viewerId,
      actorDisplayName:
        actorProfile?.display_name?.trim() ||
        actorProfile?.username?.trim() ||
        "A reader",
      reviewId,
      bookId: review.book_id as string,
      reaction: counts.viewer_reaction,
    });
  }

  return { counts };
}

export async function likeReview(
  reviewId: string
): Promise<{ counts?: ReactionCounts; error?: string }> {
  return setReviewReaction(reviewId, "like");
}

export async function dislikeReview(
  reviewId: string
): Promise<{ counts?: ReactionCounts; error?: string }> {
  return setReviewReaction(reviewId, "dislike");
}

export async function removeReviewReaction(
  reviewId: string
): Promise<{ counts?: ReactionCounts; error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const supabase = createClient();
  const { error } = await supabase
    .from("review_reactions")
    .delete()
    .eq("review_id", reviewId)
    .eq("user_id", viewerId);

  if (error) return { error: error.message };

  const countsMap = await getReviewReactionCounts([reviewId], viewerId);
  return { counts: countsMap.get(reviewId) };
}

type ReviewReplyNode = Omit<ReviewReplyWithAuthor, "children">;

export async function listReviewReplies(
  reviewId: string
): Promise<ThreadNode<ReviewReplyNode>[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("review_replies")
    .select("id, review_id, user_id, parent_reply_id, body, created_at, updated_at")
    .eq("review_id", reviewId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = data ?? [];
  const authorIds = [...new Set(rows.map((row) => row.user_id as string))];
  const authors = await fetchAuthors(authorIds);

  const flat = rows.map((row) => ({
    id: row.id as string,
    review_id: row.review_id as string,
    user_id: row.user_id as string,
    parent_reply_id: row.parent_reply_id as string | null,
    body: row.body as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    author: authors.get(row.user_id as string) ?? {
      id: row.user_id as string,
      username: null,
      display_name: null,
      avatar_url: null,
    },
  }));

  return buildReplyThread(flat);
}

export async function addReviewReply(
  reviewId: string,
  body: string,
  parentReplyId?: string | null
): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Reply cannot be empty." };

  const supabase = createClient();

  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select("id, user_id, book_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (reviewError) return { error: reviewError.message };
  if (!review) return { error: "Review not found." };

  const { data, error } = await supabase
    .from("review_replies")
    .insert({
      review_id: reviewId,
      user_id: viewerId,
      parent_reply_id: parentReplyId ?? null,
      body: trimmed,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", viewerId)
    .maybeSingle();

  const actorDisplayName =
    actorProfile?.display_name?.trim() ||
    actorProfile?.username?.trim() ||
    "A reader";

  if (review.user_id !== viewerId) {
    void createReviewReplyNotification({
      recipientId: review.user_id as string,
      actorId: viewerId,
      actorDisplayName,
      reviewId,
      bookId: review.book_id as string,
      replyId: data.id as string,
      preview: trimmed,
    });
  }

  const mentionUsernames = extractMentionUsernames(trimmed);
  if (mentionUsernames.length) {
    const { data: mentionedProfiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("username", mentionUsernames);

    for (const profile of mentionedProfiles ?? []) {
      if (profile.id === viewerId) continue;
      void createMentionNotification({
        recipientId: profile.id as string,
        actorId: viewerId,
        actorDisplayName,
        linkUrl: bookDetailsReviewsPath(review.book_id as string),
        preview: trimmed,
        dedupKey: `mention:review_reply:${data.id}:${profile.id}`,
      });
    }
  }

  return {};
}

export async function deleteReviewReply(replyId: string): Promise<{ error?: string }> {
  const viewerId = await getViewerId();
  if (!viewerId) return { error: "You must be signed in." };

  const supabase = createClient();
  const { error } = await supabase
    .from("review_replies")
    .delete()
    .eq("id", replyId)
    .eq("user_id", viewerId);

  if (error) return { error: error.message };
  return {};
}
