import { describe, expect, it } from "vitest";
import {
  REREAD_LIKELIHOOD_SCALE,
  REREAD_LIKELIHOOD_SCALE_KEY,
  parseCharacterScore,
  parseRereadLikelihood,
  parseWouldRecommend,
  validateChapterNumber,
  validateCharacterName,
} from "./plusReviews";

describe("plus reviews extras", () => {
  it("accepts Yes/No recommend only", () => {
    expect(parseWouldRecommend("yes")).toBe("yes");
    expect(parseWouldRecommend("no")).toBe("no");
    expect(parseWouldRecommend("maybe")).toBeNull();
  });

  it("uses the shared 5-star half-star reread scale", () => {
    expect(REREAD_LIKELIHOOD_SCALE.status).toBe("stars_5_half");
    expect(parseRereadLikelihood({ value: 4.5 })).toEqual({
      value: 4.5,
      scaleKey: REREAD_LIKELIHOOD_SCALE_KEY,
    });
    expect(parseRereadLikelihood({ value: "not-a-number" }).value).toBeNull();
    expect(parseRereadLikelihood({ value: 8 }).value).toBeNull();
    expect(parseRereadLikelihood({ value: 10 }).value).toBeNull();
  });

  it("parses optional character scores on the same scale", () => {
    expect(parseCharacterScore(3.5)).toBe(3.5);
    expect(parseCharacterScore("")).toBeNull();
    expect(parseCharacterScore(9)).toBeNull();
  });

  it("requires a manual chapter number", () => {
    expect(validateChapterNumber(12)).toMatchObject({ ok: true, chapterNumber: 12 });
    expect(validateChapterNumber(0).ok).toBe(false);
  });

  it("requires a user-entered character name", () => {
    expect(validateCharacterName("  Lyra  ")).toMatchObject({ ok: true, name: "Lyra" });
    expect(validateCharacterName("").ok).toBe(false);
  });
});
