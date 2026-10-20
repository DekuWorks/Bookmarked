/**
 * Shared front-cover treatment.
 * 21st.dev "Book" and coverflow listings were reviewed as metadata only.
 * Those are 3D mockups. This file keeps a flat cover with a tight physical edge.
 * No source was copied.
 */

/** Paperback / hardcover corner. Much tighter than a 12px UI radius. */
export const BOOK_COVER_RADIUS_PX = 3;

export type CoverRibbonSize = "small" | "medium" | "large";

/** Pick the existing ribbon token from the cover width. Callers can still override. */
export function coverRibbonSize(width: number | null, explicit?: CoverRibbonSize): CoverRibbonSize {
  if (explicit) return explicit;
  if (width != null && Number.isFinite(width) && width < 80) return "small";
  if (width != null && Number.isFinite(width) && width >= 160) return "large";
  return "medium";
}

/** Tailwind width utilities used by native cover frames, in px. */
export function coverWidthFromClass(sizeClassName: string): number | null {
  const arbitrary = sizeClassName.match(/\bw-\[(\d+(?:\.\d+)?)px\]/);
  if (arbitrary?.[1]) return Number(arbitrary[1]);
  const step = sizeClassName.match(/\bw-(\d+)\b/);
  if (!step?.[1]) return null;
  return Number(step[1]) * 4;
}
