import { createClient } from "@/lib/supabase/client";
import {
  parseReviewAudience,
  type ReviewAudience,
} from "@bookmarked/utils/reviewVisibility";

export async function updateReviewVisibility(
  reviewId: string,
  visibility: ReviewAudience
): Promise<{ error?: string; visibility?: ReviewAudience }> {
  const next = parseReviewAudience(visibility);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data, error } = await supabase
    .from("reviews")
    .update({ visibility: next, updated_at: new Date().toISOString() })
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .select("visibility")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: "Review not found." };
  return { visibility: parseReviewAudience(data.visibility) };
}
