import { parseReviewAudience, type ReviewAudience } from "./reviewVisibility";

export function shouldPromptReviewShareToFeed(input: {
  visibility: ReviewAudience | string | null | undefined;
  isNewPublish: boolean;
}): boolean {
  if (!input.isNewPublish) return false;
  return parseReviewAudience(input.visibility) === "public";
}
