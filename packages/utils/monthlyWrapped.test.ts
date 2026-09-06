import { describe, expect, it } from "vitest";
import { computeMonthlyWrapped } from "./monthlyWrapped";

describe("monthly wrapped", () => {
  it("uses session_date and keeps listening separate from pages", () => {
    const recap = computeMonthlyWrapped({
      year: 2026,
      month: 9,
      finishEvents: [
        {
          userBookId: "ub-1",
          readNumber: 1,
          finishedDate: "2026-09-03",
          activityKind: "completion",
        },
      ],
      sessions: [
        {
          session_date: "2026-09-02",
          pages_read: 30,
          activity_kind: "session",
        },
        {
          session_date: "2026-09-02",
          listening_seconds: 600,
          activity_kind: "session",
        },
        {
          session_date: "2026-08-01",
          pages_read: 90,
          activity_kind: "session",
        },
      ],
    });
    expect(recap.hasData).toBe(true);
    expect(recap.booksFinished).toBe(1);
    expect(recap.pagesRead).toBe(30);
    expect(recap.listeningMinutes).toBe(10);
  });
});
