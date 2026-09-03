import { describe, expect, it } from "vitest";
import {
  percentFromPages,
  resolveUserEditionTotalPages,
  validatePageProgress,
} from "./pageProgress";

describe("validatePageProgress", () => {
  it("accepts a valid current/total pair and recalculates percent", () => {
    expect(validatePageProgress({ currentPage: 50, totalPages: 200 })).toEqual({
      ok: true,
      currentPage: 50,
      totalPages: 200,
      percent: 25,
    });
  });

  it("rejects total <= 0, negative current, and current > total", () => {
    expect(validatePageProgress({ currentPage: 1, totalPages: 0 }).ok).toBe(false);
    expect(validatePageProgress({ currentPage: -1, totalPages: 200 }).ok).toBe(false);
    expect(validatePageProgress({ currentPage: 201, totalPages: 200 }).ok).toBe(false);
  });
});

describe("percentFromPages", () => {
  it("caps at 100", () => {
    expect(percentFromPages(300, 200)).toBe(100);
  });
});

describe("resolveUserEditionTotalPages", () => {
  it("prefers the user's edition total over the catalog", () => {
    expect(
      resolveUserEditionTotalPages({ userTotalPages: 412, catalogPageCount: 500 })
    ).toBe(412);
    expect(resolveUserEditionTotalPages({ userTotalPages: null, catalogPageCount: 500 })).toBe(
      500
    );
  });
});
