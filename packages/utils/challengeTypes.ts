/** Shared reading-challenge types. Rules are data-driven — no per-challenge screens. */

export const CHALLENGE_RULE_TYPES = [
  "BOOK_COUNT",
  "PAGE_COUNT",
  "AUDIOBOOK_COUNT",
  "LISTENING_TIME",
  "GENRE",
  "FORMAT",
  "BOOK_ID",
  "AUTHOR_ID",
  "CURATED_ELIGIBILITY",
  "DATE_RANGE",
  "BOOK_CLUB_SELECTION",
  "OBJECTIVE_CHECKLIST",
] as const;

export type ChallengeRuleType = (typeof CHALLENGE_RULE_TYPES)[number];

export const CHALLENGE_VISIBILITIES = ["public", "followers", "friend", "private"] as const;
export type ChallengeVisibility = (typeof CHALLENGE_VISIBILITIES)[number];

export const CHALLENGE_OWNER_KINDS = ["official", "user"] as const;
export type ChallengeOwnerKind = (typeof CHALLENGE_OWNER_KINDS)[number];

export const CHALLENGE_MEMBER_STATUSES = ["active", "completed", "left"] as const;
export type ChallengeMemberStatus = (typeof CHALLENGE_MEMBER_STATUSES)[number];

export const CHALLENGE_INVITE_STATUSES = ["pending", "accepted", "declined"] as const;
export type ChallengeInviteStatus = (typeof CHALLENGE_INVITE_STATUSES)[number];

export const CHALLENGE_GOAL_TYPES = [
  "BOOK_COUNT",
  "PAGE_COUNT",
  "AUDIOBOOK_COUNT",
  "LISTENING_TIME",
  "OBJECTIVE_CHECKLIST",
] as const;
export type ChallengeGoalType = (typeof CHALLENGE_GOAL_TYPES)[number];

export const CHALLENGE_PROGRESS_UNITS = [
  "books",
  "pages",
  "listening_seconds",
  "objectives",
] as const;
export type ChallengeProgressUnit = (typeof CHALLENGE_PROGRESS_UNITS)[number];

export const CHALLENGE_FORMATS = ["book", "ebook", "audiobook"] as const;
export type ChallengeFormat = (typeof CHALLENGE_FORMATS)[number];

export const COMMUNITY_MILESTONE_THRESHOLDS = [250_000, 500_000, 750_000, 1_000_000] as const;

export function isChallengeRuleType(value: string | null | undefined): value is ChallengeRuleType {
  return Boolean(value && (CHALLENGE_RULE_TYPES as readonly string[]).includes(value));
}

export function isChallengeVisibility(
  value: string | null | undefined
): value is ChallengeVisibility {
  return Boolean(value && (CHALLENGE_VISIBILITIES as readonly string[]).includes(value));
}

export function isChallengeGoalType(value: string | null | undefined): value is ChallengeGoalType {
  return Boolean(value && (CHALLENGE_GOAL_TYPES as readonly string[]).includes(value));
}

export type ChallengeObjectiveParams = {
  genre_ids?: string[];
  format?: ChallengeFormat;
  book_id?: string;
  book_ids?: string[];
  author_id?: string;
  curated_list_id?: string;
  club_id?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  representation_tags?: string[];
  nested_rule_type?: ChallengeRuleType;
  target_amount?: number;
};

export type ChallengeObjective = {
  id: string;
  challenge_id: string;
  rule_type: ChallengeRuleType;
  title: string;
  sort_order: number;
  target_amount: number;
  params: ChallengeObjectiveParams;
};

export type ChallengeReward = {
  id: string;
  challenge_id: string;
  badge_key: string;
  title: string;
};

export type ChallengeRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  category: string | null;
  year: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  featured: boolean;
  visibility: ChallengeVisibility;
  owner_kind: ChallengeOwnerKind;
  created_by: string | null;
  goal_type: ChallengeGoalType;
  goal_amount: number;
  allow_same_book_for_multiple_objectives: boolean;
  allow_historical: boolean;
  community_total: number;
  community_unit: ChallengeProgressUnit;
  created_at: string;
};

export type ChallengeBookContext = {
  userId: string;
  userBookId: string;
  bookId: string;
  qualifyingEventId: string;
  qualifyingDate: string;
  eventKind: "completion" | "progress";
  pagesInEvent: number;
  listeningSecondsInEvent: number;
  trackingFormat: ChallengeFormat;
  genreIds: string[];
  trustedAuthorId: string | null;
  trustedRepresentationTags: string[];
  curatedBookIds: string[];
  clubSelectionBookIds: string[];
  alreadyUsedObjectiveIds: string[];
};

export type ChallengeContributionDraft = {
  challengeId: string;
  objectiveId: string;
  userBookId: string;
  qualifyingEventId: string;
  qualifyingDate: string;
  amount: number;
  unit: ChallengeProgressUnit;
  reason: string;
};

export type ChallengeEvaluationResult = {
  challengeId: string;
  contributions: ChallengeContributionDraft[];
  skippedReasons: string[];
};

export type ChallengeProgressSnapshot = {
  current: number;
  target: number;
  unit: ChallengeProgressUnit;
  percent: number;
  completed: boolean;
};

export type ChallengeObjectiveProgress = {
  objectiveId: string;
  title: string;
  completed: boolean;
  current: number;
  target: number;
  unit: ChallengeProgressUnit;
};

export type ChallengeFinishItem = {
  challengeId: string;
  title: string;
  visibility: ChallengeVisibility;
  reasons: string[];
  percent: number;
  completed: boolean;
  shareEligible: boolean;
};

export type ChallengeBadgeAward = {
  badgeKey: string;
  title: string;
  description: string;
};

export type ChallengeEvaluationSummary = {
  updatedCount: number;
  items: ChallengeFinishItem[];
  newBadges: ChallengeBadgeAward[];
  communityMilestones: Array<{
    challengeId: string;
    title: string;
    threshold: number;
    shareEligible: boolean;
  }>;
};

export function emptyChallengeEvaluationSummary(): ChallengeEvaluationSummary {
  return {
    updatedCount: 0,
    items: [],
    newBadges: [],
    communityMilestones: [],
  };
}
