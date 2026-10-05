import { describe, expect, it } from "vitest";
import { parseReadingRoomTab } from "./readingRoomTabs";

describe("parseReadingRoomTab", () => {
  it("defaults to overview", () => {
    expect(parseReadingRoomTab(null)).toBe("overview");
    expect(parseReadingRoomTab(undefined)).toBe("overview");
    expect(parseReadingRoomTab("unknown")).toBe("overview");
  });

  it("maps legacy journal tab to trail", () => {
    expect(parseReadingRoomTab("journal")).toBe("trail");
  });

  it("maps legacy dashboard tab to overview", () => {
    expect(parseReadingRoomTab("dashboard")).toBe("overview");
  });

  it("maps the old Progress tab onto Stats", () => {
    expect(parseReadingRoomTab("progress")).toBe("stats");
    expect(parseReadingRoomTab("stats")).toBe("stats");
  });

  it("keeps Trail and History reachable without showing them in the tab bar", () => {
    expect(parseReadingRoomTab("trail")).toBe("trail");
    expect(parseReadingRoomTab("history")).toBe("history");
  });
});
