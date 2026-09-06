import { createClient } from "@/lib/supabase/client";
import { listCompletionFinishEvents } from "@/lib/services/yearlyGoals";
import { listUserReadingSessions } from "@/lib/services/readingSessions";
import {
  availableWrappedYears,
  computeYearlyWrapped,
  type YearlyWrappedRecap,
} from "@bookmarked/utils/yearlyWrapped";
import { finishEventsFromLibraryBooks } from "@bookmarked/utils/yearlyReadingGoal";
import { getUserLibraryBooks } from "@/lib/services/library";

export async function loadYearlyWrapped(
  userId: string,
  year: number
): Promise<{ recap: YearlyWrappedRecap; years: number[] }> {
  const supabase = createClient();
  const [events, sessions, books, reviews, quotes] = await Promise.all([
    listCompletionFinishEvents(userId),
    listUserReadingSessions(userId, 2000),
    getUserLibraryBooks(userId).catch(() => []),
    supabase
      .from("reviews")
      .select("created_at, rating")
      .eq("user_id", userId)
      .then(({ data }) => data ?? []),
    supabase
      .from("reading_notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .or("quote.not.is.null,category.eq.favorite_quote")
      .then(({ count }) => count ?? 0),
  ]);

  const merged = finishEventsFromLibraryBooks(
    books.map((book) => ({
      id: book.id,
      shelf_status: book.shelf_status,
      dnf: book.dnf,
      finished_at: book.finished_at,
    })),
    events
  );

  const recap = computeYearlyWrapped({
    year,
    finishEvents: merged,
    sessions,
    reviews: (reviews as Array<{ created_at: string; rating: number | null }>).map((row) => ({
      createdAt: row.created_at,
      rating: row.rating,
    })),
    quotesSaved: quotes,
  });

  return {
    recap,
    years: availableWrappedYears(merged, sessions),
  };
}
