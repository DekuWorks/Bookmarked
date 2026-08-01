export type BrandLogoSize = "small" | "medium" | "large";
export type SavedBookBadgeSize = "small" | "medium" | "large";

/** Wordmark display heights (px). */
export const BRAND_LOGO_SIZE_PX: Record<BrandLogoSize, number> = {
  small: 24,
  medium: 28,
  large: 36,
};

/** Saved-book badge ribbon width (px). Height derived from aspect ratio. */
export const SAVED_BOOK_BADGE_SIZE_PX: Record<SavedBookBadgeSize, number> = {
  small: 16,
  medium: 28,
  large: 36,
};

export const BRAND_ASSET_META = {
  logoHorizontal: {
    alt: "Bookmarked",
    naturalWidth: 814,
    naturalHeight: 181,
    aspectRatio: 814 / 181,
  },
  savedBadge: {
    alt: "",
    accessibilityLabel: "Saved to Bookmarked",
    naturalWidth: 441,
    naturalHeight: 547,
    aspectRatio: 441 / 547,
  },
  logoMark: {
    alt: "",
    naturalWidth: 256,
    naturalHeight: 256,
    aspectRatio: 1,
  },
} as const;

export function getBrandLogoDimensions(size: BrandLogoSize = "medium") {
  const height = BRAND_LOGO_SIZE_PX[size];
  return {
    height,
    width: Math.round(height * BRAND_ASSET_META.logoHorizontal.aspectRatio),
  };
}

export function getSavedBookBadgeDimensions(size: SavedBookBadgeSize = "medium") {
  const width = SAVED_BOOK_BADGE_SIZE_PX[size];
  return {
    width,
    height: Math.round(width / BRAND_ASSET_META.savedBadge.aspectRatio),
  };
}
