/** Custom session mood tags — private to the creator, safe to archive. */

export const BUILTIN_MOOD_TAGS = [
  "Happy",
  "Emotional",
  "Heartwarming",
  "Thought-provoking",
  "Dark",
  "Funny",
  "Suspenseful",
  "Romantic",
  "Adventurous",
  "Melancholy",
  "Inspiring",
  "Cozy",
] as const;

export type BuiltinMoodTag = (typeof BUILTIN_MOOD_TAGS)[number];

export type CustomMoodTag = {
  id: string;
  name: string;
  archivedAt?: string | null;
};

const BUILTIN_SET = new Set<string>(BUILTIN_MOOD_TAGS.map((tag) => tag.toLowerCase()));

export function normalizeMoodTagName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function isBuiltinMoodTag(name: string): boolean {
  return BUILTIN_SET.has(normalizeMoodTagName(name).toLowerCase());
}

export function validateCustomMoodTagName(name: string): { ok: true; name: string } | { ok: false; error: string } {
  const normalized = normalizeMoodTagName(name);
  if (!normalized) return { ok: false, error: "Enter a mood name." };
  if (normalized.length > 32) return { ok: false, error: "Mood names must be 32 characters or fewer." };
  if (isBuiltinMoodTag(normalized)) {
    return { ok: false, error: "That mood already exists as a built-in tag." };
  }
  return { ok: true, name: normalized };
}

export function mergeMoodTags(custom: CustomMoodTag[]): string[] {
  const active = custom
    .filter((tag) => !tag.archivedAt)
    .map((tag) => tag.name);
  const seen = new Set(BUILTIN_MOOD_TAGS.map((tag) => tag.toLowerCase()));
  const extras: string[] = [];
  for (const name of active) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    extras.push(name);
  }
  return [...BUILTIN_MOOD_TAGS, ...extras];
}

/** Archive only — never rewrite historical session mood strings. */
export function archiveCustomMoodTag<T extends CustomMoodTag>(
  tags: T[],
  tagId: string,
  archivedAt = new Date().toISOString()
): T[] {
  return tags.map((tag) =>
    tag.id === tagId ? { ...tag, archivedAt } : tag
  );
}
