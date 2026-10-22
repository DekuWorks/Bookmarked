import { describe, expect, it } from "vitest";
import {
  FREE_BOOK_CLUB_LIMIT,
  FREE_CUSTOM_SHELF_LIMIT,
  FREE_QUOTE_GRAPHICS_PER_MONTH,
  FREE_SAVED_QUOTE_LIMIT,
  PRICING_TIER_LIMITS,
  includedPricingFeatureItems,
  pricingTierById,
  pricingTierFeatureItems,
} from "./pricingTiers";

describe("pricing tier catalog", () => {
  it("keeps Free count limits at 1 / 25 / 3 / 3", () => {
    expect(FREE_CUSTOM_SHELF_LIMIT).toBe(1);
    expect(FREE_SAVED_QUOTE_LIMIT).toBe(25);
    expect(FREE_QUOTE_GRAPHICS_PER_MONTH).toBe(3);
    expect(FREE_BOOK_CLUB_LIMIT).toBe(3);
    expect(PRICING_TIER_LIMITS.free).toEqual({
      customShelves: 1,
      savedQuotes: 25,
      quoteGraphicsPerMonth: 3,
      joinedBookClubs: 3,
    });
  });

  it("upgrades those four Free limits to unlimited on Plus and Home", () => {
    for (const tier of ["plus", "home"] as const) {
      expect(PRICING_TIER_LIMITS[tier].customShelves).toBe(Infinity);
      expect(PRICING_TIER_LIMITS[tier].savedQuotes).toBe(Infinity);
      expect(PRICING_TIER_LIMITS[tier].quoteGraphicsPerMonth).toBe(Infinity);
      expect(PRICING_TIER_LIMITS[tier].joinedBookClubs).toBe(Infinity);
    }
  });

  it("includes Plus features on Home, and Free features on Plus", () => {
    const home = includedPricingFeatureItems("home");
    for (const item of pricingTierFeatureItems("plus")) {
      expect(home).toContain(item);
    }
    const plus = includedPricingFeatureItems("plus");
    for (const item of pricingTierFeatureItems("free")) {
      expect(plus).toContain(item);
    }
    expect(pricingTierById("plus").includesLabel).toBe("Everything in Free");
    expect(pricingTierById("home").includesLabel).toBe("Everything in Plus");
    expect(home).toContain("Interactive map of independent bookstores, libraries, and reading cafes");
    expect(pricingTierFeatureItems("plus")).not.toContain(
      "Interactive map of independent bookstores, libraries, and reading cafes"
    );
  });
});
