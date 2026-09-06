/**
 * Mood / vibe discovery beyond the viewer's own library.
 * Reuses review feelings + session mood tags — no second taxonomy.
 */

import { BUILTIN_MOOD_TAGS } from "./customMoodTags";

export const MOOD_SEARCH_PREFIX = "mood:";

export type MoodSearchQuery = {
  text: string;
  moodIds: string[];
  moodLabels: string[];
};

export function parseMoodSearchQuery(raw: string): MoodSearchQuery {
  const moodIds: string[] = [];
  const moodLabels: string[] = [];
  const textParts: string[] = [];

  for (const token of raw.trim().split(/\s+/)) {
    if (token.toLowerCase().startsWith(MOOD_SEARCH_PREFIX)) {
      const value = token.slice(MOOD_SEARCH_PREFIX.length).trim();
      if (!value) continue;
      if (/^[0-9a-f-]{8,}$/i.test(value)) moodIds.push(value);
      else moodLabels.push(value.replace(/[_-]+/g, " "));
      continue;
    }
    if (token.startsWith("#") && token.length > 1) {
      moodLabels.push(token.slice(1).replace(/[_-]+/g, " "));
      continue;
    }
    textParts.push(token);
  }

  return {
    text: textParts.join(" ").trim(),
    moodIds,
    moodLabels,
  };
}

export function moodLabelMatches(
  haystack: readonly string[] | null | undefined,
  labels: readonly string[]
): boolean {
  if (!haystack?.length || !labels.length) return false;
  const set = new Set(haystack.map((item) => item.trim().toLowerCase()));
  return labels.some((label) => set.has(label.trim().toLowerCase()));
}

export const DISCOVERY_MOOD_OPTIONS = BUILTIN_MOOD_TAGS.map((label) => ({
  id: label.toLowerCase().replace(/\s+/g, "-"),
  label,
  query: `${MOOD_SEARCH_PREFIX}${label.replace(/\s+/g, "-")}`,
}));
