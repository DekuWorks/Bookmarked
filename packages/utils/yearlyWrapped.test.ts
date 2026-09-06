import { describe, expect, it } from "vitest";
import { availableWrappedYears, computeYearlyWrapped } from "./yearlyWrapped";

describe("yearly wrapped", () => {
  it("only reports metrics from real activity dates", () => {
    const recap = computeYearlyWrapped({
      year: 2026,
      finishEvents: [
        { userBookId: "a", finishedDate: "2026-03-02", activityKind: "completion" },
        { userBookId: "b", finishedDate: "2026-03-03", activityKind: "import" },
      ],
      sessions: [
        {
          session_date: "2026-03-02",
          pages_read: 20,
          activity_kind: "session",
        },
        {
          session_date: "2025-12-31",
          pages_read: 99,
          activity_kind: "session",
        },
      ],
      reviews: [{ createdAt: "2026-03-02T10:00:00.000Z" }],
      quotesSaved: 4,
    });

    expect(recap.hasData).toBe(true);
    expect(recap.booksFinished).toBe(1);
    expect(recap.pagesRead).toBe(20);
    expect(recap.reviewsWritten).toBe(1);
    expect(recap.quotesSaved).toBe(4);
  });

  it("returns empty when the year has no accurate activity", () => {
    const recap = computeYearlyWrapped({
      year: 2024,
      finishEvents: [],
      sessions: [{ session_date: "2026-01-01", pages_read: 10, activity_kind: "session" }],
    });
    expect(recap.hasData).toBe(false);
    expect(
      availableWrappedYears(
        [],
        [{ session_date: "2026-01-01", pages_read: 10, activity_kind: "session" }],
        new Date("2026-09-01")
      )
    ).toEqual([2026]);
  });
});
