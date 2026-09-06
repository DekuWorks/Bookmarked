import { describe, expect, it } from "vitest";
import {
  computeYearlyReadingGoal,
  countBooksFinishedInYear,
  finishedAtCountsForYear,
} from "./yearlyReadingGoal";

describe("yearly reading goal", () => {
  it("counts completion attempts by session_date year, not updated_at", () => {
    const events = [
      {
        userBookId: "a",
        readNumber: 1,
        finishedDate: "2025-12-31",
        activityKind: "completion",
      },
      {
        userBookId: "b",
        readNumber: 1,
        finishedDate: "2026-01-02",
        activityKind: "completion",
      },
      {
        userBookId: "c",
        readNumber: 1,
        finishedDate: "2026-03-01",
        activityKind: "import",
      },
    ];

    expect(countBooksFinishedInYear(events, 2026)).toBe(1);
    expect(countBooksFinishedInYear(events, 2025)).toBe(1);
  });

  it("keeps a prior finish after a reread starts a new cycle", () => {
    const events = [
      {
        userBookId: "same",
        readNumber: 1,
        finishedDate: "2025-06-01",
        activityKind: "completion",
      },
      {
        userBookId: "same",
        readNumber: 2,
        finishedDate: "2026-02-01",
        activityKind: "completion",
      },
    ];

    expect(countBooksFinishedInYear(events, 2025)).toBe(1);
    expect(countBooksFinishedInYear(events, 2026)).toBe(1);
  });

  it("does not fall back to updated_at for library rows", () => {
    expect(
      finishedAtCountsForYear(
        { shelf_status: "read", finished_at: null },
        2026
      )
    ).toBe(false);
    expect(
      finishedAtCountsForYear(
        { shelf_status: "read", finished_at: "2026-04-01T12:00:00.000Z" },
        2026
      )
    ).toBe(true);
  });

  it("computes remaining toward an editable target", () => {
    const status = computeYearlyReadingGoal(
      [{ userBookId: "a", finishedDate: "2026-01-01", activityKind: "completion" }],
      12,
      2026
    );
    expect(status.completed).toBe(1);
    expect(status.remaining).toBe(11);
    expect(status.met).toBe(false);
  });
});
