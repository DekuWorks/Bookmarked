import { supabase } from "./supabase";
import { getFollowingIds } from "./follows";
import {
  canViewerSeeActivity,
  formatSocialActivityMessage,
  isFeedEligibleEvent,
  type ActivityVisibility,
} from "./activity";

/**
 * Mobile social feed. Mirrors apps/web/src/lib/services/socialFeed.ts: reads
 * `activity_events`, attaches author profiles, ranks for-you / following feeds,
 * and hydrates book covers via batched `.in()` lookups (respecting RLS).
 */

export type FeedItem = {
  id: string;
  user_id: string;
  event_type: string;
  created_at: string;
  authorName: string;
  authorUsername: string | null;
  avatarUrl: string | null;
  message: string;
  ratingEmoji: string | null;
  bookId: string | null;
  coverUrl: string | null;
  bookTitle: string;
  bookAuthor: string | null;
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

type ProfileLite = {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

const ACTIVITY_SELECT =
  "id, user_id, event_type, entity_id, entity_type, metadata_json, created_at, visibility";

function ratingEmoji(metadata: Record<string, unknown> | null): string | null {
  const raw = typeof metadata?.rating_emoji === "string" ? metadata.rating_emoji.trim() : "";
  return raw || null;
}

function bookTitle(metadata: Record<string, unknown> | null): string {
  if (typeof metadata?.title === "string") return metadata.title;
  if (typeof metadata?.book_title === "string") return metadata.book_title;
  return "";
}

function bookAuthor(metadata: Record<string, unknown> | null): string | null {
  if (typeof metadata?.author === "string") return metadata.author;
  if (typeof metadata?.book_author === "string") return metadata.book_author;
  return null;
}

function subjectName(profile: ProfileLite | undefined): string {
  return profile?.display_name?.trim() || profile?.username?.trim() || "Someone";
}

async function attachProfiles(rows: ActivityRow[]): Promise<Map<string, ProfileLite>> {
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const map = new Map<string, ProfileLite>();
  if (!userIds.length) return map;

  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", userIds);

  for (const p of data ?? []) {
    map.set(p.id as string, {
      username: p.username as string | null,
      display_name: p.display_name as string | null,
      avatar_url: p.avatar_url as string | null,
    });
  }
  return map;
}

async function buildItems(
  rows: ActivityRow[],
  profilesById: Map<string, ProfileLite>
): Promise<FeedItem[]> {
  if (!rows.length) return [];

  // Resolve book ids: from metadata, or via user_book / review entity lookups.
  const bookIdByRow = new Map<string, string>();
  const userBookIds: string[] = [];
  const reviewIds: string[] = [];

  for (const row of rows) {
    const metaBookId =
      typeof row.metadata_json?.book_id === "string" ? row.metadata_json.book_id : null;
    if (metaBookId) {
      bookIdByRow.set(row.id, metaBookId);
      continue;
    }
    if (!row.entity_id) continue;
    if (row.entity_type === "user_book") userBookIds.push(row.entity_id);
    if (row.entity_type === "review") reviewIds.push(row.entity_id);
  }

  if (userBookIds.length) {
    const { data } = await supabase
      .from("user_books")
      .select("id, book_id")
      .in("id", userBookIds);
    for (const ub of data ?? []) {
      for (const row of rows) {
        if (row.entity_type === "user_book" && row.entity_id === ub.id) {
          bookIdByRow.set(row.id, ub.book_id as string);
        }
      }
    }
  }

  const publicReviewIds = new Set<string>();
  if (reviewIds.length) {
    const { data } = await supabase
      .from("reviews")
      .select("id, book_id, visibility")
      .in("id", reviewIds);
    for (const rv of data ?? []) {
      if (rv.visibility !== "public") continue;
      publicReviewIds.add(rv.id as string);
      for (const row of rows) {
        if (row.entity_type === "review" && row.entity_id === rv.id) {
          bookIdByRow.set(row.id, rv.book_id as string);
        }
      }
    }
  }

  const bookIds = [...new Set(bookIdByRow.values())];
  const bookMap = new Map<string, { cover_url: string | null; title: string; author: string | null }>();
  if (bookIds.length) {
    const { data: books } = await supabase
      .from("books")
      .select("id, cover_url, title, author")
      .in("id", bookIds);
    for (const b of books ?? []) {
      bookMap.set(b.id as string, {
        cover_url: b.cover_url as string | null,
        title: b.title as string,
        author: b.author as string | null,
      });
    }
  }

  const visibleRows = rows.filter((row) => {
    if (row.entity_type !== "review" || !row.entity_id) return true;
    return publicReviewIds.has(row.entity_id);
  });

  return visibleRows.map((row) => {
    const profile = profilesById.get(row.user_id);
    const metadata = row.metadata_json;
    const bookId = bookIdByRow.get(row.id) ?? null;
    const book = bookId ? bookMap.get(bookId) : undefined;
    const metaCover = typeof metadata?.cover_url === "string" ? metadata.cover_url : null;
    const metaTitle = bookTitle(metadata);

    return {
      id: row.id,
      user_id: row.user_id,
      event_type: row.event_type,
      created_at: row.created_at,
      authorName: subjectName(profile),
      authorUsername: profile?.username ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      message: formatSocialActivityMessage(row.event_type, metadata, profile ?? null),
      ratingEmoji: ratingEmoji(metadata),
      bookId,
      coverUrl: metaCover ?? book?.cover_url ?? null,
      bookTitle: metaTitle || book?.title || "",
      bookAuthor: bookAuthor(metadata) ?? book?.author ?? null,
    };
  });
}

export async function fetchFollowingFeed(viewerId: string, limit = 30): Promise<FeedItem[]> {
  const followingIds = await getFollowingIds(viewerId);
  if (!followingIds.length) return [];

  const { data, error } = await supabase
    .from("activity_events")
    .select(ACTIVITY_SELECT)
    .in("user_id", followingIds)
    .neq("visibility", "private")
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (error) throw error;

  const rows = (data ?? []) as ActivityRow[];
  const followingSet = new Set(followingIds);
  const profilesById = await attachProfiles(rows);
  const visible = rows
    .filter(
      (r) =>
        isFeedEligibleEvent(r.event_type) &&
        canViewerSeeActivity(r.visibility ?? "public", viewerId, r.user_id, followingSet.has(r.user_id))
    )
    .slice(0, limit);

  return buildItems(visible, profilesById);
}

function scoreForYou(
  row: ActivityRow,
  viewerId: string,
  followingSet: Set<string>,
  viewerGenres: string[]
): number {
  let score = 0;
  const ageHours = (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60);
  score += Math.max(0, 48 - ageHours);
  if (followingSet.has(row.user_id)) score += 12;
  if (row.user_id === viewerId) score -= 20;

  const subjects = Array.isArray(row.metadata_json?.subjects)
    ? (row.metadata_json?.subjects as string[])
    : [];
  const genreMatches = viewerGenres.filter((genre) =>
    subjects.some((subject) => subject.toLowerCase().includes(genre.toLowerCase()))
  ).length;
  score += genreMatches * 8;

  if (row.event_type === "review_created" || row.event_type === "review_added") score += 6;
  if (row.event_type === "book_finished" || row.event_type === "reading_finished") score += 5;
  if (row.event_type === "book_added") score += 3;
  return score;
}

export async function fetchForYouFeed(
  viewerId: string,
  viewerGenres: string[] | null | undefined,
  limit = 30
): Promise<FeedItem[]> {
  const followingIds = await getFollowingIds(viewerId);
  const followingSet = new Set(followingIds);
  const genres = viewerGenres ?? [];

  const { data, error } = await supabase
    .from("activity_events")
    .select(ACTIVITY_SELECT)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) throw error;

  const rows = (data ?? []) as ActivityRow[];
  const profilesById = await attachProfiles(rows);
  const ranked = rows
    .filter(
      (r) =>
        isFeedEligibleEvent(r.event_type) &&
        canViewerSeeActivity(r.visibility ?? "public", viewerId, r.user_id, followingSet.has(r.user_id))
    )
    .map((row) => ({ row, score: scoreForYou(row, viewerId, followingSet, genres) }))
    .sort((a, b) => b.score - a.score || b.row.created_at.localeCompare(a.row.created_at))
    .slice(0, limit)
    .map(({ row }) => row);

  return buildItems(ranked, profilesById);
}

export async function fetchReaderActivity(
  readerId: string,
  viewerId: string,
  limit = 20
): Promise<FeedItem[]> {
  const followingIds = viewerId === readerId ? [] : await getFollowingIds(viewerId);
  const followingSet = new Set(followingIds);

  const { data, error } = await supabase
    .from("activity_events")
    .select(ACTIVITY_SELECT)
    .eq("user_id", readerId)
    .neq("visibility", "private")
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (error) throw error;

  const rows = (data ?? []) as ActivityRow[];
  const profilesById = await attachProfiles(rows);
  const visible = rows
    .filter(
      (r) =>
        isFeedEligibleEvent(r.event_type) &&
        canViewerSeeActivity(r.visibility ?? "public", viewerId, r.user_id, followingSet.has(r.user_id))
    )
    .slice(0, limit);

  return buildItems(visible, profilesById);
}

/** Hydrate raw activity rows for feed search and other callers. */
export async function hydrateActivityRows(rows: ActivityRow[]): Promise<FeedItem[]> {
  const profilesById = await attachProfiles(rows);
  return buildItems(rows, profilesById);
}

/** @deprecated Kept for the initial public feed; prefer fetchForYouFeed. */
export async function fetchPublicFeed(limit = 30): Promise<FeedItem[]> {
  const { data, error } = await supabase
    .from("activity_events")
    .select(ACTIVITY_SELECT)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (error) throw error;

  const rows = ((data ?? []) as ActivityRow[])
    .filter((r) => isFeedEligibleEvent(r.event_type))
    .slice(0, limit);
  const profilesById = await attachProfiles(rows);
  return buildItems(rows, profilesById);
}
