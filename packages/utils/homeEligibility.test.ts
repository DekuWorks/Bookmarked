import { describe, expect, it } from "vitest";
import {
  canCreatePublicMeetup,
  canUseReaderMapSocial,
  parseHomeEligibilityFlags,
  resolveAgeEligibility,
  shouldRecalcReadingDna,
} from "./homeEligibility";

describe("homeEligibility", () => {
  it("blocks Reader Map social when age is unknown or under a configured minimum", () => {
    expect(resolveAgeEligibility({ birthYear: 2000, minAge: null })).toBe("unknown");
    expect(resolveAgeEligibility({ birthYear: null, minAge: 18 })).toBe("unknown");
    expect(resolveAgeEligibility({ birthYear: 2015, nowYear: 2026, minAge: 18 })).toBe(
      "under_minimum"
    );
    expect(resolveAgeEligibility({ birthYear: 2000, nowYear: 2026, minAge: 18 })).toBe("eligible");

    expect(
      canUseReaderMapSocial({
        hasHome: true,
        optedIn: true,
        ageStatus: "unknown",
      })
    ).toBe(false);
    expect(
      canUseReaderMapSocial({
        hasHome: true,
        optedIn: true,
        ageStatus: "eligible",
      })
    ).toBe(true);
    expect(
      canUseReaderMapSocial({
        hasHome: true,
        optedIn: false,
        ageStatus: "eligible",
      })
    ).toBe(false);
  });

  it("does not invent a minimum age when flags are empty", () => {
    const flags = parseHomeEligibilityFlags([]);
    expect(flags.readerMapMinAge).toBeNull();
    expect(flags.bookMapUserSubmissionsEnabled).toBe(false);
    expect(flags.publicMeetupPreapproval).toBe(true);
  });

  it("gates public meetup create by policy and age", () => {
    expect(
      canCreatePublicMeetup({
        hasHome: true,
        hasPlus: true,
        ageStatus: "unknown",
        policy: "home_only",
      })
    ).toBe(false);
    expect(
      canCreatePublicMeetup({
        hasHome: false,
        hasPlus: true,
        ageStatus: "eligible",
        policy: "home_only",
      })
    ).toBe(false);
    expect(
      canCreatePublicMeetup({
        hasHome: true,
        hasPlus: true,
        ageStatus: "eligible",
        policy: "home_only",
      })
    ).toBe(true);
  });

  it("recalcs DNA only after the configured cache window", () => {
    const now = Date.parse("2026-09-06T12:00:00.000Z");
    expect(shouldRecalcReadingDna(null, 24, now)).toBe(true);
    expect(shouldRecalcReadingDna("2026-09-06T10:00:00.000Z", 24, now)).toBe(false);
    expect(shouldRecalcReadingDna("2026-09-04T12:00:00.000Z", 24, now)).toBe(true);
  });
});
