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

export function emptyReadingRoomData(
  yearlyReadingGoal: number | null = null
): ReadingRoomData {
  return {
    currentlyReading: [],
    recentlyFinished: [],
    favorites: [],
    analytics: computeReadingAnalytics({
      books: [],
      reviewsWritten: 0,
      streakTimestamps: [],
    }),
    readingGoal: computeReadingGoal([], yearlyReadingGoal),
    shelves: groupBooksByShelf([]),
  };
}

export async function getReadingRoomData(
  userId: string,
  yearlyReadingGoal: number | null = null,
  profileGenres?: string[] | null
): Promise<ReadingRoomData> {
  const supabase = createClient();
  const [books, streakTimestamps] = await Promise.all([
    getUserLibraryBooks(userId).catch((error) => {
      console.error("[readingRoom] library load failed:", error);
      return [] as LibraryBookRow[];
    }),
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

/** Owner-only private reviews. RLS still requires user_id = auth user. */
export async function listPrivateUserReviews(
  userId: string,
  limit = 50
): Promise<UserReviewWithBook[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*, books(id, title, author, cover_url)")
    .eq("user_id", userId)
    .eq("visibility", "private")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[readingRoom] list private user reviews failed:", error);
    return [];
  }

  return (data ?? []) as UserReviewWithBook[];
}

/** Public-only reviews for a reader profile. Kept separate from the Reading
 * Room query so private reviews can never be shown by a profile surface. */
export async function listPublicUserReviews(
  userId: string,
  limit = 50
): Promise<UserReviewWithBook[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*, books(id, title, author, cover_url)")
    .eq("user_id", userId)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[readingRoom] list public user reviews failed:", error);
    return [];
  }

  return (data ?? []) as UserReviewWithBook[];
}
