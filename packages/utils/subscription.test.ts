import { describe, expect, it } from "vitest";
import {
  ENTITLEMENTS,
  canAccessFeature,
  canCreateReadingChallenge,
  IOS_SUBSCRIBE_COPY,
  canCreateCustomShelf,
  canJoinBookClub,
  canSaveQuote,
  getEntitlements,
  getReadingDnaAccess,
  subscriptionIsActive,
} from "./subscription";

const activePlus = {
  subscription_tier: "plus" as const,
  subscription_status: "active" as const,
  subscription_expires_at: null,
};

const activeHome = {
  ...activePlus,
  subscription_tier: "home" as const,
};

describe("ENTITLEMENTS + canAccessFeature", () => {
  it("keeps Free limits and top-three DNA access", () => {
    expect(getEntitlements(null).customShelves).toBe(1);
    expect(getEntitlements("free").savedQuotes).toBe(25);
    expect(getReadingDnaAccess(null)).toBe("top_three");
    expect(canAccessFeature("full_reading_dna", null)).toBe(false);
    expect(canAccessFeature("tracker", null)).toBe(true);
    expect(canAccessFeature("reading_dna_traits", null)).toBe(true);
  });

  it("unlocks Plus FeatureKeys and full DNA", () => {
    expect(canAccessFeature("full_reading_dna", activePlus)).toBe(true);
    expect(canAccessFeature("advanced_reading_insights", activePlus)).toBe(true);
    expect(canAccessFeature("reading_dna_dashboard", activePlus)).toBe(true);
    expect(canAccessFeature("reader_map", activePlus)).toBe(false);
    expect(getReadingDnaAccess(activePlus)).toBe("full");
    expect(getEntitlements(activePlus).joinedBookClubs).toBe(Infinity);
    expect(canCreateReadingChallenge(null)).toBe(false);
    expect(canCreateReadingChallenge(activePlus)).toBe(true);
  });

  it("unlocks Home-only surfaces and advanced DNA", () => {
    expect(canAccessFeature("reading_dna_match", activeHome)).toBe(true);
    expect(getReadingDnaAccess(activeHome)).toBe("advanced");
    expect(ENTITLEMENTS.home.readingDNAAccess).toBe("advanced");
  });

  it("describes iOS-only subscribe with shared web unlock", () => {
    expect(IOS_SUBSCRIBE_COPY.body).toMatch(/iOS app/i);
    expect(IOS_SUBSCRIBE_COPY.body).toMatch(/bookmarked\.online/i);
    expect(IOS_SUBSCRIBE_COPY.body).not.toMatch(/checkout|stripe/i);
  });

  it("enforces numeric Free limits via helpers", () => {
    expect(canCreateCustomShelf(0, null)).toBe(true);
    expect(canCreateCustomShelf(1, null)).toBe(false);
    expect(canSaveQuote(25, null)).toBe(false);
    expect(canJoinBookClub(2, null)).toBe(true);
    expect(canCreateCustomShelf(5, activePlus)).toBe(true);
  });

  it("keeps access during grace_period and canceled-until-expiry", () => {
    expect(
      subscriptionIsActive({
        subscription_tier: "plus",
        subscription_status: "grace_period",
        subscription_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      })
    ).toBe(true);
    expect(
      subscriptionIsActive({
        subscription_tier: "plus",
        subscription_status: "canceled",
        subscription_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      })
    ).toBe(true);
    expect(
      subscriptionIsActive({
        subscription_tier: "plus",
        subscription_status: "expired",
        subscription_expires_at: new Date(Date.now() - 1000).toISOString(),
      })
    ).toBe(false);
  });
});
