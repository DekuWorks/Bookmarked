import { describe, expect, it } from "vitest";
import {
  collectStreakDateKeys,
  computeReadingStreak,
  sessionQualifiesForStreak,
  streakDateKeyForSession,
} from "./readingStreak";

describe("reading streak qualification", () => {
  it("counts a session on session_date when pages were read", () => {
    expect(
      sessionQualifiesForStreak({
        session_date: "2026-09-04",
        created_at: "2026-09-06T10:00:00.000Z",
        pages_read: 12,
        activity_kind: "session",
      })
    ).toBe(true);
    expect(
      streakDateKeyForSession({
        session_date: "2026-09-04",
        created_at: "2026-09-06T10:00:00.000Z",
        pages_read: 12,
      })
    ).toBe("2026-09-04");
  });

  it("counts listening progress and ignores notes-only sessions", () => {
    expect(
      sessionQualifiesForStreak({
        session_date: "2026-09-04",
        listening_seconds: 900,
        activity_kind: "progress",
      })
    ).toBe(true);
    expect(
      sessionQualifiesForStreak({
        session_date: "2026-09-04",
        pages_read: 0,
        note: "Loved this chapter",
        activity_kind: "session",
      })
    ).toBe(false);
  });

  it("does not count shelf, import, finish-without-progress, or corrections", () => {
    expect(
      sessionQualifiesForStreak({
        session_date: "2026-09-04",
        pages_read: 400,
        activity_kind: "completion",
      })
    ).toBe(false);
    expect(
      sessionQualifiesForStreak({
        session_date: "2019-01-01",
        pages_read: 320,
        activity_kind: "import",
      })
    ).toBe(false);
    expect(
      sessionQualifiesForStreak({
        session_date: "2026-09-04",
        pages_read: 0,
        activity_kind: "completion",
        completed_at: "2026-09-04T12:00:00.000Z",
      })
    ).toBe(false);
    expect(
      collectStreakDateKeys([
        { session_date: "2026-09-04", pages_read: 10, activity_kind: "session" },
        { session_date: "2026-09-04", pages_read: 20, activity_kind: "import" },
        { created_at: "2026-09-05T18:00:00.000Z", updated_at: "2026-09-06T01:00:00.000Z", pages_read: 8 },
      ])
    ).toEqual(expect.arrayContaining(["2026-09-04"]));
  });

  it("uses session_date, not created_at or updated_at, when both exist", () => {
    const keys = collectStreakDateKeys([
      {
        session_date: "2026-09-01",
        created_at: "2026-09-06T08:00:00.000Z",
        updated_at: "2026-09-06T09:00:00.000Z",
        pages_read: 15,
        activity_kind: "session",
      },
    ]);
    expect(keys).toEqual(["2026-09-01"]);
  });
});

describe("computeReadingStreak", () => {
  it("counts consecutive local days including yesterday", () => {
    const now = new Date("2026-09-06T15:00:00");
    const streak = computeReadingStreak(["2026-09-06", "2026-09-05", "2026-09-04"], now);
    expect(streak.current).toBe(3);
    expect(streak.longest).toBe(3);
    expect(streak.activeDays).toBe(3);
  });
});
