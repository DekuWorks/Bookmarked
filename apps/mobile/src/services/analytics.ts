import type { LibraryBookRow } from "./library";
import {
  computeFavoriteGenre,
  computeReadingStreak,
  fetchReadingStreakTimestamps,
  type FavoriteGenreInsight,
  type ReadingStreakInsight,
} from "./readingInsights";
import { countResolvedPagesRead } from "../utils/readingCompletion";
import { countsTowardFinishedStats } from "../../../../packages/utils/shelfStatus";
import { supabase } from "./supabase";

export type ReadingAnalytics = {
  booksRead: number;
  currentlyReading: number;
  wantToRead: number;
  pagesRead: number;
  reviewsWritten: number;
  averageRatingGiven: number | null;
  favoritesCount: number;
  favoriteGenre: FavoriteGenreInsight;
  readingStreak: ReadingStreakInsight;
};

type AnalyticsInput = {
  books: LibraryBookRow[];
  reviewsWritten: number;
  streakTimestamps?: string[];
  profileGenres?: string[] | null;
};

/** Pure analytics computation — mirrors apps/web/src/lib/services/analytics.ts. */
export function computeReadingAnalytics({
  books,
  reviewsWritten,
  streakTimestamps = [],
  profileGenres,
}: AnalyticsInput): ReadingAnalytics {
  const wantToRead = books.filter((b) => b.shelf_status === "want_to_read").length;
  const currentlyReading = books.filter((b) => b.shelf_status === "currently_reading").length;
  const booksRead = books.filter((b) => countsTowardFinishedStats(b)).length;
  const pagesRead = countResolvedPagesRead(books);
  const favoritesCount = books.filter((b) => b.is_favorite).length;

  const rated = books.filter((b) => b.rating != null);
  const averageRatingGiven =
    rated.length > 0
      ? rated.reduce((sum, book) => sum + Number(book.rating), 0) / rated.length
      : null;

  return {
    booksRead,
    currentlyReading,
    wantToRead,
    pagesRead,
    reviewsWritten,
    averageRatingGiven,
    favoritesCount,
    favoriteGenre: computeFavoriteGenre(books, profileGenres),
    readingStreak: computeReadingStreak(streakTimestamps),
  };
}

async function countUserReviews(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count ?? 0;
}

export async function loadReadingAnalytics(
  userId: string,
  books: LibraryBookRow[],
  profileGenres?: string[] | null
): Promise<ReadingAnalytics> {
  const [streakTimestamps, reviewsWritten] = await Promise.all([
    fetchReadingStreakTimestamps(userId),
    countUserReviews(userId),
  ]);

  return computeReadingAnalytics({
    books,
    reviewsWritten,
    streakTimestamps,
    profileGenres,
  });
}
