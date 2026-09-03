import { describe, expect, it } from "vitest";
import {
  LIBRARY_FILTER_OPTIONS,
  libraryGridColumnCount,
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
    expect(libraryGridColumnCount(768, true)).toBe(4);
    expect(libraryGridColumnCount(1024, false)).toBe(1);
  });
});
