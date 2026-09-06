import { describe, expect, it } from "vitest";
import { evaluateBookForChallenges } from "../../../../packages/utils/challengeRuleEngine";
import { filterNewContributions } from "../../../../packages/utils/challengeContributions";
import { canCreateReadingChallenge, IOS_SUBSCRIBE_COPY } from "../../../../packages/utils/subscription";

describe("iOS challenge engine", () => {
  it("dedups the same finish event and allows one book across challenges", () => {
    const book = {
      userId: "u1",
      userBookId: "ub1",
      bookId: "b1",
      qualifyingEventId: "e1",
      qualifyingDate: "2026-09-06T00:00:00.000Z",
      eventKind: "completion" as const,
      pagesInEvent: 12,
      listeningSecondsInEvent: 0,
      trackingFormat: "book" as const,
      genreIds: [],
      trustedAuthorId: null,
      trustedRepresentationTags: [],
      curatedBookIds: [],
      clubSelectionBookIds: [],
    };
    const results = evaluateBookForChallenges(
      [
        {
          challenge: {
            id: "a",
            starts_at: null,
            ends_at: null,
            allow_historical: true,
            allow_same_book_for_multiple_objectives: false,
          },
          objectives: [
            {
              id: "oa",
              challenge_id: "a",
              rule_type: "BOOK_COUNT",
              title: "A",
              sort_order: 0,
              target_amount: 1,
              params: {},
            },
          ],
          usedObjectiveIds: [],
        },
        {
          challenge: {
            id: "b",
            starts_at: null,
            ends_at: null,
            allow_historical: true,
            allow_same_book_for_multiple_objectives: false,
          },
          objectives: [
            {
              id: "ob",
              challenge_id: "b",
              rule_type: "BOOK_COUNT",
              title: "B",
              sort_order: 0,
              target_amount: 1,
              params: {},
            },
          ],
          usedObjectiveIds: [],
        },
      ],
      book
    );
    const drafts = results.flatMap((row) => row.contributions);
    expect(drafts).toHaveLength(2);
    expect(filterNewContributions(drafts, new Set(), "u1")).toHaveLength(2);
    expect(filterNewContributions(drafts, new Set(), "u1")).toHaveLength(2);
  });

  it("keeps Plus purchase on iOS", () => {
    expect(canCreateReadingChallenge(null)).toBe(false);
    expect(IOS_SUBSCRIBE_COPY.cta).toMatch(/iOS/i);
  });
});
