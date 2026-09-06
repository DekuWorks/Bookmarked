import { genreIdsOverlap, representationTagsMatch } from "./challengeGenres";
import type {
  ChallengeBookContext,
  ChallengeContributionDraft,
  ChallengeEvaluationResult,
  ChallengeObjective,
  ChallengeProgressUnit,
  ChallengeRecord,
  ChallengeRuleType,
} from "./challengeTypes";

function parseIsoDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function qualifyingDateIsEligible(input: {
  qualifyingDate: string;
  startsAt: string | null | undefined;
  endsAt: string | null | undefined;
  allowHistorical: boolean;
}): boolean {
  if (input.allowHistorical) return true;
  const eventMs = parseIsoDate(input.qualifyingDate);
  if (eventMs == null) return false;
  const startMs = parseIsoDate(input.startsAt ?? null);
  const endMs = parseIsoDate(input.endsAt ?? null);
  if (startMs != null && eventMs < startMs) return false;
  if (endMs != null && eventMs > endMs) return false;
  return true;
}

function unitForRule(ruleType: ChallengeRuleType): ChallengeProgressUnit {
  switch (ruleType) {
    case "PAGE_COUNT":
      return "pages";
    case "LISTENING_TIME":
      return "listening_seconds";
    case "OBJECTIVE_CHECKLIST":
      return "objectives";
    default:
      return "books";
  }
}

function amountForRule(ruleType: ChallengeRuleType, book: ChallengeBookContext): number {
  switch (ruleType) {
    case "PAGE_COUNT":
      return Math.max(0, book.pagesInEvent);
    case "LISTENING_TIME":
      return Math.max(0, book.listeningSecondsInEvent);
    case "AUDIOBOOK_COUNT":
      return book.trackingFormat === "audiobook" && book.eventKind === "completion" ? 1 : 0;
    case "BOOK_COUNT":
    case "GENRE":
    case "FORMAT":
    case "BOOK_ID":
    case "AUTHOR_ID":
    case "CURATED_ELIGIBILITY":
    case "DATE_RANGE":
    case "BOOK_CLUB_SELECTION":
    case "OBJECTIVE_CHECKLIST":
      return book.eventKind === "completion" ? 1 : 0;
    default:
      return 0;
  }
}

function formatMatches(book: ChallengeBookContext, required?: string): boolean {
  if (!required) return false;
  return book.trackingFormat === required;
}

function evaluateObjectiveRule(
  ruleType: ChallengeRuleType,
  objective: ChallengeObjective,
  book: ChallengeBookContext
): { qualifies: boolean; reason: string } {
  const params = objective.params;

  if (params.representation_tags?.length) {
    if (!representationTagsMatch(book.trustedRepresentationTags, params.representation_tags)) {
      return { qualifies: false, reason: "" };
    }
  }

  switch (ruleType) {
    case "BOOK_COUNT":
      if (book.eventKind !== "completion") return { qualifies: false, reason: "" };
      return { qualifies: true, reason: "Finished a book toward the reading goal" };
    case "PAGE_COUNT":
      if (book.pagesInEvent <= 0) return { qualifies: false, reason: "" };
      return {
        qualifies: true,
        reason: `Counted ${book.pagesInEvent} page${book.pagesInEvent === 1 ? "" : "s"} from this session`,
      };
    case "AUDIOBOOK_COUNT":
      if (book.eventKind !== "completion") return { qualifies: false, reason: "" };
      if (book.trackingFormat !== "audiobook") return { qualifies: false, reason: "" };
      return { qualifies: true, reason: "Finished an audiobook" };
    case "LISTENING_TIME":
      if (book.listeningSecondsInEvent <= 0) return { qualifies: false, reason: "" };
      return { qualifies: true, reason: "Counted listening time from this session" };
    case "GENRE":
      if (book.eventKind !== "completion") return { qualifies: false, reason: "" };
      if (!genreIdsOverlap(book.genreIds, params.genre_ids)) {
        return { qualifies: false, reason: "" };
      }
      return { qualifies: true, reason: "Matched a required genre from catalog subjects" };
    case "FORMAT":
      if (book.eventKind !== "completion") return { qualifies: false, reason: "" };
      if (!formatMatches(book, params.format)) return { qualifies: false, reason: "" };
      return { qualifies: true, reason: "Matched the edition format you selected" };
    case "BOOK_ID":
      if (book.eventKind !== "completion") return { qualifies: false, reason: "" };
      if (!params.book_id || params.book_id !== book.bookId) {
        return { qualifies: false, reason: "" };
      }
      return { qualifies: true, reason: "This title is on the challenge list" };
    case "AUTHOR_ID":
      if (book.eventKind !== "completion") return { qualifies: false, reason: "" };
      if (!params.author_id || !book.trustedAuthorId) {
        return { qualifies: false, reason: "" };
      }
      if (params.author_id !== book.trustedAuthorId) {
        return { qualifies: false, reason: "" };
      }
      return { qualifies: true, reason: "Matched a curated author id" };
    case "CURATED_ELIGIBILITY": {
      if (book.eventKind !== "completion") return { qualifies: false, reason: "" };
      const list = [...(params.book_ids ?? []), ...book.curatedBookIds];
      if (!list.includes(book.bookId)) return { qualifies: false, reason: "" };
      return { qualifies: true, reason: "On the curated eligibility list" };
    }
    case "DATE_RANGE":
      if (book.eventKind !== "completion") return { qualifies: false, reason: "" };
      if (
        !qualifyingDateIsEligible({
          qualifyingDate: book.qualifyingDate,
          startsAt: params.starts_at ?? null,
          endsAt: params.ends_at ?? null,
          allowHistorical: false,
        })
      ) {
        return { qualifies: false, reason: "" };
      }
      return { qualifies: true, reason: "Finished inside the challenge dates" };
    case "BOOK_CLUB_SELECTION":
      if (book.eventKind !== "completion") return { qualifies: false, reason: "" };
      if (!book.clubSelectionBookIds.includes(book.bookId)) {
        return { qualifies: false, reason: "" };
      }
      return { qualifies: true, reason: "This is a book club selection" };
    case "OBJECTIVE_CHECKLIST": {
      const nested = params.nested_rule_type ?? "BOOK_COUNT";
      if (nested === "OBJECTIVE_CHECKLIST") {
        return { qualifies: false, reason: "" };
      }
      return evaluateObjectiveRule(nested, objective, book);
    }
    default:
      return { qualifies: false, reason: "" };
  }
}

/**
 * Evaluate one finished/progress event against one challenge.
 * One book may update many challenges; same-book-for-multiple-objectives is per-challenge.
 */
export function evaluateBookForChallenge(
  challenge: Pick<
    ChallengeRecord,
    | "id"
    | "starts_at"
    | "ends_at"
    | "allow_historical"
    | "allow_same_book_for_multiple_objectives"
  >,
  objectives: ChallengeObjective[],
  book: ChallengeBookContext
): ChallengeEvaluationResult {
  const skippedReasons: string[] = [];
  if (
    !qualifyingDateIsEligible({
      qualifyingDate: book.qualifyingDate,
      startsAt: challenge.starts_at,
      endsAt: challenge.ends_at,
      allowHistorical: challenge.allow_historical,
    })
  ) {
    return {
      challengeId: challenge.id,
      contributions: [],
      skippedReasons: ["Outside the challenge dates"],
    };
  }

  const contributions: ChallengeContributionDraft[] = [];
  const sorted = [...objectives].sort((a, b) => a.sort_order - b.sort_order);

  for (const objective of sorted) {
    if (book.alreadyUsedObjectiveIds.includes(objective.id)) {
      skippedReasons.push("Book already counted for this objective");
      continue;
    }

    const { qualifies, reason } = evaluateObjectiveRule(objective.rule_type, objective, book);
    if (!qualifies) continue;

    const amount = amountForRule(objective.rule_type, book);
    if (amount <= 0) continue;

    contributions.push({
      challengeId: challenge.id,
      objectiveId: objective.id,
      userBookId: book.userBookId,
      qualifyingEventId: book.qualifyingEventId,
      qualifyingDate: book.qualifyingDate,
      amount,
      unit: unitForRule(objective.rule_type),
      reason,
    });

    if (!challenge.allow_same_book_for_multiple_objectives) {
      break;
    }
  }

  return { challengeId: challenge.id, contributions, skippedReasons };
}

export function evaluateBookForChallenges(
  challenges: Array<{
    challenge: Pick<
      ChallengeRecord,
      | "id"
      | "starts_at"
      | "ends_at"
      | "allow_historical"
      | "allow_same_book_for_multiple_objectives"
    >;
    objectives: ChallengeObjective[];
    usedObjectiveIds: string[];
  }>,
  book: Omit<ChallengeBookContext, "alreadyUsedObjectiveIds">
): ChallengeEvaluationResult[] {
  return challenges.map((entry) =>
    evaluateBookForChallenge(entry.challenge, entry.objectives, {
      ...book,
      alreadyUsedObjectiveIds: entry.usedObjectiveIds,
    })
  );
}
