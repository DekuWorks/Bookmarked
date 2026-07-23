import { describe, expect, it } from "vitest";
import {
  BRAND_ASSET_META,
  BRAND_LOGO_SIZE_PX,
  SAVED_BOOK_BADGE_SIZE_PX,
  getBrandLogoDimensions,
  getSavedBookBadgeDimensions,
} from "./brandAssets";

describe("BRAND_ASSET_META", () => {
  it("does not use emoji in labels", () => {
    expect(BRAND_ASSET_META.logoHorizontal.alt).toBe("Bookmarked");
    expect(BRAND_ASSET_META.savedBadge.accessibilityLabel).toBe("Saved to Bookmarked");
    expect(BRAND_ASSET_META.logoHorizontal.alt).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    expect(BRAND_ASSET_META.savedBadge.accessibilityLabel).not.toMatch(
      /[\u{1F300}-\u{1FAFF}]/u
    );
  });

  it("preserves trimmed asset aspect ratios", () => {
    expect(BRAND_ASSET_META.logoHorizontal.aspectRatio).toBeCloseTo(814 / 181, 4);
    expect(BRAND_ASSET_META.savedBadge.aspectRatio).toBeCloseTo(441 / 547, 4);
  });
});

describe("size tokens", () => {
  it("defines small/medium/large logo heights", () => {
    expect(Object.keys(BRAND_LOGO_SIZE_PX).sort()).toEqual(["large", "medium", "small"]);
  });

  it("defines small/medium/large badge widths", () => {
    expect(Object.keys(SAVED_BOOK_BADGE_SIZE_PX).sort()).toEqual([
      "large",
      "medium",
      "small",
    ]);
  });

  it("derives dimensions from aspect ratio", () => {
    const logo = getBrandLogoDimensions("medium");
    expect(logo.width).toBe(
      Math.round(logo.height * BRAND_ASSET_META.logoHorizontal.aspectRatio)
    );

    const badge = getSavedBookBadgeDimensions("medium");
    expect(badge.height).toBe(
      Math.round(badge.width / BRAND_ASSET_META.savedBadge.aspectRatio)
    );
  });
});
