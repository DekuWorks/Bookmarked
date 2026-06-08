import { createClient } from "@/lib/supabase/server";
import {
  computeReadingAnalytics,
  type ReadingAnalytics,
} from "@/lib/services/analytics";
import {
  computeReadingGoal,
  type ReadingGoalStatus,
} from "@/lib/services/readingGoal";
import { fetchReadingStreakTimestamps } from "@/lib/services/readingInsights";
import {
  getUserLibraryBooks,
  groupBooksByShelf,
  type LibraryBookRow,
  type ShelfGroup,
} from "@/lib/services/library";

export type ReadingRoomData = {
  currentlyReading: LibraryBookRow[];
  recentlyFinished: LibraryBookRow[];
  favorites: LibraryBookRow[];
  analytics: ReadingAnalytics;
  readingGoal: ReadingGoalStatus;
  shelves: ShelfGroup[];
};

export async function getReadingRoomData(
  userId: string,
  yearlyReadingGoal: number | null = null,
  profileGenres?: string[] | null
): Promise<ReadingRoomData> {
  const supabase = await createClient();
  const [books, streakTimestamps] = await Promise.all([
    getUserLibraryBooks(userId),
    fetchReadingStreakTimestamps(userId),
  ]);

  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const currentlyReading = books.filter((b) => b.shelf_status === "currently_reading");

  const recentlyFinished = books
    .filter((b) => b.shelf_status === "read")
    .sort((a, b) => {
      const aDate = a.finished_at ? new Date(a.finished_at).getTime() : 0;
      const bDate = b.finished_at ? new Date(b.finished_at).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, 6);

  const favorites = books.filter((b) => b.is_favorite).slice(0, 8);

  return {
    currentlyReading,
    recentlyFinished,
    favorites,
    analytics: computeReadingAnalytics({
      books,
      reviewsWritten: reviewCount ?? 0,
      streakTimestamps,
      profileGenres,
    }),
    readingGoal: computeReadingGoal(books, yearlyReadingGoal),
    shelves: groupBooksByShelf(books),
  };
}
