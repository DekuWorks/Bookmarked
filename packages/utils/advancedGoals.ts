/**
 * Plus advanced reading goals.
 * Reuses challenge rule types where safe. No simultaneous cap (product decision).
 */

import {
  CHALLENGE_RULE_TYPES,
  type ChallengeGoalType,
  type ChallengeRuleType,
} from "./challengeTypes";

export const ADVANCED_GOAL_KINDS = [
  "BOOK_COUNT",
  "PAGE_COUNT",
  "AUDIOBOOK_COUNT",
  "LISTENING_TIME",
  "READING_TIME",
  "GENRE",
  "MONTHLY",
  "DATE_RANGE",
] as const;

export type AdvancedGoalKind = (typeof ADVANCED_GOAL_KINDS)[number];

/** No simultaneous cap. Do not invent a number like 10. */
export const ADVANCED_GOAL_SIMULTANEOUS_LIMIT: number | null = null;

export type AdvancedGoalParams = {
  genre_ids?: string[];
  starts_at?: string | null;
  ends_at?: string | null;
  month?: string | null;
};

export type AdvancedGoalDraft = {
  title: string;
  kind: AdvancedGoalKind;
  targetAmount: number;
  params?: AdvancedGoalParams;
};

export function isAdvancedGoalKind(value: string | null | undefined): value is AdvancedGoalKind {
  return Boolean(value && (ADVANCED_GOAL_KINDS as readonly string[]).includes(value));
}

export function challengeRuleForGoalKind(kind: AdvancedGoalKind): ChallengeRuleType | null {
  if ((CHALLENGE_RULE_TYPES as readonly string[]).includes(kind)) {
    return kind as ChallengeRuleType;
  }
  if (kind === "DATE_RANGE" || kind === "MONTHLY") return "DATE_RANGE";
  if (kind === "READING_TIME") return null;
  return null;
}

export function challengeGoalTypeForKind(kind: AdvancedGoalKind): ChallengeGoalType {
  switch (kind) {
    case "PAGE_COUNT":
      return "PAGE_COUNT";
    case "AUDIOBOOK_COUNT":
      return "AUDIOBOOK_COUNT";
    case "LISTENING_TIME":
    case "READING_TIME":
      return "LISTENING_TIME";
    default:
      return "BOOK_COUNT";
  }
}

export function validateAdvancedGoalDraft(
  draft: AdvancedGoalDraft
): { ok: true } | { ok: false; error: string } {
  if (!draft.title.trim()) return { ok: false, error: "Give this goal a name." };
  if (!isAdvancedGoalKind(draft.kind)) return { ok: false, error: "Choose a goal type." };
  if (!Number.isFinite(draft.targetAmount) || draft.targetAmount <= 0) {
    return { ok: false, error: "Set a target greater than zero." };
  }
  return { ok: true };
}

export function canCreateAnotherAdvancedGoal(activeCount: number): {
  allowed: boolean;
  limit: number | null;
} {
  if (ADVANCED_GOAL_SIMULTANEOUS_LIMIT == null) {
    return { allowed: true, limit: null };
  }
  return { allowed: activeCount < ADVANCED_GOAL_SIMULTANEOUS_LIMIT, limit: ADVANCED_GOAL_SIMULTANEOUS_LIMIT };
}
