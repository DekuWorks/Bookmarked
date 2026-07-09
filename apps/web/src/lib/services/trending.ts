import { createClient } from "@/lib/supabase/client";

export type TrendingBook = {
  bookId: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  metric: number;
  metricLabel: string;
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
    });
  }
  return map;
}

function topBooks(
  counts: Map<string, number>,
  books: Map<string, TrendingBook>,
  metricLabel: string,
  limit = 5
): TrendingBook[] {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([bookId, metric]) => {
      const base = books.get(bookId);
      if (!base) return null;
      return { ...base, metric, metricLabel };
    })
    .filter((b): b is TrendingBook => b != null);
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
      .select("metadata_json")
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

  const trendingCounts = new Map<string, number>();
  for (const row of activityRows.data ?? []) {
    const meta = row.metadata_json as { book_id?: string } | null;
    const id = meta?.book_id;
    if (!id) continue;
    trendingCounts.set(id, (trendingCounts.get(id) ?? 0) + 1);
  }

  const allIds = [
    ...new Set([...shelvedCounts.keys(), ...reviewCounts.keys(), ...trendingCounts.keys()]),
  ];
  const books = await loadBooksByIds(allIds);

  return [
    {
      id: "trending",
      title: "Trending Books",
      books: topBooks(trendingCounts, books, "activity this week"),
    },
    {
      id: "shelved",
      title: "Most Shelved This Week",
      books: topBooks(shelvedCounts, books, "shelved this week"),
    },
    {
      id: "reviewed",
      title: "Most Reviewed",
      books: topBooks(reviewCounts, books, "reviews this week"),
    },
  ].filter((section) => section.books.length > 0);
}
