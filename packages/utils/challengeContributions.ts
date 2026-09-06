import type { ChallengeContributionDraft } from "./challengeTypes";

/** Dedup key: membership + objective + user_book + qualifying_event. */
export function challengeContributionDedupKey(input: {
  challengeId: string;
  userId: string;
  objectiveId: string;
  userBookId: string;
  qualifyingEventId: string;
}): string {
  return [
    input.challengeId,
    input.userId,
    input.objectiveId,
    input.userBookId,
    input.qualifyingEventId,
  ].join(":");
}

export function isDuplicateContribution(
  existingKeys: ReadonlySet<string>,
  draft: ChallengeContributionDraft,
  userId: string
): boolean {
  return existingKeys.has(
    challengeContributionDedupKey({
      challengeId: draft.challengeId,
      userId,
      objectiveId: draft.objectiveId,
      userBookId: draft.userBookId,
      qualifyingEventId: draft.qualifyingEventId,
    })
  );
}

export function filterNewContributions(
  drafts: ChallengeContributionDraft[],
  existingKeys: ReadonlySet<string>,
  userId: string
): ChallengeContributionDraft[] {
  const seen = new Set(existingKeys);
  const next: ChallengeContributionDraft[] = [];
  for (const draft of drafts) {
    const key = challengeContributionDedupKey({
      challengeId: draft.challengeId,
      userId,
      objectiveId: draft.objectiveId,
      userBookId: draft.userBookId,
      qualifyingEventId: draft.qualifyingEventId,
    });
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(draft);
  }
  return next;
}

export function communityIncrementForDraft(draft: ChallengeContributionDraft): number {
  return Math.max(0, draft.amount);
}
