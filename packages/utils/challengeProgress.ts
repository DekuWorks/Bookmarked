import { challengePercent } from "./challengeDisplay";
import type {
  ChallengeGoalType,
  ChallengeObjective,
  ChallengeObjectiveProgress,
  ChallengeProgressSnapshot,
  ChallengeProgressUnit,
} from "./challengeTypes";

export function unitForGoalType(goalType: ChallengeGoalType): ChallengeProgressUnit {
  switch (goalType) {
    case "PAGE_COUNT":
      return "pages";
    case "LISTENING_TIME":
      return "listening_seconds";
    case "OBJECTIVE_CHECKLIST":
      return "objectives";
    case "AUDIOBOOK_COUNT":
    case "BOOK_COUNT":
    default:
      return "books";
  }
}

export function calculateChallengeProgress(input: {
  current: number;
  target: number;
  unit: ChallengeProgressUnit;
}): ChallengeProgressSnapshot {
  const current = Math.max(0, Number.isFinite(input.current) ? input.current : 0);
  const target = Math.max(0, Number.isFinite(input.target) ? input.target : 0);
  const percent = challengePercent(current, target);
  return {
    current,
    target,
    unit: input.unit,
    percent,
    completed: target > 0 && current >= target,
  };
}

export function applyContributionAmount(input: {
  previous: number;
  amount: number;
  monotonic: boolean;
}): number {
  const previous = Math.max(0, input.previous);
  const amount = Math.max(0, input.amount);
  if (input.monotonic) {
    return Math.max(previous, amount);
  }
  return previous + amount;
}

export function isMonotonicRule(ruleType: string): boolean {
  return ruleType === "PAGE_COUNT" || ruleType === "LISTENING_TIME";
}

export function objectiveIsComplete(current: number, target: number): boolean {
  return target > 0 && current >= target;
}

export function summarizeObjectiveProgress(
  objectives: ChallengeObjective[],
  amounts: Record<string, number>
): ChallengeObjectiveProgress[] {
  return [...objectives]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((objective) => {
      const current = Math.max(0, amounts[objective.id] ?? 0);
      const target = Math.max(0, objective.target_amount);
      const unit = unitForGoalType(
        objective.rule_type === "PAGE_COUNT" ||
          objective.rule_type === "LISTENING_TIME" ||
          objective.rule_type === "AUDIOBOOK_COUNT" ||
          objective.rule_type === "OBJECTIVE_CHECKLIST"
          ? objective.rule_type
          : "BOOK_COUNT"
      );
      return {
        objectiveId: objective.id,
        title: objective.title,
        current,
        target,
        unit,
        completed: objectiveIsComplete(current, target),
      };
    });
}

export function completedObjectiveCount(progress: ChallengeObjectiveProgress[]): number {
  return progress.filter((item) => item.completed).length;
}

export function primaryProgressFromObjectives(input: {
  goalType: ChallengeGoalType;
  goalAmount: number;
  books: number;
  pages: number;
  listeningSeconds: number;
  objectives: ChallengeObjectiveProgress[];
}): ChallengeProgressSnapshot {
  const unit = unitForGoalType(input.goalType);
  let current = 0;
  switch (input.goalType) {
    case "PAGE_COUNT":
      current = input.pages;
      break;
    case "LISTENING_TIME":
      current = input.listeningSeconds;
      break;
    case "OBJECTIVE_CHECKLIST":
      current = completedObjectiveCount(input.objectives);
      break;
    case "AUDIOBOOK_COUNT":
    case "BOOK_COUNT":
    default:
      current = input.books;
      break;
  }
  return calculateChallengeProgress({
    current,
    target: input.goalAmount,
    unit,
  });
}
