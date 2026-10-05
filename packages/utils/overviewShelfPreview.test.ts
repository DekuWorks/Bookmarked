import { describe, expect, it } from "vitest";
import {
  OVERVIEW_PREVIEW_SHELVES,
  SHELF_PREVIEW_LIMIT,
  bookCountLabel,
  currentlyReadingProgressLabel,
  previewShelfItems,
  readingGoalPercentLabel,
  readingGoalSummary,
} from "./overviewShelfPreview";

describe("overview shelf preview", () => {
  it("previews only TBR, Finished, and DNF", () => {
    expect(OVERVIEW_PREVIEW_SHELVES.map((shelf) => shelf.title)).toEqual([
      "TBR",
      "Finished",
      "DNF",
    ]);
  });

  it("caps cover previews at five and keeps the full count separate", () => {
    const items = [1, 2, 3, 4, 5, 6, 7];
    expect(previewShelfItems(items)).toEqual([1, 2, 3, 4, 5]);
    expect(previewShelfItems(items).length).toBe(SHELF_PREVIEW_LIMIT);
    expect(bookCountLabel(items.length)).toBe("7 books");
    expect(bookCountLabel(1)).toBe("1 book");
    expect(bookCountLabel(0)).toBe("0 books");
  });

  it("formats the reading goal line and percent from the same status", () => {
    expect(readingGoalSummary(3, 12)).toBe("3 out of 12 books");
    expect(readingGoalSummary(0, null)).toBe("0 books finished this year");
    expect(readingGoalSummary(1, null)).toBe("1 book finished this year");
    expect(readingGoalPercentLabel(42.4)).toBe("42%");
    expect(readingGoalPercentLabel(null)).toBeNull();
  });

  it("shows current and total pages when both exist", () => {
    expect(
      currentlyReadingProgressLabel({
        progressPages: 40,
        totalPages: 320,
        progressPercent: 10,
      })
    ).toEqual({ value: "40 / 320", percent: 13 });
  });
});
