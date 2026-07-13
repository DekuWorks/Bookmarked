import { supabase } from "./supabase";

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
