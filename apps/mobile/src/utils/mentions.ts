/**
 * @mention parsing. Mirror of apps/web/src/lib/utils/mentions.ts so mobile posts
 * / comments tag and notify the same usernames web does.
 */

/** Usernames may include dots (e.g. leighton.cook). */
const MENTION_REGEX = /@([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)/g;
const MIN_MENTION_LENGTH = 2;
const MAX_MENTION_LENGTH = 30;

function isValidMentionLength(username: string): boolean {
  return username.length >= MIN_MENTION_LENGTH && username.length <= MAX_MENTION_LENGTH;
}

export function extractMentionUsernames(body: string): string[] {
  const seen = new Set<string>();
  const matches: string[] = [];

  for (const match of body.matchAll(MENTION_REGEX)) {
    const username = match[1]?.toLowerCase();
    if (!username || !isValidMentionLength(username) || seen.has(username)) continue;
    seen.add(username);
    matches.push(username);
  }

  return matches;
}

export type MentionSegment =
  | { type: "text"; value: string }
  | { type: "mention"; username: string };

export function parseMentionSegments(body: string): MentionSegment[] {
  const segments: MentionSegment[] = [];
  let lastIndex = 0;

  for (const match of body.matchAll(MENTION_REGEX)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", value: body.slice(lastIndex, index) });
    }
    const username = match[1];
    if (!username || !isValidMentionLength(username)) continue;
    segments.push({ type: "mention", username });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < body.length) {
    segments.push({ type: "text", value: body.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: "text", value: body }];
}

/** Detect an in-progress "@partial" token at the end of the text left of the cursor. */
export function activeMentionQuery(textBeforeCursor: string): string | null {
  const match = textBeforeCursor.match(/@([a-zA-Z0-9_.]*)$/);
  return match ? match[1] : null;
}
