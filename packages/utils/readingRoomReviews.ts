/** Shared Reading Room review tab logic — web + mobile. */

export type ReviewFilter =
  | "all"
  | "rating_only"
  | "written_only"
  | "rating_and_review"
  | "spoiler";

export type ReviewFilterable = {
  rating: number | null;
  review_body: string | null;
  has_spoilers: boolean;
  created_at: string;
};

export const REVIEW_FILTER_OPTIONS: { id: ReviewFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "rating_only", label: "Star Rating Only" },
  { id: "written_only", label: "Written Review Only" },
  { id: "rating_and_review", label: "Rating & Review" },
  { id: "spoiler", label: "Spoiler Reviews" },
];

export function hasWrittenReview(review: ReviewFilterable): boolean {
  return Boolean(review.review_body?.trim());
}

export function hasStarRating(review: ReviewFilterable): boolean {
  return review.rating != null;
}

export function filterReviews<T extends ReviewFilterable>(
  reviews: T[],
  filter: ReviewFilter
): T[] {
  switch (filter) {
    case "rating_only":
      return reviews.filter((review) => hasStarRating(review) && !hasWrittenReview(review));
    case "written_only":
      return reviews.filter((review) => hasWrittenReview(review) && !hasStarRating(review));
    case "rating_and_review":
      return reviews.filter((review) => hasStarRating(review) && hasWrittenReview(review));
    case "spoiler":
      return reviews.filter((review) => review.has_spoilers);
    default:
      return reviews;
  }
}

export function groupReviewsByMonth<T extends ReviewFilterable>(
  reviews: T[]
): [string, T[]][] {
  const groups = new Map<string, T[]>();

  for (const review of reviews) {
    const date = new Date(review.created_at);
    const key = date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const list = groups.get(key) ?? [];
    list.push(review);
    groups.set(key, list);
  }

  return [...groups.entries()];
}

export type ReviewShareInput = {
  title: string;
  author?: string | null;
  rating?: number | null;
  reviewBody?: string | null;
  feelings?: string[];
  hasSpoilers?: boolean;
  bookUrl: string;
};

/** Public review share text for the social feed (no private notes). */
export function buildReviewSharePostBody(input: ReviewShareInput): string {
  const lines: string[] = [];

  lines.push(`📚 ${input.title}`);
  if (input.author?.trim()) {
    lines.push(`by ${input.author.trim()}`);
  }

  if (input.rating != null) {
    lines.push(`⭐ ${input.rating}/5`);
  } else if (hasWrittenReview({ review_body: input.reviewBody ?? null } as ReviewFilterable)) {
    lines.push("No star rating");
  }

  if (input.feelings?.length) {
    lines.push(input.feelings.map((feeling) => `#${feeling}`).join(" "));
  }

  if (input.hasSpoilers) {
    lines.push("⚠️ Contains spoilers");
  }

  const body = input.reviewBody?.trim();
  if (body) {
    lines.push("");
    lines.push(body);
  } else if (input.rating != null) {
    lines.push("");
    lines.push("Rating only — no written review.");
  }

  lines.push("");
  lines.push(input.bookUrl);

  return lines.join("\n");
}
