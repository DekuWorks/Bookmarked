import { supabase } from "./supabase";
import { activityMetadata, bookActivityContext, recordActivity } from "./activity";
import type { Review, ReviewRatingMode, ReviewVisibility } from "../types";
import {
  parseReviewAudience,
  type ReviewAudience,
} from "../../../../packages/utils/reviewVisibility";

/**
 * Mobile reviews service. Writes to the `reviews` table + records feed activity,
 * mirroring the write side of the web review flow. Supports rating (half-stars),
 * signature emoji, feelings, spoilers, visibility, and advanced category ratings.
 */

export type ReviewInput = {
  bookId: string;
  userBookId?: string | null;
  /** Which read this review is for (multi-read). Defaults to 1. */
  readNumber?: number | null;
  rating?: number | null;
  ratingEmoji?: string | null;
  reviewBody?: string | null;
  hasSpoilers?: boolean;
  visibility?: ReviewVisibility;
  feelings?: string[];
  ratingMode?: ReviewRatingMode;
  plot?: number | null;
  characters?: number | null;
  writingStyle?: number | null;
  worldBuilding?: number | null;
  pacing?: number | null;
  emotionalImpact?: number | null;
};

/** Signature rating emoji options (matches the web review composer set). */
export const RATING_EMOJIS = ["😍", "🥰", "😊", "🙂", "😐", "😕", "😞", "😡", "🤯", "😭", "🔥", "💫"];

export const REVIEW_FEELINGS = [
  "Cozy",
  "Heartbreaking",
  "Thrilling",
  "Funny",
  "Thought-provoking",
  "Romantic",
  "Dark",
  "Inspiring",
  "Nostalgic",
  "Unputdownable",
];

export async function getBookReviews(bookId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, profiles(display_name, username)")
    .eq("book_id", bookId)
    .order("read_number", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Review[];
}

export async function upsertReview(
  userId: string,
  input: ReviewInput,
  book: { id: string; title: string; cover_url?: string | null; subjects?: string[] | null }
): Promise<{ error?: string; review?: Review }> {
  const readNumber = Math.max(1, Number(input.readNumber) || 1);
  const payload = {
    user_id: userId,
    book_id: input.bookId,
    user_book_id: input.userBookId ?? null,
    read_number: readNumber,
    rating: input.rating ?? null,
    rating_emoji: input.ratingEmoji?.trim() || null,
    review_body: input.reviewBody?.trim() || null,
    has_spoilers: input.hasSpoilers ?? false,
    visibility: parseReviewAudience(input.visibility),
    feelings: input.feelings ?? [],
    rating_mode: input.ratingMode ?? "regular",
    plot: input.plot ?? null,
    characters: input.characters ?? null,
    writing_style: input.writingStyle ?? null,
    world_building: input.worldBuilding ?? null,
    pacing: input.pacing ?? null,
    emotional_impact: input.emotionalImpact ?? null,
    updated_at: new Date().toISOString(),
  };

  // Reviews are unique on (user_id, book_id, read_number); match this read so a
  // later read inserts a new row instead of overwriting an earlier one.
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("book_id", input.bookId)
    .eq("read_number", readNumber)
    .maybeSingle();

  const { data, error } = existing?.id
    ? await supabase.from("reviews").update(payload).eq("id", existing.id).select("*").single()
    : await supabase.from("reviews").insert(payload).select("*").single();

  if (error) return { error: error.message };

  const review = data as Review;
  await recordActivity({
    user_id: userId,
    event_type: existing?.id ? "review_updated" : "review_created",
    entity_type: "review",
    entity_id: review.id,
    visibility: parseReviewAudience(review.visibility),
    metadata_json: activityMetadata(book.title, {
      ...bookActivityContext(book),
      rating: input.rating ?? undefined,
      rating_emoji: input.ratingEmoji ?? undefined,
    }),
  });

  return { review };
}

export async function updateReviewVisibility(
  reviewId: string,
  visibility: ReviewAudience
): Promise<{ error?: string; review?: Review }> {
  const next = parseReviewAudience(visibility);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data, error } = await supabase
    .from("reviews")
    .update({ visibility: next, updated_at: new Date().toISOString() })
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Review not found." };
  return { review: data as Review };
}
