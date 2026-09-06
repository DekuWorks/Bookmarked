import { describe, expect, it } from "vitest";
import { evaluateBookForChallenge } from "@bookmarked/utils/challengeRuleEngine";
import { canCreateReadingChallenge, IOS_SUBSCRIBE_COPY } from "@bookmarked/utils/subscription";
import { challengeCanShareToFeed } from "@bookmarked/utils/challengeVisibility";

describe("web challenge engine", () => {
  it("evaluates a finished book and keeps feed private", () => {
    const result = evaluateBookForChallenge(
      {
        id: "c1",
        starts_at: null,
        ends_at: null,
        allow_historical: true,
        allow_same_book_for_multiple_objectives: false,
      },
      [
        {
          id: "o1",
          challenge_id: "c1",
          rule_type: "BOOK_COUNT",
          title: "Books",
          sort_order: 0,
          target_amount: 10,
          params: {},
        },
      ],
      {
        userId: "u1",
        userBookId: "ub1",
        bookId: "b1",
        qualifyingEventId: "e1",
        qualifyingDate: "2026-09-06T00:00:00.000Z",
        eventKind: "completion",
        pagesInEvent: 200,
        listeningSecondsInEvent: 0,
        trackingFormat: "book",
        genreIds: [],
        trustedAuthorId: null,
        trustedRepresentationTags: [],
        curatedBookIds: [],
        clubSelectionBookIds: [],
        alreadyUsedObjectiveIds: [],
      }
    );
    expect(result.contributions).toHaveLength(1);
    expect(challengeCanShareToFeed("private")).toBe(false);
  });

  it("does not treat web as a subscribe path", () => {
    expect(canCreateReadingChallenge(null)).toBe(false);
    expect(IOS_SUBSCRIBE_COPY.body).toMatch(/iOS app/i);
    expect(IOS_SUBSCRIBE_COPY.body).not.toMatch(/checkout|stripe/i);
  });
});
