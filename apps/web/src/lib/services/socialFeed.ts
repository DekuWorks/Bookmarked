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
  bookTitle: string;
  bookAuthor: string | null;
  clubId: string | null;
  clubName: string | null;
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

export type ActivityRow = {
  id: string;
  user_id: string;
  event_type: string;
  entity_id: string | null;
  entity_type: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  visibility: ActivityVisibility;
};

const ACTIVITY_SELECT =
  "id, user_id, event_type, entity_id, entity_type, metadata_json, created_at, visibility";

function bookAuthorFromMetadata(metadata: Record<string, unknown> | null): string | null {
  if (typeof metadata?.author === "string") return metadata.author;
  if (typeof metadata?.book_author === "string") return metadata.book_author;
  return null;
}

function bookTitleFromMetadata(metadata: Record<string, unknown> | null): string {
  if (typeof metadata?.title === "string") return metadata.title;
  if (typeof metadata?.book_title === "string") return metadata.book_title;
  return "Book";
}

export async function attachProfilesToActivity(rows: ActivityRow[]): Promise<RawFeedRow[]> {
  if (!rows.length) return [];

  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", userIds);

  if (error) throw error;

  const profilesById = new Map(
    (data ?? []).map((profile) => [
      profile.id,
      {
        username: profile.username as string | null,
        display_name: profile.display_name as string | null,
        avatar_url: profile.avatar_url as string | null,
      },
    ])
  );

  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    event_type: row.event_type,
    metadata_json: row.metadata_json,
    created_at: row.created_at,
    visibility: row.visibility,
    profiles: profilesById.get(row.user_id) ?? null,
  }));
}

export function enrichFeedRow(row: RawFeedRow): FeedItem {
  const metadata = row.metadata_json;
  const bookId =
    typeof metadata?.book_id === "string"
      ? metadata.book_id
      : null;

  const coverUrl =
    typeof metadata?.cover_url === "string" ? metadata.cover_url : null;

  const clubId =
    typeof metadata?.club_id === "string" ? metadata.club_id : null;
  const clubName =
    typeof metadata?.club_name === "string" ? metadata.club_name : null;

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
    bookTitle: bookTitleFromMetadata(metadata),
    bookAuthor: bookAuthorFromMetadata(metadata),
    clubId,
    clubName,
  };
}

export async function hydrateFeedItems(
  items: FeedItem[],
  activityRows: ActivityRow[]
): Promise<FeedItem[]> {
  if (!items.length) return items;

  const rowById = new Map(activityRows.map((row) => [row.id, row]));
  const supabase = createClient();

  const userBookIds: string[] = [];
  const reviewIds: string[] = [];

  for (const item of items) {
    if (item.bookId) continue;
    const row = rowById.get(item.id);
    if (!row?.entity_id) continue;
    if (row.entity_type === "user_book") userBookIds.push(row.entity_id);
    if (row.entity_type === "review") reviewIds.push(row.entity_id);
  }

  const bookIdByItemId = new Map<string, string>();

  if (userBookIds.length) {
    const { data } = await supabase
      .from("user_books")
      .select("id, book_id")
      .in("id", userBookIds);

    for (const row of data ?? []) {
      for (const item of items) {
        const activity = rowById.get(item.id);
        if (activity?.entity_type === "user_book" && activity.entity_id === row.id) {
          bookIdByItemId.set(item.id, row.book_id);
        }
      }
    }
  }

  if (reviewIds.length) {
    const { data } = await supabase
      .from("reviews")
      .select("id, book_id")
      .in("id", reviewIds);

    for (const row of data ?? []) {
      for (const item of items) {
        const activity = rowById.get(item.id);
        if (activity?.entity_type === "review" && activity.entity_id === row.id) {
          bookIdByItemId.set(item.id, row.book_id);
        }
      }
    }
  }

  const allBookIds = [
    ...new Set([
      ...items.map((item) => item.bookId).filter((id): id is string => Boolean(id)),
      ...bookIdByItemId.values(),
    ]),
  ];

  const bookMap = new Map<string, { cover_url: string | null; title: string; author: string | null }>();

  if (allBookIds.length) {
    const { data } = await supabase
      .from("books")
      .select("id, cover_url, title, author")
      .in("id", allBookIds);

    for (const book of data ?? []) {
      bookMap.set(book.id, {
        cover_url: book.cover_url as string | null,
        title: book.title as string,
        author: book.author as string | null,
      });
    }
  }

  return items.map((item) => {
    const resolvedBookId = item.bookId ?? bookIdByItemId.get(item.id) ?? null;
    const book = resolvedBookId ? bookMap.get(resolvedBookId) : undefined;

    return {
      ...item,
      bookId: resolvedBookId,
      coverUrl: item.coverUrl ?? book?.cover_url ?? null,
      bookTitle: item.bookTitle !== "Book" ? item.bookTitle : book?.title ?? item.bookTitle,
      bookAuthor: item.bookAuthor ?? book?.author ?? null,
    };
  });
}

async function buildFeedItems(
  rows: RawFeedRow[],
  activityRows: ActivityRow[]
): Promise<FeedItem[]> {
  const enriched = rows.map(enrichFeedRow);
  return hydrateFeedItems(enriched, activityRows);
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
    .select(ACTIVITY_SELECT)
    .in("user_id", followingIds)
    .neq("visibility", "private")
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (error) throw error;

  const activityRows = (data ?? []) as ActivityRow[];
  const followingSet = new Set(followingIds);
  const withProfiles = await attachProfilesToActivity(activityRows);
  const visible = filterVisibleRows(withProfiles, viewerId, followingSet);
  const selected = visible.slice(0, limit);
  const selectedActivity = selected
    .map((row) => activityRows.find((activity) => activity.id === row.id))
    .filter((row): row is ActivityRow => Boolean(row));

  return buildFeedItems(selected, selectedActivity);
}

export async function fetchForYouFeed(
  viewerId: string,
  _viewerGenres: string[] | null | undefined,
  limit = 30
): Promise<FeedItem[]> {
  const [followingIds, supabase] = await Promise.all([
    getFollowingIds(viewerId),
    Promise.resolve(createClient()),
  ]);

  const followingSet = new Set(followingIds);

  const { data, error } = await supabase
    .from("activity_events")
    .select(ACTIVITY_SELECT)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) throw error;

  const activityRows = (data ?? []) as ActivityRow[];
  const withProfiles = await attachProfilesToActivity(activityRows);
  const visible = filterVisibleRows(withProfiles, viewerId, followingSet)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
  const selectedActivity = visible
    .map((row) => activityRows.find((activity) => activity.id === row.id))
    .filter((row): row is ActivityRow => Boolean(row));

  return buildFeedItems(visible, selectedActivity);
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
    .select(ACTIVITY_SELECT)
    .eq("user_id", readerId)
    .neq("visibility", "private")
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (error) throw error;

  const activityRows = (data ?? []) as ActivityRow[];
  const withProfiles = await attachProfilesToActivity(activityRows);
  const visible = filterVisibleRows(withProfiles, viewerId, followingSet);
  const selected = visible.slice(0, limit);
  const selectedActivity = selected
    .map((row) => activityRows.find((activity) => activity.id === row.id))
    .filter((row): row is ActivityRow => Boolean(row));

  return buildFeedItems(selected, selectedActivity);
}
