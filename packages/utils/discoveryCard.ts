/** Shared discovery-carousel card helpers for web + iOS. */

/** Fixed row heights (px) so cards stay aligned with or without rating/review/tags. */
export const DISCOVERY_CARD_ROW_PX = {
  coverHeight: 160,
  title: 40,
  author: 16,
  rating: 20,
  review: 32,
  tags: 20,
  metric: 18,
} as const;

export type DiscoveryReviewState = "none" | "rating_only" | "written_only" | "both";

export function discoveryReviewState(input: {
  hasRating: boolean;
  hasWrittenReview: boolean;
}): DiscoveryReviewState {
  if (input.hasRating && input.hasWrittenReview) return "both";
  if (input.hasRating) return "rating_only";
  if (input.hasWrittenReview) return "written_only";
  return "none";
}

/** Empty / summary labels for the reserved rating/review row. */
export function discoveryReviewSummaryLabel(state: DiscoveryReviewState): string {
  switch (state) {
    case "none":
      return "No review yet";
    case "rating_only":
      return "Rating only";
    case "written_only":
    case "both":
      return "Written review available";
  }
}

export function clampDiscoveryTags(tags: readonly string[] | null | undefined, limit = 2): string[] {
  if (!tags?.length) return [];
  const cleaned = tags.map((t) => t.trim()).filter(Boolean);
  return cleaned.slice(0, limit);
}
