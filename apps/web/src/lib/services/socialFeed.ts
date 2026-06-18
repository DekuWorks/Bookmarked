import { createClient } from "@/lib/supabase/client";
import {
  canViewerSeeActivity,
  formatSocialActivityMessage,
  isFeedEligibleEvent,
  type ActivityVisibility,
} from "@/lib/services/activity";
import { getFollowingIds } from "@/lib/services/follows";

export type FeedItem = {
  id: string;
  user_id: string;
  event_type: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  visibility: ActivityVisibility;
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  message: string;
  actionMessage: string;
  bookId: string | null;
  coverUrl: string | null;
};

type RawFeedRow = {
  id: string;
  user_id: string;
  event_type: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  visibility: ActivityVisibility;
  profiles: FeedItem["profiles"];
};

type ProfileSnippet = FeedItem["profiles"];

type SupabaseFeedRow = Omit<RawFeedRow, "profiles"> & {
  profiles: ProfileSnippet | ProfileSnippet[] | null;
};

function normalizeFeedRows(rows: SupabaseFeedRow[]): RawFeedRow[] {
  return rows.map((row) => ({
    ...row,
    profiles: Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles,
  }));
}

const FEED_SELECT =
  "id, user_id, event_type, entity_id, metadata_json, created_at, visibility, profiles(username, display_name, avatar_url)";

function enrichFeedRow(row: RawFeedRow): FeedItem {
  const metadata = row.metadata_json;
  const bookId =
    typeof metadata?.book_id === "string"
      ? metadata.book_id
      : null;

  const coverUrl =
    typeof metadata?.cover_url === "string" ? metadata.cover_url : null;

  const message = formatSocialActivityMessage(row.event_type, metadata, row.profiles);
  const readerName =
    row.profiles?.display_name?.trim() ||
    row.profiles?.username?.trim() ||
    "Someone";
  const actionMessage = message.startsWith(`${readerName} `)
    ? message.slice(readerName.length + 1)
    : message;

  return {
    ...row,
    message,
    actionMessage,
    bookId,
    coverUrl,
  };
}

function filterVisibleRows(
  rows: RawFeedRow[],
  viewerId: string,
  followingSet: Set<string>
): RawFeedRow[] {
  return rows.filter(
    (row) =>
      isFeedEligibleEvent(row.event_type) &&
      canViewerSeeActivity(
        row.visibility ?? "public",
        viewerId,
        row.user_id,
        followingSet.has(row.user_id)
      )
  );
}

export async function fetchFollowingFeed(
  viewerId: string,
  limit = 30
): Promise<FeedItem[]> {
  const followingIds = await getFollowingIds(viewerId);
  if (!followingIds.length) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_events")
    .select(FEED_SELECT)
    .in("user_id", followingIds)
    .neq("visibility", "private")
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (error) throw error;

  const followingSet = new Set(followingIds);
  const visible = filterVisibleRows(
    normalizeFeedRows((data ?? []) as SupabaseFeedRow[]),
    viewerId,
    followingSet
  );

  return visible.slice(0, limit).map(enrichFeedRow);
}

function scoreForYouItem(
  row: RawFeedRow,
  viewerId: string,
  followingSet: Set<string>,
  viewerGenres: string[]
): number {
  let score = 0;
  const ageHours =
    (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60);
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

  if (row.event_type === "review_created" || row.event_type === "review_added") {
    score += 6;
  }
  if (row.event_type === "book_finished" || row.event_type === "reading_finished") {
    score += 5;
  }
  if (row.event_type === "book_added") score += 3;

  return score;
}

export async function fetchForYouFeed(
  viewerId: string,
  viewerGenres: string[] | null | undefined,
  limit = 30
): Promise<FeedItem[]> {
  const [followingIds, supabase] = await Promise.all([
    getFollowingIds(viewerId),
    Promise.resolve(createClient()),
  ]);

  const followingSet = new Set(followingIds);
  const genres = viewerGenres ?? [];

  const { data, error } = await supabase
    .from("activity_events")
    .select(FEED_SELECT)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) throw error;

  const visible = filterVisibleRows(
    normalizeFeedRows((data ?? []) as SupabaseFeedRow[]),
    viewerId,
    followingSet
  )
    .map((row) => ({
      row,
      score: scoreForYouItem(row, viewerId, followingSet, genres),
    }))
    .sort((a, b) => b.score - a.score || b.row.created_at.localeCompare(a.row.created_at))
    .slice(0, limit)
    .map(({ row }) => enrichFeedRow(row));

  return visible;
}

export async function fetchReaderActivity(
  readerId: string,
  viewerId: string,
  limit = 20
): Promise<FeedItem[]> {
  const followingIds = viewerId === readerId ? [] : await getFollowingIds(viewerId);
  const followingSet = new Set(followingIds);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("activity_events")
    .select(FEED_SELECT)
    .eq("user_id", readerId)
    .neq("visibility", "private")
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (error) throw error;

  const visible = filterVisibleRows(
    normalizeFeedRows((data ?? []) as SupabaseFeedRow[]),
    viewerId,
    followingSet
  );
  return visible.slice(0, limit).map(enrichFeedRow);
}
