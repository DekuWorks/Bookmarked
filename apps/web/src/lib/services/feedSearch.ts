import { createClient } from "@/lib/supabase/client";
import {
  canViewerSeeActivity,
  isFeedEligibleEvent,
  type ActivityVisibility,
} from "@/lib/services/activity";
import { getFollowingIds } from "@/lib/services/follows";
import {
  attachProfilesToActivity,
  enrichFeedRow,
  hydrateFeedItems,
  type ActivityRow,
  type FeedItem,
} from "@/lib/services/socialFeed";
import type { Profile } from "@/types";
import { moodLabelMatches, parseMoodSearchQuery } from "@bookmarked/utils/moodDiscovery";

export type ReaderSearchResult = Profile & {
  isFollowing: boolean;
  isSelf: boolean;
};

export type BookSearchResult = {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  onShelf?: boolean;
};

export type MoodDiscoveryHit = {
  id: string;
  bookId: string;
  bookTitle: string;
  author: string | null;
  feelings: string[];
};

export type FeedSearchResults = {
  readers: ReaderSearchResult[];
  books: BookSearchResult[];
  posts: FeedItem[];
  moods?: MoodDiscoveryHit[];
};

function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function ilikePattern(query: string): string {
  return `%${escapeIlike(query.trim())}%`;
}

export async function searchReaders(
  query: string,
  viewerId: string,
  limit = 8
): Promise<ReaderSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const pattern = ilikePattern(trimmed);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .not("username", "is", null)
    .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
    .limit(limit);

  if (error) throw error;

  const profiles = (data ?? []) as Profile[];
  if (!profiles.length) return [];

  const followingIds = await getFollowingIds(viewerId);
  const followingSet = new Set(followingIds);

  return profiles.map((profile) => ({
    ...profile,
    isFollowing: followingSet.has(profile.id),
    isSelf: profile.id === viewerId,
  }));
}

export async function searchCatalogBooks(
  query: string,
  viewerId?: string,
  limit = 8
): Promise<BookSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const pattern = ilikePattern(trimmed);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("books")
    .select("id, title, author, cover_url")
    .or(`title.ilike.${pattern},author.ilike.${pattern}`)
    .order("title", { ascending: true })
    .limit(limit);

  if (error) throw error;
  const books = (data ?? []) as BookSearchResult[];
  if (!viewerId || books.length === 0) return books;

  const bookIds = books.map((book) => book.id);
  const { data: shelvedRows, error: shelvedError } = await supabase
    .from("user_books")
    .select("book_id")
    .eq("user_id", viewerId)
    .in("book_id", bookIds);

  if (shelvedError) throw shelvedError;

  const shelvedIds = new Set((shelvedRows ?? []).map((row) => row.book_id));
  return books.map((book) => ({
    ...book,
    onShelf: shelvedIds.has(book.id),
  }));
}

export async function searchFeedPosts(
  query: string,
  viewerId: string,
  limit = 12
): Promise<FeedItem[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_events")
    .select("id, user_id, event_type, entity_id, entity_type, metadata_json, created_at, visibility")
    .neq("visibility", "private")
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) throw error;

  const followingIds = await getFollowingIds(viewerId);
  const followingSet = new Set(followingIds);

  const rows = ((data ?? []) as ActivityRow[]).filter((row) => {
    if (!isFeedEligibleEvent(row.event_type)) return false;
    if (
      !canViewerSeeActivity(
        row.visibility ?? "public",
        viewerId,
        row.user_id,
        followingSet.has(row.user_id)
      )
    ) {
      return false;
    }

    const metadata = row.metadata_json;
    const title =
      typeof metadata?.title === "string"
        ? metadata.title
        : typeof metadata?.book_title === "string"
          ? metadata.book_title
          : "";
    const author = typeof metadata?.author === "string" ? metadata.author : "";

    return (
      title.toLowerCase().includes(trimmed) ||
      author.toLowerCase().includes(trimmed)
    );
  });

  const filtered = rows.slice(0, limit * 2);
  const withProfiles = await attachProfilesToActivity(filtered);
  const enriched = withProfiles.slice(0, limit).map(enrichFeedRow);
  return hydrateFeedItems(enriched, filtered.slice(0, limit));
}

export async function searchPublicReviewsByMood(
  query: string,
  viewerId: string,
  limit = 12
): Promise<MoodDiscoveryHit[]> {
  const parsed = parseMoodSearchQuery(query);
  if (parsed.moodIds.length === 0 && parsed.moodLabels.length === 0 && !parsed.text) {
    return [];
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, book_id, feelings, books(title, author)")
    .neq("visibility", "private")
    .neq("user_id", viewerId)
    .limit(80);

  if (error) {
    console.warn("[feedSearch] mood search failed:", error.message);
    return [];
  }

  const labels = [
    ...parsed.moodLabels,
    ...parsed.moodIds.map((id) => id.replace(/-/g, " ")),
    ...(parsed.text ? [parsed.text] : []),
  ];

  return ((data ?? []) as Array<{
    id: string;
    book_id: string;
    feelings: string[] | null;
    books: { title: string; author: string | null } | { title: string; author: string | null }[] | null;
  }>)
    .filter((row) => moodLabelMatches(row.feelings ?? [], labels))
    .slice(0, limit)
    .map((row) => {
      const book = Array.isArray(row.books) ? row.books[0] : row.books;
      return {
        id: row.id,
        bookId: row.book_id,
        bookTitle: book?.title ?? "Untitled",
        author: book?.author ?? null,
        feelings: row.feelings ?? [],
      };
    });
}

export async function searchFeed(
  query: string,
  viewerId: string
): Promise<FeedSearchResults> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { readers: [], books: [], posts: [], moods: [] };
  }

  const parsed = parseMoodSearchQuery(trimmed);
  const textQuery = parsed.text || trimmed;

  const [readers, books, posts, moods] = await Promise.all([
    searchReaders(textQuery, viewerId),
    searchCatalogBooks(textQuery, viewerId),
    searchFeedPosts(textQuery, viewerId),
    searchPublicReviewsByMood(trimmed, viewerId),
  ]);

  return { readers, books, posts, moods };
}
