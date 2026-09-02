/**
 * Outer Currently Reading Overview card — shared by book cards and Add Book.
 *
 * Matches the full card footprint (cover + title + progress + Continue reading
 * on web; cover + progress + title + author on iOS), not the cover image alone.
 * Recently Finished / Favorites 80×120 covers are a different token.
 */

export type CurrentlyReadingCardPlatform = "web" | "native";

export const CURRENTLY_READING_CARD_SIZE = {
  web: {
    widthPx: 220,
    /**
     * padding 32 + cover 168 + title block 56 + percent 40 + continue 60.
     * Cover is 112×168 (2:3) inside 16px padding.
     */
    heightPx: 356,
    coverWidthPx: 112,
    coverHeightPx: 168,
    borderRadiusPx: 12,
    paddingPx: 16,
    /** Scaled from 32px on the old cover-only control; capped so it does not fill the card. */
    plusIconPx: 40,
  },
  native: {
    widthPx: 96,
    /**
     * cover 144 + progress 14 + two-line title 45 + author 19.
     * Cover stays 96×144 (Tailwind w-24 h-36).
     */
    heightPx: 224,
    coverWidthPx: 96,
    coverHeightPx: 144,
    borderRadiusPx: 12,
    paddingPx: 0,
    plusIconPx: 32,
  },
} as const;

export type CurrentlyReadingCardSize =
  (typeof CURRENTLY_READING_CARD_SIZE)[CurrentlyReadingCardPlatform];

export function currentlyReadingCardBoxStyle(
  platform: CurrentlyReadingCardPlatform
): { width: number; height: number; borderRadius: number } {
  const size = CURRENTLY_READING_CARD_SIZE[platform];
  return {
    width: size.widthPx,
    height: size.heightPx,
    borderRadius: size.borderRadiusPx,
  };
}

export function currentlyReadingCoverBoxStyle(
  platform: CurrentlyReadingCardPlatform
): { width: number; height: number } {
  const size = CURRENTLY_READING_CARD_SIZE[platform];
  return {
    width: size.coverWidthPx,
    height: size.coverHeightPx,
  };
}
