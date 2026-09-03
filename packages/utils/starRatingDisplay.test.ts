import { describe, expect, it } from "vitest";
import { clampStarRating, starFills } from "./starRatingDisplay";

describe("starRatingDisplay", () => {
  it("always returns five fills", () => {
    expect(starFills(3.5)).toEqual(["full", "full", "full", "half", "empty"]);
    expect(starFills(null)).toHaveLength(5);
  });

  it("clamps out-of-range ratings", () => {
    expect(clampStarRating(9)).toBe(5);
    expect(clampStarRating(-2)).toBe(0);
  });
});
