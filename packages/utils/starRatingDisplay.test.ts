import { describe, expect, it } from "vitest";
import { clampStarRating, parseHalfStarRating, starFills } from "./starRatingDisplay";

describe("starRatingDisplay", () => {
  it("always returns five fills", () => {
    expect(starFills(3.5)).toEqual(["full", "full", "full", "half", "empty"]);
    expect(starFills(null)).toHaveLength(5);
  });

  it("clamps out-of-range ratings", () => {
    expect(clampStarRating(9)).toBe(5);
    expect(clampStarRating(-2)).toBe(0);
  });

  it("parses 0.5-step scores and rejects a 1–10 scale", () => {
    expect(parseHalfStarRating(4.5)).toBe(4.5);
    expect(parseHalfStarRating(8)).toBeNull();
    expect(parseHalfStarRating("")).toBeNull();
  });
});
