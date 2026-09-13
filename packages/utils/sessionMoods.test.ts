import { describe, expect, it } from "vitest";
import {
  flattenSessionMoodsForAnalytics,
  normalizeSessionMoods,
  primarySessionMood,
  renameSessionMood,
  sessionMoodsFromRow,
  sessionMoodsPatch,
  toggleSessionMood,
} from "./sessionMoods";

describe("sessionMoods", () => {
  it("normalizes, dedupes, and caps tags", () => {
    expect(normalizeSessionMoods([" Emotional ", "emotional", "Dark", ""])).toEqual([
      "Emotional",
      "Dark",
    ]);
  });

  it("reads moods[] first and falls back to mood", () => {
    expect(sessionMoodsFromRow({ mood: "Cozy", moods: ["Dark", "Funny"] })).toEqual([
      "Dark",
      "Funny",
    ]);
    expect(sessionMoodsFromRow({ mood: "Cozy", moods: [] })).toEqual(["Cozy"]);
  });

  it("toggles without closing other selections", () => {
    expect(toggleSessionMood(["Emotional"], "Dark")).toEqual(["Emotional", "Dark"]);
    expect(toggleSessionMood(["Emotional", "Dark"], "Emotional")).toEqual(["Dark"]);
  });

  it("renames the live selection only", () => {
    expect(renameSessionMood(["Reflective", "Dark"], "Reflective", "Hopeful")).toEqual([
      "Hopeful",
      "Dark",
    ]);
  });

  it("keeps mood as the first selected tag", () => {
    expect(sessionMoodsPatch(["Dark", "Cozy"])).toEqual({
      moods: ["Dark", "Cozy"],
      mood: "Dark",
    });
    expect(primarySessionMood([])).toBeNull();
  });

  it("flattens multi-tag sessions for analytics", () => {
    expect(
      flattenSessionMoodsForAnalytics([
        { mood: "Cozy", moods: ["Dark", "Funny"] },
        { mood: null, moods: [] },
      ])
    ).toEqual(["Dark", "Funny", null]);
  });
});
