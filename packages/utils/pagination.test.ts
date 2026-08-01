import { describe, expect, it } from "vitest";
import { paginateItems } from "./pagination";

describe("paginateItems", () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1);

  it("returns the first page of 10 by default", () => {
    const slice = paginateItems(items, 1);
    expect(slice.pageItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(slice.page).toBe(1);
    expect(slice.totalPages).toBe(3);
    expect(slice.total).toBe(23);
  });

  it("returns the last partial page", () => {
    const slice = paginateItems(items, 3);
    expect(slice.pageItems).toEqual([21, 22, 23]);
    expect(slice.page).toBe(3);
    expect(slice.endIndex).toBe(23);
  });

  it("clamps out-of-range pages", () => {
    expect(paginateItems(items, 0).page).toBe(1);
    expect(paginateItems(items, 99).page).toBe(3);
  });

  it("handles empty lists", () => {
    const slice = paginateItems([], 1);
    expect(slice.pageItems).toEqual([]);
    expect(slice.totalPages).toBe(1);
    expect(slice.total).toBe(0);
  });
});
