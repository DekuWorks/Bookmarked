/** Shared half-star fill for a single 5-star row. */

export type StarFill = "full" | "half" | "empty";

export function clampStarRating(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, value));
}

export function starFill(value: number, star: number): StarFill {
  const rating = clampStarRating(value);
  if (rating >= star) return "full";
  if (rating >= star - 0.5) return "half";
  return "empty";
}

export function starFills(value: number | null | undefined): StarFill[] {
  const rating = clampStarRating(value);
  return [1, 2, 3, 4, 5].map((star) => starFill(rating, star));
}

export const STAR_RATING_ROW_CLASS = "inline-flex flex-nowrap items-center";
