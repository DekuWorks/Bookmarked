/** Meaningful badges only. Opening a tab never awards one. */

export const CHALLENGE_BADGE_KEYS = [
  "first_challenge_completed",
  "challenge_streak_30",
  "books_100",
] as const;

export type ChallengeBadgeKey = (typeof CHALLENGE_BADGE_KEYS)[number];

export const CHALLENGE_BADGE_DEFINITIONS: Record<
  ChallengeBadgeKey,
  { title: string; description: string }
> = {
  first_challenge_completed: {
    title: "First Challenge Completed",
    description: "Finished your first reading challenge.",
  },
  challenge_streak_30: {
    title: "30-day streak",
    description: "Kept a 30-day reading streak.",
  },
  books_100: {
    title: "100 books",
    description: "Finished 100 books.",
  },
};

export function isChallengeBadgeKey(value: string | null | undefined): value is ChallengeBadgeKey {
  return Boolean(value && (CHALLENGE_BADGE_KEYS as readonly string[]).includes(value));
}

export function badgeA11yLabel(title: string, featured: boolean): string {
  return featured ? `${title} badge, featured` : `${title} badge`;
}

export function shouldAwardOneTimeBadge(
  badgeKey: string,
  alreadyAwarded: ReadonlySet<string>
): boolean {
  return isChallengeBadgeKey(badgeKey) && !alreadyAwarded.has(badgeKey);
}

export function evaluateChallengeBadges(input: {
  completedChallengeCount: number;
  readingStreakDays: number;
  finishedBookCount: number;
  alreadyAwarded: readonly string[];
}): ChallengeBadgeKey[] {
  const have = new Set(input.alreadyAwarded);
  const next: ChallengeBadgeKey[] = [];

  if (input.completedChallengeCount >= 1 && shouldAwardOneTimeBadge("first_challenge_completed", have)) {
    next.push("first_challenge_completed");
  }
  if (input.readingStreakDays >= 30 && shouldAwardOneTimeBadge("challenge_streak_30", have)) {
    next.push("challenge_streak_30");
  }
  if (input.finishedBookCount >= 100 && shouldAwardOneTimeBadge("books_100", have)) {
    next.push("books_100");
  }

  return next;
}

export function featuredBadgeLimit(): number {
  return 6;
}

export function canFeatureAnotherBadge(featuredCount: number): boolean {
  return featuredCount < featuredBadgeLimit();
}
