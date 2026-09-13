import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  READING_CALENDAR_QUERY_KEY,
  READING_SESSIONS_QUERY_KEY,
  readingCalendarQueryKey,
  readingSessionsQueryKey,
} from "./readingSessionQueries";
import { shouldCreateProgressReadingSession } from "../../../../packages/utils/progressSession";

const root = resolve(__dirname, "../..");

describe("reading session Trail/Calendar sync", () => {
  it("uses stable query keys for Trail and Calendar", () => {
    expect(readingSessionsQueryKey("user-1")).toEqual([READING_SESSIONS_QUERY_KEY, "user-1"]);
    expect(readingCalendarQueryKey("user-1", "2026-09-01", "2026-10-01")).toEqual([
      READING_CALENDAR_QUERY_KEY,
      "user-1",
      "2026-09-01",
      "2026-10-01",
    ]);
  });

  it("invalidates Trail and Calendar after Book Page progress saves", () => {
    const source = readFileSync(resolve(root, "app/(app)/book/[id].tsx"), "utf8");
    expect(source).toContain('queryKey: ["reading-sessions"]');
    expect(source).toContain('queryKey: ["reading-calendar"]');
  });

  it("refetches session sources when Home regains focus", () => {
    const source = readFileSync(resolve(root, "app/(app)/index.tsx"), "utf8");
    expect(source).toContain("useFocusEffect");
    expect(source).toContain("READING_CALENDAR_QUERY_KEY");
    expect(source).toContain("readingSessionsQueryKey");
  });

  it("does not invent sessions for no-op or backward progress", () => {
    expect(
      shouldCreateProgressReadingSession({
        format: "book",
        previousPosition: 100,
        nextPosition: 100,
      }).create
    ).toBe(false);
    expect(
      shouldCreateProgressReadingSession({
        format: "audiobook",
        previousPosition: 900,
        nextPosition: 800,
      }).create
    ).toBe(false);
  });
});
