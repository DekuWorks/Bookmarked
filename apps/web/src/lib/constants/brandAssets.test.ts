import { describe, expect, it } from "vitest";
import {
  BRAND_ASSETS,
  BRAND_LOGO_SIZE_PX,
  SAVED_BOOK_BADGE_SIZE_PX,
  getBrandLogoDimensions,
  getSavedBookBadgeDimensions,
} from "./brandAssets";

describe("BRAND_ASSETS", () => {
  it("uses normalized public paths", () => {
    expect(BRAND_ASSETS.logoHorizontal.src).toBe(
      "/assets/branding/bookmarked-logo-horizontal.png"
    );
    expect(BRAND_ASSETS.savedBadge.src).toBe(
      "/assets/branding/bookmarked-saved-badge.png"
    );
  });

  it("does not use emoji in alt or accessibility labels", () => {
    expect(BRAND_ASSETS.logoHorizontal.alt).toBe("Bookmarked");
    expect(BRAND_ASSETS.savedBadge.accessibilityLabel).toBe("Saved to Bookmarked");
    expect(BRAND_ASSETS.logoHorizontal.alt).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    expect(BRAND_ASSETS.savedBadge.accessibilityLabel).not.toMatch(
      /[\u{1F300}-\u{1FAFF}]/u
    );
  });

  it("preserves trimmed asset aspect ratios", () => {
    expect(BRAND_ASSETS.logoHorizontal.aspectRatio).toBeCloseTo(814 / 181, 4);
    expect(BRAND_ASSETS.savedBadge.aspectRatio).toBeCloseTo(441 / 547, 4);
  });
});

describe("size tokens", () => {
  it("defines small/medium/large logo heights", () => {
    expect(Object.keys(BRAND_LOGO_SIZE_PX).sort()).toEqual(["large", "medium", "small"]);
    expect(BRAND_LOGO_SIZE_PX.small).toBeLessThan(BRAND_LOGO_SIZE_PX.medium);
    expect(BRAND_LOGO_SIZE_PX.medium).toBeLessThan(BRAND_LOGO_SIZE_PX.large);
  });

  it("defines small/medium/large badge widths", () => {
    expect(Object.keys(SAVED_BOOK_BADGE_SIZE_PX).sort()).toEqual([
      "large",
      "medium",
      "small",
    ]);
    expect(SAVED_BOOK_BADGE_SIZE_PX.small).toBeLessThan(SAVED_BOOK_BADGE_SIZE_PX.medium);
    expect(SAVED_BOOK_BADGE_SIZE_PX.medium).toBeLessThan(SAVED_BOOK_BADGE_SIZE_PX.large);
  });

  it("derives dimensions from aspect ratio", () => {
    const logo = getBrandLogoDimensions("medium");
    expect(logo.width).toBe(Math.round(logo.height * BRAND_ASSETS.logoHorizontal.aspectRatio));

    const badge = getSavedBookBadgeDimensions("medium");
    expect(badge.height).toBe(
      Math.round(badge.width / BRAND_ASSETS.savedBadge.aspectRatio)
    );
  });
});
