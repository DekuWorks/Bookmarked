/**
 * Plus mood analytics — own session/review tags only.
 * Stable IDs: builtin slugs stay fixed; custom tags use their row id.
 */

import { BUILTIN_MOOD_TAGS, normalizeMoodTagName } from "./customMoodTags";

export type MoodTagRef = {
  id: string;
  label: string;
  builtin: boolean;
};

export type MoodCount = MoodTagRef & { count: number };

export function builtinMoodTagId(label: string): string {
  return `builtin:${normalizeMoodTagName(label).toLowerCase().replace(/\s+/g, "_")}`;
}

export function resolveMoodTagRef(
  raw: string | null | undefined,
  customByName?: Map<string, { id: string; name: string }>
): MoodTagRef | null {
  const label = normalizeMoodTagName(raw ?? "");
  if (!label) return null;
  const builtin = BUILTIN_MOOD_TAGS.find((tag) => tag.toLowerCase() === label.toLowerCase());
  if (builtin) {
    return { id: builtinMoodTagId(builtin), label: builtin, builtin: true };
  }
  const custom = customByName?.get(label.toLowerCase());
  if (custom) {
    return { id: custom.id, label: custom.name, builtin: false };
  }
  return { id: `unresolved:${label.toLowerCase()}`, label, builtin: false };
}

export function computeMoodAnalytics(
  moods: Array<string | null | undefined>,
  custom?: Array<{ id: string; name: string }>
): MoodCount[] {
  const customByName = new Map(
    (custom ?? []).map((tag) => [normalizeMoodTagName(tag.name).toLowerCase(), tag])
  );
  const counts = new Map<string, MoodCount>();
  for (const raw of moods) {
    const ref = resolveMoodTagRef(raw, customByName);
    if (!ref) continue;
    const current = counts.get(ref.id) ?? { ...ref, count: 0 };
    current.count += 1;
    counts.set(ref.id, current);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
