import type { LibraryBookRow } from "@/lib/services/library";

export type ReadingAnalytics = {
  booksRead: number;
  currentlyReading: number;
  wantToRead: number;
  pagesRead: number;
  reviewsWritten: number;
  averageRatingGiven: number | null;
  favoritesCount: number;
};

export function computeReadingAnalytics(
  books: LibraryBookRow[],
  reviewsWritten: number
): ReadingAnalytics {
  const wantToRead = books.filter((b) => b.shelf_status === "want_to_read").length;
  const currentlyReading = books.filter(
    (b) => b.shelf_status === "currently_reading"
  ).length;
  const booksRead = books.filter((b) => b.shelf_status === "read").length;
  const pagesRead = books.reduce((sum, b) => sum + (Number(b.progress_pages) || 0), 0);
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
  };
}
