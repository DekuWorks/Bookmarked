import type { LibraryBookRow } from "@/lib/services/library";
import {
  computeFavoriteGenre,
  computeReadingStreak,
  type FavoriteGenreInsight,
  type ReadingStreakInsight,
} from "@/lib/services/readingInsights";
import { countResolvedPagesRead } from "@/lib/utils/readingCompletion";
import { countsTowardFinishedStats } from "../../../../../packages/utils/shelfStatus";

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

export function computeReadingAnalytics({
  books,
  reviewsWritten,
  streakTimestamps = [],
  profileGenres,
}: AnalyticsInput): ReadingAnalytics {
  const wantToRead = books.filter((b) => b.shelf_status === "want_to_read").length;
  const currentlyReading = books.filter(
    (b) => b.shelf_status === "currently_reading"
  ).length;
  const booksRead = books.filter((b) => countsTowardFinishedStats(b)).length;
  const pagesRead = countResolvedPagesRead(books);
  const favoritesCount = books.filter((b) => b.is_favorite).length;

  const rated = books.filter((b) => b.rating != null);
  const averageRatingGiven =
    rated.length > 0
      ? rated.reduce((s, b) => s + Number(b.rating), 0) / rated.length
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
