/** Shared Home → Overview shelf cover frame (Recently Finished + Favorites). */

export const OVERVIEW_SHELF_COVER_ASPECT_RATIO = 2 / 3;

/**
 * Compact portrait frame.
 * Phone is 80×120. Tablet / iPad is 96×144 (`w-24 h-36`).
 *
 * Do not size web `BookCover` with a short fixed height plus its default
 * `w-full` — `cn()` does not merge Tailwind width utilities, so `w-full`
 * can win and crop covers into landscape thumbnails.
 */
export const OVERVIEW_SHELF_TABLET_MIN_PX = 768;

export const OVERVIEW_SHELF_COVER = {
  widthPx: 80,
  heightPx: 120,
  /** Matches iOS CoverTile `w-24 h-36` and web `md:w-24`. */
  tabletWidthPx: 96,
  tabletHeightPx: 144,
  aspectRatio: OVERVIEW_SHELF_COVER_ASPECT_RATIO,
  /** Show complete artwork; letterbox inside the portrait frame. */
  fit: "contain",
} as const;

/**
 * Web frame classes. Width only — `BookCover` supplies the 2:3 height.
 * `w-20` is 80px and `md:w-24` is 96px. Do not add `overflow-hidden` here;
 * that clips the shared cover and the saved ribbon.
 */
export const OVERVIEW_SHELF_COVER_FRAME_CLASS =
  "relative w-20 shrink-0 self-start overflow-visible bg-background md:w-24";

export type OverviewShelfCoverFit = typeof OVERVIEW_SHELF_COVER.fit;

export function overviewShelfCoverBoxStyle(viewportWidth?: number): {
  width: number;
  height: number;
} {
  const tablet =
    typeof viewportWidth === "number" && viewportWidth >= OVERVIEW_SHELF_TABLET_MIN_PX;
  const width = tablet ? OVERVIEW_SHELF_COVER.tabletWidthPx : OVERVIEW_SHELF_COVER.widthPx;
  return {
    width,
    height: Math.round(width / OVERVIEW_SHELF_COVER.aspectRatio),
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
