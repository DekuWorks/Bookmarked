/** Multi-select session moods. `moods[]` is source of truth; `mood` stays first tag. */

import {
  disableSessionMoodsColumn,
  isMissingMoodsColumn,
  isSessionMoodsColumnEnabled,
} from "./schemaCompat";

export const MAX_SESSION_MOODS = 12;
export const MAX_MOOD_TAG_LENGTH = 32;

export function normalizeSessionMoods(values: readonly (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const raw of values) {
    const label = raw?.trim().replace(/\s+/g, " ") ?? "";
    if (!label || label.length > MAX_MOOD_TAG_LENGTH) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(label);
    if (next.length >= MAX_SESSION_MOODS) break;
  }
  return next;
}

export function sessionMoodsFromRow(row: {
  mood?: string | null;
  moods?: string[] | null;
}): string[] {
  if (Array.isArray(row.moods) && row.moods.length > 0) {
    return normalizeSessionMoods(row.moods);
  }
  return normalizeSessionMoods([row.mood]);
}

export function toggleSessionMood(selected: readonly string[], mood: string): string[] {
  const current = normalizeSessionMoods(selected);
  const key = mood.trim().toLowerCase();
  if (!key) return current;
  if (current.some((item) => item.toLowerCase() === key)) {
    return current.filter((item) => item.toLowerCase() !== key);
  }
  return normalizeSessionMoods([...current, mood]);
}

export function renameSessionMood(
  selected: readonly string[],
  previous: string,
  next: string
): string[] {
  return normalizeSessionMoods(
    selected.map((item) => (item.toLowerCase() === previous.trim().toLowerCase() ? next : item))
  );
}

export function primarySessionMood(moods: readonly string[]): string | null {
  return normalizeSessionMoods(moods)[0] ?? null;
}

export function sessionMoodsPatch(moods: readonly string[]): {
  moods: string[];
  mood: string | null;
} {
  const normalized = normalizeSessionMoods(moods);
  return { moods: normalized, mood: normalized[0] ?? null };
}

export function sessionMoodsWritePatch(moods: readonly string[]): {
  moods?: string[];
  mood: string | null;
} {
  const patch = sessionMoodsPatch(moods);
  if (!isSessionMoodsColumnEnabled()) {
    return { mood: patch.mood };
  }
  return patch;
}

export async function withSessionMoodsWrite(
  run: (
    includeMoodsColumn: boolean
  ) => PromiseLike<{ data: unknown; error: { message?: string | null; code?: string | null } | null }>
): Promise<{ data: unknown; error: { message?: string; code?: string } | null }> {
  const first = await run(isSessionMoodsColumnEnabled());
  const result =
    first.error && isMissingMoodsColumn(first.error)
      ? (disableSessionMoodsColumn(), await run(false))
      : first;
  return {
    data: result.data ?? null,
    error: result.error
      ? { message: result.error.message ?? undefined, code: result.error.code ?? undefined }
      : null,
  };
}

export function flattenSessionMoodsForAnalytics(
  sessions: readonly { mood?: string | null; moods?: string[] | null }[]
): Array<string | null> {
  return sessions.flatMap((session) => {
    const moods = sessionMoodsFromRow(session);
    return moods.length ? moods : [null];
  });
}
