import { describe, expect, it } from "vitest";
import { canViewClubAnalytics } from "./clubAnalytics";

describe("club analytics auth", () => {
  it("requires Plus and an existing owner/host role", () => {
    expect(canViewClubAnalytics({ hasPlus: true, role: "owner" })).toBe(true);
    expect(canViewClubAnalytics({ hasPlus: true, role: "host" })).toBe(true);
    expect(canViewClubAnalytics({ hasPlus: true, role: "moderator" })).toBe(false);
    expect(canViewClubAnalytics({ hasPlus: true, role: "member" })).toBe(false);
    expect(canViewClubAnalytics({ hasPlus: false, role: "owner" })).toBe(false);
  });
});
