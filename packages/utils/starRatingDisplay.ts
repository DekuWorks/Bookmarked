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

export function isValidHalfStarRating(value: number): boolean {
  return value >= 0.5 && value <= 5 && Number.isInteger(value * 2);
}

/** Shared 5-star half-star parse. Rejects 1–10 (and other) scales instead of converting them. */
export function parseHalfStarRating(value: unknown): number | null {
  if (value == null || value === "") return null;
  const raw = Number(value);
  if (!Number.isFinite(raw) || !isValidHalfStarRating(raw)) return null;
  return raw;
}

export const STAR_RATING_ROW_CLASS = "inline-flex flex-nowrap items-center";
