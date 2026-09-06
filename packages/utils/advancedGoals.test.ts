import { describe, expect, it } from "vitest";
import {
  ADVANCED_GOAL_SIMULTANEOUS_LIMIT,
  canCreateAnotherAdvancedGoal,
  challengeRuleForGoalKind,
  validateAdvancedGoalDraft,
} from "./advancedGoals";

describe("advanced goals", () => {
  it("leaves the simultaneous cap unset", () => {
    expect(ADVANCED_GOAL_SIMULTANEOUS_LIMIT).toBeNull();
    expect(canCreateAnotherAdvancedGoal(99)).toEqual({ allowed: true, limit: null });
  });

  it("reuses challenge rules where they exist", () => {
    expect(challengeRuleForGoalKind("PAGE_COUNT")).toBe("PAGE_COUNT");
    expect(challengeRuleForGoalKind("READING_TIME")).toBeNull();
    expect(
      validateAdvancedGoalDraft({ title: "Read 12", kind: "BOOK_COUNT", targetAmount: 12 }).ok
    ).toBe(true);
  });
});
