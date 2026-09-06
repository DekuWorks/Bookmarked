import { describe, expect, it } from "vitest";
import {
  PLUS_INSIGHTS_COPY,
  computePagesByMonth,
  computePagesByWeek,
  computeReadingHabits,
  computeReadingSpeed,
  computeReadingTime,
  computeYearOverYear,
  heatmapA11yLabel,
} from "./plusInsights";

describe("computeReadingSpeed", () => {
  it("uses pages and duration only", () => {
    const result = computeReadingSpeed([
      { pages_read: 40, duration_seconds: 3600, session_format: "book", activity_kind: "session" },
    ]);
    expect(result.pagesPerHour).toBe(40);
  });

  it("never invents pace from dates or audiobooks", () => {
    const result = computeReadingSpeed([
      { pages_read: 200, session_format: "book", activity_kind: "session", created_at: "2026-01-01T00:00:00.000Z" },
      { pages_read: 50, duration_seconds: 1800, session_format: "audiobook", activity_kind: "session" },
    ]);
    expect(result.pagesPerHour).toBeNull();
    expect(result.omittedUntimedPrintSessions).toBe(1);
    expect(result.omittedAudiobookSessions).toBe(1);
  });
});

describe("computeReadingTime", () => {
  it("keeps reading and listening separate", () => {
    const result = computeReadingTime([
      { duration_seconds: 600, session_format: "book", activity_kind: "session" },
      { listening_seconds: 900, session_format: "audiobook", activity_kind: "session" },
    ]);
    expect(result.readingSeconds).toBe(600);
    expect(result.listeningSeconds).toBe(900);
    expect(result.combinedSeconds).toBeNull();
  });
});

describe("pages by week/month", () => {
  it("ignores audiobook pages and uses session_date", () => {
    const now = new Date("2026-09-06T12:00:00.000Z");
    const week = computePagesByWeek(
      [
        { session_date: "2026-09-05", pages_read: 20, session_format: "book", activity_kind: "session" },
        { session_date: "2026-09-05", pages_read: 99, session_format: "audiobook", activity_kind: "session" },
        { session_date: "2026-08-01", pages_read: 40, session_format: "book", activity_kind: "session" },
      ],
      2,
      now
    );
    expect(week.at(-1)?.pages).toBe(20);
    const month = computePagesByMonth(
      [{ session_date: "2026-09-01", pages_read: 15, session_format: "book", activity_kind: "progress" }],
      1,
      now
    );
    expect(month[0]?.pages).toBe(15);
  });
});

describe("habits and YoY", () => {
  it("uses sparse copy instead of fake precision", () => {
    const habits = computeReadingHabits([
      { session_date: "2026-09-01", pages_read: 10, activity_kind: "session" },
    ]);
    expect(habits.sparse).toBe(true);
    expect(habits.copy).toBe(PLUS_INSIGHTS_COPY.sparseHabits);
  });

  it("omits incomplete years and never returns Infinity%", () => {
    const points = computeYearOverYear({
      currentYear: 2026,
      years: [
        { year: 2025, pages: 0, listeningSeconds: 0, booksFinished: 1 },
        { year: 2026, pages: 100, listeningSeconds: 0, booksFinished: 2 },
      ],
    });
    expect(points[0]?.percentChangePages).toBeNull();
    expect(points[1]?.complete).toBe(false);
    expect(points[1]?.percentChangePages).toBeNull();
  });

  it("computes a finite percent when the prior complete year had pages", () => {
    const points = computeYearOverYear({
      currentYear: 2026,
      years: [
        { year: 2024, pages: 100, listeningSeconds: 0, booksFinished: 4 },
        { year: 2025, pages: 150, listeningSeconds: 0, booksFinished: 6 },
      ],
    });
    expect(points[1]?.percentChangePages).toBe(50);
  });
});

describe("heatmap a11y", () => {
  it("includes a readable value", () => {
    expect(heatmapA11yLabel("2026-09-06", 12)).toMatch(/12 pages read/);
    expect(heatmapA11yLabel("2026-09-06", 0)).toMatch(/no pages read/);
  });
});
