/** React Native image sources — separate from brandAssets.ts so vitest can import meta without PNG requires. */
export const BRAND_ASSETS = {
  logoHorizontal: require("../../assets/branding/bookmarked-logo-horizontal.png"),
  savedBadge: require("../../assets/branding/bookmarked-saved-badge.png"),
  logoMark: require("../../assets/brand/logo-mark.png"),
} as const;
