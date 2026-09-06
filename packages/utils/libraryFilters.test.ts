import { describe, expect, it } from "vitest";
import {
  LIBRARY_FILTER_OPTIONS,
  LIBRARY_GRID_GAP,
  libraryGridColumnCount,
  libraryGridLayout,
  parseLibraryFilter,
} from "./libraryFilters";

describe("library filters", () => {
  it("keeps TBR → Currently Reading → Finished → DNF → All", () => {
    expect(LIBRARY_FILTER_OPTIONS.map((option) => option.id)).toEqual([
      "tbr",
      "currently_reading",
      "finished",
      "dnf",
      "all",
    ]);
  });

  it("falls back to All for unknown values", () => {
    expect(parseLibraryFilter("read")).toBe("all");
    expect(parseLibraryFilter("tbr")).toBe("tbr");
  });

  it("uses 4 columns on tablet grid and 3 on phone", () => {
    expect(libraryGridColumnCount(390, true)).toBe(3);
    expect(libraryGridColumnCount(767, true)).toBe(3);
    expect(libraryGridColumnCount(768, true)).toBe(4);
    expect(libraryGridColumnCount(1024, true)).toBe(4);
    expect(libraryGridColumnCount(1024, false)).toBe(1);
  });

  it("drops to 3 columns when the scene is phone-like (Split View)", () => {
    expect(libraryGridColumnCount(512, true)).toBe(3);
    expect(libraryGridLayout(512, true).columns).toBe(3);
  });

  it("keeps 4 columns on a full iPad scene even when the card is padded under 768", () => {
    const paddedCard = libraryGridLayout(704, true, { columnWidth: 768 });
    expect(paddedCard.columns).toBe(4);
    expect(paddedCard.tileWidth).toBe(Math.floor((704 - LIBRARY_GRID_GAP * 3) / 4));
  });

  it("sizes equal tiles from content width with even gaps", () => {
    const tablet = libraryGridLayout(768, true, LIBRARY_GRID_GAP);
    expect(tablet.columns).toBe(4);
    expect(tablet.tileWidth).toBe(Math.floor((768 - LIBRARY_GRID_GAP * 3) / 4));

    const phone = libraryGridLayout(390, true, LIBRARY_GRID_GAP);
    expect(phone.columns).toBe(3);
    expect(phone.tileWidth).toBe(Math.floor((390 - LIBRARY_GRID_GAP * 2) / 3));
    expect(phone.columns).not.toBe(4);
  });
});
