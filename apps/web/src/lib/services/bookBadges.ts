import { createClient } from "@/lib/supabase/client";
import {
  getCommunityRatingsForBooks,
  type CommunityRating,
} from "@/lib/services/communityRatings";

export type BookBadgeType = "trending" | "bestseller";

export type BookBadge = {
  type: BookBadgeType;
  label: string;
  emoji: string;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const BESTSELLER_MIN_RATINGS = 10;
const BESTSELLER_MIN_AVERAGE = 4.5;
const TRENDING_MIN_ACTIVITY = 3;

function weekAgoIso(): string {
  return new Date(Date.now() - WEEK_MS).toISOString();
}

function isBestseller(rating: CommunityRating | undefined): boolean {
  if (!rating) return false;
  return (
    rating.ratingCount >= BESTSELLER_MIN_RATINGS &&
    rating.averageRating >= BESTSELLER_MIN_AVERAGE
  );
}

export async function getBookBadgesForBooks(
  bookIds: string[]
): Promise<Map<string, BookBadge[]>> {
  const unique = [...new Set(bookIds.filter(Boolean))];
  const result = new Map<string, BookBadge[]>();
  if (unique.length === 0) return result;

  const supabase = createClient();
  const since = weekAgoIso();

  const [activityRes, ratings] = await Promise.all([
    supabase
      .from("activity_events")
      .select("metadata_json")
      .gte("created_at", since)
      .in("event_type", ["book_added", "book_finished", "review_created"]),
    getCommunityRatingsForBooks(unique),
  ]);

  if (activityRes.error) throw activityRes.error;

  const activityCounts = new Map<string, number>();
  for (const row of activityRes.data ?? []) {
    const meta = row.metadata_json as { book_id?: string } | null;
    const id = meta?.book_id;
    if (!id || !unique.includes(id)) continue;
    activityCounts.set(id, (activityCounts.get(id) ?? 0) + 1);
  }

  for (const bookId of unique) {
    const badges: BookBadge[] = [];
    if ((activityCounts.get(bookId) ?? 0) >= TRENDING_MIN_ACTIVITY) {
      badges.push({ type: "trending", label: "Trending", emoji: "🔥" });
    }
    if (isBestseller(ratings.get(bookId))) {
      badges.push({ type: "bestseller", label: "Bestseller", emoji: "⭐" });
    }
    if (badges.length) result.set(bookId, badges);
  }

  return result;
}

export async function getBookBadges(bookId: string): Promise<BookBadge[]> {
  const map = await getBookBadgesForBooks([bookId]);
  return map.get(bookId) ?? [];
}
