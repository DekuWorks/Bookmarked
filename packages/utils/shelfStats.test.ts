import { describe, expect, it } from "vitest";
import { buildShelfStatCards, computeShelfStatsFromItems } from "./shelfStats";

const items = [
  { progress_percent: 40, progress_pages: 80, rating: 4, finished_at: null },
  { progress_percent: 0, progress_pages: 0, rating: null, finished_at: null },
];

describe("computeShelfStatsFromItems", () => {
  it("counts books and pages for TBR / custom (2 cards)", () => {
    const stats = computeShelfStatsFromItems(items, "want_to_read");
    expect(stats.totalBooks).toBe(2);
    expect(stats.pagesRead).toBe(80);
    expect(buildShelfStatCards(stats, "want_to_read").map((card) => card.label)).toEqual([
      "Total books",
      "Pages logged",
    ]);
    expect(buildShelfStatCards(stats, "custom").map((card) => card.label)).toEqual([
      "Total books",
      "Pages logged",
    ]);
  });

  it("adds avg progress on currently reading (3 cards)", () => {
    const stats = computeShelfStatsFromItems(items, "currently_reading");
    const cards = buildShelfStatCards(stats, "currently_reading");
    expect(cards).toHaveLength(3);
    expect(cards[1]).toEqual({ label: "Avg progress", value: "40%" });
  });

  it("adds finished-this-month and rating on Finished (4 cards)", () => {
    const stats = computeShelfStatsFromItems(
      [
        {
          progress_percent: 100,
          progress_pages: 300,
          rating: 4.5,
          finished_at: "2026-09-02T12:00:00.000Z",
        },
        {
          progress_percent: 100,
          progress_pages: 200,
          rating: 3.5,
          finished_at: "2026-08-01T12:00:00.000Z",
        },
      ],
      "read",
      new Date("2026-09-07T12:00:00.000Z")
    );
    const cards = buildShelfStatCards(stats, "read");
    expect(cards).toHaveLength(4);
    expect(cards[1]).toEqual({ label: "Finished this month", value: 1 });
    expect(cards[2]).toEqual({ label: "Avg rating", value: "4.0" });
  });

  it("does not invent placeholder cards for DNF", () => {
    const stats = computeShelfStatsFromItems(items, "dnf");
    expect(buildShelfStatCards(stats, "dnf")).toHaveLength(2);
  });
});
