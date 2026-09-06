import { createClient } from "@/lib/supabase/client";
import type { LibraryBookRow } from "@/lib/services/library";
import { collectStreakDateKeys } from "@bookmarked/utils/readingStreak";

export type FavoriteGenreInsight = {
  genre: string | null;
  bookCount: number;
  source: "library" | "profile" | null;
};

export type { ReadingStreakInsight } from "@bookmarked/utils/readingStreak";
export { computeReadingStreak } from "@bookmarked/utils/readingStreak";

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

export async function fetchReadingStreakTimestamps(userId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reading_sessions")
    .select(
      "session_date, created_at, updated_at, pages_read, listening_seconds, listening_start_seconds, listening_end_seconds, note, activity_kind, completed_at"
    )
    .eq("user_id", userId)
    .order("session_date", { ascending: false })
    .limit(500);

  if (error) throw error;
  return collectStreakDateKeys(data ?? []);
}
