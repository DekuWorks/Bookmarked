import { createClient } from "@/lib/supabase/client";
import {
  addWeightedActivityCount,
  aggregateRatingsByBook,
  blendTrendingScore,
  type CommunityRating,
  type TrendingActivityEventType,
} from "../../../../../packages/utils";

export type TrendingBook = {
  bookId: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  metric: number;
  metricLabel: string;
  communityRating: CommunityRating | null;
};

export type TrendingSection = {
  id: string;
  title: string;
  books: TrendingBook[];
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function weekAgoIso(): string {
  return new Date(Date.now() - WEEK_MS).toISOString();
}

async function loadBooksByIds(bookIds: string[]): Promise<Map<string, TrendingBook>> {
  if (bookIds.length === 0) return new Map();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("books")
    .select("id, title, author, cover_url")
    .in("id", bookIds);

  if (error) throw error;

  const map = new Map<string, TrendingBook>();
  for (const book of data ?? []) {
    map.set(book.id, {
      bookId: book.id,
      title: book.title,
      author: book.author,
      coverUrl: book.cover_url,
      metric: 0,
      metricLabel: "",
      communityRating: null,
    });
  }
  return map;
}

async function loadCommunityRatings(bookIds: string[]): Promise<Map<string, CommunityRating>> {
  if (bookIds.length === 0) return new Map();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("book_id, rating")
    .in("book_id", bookIds)
    .eq("visibility", "public")
    .not("rating", "is", null);

  if (error) throw error;

  return aggregateRatingsByBook(
    (data ?? []).map((row) => ({
      book_id: row.book_id as string,
      rating: Number(row.rating),
    }))
  );
}

function topBooks(
  scores: Map<string, number>,
  books: Map<string, TrendingBook>,
  ratings: Map<string, CommunityRating>,
  metricLabel: string,
  limit = 5,
  roundMetric = true
): TrendingBook[] {
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([bookId, metric]) => {
      const base = books.get(bookId);
      if (!base) return null;
      const displayMetric = roundMetric ? Math.round(metric * 10) / 10 : Math.round(metric);
      return {
        ...base,
        metric: displayMetric,
        metricLabel,
        communityRating: ratings.get(bookId) ?? null,
      };
    })
    .filter((b): b is TrendingBook => b != null);
}

function compositeTrendingScores(
  activityCounts: Map<string, number>,
  shelvedCounts: Map<string, number>,
  reviewCounts: Map<string, number>
): Map<string, number> {
  const bookIds = new Set([
    ...activityCounts.keys(),
    ...shelvedCounts.keys(),
    ...reviewCounts.keys(),
  ]);
  const scores = new Map<string, number>();
  for (const bookId of bookIds) {
    scores.set(bookId, blendTrendingScore(bookId, activityCounts, shelvedCounts, reviewCounts));
  }
  return scores;
}

export async function fetchTrendingSections(): Promise<TrendingSection[]> {
  const supabase = createClient();
  const since = weekAgoIso();

  const [shelfRows, reviewRows, activityRows] = await Promise.all([
    supabase.from("user_books").select("book_id").gte("created_at", since),
    supabase
      .from("reviews")
      .select("book_id")
      .eq("visibility", "public")
      .gte("created_at", since),
    supabase
      .from("activity_events")
      .select("event_type, metadata_json")
      .gte("created_at", since)
      .in("event_type", ["book_added", "book_finished", "review_created"]),
  ]);

  if (shelfRows.error) throw shelfRows.error;
  if (reviewRows.error) throw reviewRows.error;
  if (activityRows.error) throw activityRows.error;

  const shelvedCounts = new Map<string, number>();
  for (const row of shelfRows.data ?? []) {
    const id = row.book_id as string;
    shelvedCounts.set(id, (shelvedCounts.get(id) ?? 0) + 1);
  }

  const reviewCounts = new Map<string, number>();
  for (const row of reviewRows.data ?? []) {
    const id = row.book_id as string;
    reviewCounts.set(id, (reviewCounts.get(id) ?? 0) + 1);
  }

  const activityCounts = new Map<string, number>();
  for (const row of activityRows.data ?? []) {
    const meta = row.metadata_json as { book_id?: string } | null;
    const id = meta?.book_id;
    if (!id) continue;
    const eventType = row.event_type as TrendingActivityEventType;
    if (eventType in { book_added: 1, book_finished: 1, review_created: 1 }) {
      addWeightedActivityCount(activityCounts, id, eventType);
    }
  }

  const trendingScores = compositeTrendingScores(activityCounts, shelvedCounts, reviewCounts);

  const allIds = [
    ...new Set([
      ...shelvedCounts.keys(),
      ...reviewCounts.keys(),
      ...activityCounts.keys(),
      ...trendingScores.keys(),
    ]),
  ];

  const [books, ratings] = await Promise.all([
    loadBooksByIds(allIds),
    loadCommunityRatings(allIds),
  ]);

  return [
    {
      id: "trending",
      title: "Trending Books",
      books: topBooks(trendingScores, books, ratings, "trend score this week"),
    },
    {
      id: "shelved",
      title: "Most Shelved This Week",
      books: topBooks(shelvedCounts, books, ratings, "shelved this week", 5, false),
    },
    {
      id: "reviewed",
      title: "Most Reviewed",
      books: topBooks(reviewCounts, books, ratings, "reviews this week", 5, false),
    },
  ].filter((section) => section.books.length > 0);
}
