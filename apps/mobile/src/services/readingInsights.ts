import type { LibraryBookRow } from "./library";
import { supabase } from "./supabase";

export type ReadingStreakInsight = {
  current: number;
  longest: number;
  activeDays: number;
};

export type FavoriteGenreInsight = {
  genre: string | null;
  bookCount: number;
  source: "library" | "profile" | null;
};

function normalizeGenreLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Top subject/genre from read books; falls back to profile favorite_genres. */
export function computeFavoriteGenre(
  books: LibraryBookRow[],
  profileGenres?: string[] | null
): FavoriteGenreInsight {
  const counts = new Map<string, number>();

  for (const ub of books) {
    if (ub.shelf_status !== "read") continue;
    const subjects = ub.books?.subjects ?? [];
    const seen = new Set<string>();

    for (const subject of subjects.slice(0, 5)) {
      const label = normalizeGenreLabel(subject);
      if (!label) continue;
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  let topGenre: string | null = null;
  let topCount = 0;
  const labelByKey = new Map<string, string>();

  for (const [key, count] of counts) {
    if (!labelByKey.has(key)) {
      const match = books
        .flatMap((ub) => ub.books?.subjects ?? [])
        .map(normalizeGenreLabel)
        .find((s) => s.toLowerCase() === key);
      labelByKey.set(key, match ?? normalizeGenreLabel(key));
    }
    if (count > topCount) {
      topCount = count;
      topGenre = labelByKey.get(key) ?? null;
    }
  }

  if (topGenre) {
    return { genre: topGenre, bookCount: topCount, source: "library" };
  }

  const profileGenre = profileGenres?.find((g) => g.trim())?.trim();
  if (profileGenre) {
    return {
      genre: normalizeGenreLabel(profileGenre),
      bookCount: 0,
      source: "profile",
    };
  }

  return { genre: null, bookCount: 0, source: null };
}

function toUtcDateKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function addUtcDays(dateKey: string, delta: number): string {
  const d = new Date(`${dateKey}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function daysBetweenUtc(a: string, b: string): number {
  const ms =
    new Date(`${b}T12:00:00.000Z`).getTime() - new Date(`${a}T12:00:00.000Z`).getTime();
  return Math.round(ms / 86_400_000);
}

export function computeReadingStreak(timestamps: string[]): ReadingStreakInsight {
  const dateKeys = new Set(timestamps.map(toUtcDateKey));

  if (dateKeys.size === 0) {
    return { current: 0, longest: 0, activeDays: 0 };
  }

  const sorted = Array.from(dateKeys).sort();
  let longest = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetweenUtc(sorted[i - 1]!, sorted[i]!);
    if (gap === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else if (gap > 1) {
      run = 1;
    }
  }

  const today = toUtcDateKey(new Date().toISOString());
  const yesterday = addUtcDays(today, -1);

  let current = 0;
  if (dateKeys.has(today) || dateKeys.has(yesterday)) {
    let cursor = dateKeys.has(today) ? today : yesterday;
    while (dateKeys.has(cursor)) {
      current += 1;
      cursor = addUtcDays(cursor, -1);
    }
  }

  return { current, longest, activeDays: dateKeys.size };
}

export async function fetchReadingStreakTimestamps(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("reading_sessions")
    .select("created_at")
    .eq("user_id", userId)
    .or("pages_read.gt.0,note.not.is.null")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data ?? []).map((row) => row.created_at as string);
}
