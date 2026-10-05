import { describe, expect, it } from "vitest";
import {
  parseReadingRoomTab,
  readingRoomTabHref,
} from "./readingRoomTabs";

describe("parseReadingRoomTab", () => {
  it("defaults to overview", () => {
    expect(parseReadingRoomTab(null)).toBe("overview");
    expect(parseReadingRoomTab("unknown")).toBe("overview");
  });

  it("maps legacy journal tab to trail", () => {
    expect(parseReadingRoomTab("journal")).toBe("trail");
  });

  it("maps legacy dashboard tab to overview", () => {
    expect(parseReadingRoomTab("dashboard")).toBe("overview");
  });

  it("maps the old Progress tab onto Stats and keeps Trail", () => {
    expect(parseReadingRoomTab("progress")).toBe("stats");
    expect(parseReadingRoomTab("stats")).toBe("stats");
    expect(parseReadingRoomTab("trail")).toBe("trail");
  });
});

describe("readingRoomTabHref", () => {
  it("uses clean URL for overview", () => {
    expect(readingRoomTabHref("overview")).toBe("/reading-room/");
  });

  it("adds tab query for other tabs", () => {
    expect(readingRoomTabHref("stats")).toBe("/reading-room/?tab=stats");
    expect(readingRoomTabHref("trail")).toBe("/reading-room/?tab=trail");
    expect(readingRoomTabHref("history")).toBe("/reading-room/?tab=history");
  });
});
