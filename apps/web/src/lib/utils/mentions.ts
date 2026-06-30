const MENTION_REGEX = /@([a-zA-Z0-9_]{2,30})/g;

export function extractMentionUsernames(body: string): string[] {
  const seen = new Set<string>();
  const matches: string[] = [];

  for (const match of body.matchAll(MENTION_REGEX)) {
    const username = match[1]?.toLowerCase();
    if (!username || seen.has(username)) continue;
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
    segments.push({ type: "mention", username: match[1] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < body.length) {
    segments.push({ type: "text", value: body.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: "text", value: body }];
}
