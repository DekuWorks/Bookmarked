import type { Profile } from "../types";
import {
  canViewerSeeActivity,
  isFeedEligibleEvent,
  type ActivityVisibility,
} from "./activity";
import { hydrateActivityRows, type FeedItem } from "./feed";
import { getFollowingIds } from "./follows";
import { supabase } from "./supabase";

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

export type FeedSearchResults = {
  readers: ReaderSearchResult[];
  books: BookSearchResult[];
  posts: FeedItem[];
};

type ActivityRow = {
  id: string;
  user_id: string;
  event_type: string;
  entity_id: string | null;
  entity_type: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  visibility: ActivityVisibility;
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

  const shelvedIds = new Set((shelvedRows ?? []).map((row) => row.book_id as string));
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

  const filtered = rows.slice(0, limit);
  return hydrateActivityRows(filtered);
}

export async function searchFeed(
  query: string,
  viewerId: string
): Promise<FeedSearchResults> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { readers: [], books: [], posts: [] };
  }

  const [readers, books, posts] = await Promise.all([
    searchReaders(trimmed, viewerId),
    searchCatalogBooks(trimmed, viewerId),
    searchFeedPosts(trimmed, viewerId),
  ]);

  return { readers, books, posts };
}
