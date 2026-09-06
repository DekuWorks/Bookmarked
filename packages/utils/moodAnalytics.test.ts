import { describe, expect, it } from "vitest";
import { builtinMoodTagId, computeMoodAnalytics } from "./moodAnalytics";

describe("mood analytics", () => {
  it("uses stable builtin ids and own custom ids", () => {
    const rows = computeMoodAnalytics(["Cozy", "cozy", "Rainy"], [
      { id: "custom-1", name: "Rainy" },
    ]);
    expect(rows[0]?.id).toBe(builtinMoodTagId("Cozy"));
    expect(rows[0]?.count).toBe(2);
    expect(rows[1]?.id).toBe("custom-1");
  });
});
