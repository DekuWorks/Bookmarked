import { createClient } from "@/lib/supabase/client";
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
import type { Book, Review } from "@/types";
import { selectRecentlyFinishedBooks } from "@bookmarked/utils/readingRoomHistory";

export type UserReviewWithBook = Review & {
  books: Pick<Book, "id" | "title" | "author" | "cover_url"> | null;
};

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
  const supabase = createClient();
  const [books, streakTimestamps] = await Promise.all([
    getUserLibraryBooks(userId),
    fetchReadingStreakTimestamps(userId),
  ]);

  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const currentlyReading = books.filter((b) => b.shelf_status === "currently_reading");

  const recentlyFinished = selectRecentlyFinishedBooks(books);

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

export async function listUserReviews(
  userId: string,
  limit = 50
): Promise<UserReviewWithBook[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*, books(id, title, author, cover_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[readingRoom] list user reviews failed:", error);
    return [];
  }

  return (data ?? []) as UserReviewWithBook[];
}
