import { describe, expect, it } from "vitest";
import { canAccessExperience, sprintProgress } from "./eventAccess";
import { hideJoinUrlUntilAuthorized, isAuthorizedVideoJoin } from "./videoEventProvider";
import { priorityFromEntitlement } from "./homeConcierge";

const homeQa = {
  experience_id: "qa-1",
  required_tier: "home" as const,
  price_cents: null,
  lower_tier_fee_cents: 1500,
  currency: "usd",
  included_for_home: true,
};

describe("eventAccess + video join + concierge", () => {
  it("includes Home Q&As and prices lower-tier fees as data", () => {
    expect(canAccessExperience({ viewerTier: "home", access: homeQa })).toMatchObject({
      allowed: true,
      requiresTicket: false,
    });
    expect(canAccessExperience({ viewerTier: "plus", access: homeQa })).toMatchObject({
      allowed: false,
      requiresTicket: true,
      feeCents: 1500,
    });
  });

  it("hides the join URL until the viewer is authorized", () => {
    expect(hideJoinUrlUntilAuthorized({ join_url: "https://meet.example/abc" }, false).join_url).toBe(
      null
    );
    expect(hideJoinUrlUntilAuthorized({ join_url: "https://meet.example/abc" }, true).join_url).toBe(
      "https://meet.example/abc"
    );
    expect(isAuthorizedVideoJoin({ hasHome: true, rsvpGoing: true })).toBe(true);
    expect(isAuthorizedVideoJoin({ hasHome: false, ticketed: true, ticketPaid: false })).toBe(false);
  });

  it("derives concierge priority from entitlement, not the client", () => {
    expect(
      priorityFromEntitlement({
        subscription_tier: "home",
        subscription_status: "active",
        subscription_expires_at: null,
      })
    ).toBe("home_priority");
    expect(
      priorityFromEntitlement({
        subscription_tier: "plus",
        subscription_status: "active",
        subscription_expires_at: null,
      })
    ).toBe("standard");
  });

  it("tracks 24h sprint progress without requiring a stay-online flag", () => {
    const start = "2026-09-06T00:00:00.000Z";
    const end = "2026-09-07T00:00:00.000Z";
    const mid = Date.parse("2026-09-06T12:00:00.000Z");
    const progress = sprintProgress({ startsAt: start, endsAt: end, now: mid });
    expect(progress.ratio).toBeCloseTo(0.5);
    expect(progress.ended).toBe(false);
  });
});
