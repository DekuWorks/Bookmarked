import { describe, expect, it } from "vitest";
import { evaluateBookForChallenge, evaluateBookForChallenges, qualifyingDateIsEligible } from "./challengeRuleEngine";
import { filterNewContributions, challengeContributionDedupKey } from "./challengeContributions";
import { crossedCommunityMilestones } from "./challengeDisplay";
import { evaluateChallengeBadges, shouldAwardOneTimeBadge } from "./challengeBadges";
import { canCreateReadingChallenge } from "./subscription";
import { buildChallengeSharePostBody, challengeShareIsMajorMilestone } from "./feedShare";
import { challengeCanShareToFeed, challengeVisibleToViewer } from "./challengeVisibility";
import { mapSubjectsToGenreIds, representationTagsMatch } from "./challengeGenres";
import type { ChallengeBookContext, ChallengeObjective, ChallengeRecord } from "./challengeTypes";

const challenge = (
  overrides: Partial<ChallengeRecord> = {}
): Pick<
  ChallengeRecord,
  | "id"
  | "starts_at"
  | "ends_at"
  | "allow_historical"
  | "allow_same_book_for_multiple_objectives"
> => ({
  id: "ch-1",
  starts_at: "2026-01-01T00:00:00.000Z",
  ends_at: "2026-12-31T23:59:59.000Z",
  allow_historical: false,
  allow_same_book_for_multiple_objectives: false,
  ...overrides,
});

const objective = (overrides: Partial<ChallengeObjective> = {}): ChallengeObjective => ({
  id: "obj-1",
  challenge_id: "ch-1",
  rule_type: "BOOK_COUNT",
  title: "Read books",
  sort_order: 0,
  target_amount: 52,
  params: {},
  ...overrides,
});

const book = (overrides: Partial<ChallengeBookContext> = {}): ChallengeBookContext => ({
  userId: "user-1",
  userBookId: "ub-1",
  bookId: "book-1",
  qualifyingEventId: "evt-1",
  qualifyingDate: "2026-06-01T12:00:00.000Z",
  eventKind: "completion",
  pagesInEvent: 320,
  listeningSecondsInEvent: 0,
  trackingFormat: "book",
  genreIds: ["fantasy"],
  trustedAuthorId: null,
  trustedRepresentationTags: [],
  curatedBookIds: [],
  clubSelectionBookIds: [],
  alreadyUsedObjectiveIds: [],
  ...overrides,
});

describe("challenge rule engine", () => {
  it("counts a finished book toward BOOK_COUNT", () => {
    const result = evaluateBookForChallenge(challenge(), [objective()], book());
    expect(result.contributions).toHaveLength(1);
    expect(result.contributions[0]?.amount).toBe(1);
    expect(result.contributions[0]?.reason).toContain("Finished a book");
  });

  it("does not increment BOOK_COUNT on a progress edit", () => {
    const result = evaluateBookForChallenge(
      challenge(),
      [objective()],
      book({ eventKind: "progress", pagesInEvent: 20 })
    );
    expect(result.contributions).toHaveLength(0);
  });

  it("counts pages from a canonical progress event, not a retry with no pages", () => {
    const pages = evaluateBookForChallenge(
      challenge(),
      [objective({ id: "pages", rule_type: "PAGE_COUNT", target_amount: 10000 })],
      book({ eventKind: "progress", pagesInEvent: 40 })
    );
    expect(pages.contributions[0]?.amount).toBe(40);
    expect(pages.contributions[0]?.unit).toBe("pages");

    const empty = evaluateBookForChallenge(
      challenge(),
      [objective({ id: "pages", rule_type: "PAGE_COUNT" })],
      book({ eventKind: "progress", pagesInEvent: 0 })
    );
    expect(empty.contributions).toHaveLength(0);
  });

  it("counts audiobooks and listening time without using pages", () => {
    const audio = evaluateBookForChallenge(
      challenge(),
      [objective({ rule_type: "AUDIOBOOK_COUNT" })],
      book({ trackingFormat: "audiobook" })
    );
    expect(audio.contributions[0]?.amount).toBe(1);

    const listening = evaluateBookForChallenge(
      challenge(),
      [objective({ rule_type: "LISTENING_TIME" })],
      book({
        eventKind: "progress",
        trackingFormat: "audiobook",
        pagesInEvent: 0,
        listeningSecondsInEvent: 88200,
      })
    );
    expect(listening.contributions[0]?.unit).toBe("listening_seconds");
    expect(listening.contributions[0]?.amount).toBe(88200);
  });

  it("matches genre from stable IDs only", () => {
    expect(mapSubjectsToGenreIds(["Science Fiction", "Totally Made Up"])).toEqual(["sci-fi"]);
    const hit = evaluateBookForChallenge(
      challenge(),
      [objective({ rule_type: "GENRE", params: { genre_ids: ["fantasy"] } })],
      book({ genreIds: ["fantasy"] })
    );
    expect(hit.contributions).toHaveLength(1);
    const miss = evaluateBookForChallenge(
      challenge(),
      [objective({ rule_type: "GENRE", params: { genre_ids: ["romance"] } })],
      book({ genreIds: ["fantasy"] })
    );
    expect(miss.contributions).toHaveLength(0);
  });

  it("never infers author or representation from names", () => {
    const noAuthor = evaluateBookForChallenge(
      challenge(),
      [objective({ rule_type: "AUTHOR_ID", params: { author_id: "author-1" } })],
      book({ trustedAuthorId: null })
    );
    expect(noAuthor.contributions).toHaveLength(0);
    expect(representationTagsMatch([], ["own-voices"])).toBe(false);
    expect(representationTagsMatch(["own-voices"], ["own-voices"])).toBe(true);
  });

  it("uses user-selected format, not catalog duration", () => {
    const miss = evaluateBookForChallenge(
      challenge(),
      [objective({ rule_type: "FORMAT", params: { format: "audiobook" } })],
      book({ trackingFormat: "book" })
    );
    expect(miss.contributions).toHaveLength(0);
    const hit = evaluateBookForChallenge(
      challenge(),
      [objective({ rule_type: "FORMAT", params: { format: "audiobook" } })],
      book({ trackingFormat: "audiobook" })
    );
    expect(hit.contributions).toHaveLength(1);
  });

  it("matches curated lists, club selections, and exact book ids", () => {
    expect(
      evaluateBookForChallenge(
        challenge(),
        [objective({ rule_type: "BOOK_ID", params: { book_id: "book-1" } })],
        book()
      ).contributions
    ).toHaveLength(1);
    expect(
      evaluateBookForChallenge(
        challenge(),
        [objective({ rule_type: "CURATED_ELIGIBILITY", params: { book_ids: ["book-9"] } })],
        book()
      ).contributions
    ).toHaveLength(0);
    expect(
      evaluateBookForChallenge(
        challenge(),
        [objective({ rule_type: "BOOK_CLUB_SELECTION" })],
        book({ clubSelectionBookIds: ["book-1"] })
      ).contributions
    ).toHaveLength(1);
  });
});

describe("date eligibility", () => {
  it("rejects finishes outside the range unless historical is allowed", () => {
    expect(
      qualifyingDateIsEligible({
        qualifyingDate: "2025-12-01T00:00:00.000Z",
        startsAt: "2026-01-01T00:00:00.000Z",
        endsAt: "2026-12-31T00:00:00.000Z",
        allowHistorical: false,
      })
    ).toBe(false);
    expect(
      qualifyingDateIsEligible({
        qualifyingDate: "2025-12-01T00:00:00.000Z",
        startsAt: "2026-01-01T00:00:00.000Z",
        endsAt: "2026-12-31T00:00:00.000Z",
        allowHistorical: true,
      })
    ).toBe(true);

    const seasonal = evaluateBookForChallenge(
      challenge(),
      [objective()],
      book({ qualifyingDate: "2025-06-01T00:00:00.000Z" })
    );
    expect(seasonal.contributions).toHaveLength(0);
    expect(seasonal.skippedReasons.join(" ")).toMatch(/dates/i);
  });
});

describe("multi-challenge and same-book objectives", () => {
  it("lets one finish update many challenges", () => {
    const results = evaluateBookForChallenges(
      [
        { challenge: challenge({ id: "a" }), objectives: [objective({ challenge_id: "a" })], usedObjectiveIds: [] },
        { challenge: challenge({ id: "b" }), objectives: [objective({ id: "obj-b", challenge_id: "b" })], usedObjectiveIds: [] },
      ],
      book()
    );
    expect(results.map((row) => row.contributions.length)).toEqual([1, 1]);
  });

  it("respects allow_same_book_for_multiple_objectives", () => {
    const objectives = [
      objective({ id: "one", sort_order: 0 }),
      objective({ id: "two", sort_order: 1, title: "Second" }),
    ];
    const blocked = evaluateBookForChallenge(challenge(), objectives, book());
    expect(blocked.contributions).toHaveLength(1);

    const allowed = evaluateBookForChallenge(
      challenge({ allow_same_book_for_multiple_objectives: true }),
      objectives,
      book()
    );
    expect(allowed.contributions).toHaveLength(2);
  });
});

describe("contribution dedup", () => {
  it("never increments the same membership + objective + book + event twice", () => {
    const draft = evaluateBookForChallenge(challenge(), [objective()], book()).contributions[0];
    expect(draft).toBeTruthy();
    if (!draft) return;
    const key = challengeContributionDedupKey({
      challengeId: draft.challengeId,
      userId: "user-1",
      objectiveId: draft.objectiveId,
      userBookId: draft.userBookId,
      qualifyingEventId: draft.qualifyingEventId,
    });
    const retry = filterNewContributions([draft, draft], new Set([key]), "user-1");
    expect(retry).toHaveLength(0);
  });
});

describe("community milestones", () => {
  it("only fires at 250k / 500k / 750k / 1M, not every increment", () => {
    expect(crossedCommunityMilestones(249_999, 250_001)).toEqual([250_000]);
    expect(crossedCommunityMilestones(250_001, 250_050)).toEqual([]);
    expect(crossedCommunityMilestones(749_000, 1_000_000)).toEqual([750_000, 1_000_000]);
  });
});

describe("friend visibility", () => {
  it("keeps private friend challenges off the Feed and away from strangers", () => {
    expect(challengeCanShareToFeed("friend")).toBe(false);
    expect(challengeCanShareToFeed("private")).toBe(false);
    expect(challengeCanShareToFeed("public")).toBe(true);
    expect(
      challengeVisibleToViewer({
        visibility: "friend",
        createdBy: "owner",
        viewerId: "stranger",
        isMember: false,
        isInvited: false,
        viewerFollowsCreator: false,
        isActive: true,
      })
    ).toBe(false);
    expect(
      challengeVisibleToViewer({
        visibility: "friend",
        createdBy: "owner",
        viewerId: "friend-1",
        isMember: false,
        isInvited: true,
        viewerFollowsCreator: true,
        isActive: true,
      })
    ).toBe(true);
  });
});

describe("badges and premium gate", () => {
  it("awards meaningful badges once and never for opening a tab", () => {
    expect(shouldAwardOneTimeBadge("first_challenge_completed", new Set())).toBe(true);
    expect(shouldAwardOneTimeBadge("first_challenge_completed", new Set(["first_challenge_completed"]))).toBe(
      false
    );
    expect(
      evaluateChallengeBadges({
        completedChallengeCount: 0,
        readingStreakDays: 0,
        finishedBookCount: 0,
        alreadyAwarded: [],
      })
    ).toEqual([]);
    expect(
      evaluateChallengeBadges({
        completedChallengeCount: 1,
        readingStreakDays: 30,
        finishedBookCount: 100,
        alreadyAwarded: ["first_challenge_completed"],
      })
    ).toEqual(["challenge_streak_30", "books_100"]);
  });

  it("gates challenge creation on Plus/Home", () => {
    expect(canCreateReadingChallenge(null)).toBe(false);
    expect(
      canCreateReadingChallenge({
        subscription_tier: "plus",
        subscription_status: "active",
        subscription_expires_at: null,
      })
    ).toBe(true);
  });
});

describe("feed share is not spam", () => {
  it("only offers structured cards for major milestones", () => {
    expect(challengeShareIsMajorMilestone("challenge_complete")).toBe(true);
    expect(buildChallengeSharePostBody({ kind: "challenge_complete", challengeTitle: "52 Books" })).toBe(
      "Challenge complete: 52 Books"
    );
  });
});
