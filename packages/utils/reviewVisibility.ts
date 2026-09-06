/** Shared review audience (public vs private) — web + iOS. */

export type ReviewAudience = "public" | "private";

export const REVIEW_VISIBILITY_OPTIONS: {
  value: ReviewAudience;
  label: string;
  helper: string;
}[] = [
  {
    value: "public",
    label: "Public",
    helper: "Public: Visible on your profile, book pages, and the Feed.",
  },
  {
    value: "private",
    label: "Private",
    helper: "Private: Visible only to you.",
  },
];

export const PRIVATE_REVIEW_BADGE = {
  label: "Private",
  ariaLabel: "Private Review",
} as const;

export const PRIVATE_REVIEWS_EMPTY_COPY = {
  title: "You don't have any private reviews yet.",
  hint: "You can make any review private when writing or editing it.",
} as const;

/** Treat anything other than `private` as public so existing rows stay public. */
export function parseReviewAudience(value: unknown): ReviewAudience {
  return value === "private" ? "private" : "public";
}

export function isPrivateReview(visibility: unknown): boolean {
  return visibility === "private";
}

export function isPublicReview(visibility: unknown): boolean {
  return parseReviewAudience(visibility) === "public";
}

/**
 * Mirrors `reviews_select_visible` RLS:
 * owner can read public + private; everyone else can read public only.
 */
export function canViewerReadReview(args: {
  visibility: unknown;
  ownerId: string;
  viewerId: string | null | undefined;
}): boolean {
  if (args.viewerId && args.viewerId === args.ownerId) return true;
  return isPublicReview(args.visibility);
}

/** Private wins for any public surface (Feed, profile, book page, discovery). */
export function isReviewPubliclyVisible(visibility: unknown): boolean {
  return isPublicReview(visibility);
}

export function reviewActivityVisibility(visibility: unknown): ReviewAudience {
  return parseReviewAudience(visibility);
}
