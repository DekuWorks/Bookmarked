import { describe, expect, it } from "vitest";
import {
  challengeCardColumns,
  challengeProgressAnnouncement,
  checklistItemAnnouncement,
  formatChallengeListeningTime,
  formatCommunityMilestone,
  timeRemainingLabel,
} from "./challengeDisplay";

describe("challenge display", () => {
  it("shows listening as 24h 30m, never seconds or Page 0", () => {
    expect(formatChallengeListeningTime(88_200)).toBe("24h 30m");
    expect(formatChallengeListeningTime(0)).toBe("0m");
  });

  it("formats community milestones as 250k / 1M", () => {
    expect(formatCommunityMilestone(250_000)).toBe("250k");
    expect(formatCommunityMilestone(1_000_000)).toBe("1M");
  });

  it("uses 1 column on iPhone and 2 on iPad", () => {
    expect(challengeCardColumns(390)).toBe(1);
    expect(challengeCardColumns(768)).toBe(2);
  });

  it("announces progress and checklist state", () => {
    expect(
      challengeProgressAnnouncement({
        title: "52 Books",
        current: 13,
        target: 52,
        unit: "books",
        percent: 25,
      })
    ).toContain("25 percent");
    expect(checklistItemAnnouncement("Read a classic", true)).toBe("Read a classic, complete");
    expect(checklistItemAnnouncement("Read a classic", false)).toBe("Read a classic, incomplete");
  });

  it("hides time remaining after the end date", () => {
    expect(timeRemainingLabel("2020-01-01T00:00:00.000Z", Date.parse("2026-09-06T00:00:00.000Z"))).toBe(
      "Ended"
    );
  });
});
