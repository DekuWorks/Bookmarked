export const FEED_SOURCE_TYPES = ["review", "note"] as const;
export type FeedSourceType = (typeof FEED_SOURCE_TYPES)[number];

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
