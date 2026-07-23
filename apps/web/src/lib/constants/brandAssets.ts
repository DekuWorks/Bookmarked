export type BrandLogoSize = "small" | "medium" | "large";
export type SavedBookBadgeSize = "small" | "medium" | "large";

/** Wordmark display heights (px). */
export const BRAND_LOGO_SIZE_PX: Record<BrandLogoSize, number> = {
  small: 24,
  medium: 32,
  large: 40,
};

/** Saved-book badge ribbon width (px). Height derived from aspect ratio. */
export const SAVED_BOOK_BADGE_SIZE_PX: Record<SavedBookBadgeSize, number> = {
  small: 14,
  medium: 20,
  large: 28,
};

export const BRAND_ASSETS = {
  logoHorizontal: {
    src: "/assets/branding/bookmarked-logo-horizontal.png",
    alt: "Bookmarked",
    naturalWidth: 814,
    naturalHeight: 181,
    aspectRatio: 814 / 181,
  },
  savedBadge: {
    src: "/assets/branding/bookmarked-saved-badge.png",
    alt: "",
    accessibilityLabel: "Saved to Bookmarked",
    naturalWidth: 441,
    naturalHeight: 547,
    aspectRatio: 441 / 547,
  },
  logoMark: {
    src: "/logo-mark.png",
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
    width: Math.round(height * BRAND_ASSETS.logoHorizontal.aspectRatio),
  };
}

export function getSavedBookBadgeDimensions(size: SavedBookBadgeSize = "medium") {
  const width = SAVED_BOOK_BADGE_SIZE_PX[size];
  return {
    width,
    height: Math.round(width / BRAND_ASSETS.savedBadge.aspectRatio),
  };
}
