/** Shared Home → Overview shelf cover frame (Recently Finished + Favorites). */

export const OVERVIEW_SHELF_COVER_ASPECT_RATIO = 2 / 3;

/**
 * Compact but readable portrait frame.
 *
 * Do not size web `BookCover` with a short fixed height plus its default
 * `w-full` — `cn()` does not merge Tailwind width utilities, so `w-full`
 * can win and crop covers into landscape thumbnails.
 */
export const OVERVIEW_SHELF_COVER = {
  widthPx: 80,
  heightPx: 120,
  aspectRatio: OVERVIEW_SHELF_COVER_ASPECT_RATIO,
  /** Show complete artwork; letterbox inside the portrait frame. */
  fit: "contain",
} as const;

export type OverviewShelfCoverFit = typeof OVERVIEW_SHELF_COVER.fit;

export function overviewShelfCoverBoxStyle(): {
  width: number;
  height: number;
} {
  return {
    width: OVERVIEW_SHELF_COVER.widthPx,
    height: OVERVIEW_SHELF_COVER.heightPx,
  };
}

export function overviewShelfCoverFrame(
  widthPx = OVERVIEW_SHELF_COVER.widthPx
): { width: number; height: number; aspectRatio: number } {
  return {
    width: widthPx,
    height: Math.round(widthPx / OVERVIEW_SHELF_COVER.aspectRatio),
    aspectRatio: OVERVIEW_SHELF_COVER.aspectRatio,
  };
}

export function isPortraitCoverFrame(width: number, height: number): boolean {
  return height > width;
}
