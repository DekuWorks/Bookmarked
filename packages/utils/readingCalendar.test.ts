import { describe, expect, it } from "vitest";
import { addCalendarMonths, buildReadingCalendarMonth } from "./readingCalendar";

describe("reading calendar", () => {
  it("places a qualifying session on session_date, not created_at", () => {
    const month = buildReadingCalendarMonth(
      [
        {
          session_date: "2026-09-04",
          created_at: "2026-09-06T10:00:00.000Z",
          pages_read: 12,
          activity_kind: "session",
          bookId: "b1",
          bookTitle: "One",
          bookCoverUrl: "https://covers.example/one.jpg",
        },
      ],
      2026,
      9
    );

    const fourth = month.days.find((day) => day.dateKey === "2026-09-04");
    const sixth = month.days.find((day) => day.dateKey === "2026-09-06");
    expect(fourth?.qualifying).toBe(true);
    expect(fourth?.coverUrl).toContain("one.jpg");
    expect(sixth?.qualifying).toBe(false);
  });

  it("uses the most recent cover plus a count when two books are read the same day", () => {
    const month = buildReadingCalendarMonth(
      [
        {
          session_date: "2026-09-04",
          created_at: "2026-09-04T09:00:00.000Z",
          pages_read: 8,
          activity_kind: "session",
          bookId: "older",
          bookTitle: "Older",
          bookCoverUrl: "https://covers.example/older.jpg",
        },
        {
          session_date: "2026-09-04",
          created_at: "2026-09-04T18:00:00.000Z",
          pages_read: 10,
          activity_kind: "progress",
          bookId: "newer",
          bookTitle: "Newer",
          bookCoverUrl: "https://covers.example/newer.jpg",
        },
      ],
      2026,
      9
    );

    const day = month.days.find((item) => item.dateKey === "2026-09-04");
    expect(day?.bookCount).toBe(2);
    expect(day?.coverUrl).toContain("newer.jpg");
    expect(day?.coverTitle).toBe("Newer");
  });

  it("ignores import and shelf-style completion events", () => {
    const month = buildReadingCalendarMonth(
      [
        {
          session_date: "2026-09-04",
          pages_read: 300,
          activity_kind: "import",
          bookCoverUrl: "https://covers.example/import.jpg",
        },
        {
          session_date: "2026-09-05",
          pages_read: 300,
          activity_kind: "completion",
          bookCoverUrl: "https://covers.example/finish.jpg",
        },
      ],
      2026,
      9
    );

    expect(month.days.find((day) => day.dateKey === "2026-09-04")?.qualifying).toBe(false);
    expect(month.days.find((day) => day.dateKey === "2026-09-05")?.qualifying).toBe(false);
  });

  it("navigates months without wrapping the year incorrectly", () => {
    expect(addCalendarMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(addCalendarMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
  });
});
