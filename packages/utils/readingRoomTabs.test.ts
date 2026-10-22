import { describe, expect, it } from "vitest";
import {
  legacyProgressLocation,
  parseReadingRoomTab,
  READING_ROOM_TAB_OPTIONS,
  resolveReadingRoomDestination,
} from "./readingRoomTabs";

describe("parseReadingRoomTab", () => {
  it("defaults to overview", () => {
    expect(parseReadingRoomTab(null)).toBe("overview");
    expect(parseReadingRoomTab(undefined)).toBe("overview");
    expect(parseReadingRoomTab("unknown")).toBe("overview");
  });

  it("maps legacy journal and trail tabs onto Overview", () => {
    expect(parseReadingRoomTab("journal")).toBe("overview");
    expect(parseReadingRoomTab("trail")).toBe("overview");
  });

  it("maps legacy dashboard tab to overview", () => {
    expect(parseReadingRoomTab("dashboard")).toBe("overview");
  });

  it("maps the old Progress tab onto Stats", () => {
    expect(parseReadingRoomTab("progress")).toBe("stats");
    expect(parseReadingRoomTab("stats")).toBe("stats");
  });

  it("keeps History reachable without showing it in the tab bar", () => {
    expect(parseReadingRoomTab("history")).toBe("history");
    expect(READING_ROOM_TAB_OPTIONS.map((option) => option.id)).not.toContain("history");
    expect(READING_ROOM_TAB_OPTIONS.map((option) => option.id)).not.toContain("trail");
  });

  it("shows Overview, Reviews, Notes, and Stats, and no Progress tab", () => {
    expect(READING_ROOM_TAB_OPTIONS.map((option) => option.label)).toEqual([
      "Overview",
      "Reviews",
      "Notes",
      "Stats",
    ]);
    expect(READING_ROOM_TAB_OPTIONS.map((option) => option.id)).not.toContain("progress");
  });

  it("sends a goal Progress link to Overview and the rest of Progress to Stats", () => {
    expect(resolveReadingRoomDestination("progress", "reading-goal")).toBe("overview");
    expect(resolveReadingRoomDestination("progress", "#goal")).toBe("overview");
    expect(resolveReadingRoomDestination("progress", "reading-activity")).toBe("stats");
    expect(resolveReadingRoomDestination("progress", "ai-insights")).toBe("stats");
    expect(resolveReadingRoomDestination("progress", "reading-calendar")).toBe("stats");
    expect(resolveReadingRoomDestination("progress", null)).toBe("stats");
    expect(legacyProgressLocation("progress", "reading-goal")).toEqual({
      tab: "overview",
      hash: "reading-goal",
    });
    expect(legacyProgressLocation("progress", "reading-activity")).toEqual({
      tab: "stats",
      hash: "reading-activity",
    });
    expect(legacyProgressLocation("stats", "reading-goal")).toBeNull();
  });
});
