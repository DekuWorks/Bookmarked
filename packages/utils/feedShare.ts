export const FEED_SOURCE_TYPES = [
  "review",
  "note",
  "challenge_complete",
  "challenge_goal",
  "challenge_badge",
  "challenge_community_milestone",
] as const;
export type FeedSourceType = (typeof FEED_SOURCE_TYPES)[number];

export const CHALLENGE_FEED_SOURCE_TYPES = [
  "challenge_complete",
  "challenge_goal",
  "challenge_badge",
  "challenge_community_milestone",
] as const;
export type ChallengeFeedSourceType = (typeof CHALLENGE_FEED_SOURCE_TYPES)[number];

export function isFeedSourceType(value: string | null | undefined): value is FeedSourceType {
  return Boolean(value && (FEED_SOURCE_TYPES as readonly string[]).includes(value));
}

export function feedShareDedupKey(sourceType: FeedSourceType, sourceId: string): string {
  return `${sourceType}:${sourceId}`;
}

export function noteIsShareableToFeed(visibility: string | null | undefined): boolean {
  return visibility === "public";
}

export function buildNoteSharePostBody(input: {
  quote?: string | null;
  note?: string | null;
  bookTitle?: string | null;
  location?: string | null;
  caption?: string | null;
}): string {
  const blocks: string[] = [];
  const caption = input.caption?.trim();
  if (caption) blocks.push(caption);

  const details: string[] = [];
  if (input.bookTitle?.trim()) details.push(`📖 ${input.bookTitle.trim()}`);
  if (input.location?.trim()) details.push(input.location.trim());
  if (details.length) blocks.push(details.join("\n"));

  if (input.quote?.trim()) blocks.push(`“${input.quote.trim()}”`);
  if (input.note?.trim()) blocks.push(input.note.trim());

  return blocks.join("\n\n");
}

export function isChallengeFeedSourceType(
  value: string | null | undefined
): value is ChallengeFeedSourceType {
  return Boolean(value && (CHALLENGE_FEED_SOURCE_TYPES as readonly string[]).includes(value));
}

/** Major milestones only — not each objective, book, or percent tick. */
export function challengeShareIsMajorMilestone(kind: ChallengeFeedSourceType): boolean {
  return CHALLENGE_FEED_SOURCE_TYPES.includes(kind);
}

export function buildChallengeSharePostBody(input: {
  kind: ChallengeFeedSourceType;
  challengeTitle: string;
  detail?: string | null;
}): string {
  const title = input.challengeTitle.trim() || "Reading challenge";
  switch (input.kind) {
    case "challenge_complete":
      return `Challenge complete: ${title}`;
    case "challenge_goal":
      return input.detail?.trim()
        ? `Challenge goal: ${title}\n${input.detail.trim()}`
        : `Challenge goal: ${title}`;
    case "challenge_badge":
      return input.detail?.trim()
        ? `New badge: ${input.detail.trim()}`
        : `New badge from ${title}`;
    case "challenge_community_milestone":
      return input.detail?.trim()
        ? `${title} reached ${input.detail.trim()}`
        : `${title} hit a community milestone`;
    default:
      return title;
  }
}
