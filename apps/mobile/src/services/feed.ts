import { supabase } from "./supabase";

/**
 * Read-only social feed for mobile. Mirrors the core of the web
 * `socialFeed` service (apps/web/src/lib/services/socialFeed.ts): it reads
 * public `activity_events`, attaches author profiles, formats a human message,
 * and hydrates book covers. Ranking/visibility-for-followers is intentionally
 * simplified for the mobile foundation.
 */

type ActivityVisibility = "public" | "followers" | "private";

const FEED_EVENT_TYPES = new Set<string>([
  "book_added",
  "shelf_updated",
  "book_finished",
  "reading_finished",
  "reading_started",
  "review_created",
  "review_added",
  "review_updated",
]);

export type FeedItem = {
  id: string;
  user_id: string;
  event_type: string;
  created_at: string;
  authorName: string;
  authorUsername: string | null;
  avatarUrl: string | null;
  message: string;
  /** Reviewer's signature rating emoji (reviews.rating_emoji), when present. */
  ratingEmoji: string | null;
  coverUrl: string | null;
  bookTitle: string;
  bookAuthor: string | null;
};

function ratingEmoji(metadata: Record<string, unknown> | null): string | null {
  const raw = typeof metadata?.rating_emoji === "string" ? metadata.rating_emoji.trim() : "";
  return raw || null;
}

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

const ACTIVITY_SELECT =
  "id, user_id, event_type, entity_id, entity_type, metadata_json, created_at, visibility";

function bookTitle(metadata: Record<string, unknown> | null): string {
  if (typeof metadata?.title === "string") return metadata.title;
  if (typeof metadata?.book_title === "string") return metadata.book_title;
  return "a book";
}

function bookAuthor(metadata: Record<string, unknown> | null): string | null {
  if (typeof metadata?.author === "string") return metadata.author;
  if (typeof metadata?.book_author === "string") return metadata.book_author;
  return null;
}

function shelfLabel(metadata: Record<string, unknown> | null): string | null {
  const raw = typeof metadata?.shelf_status === "string" ? metadata.shelf_status : null;
  return raw ? raw.replace(/_/g, " ") : null;
}

function formatMessage(
  eventType: string,
  metadata: Record<string, unknown> | null,
  subject: string
): string {
  const title = bookTitle(metadata);
  const shelf = shelfLabel(metadata);
  const rating = typeof metadata?.rating === "number" ? metadata.rating : null;

  switch (eventType) {
    case "book_added":
      return shelf ? `${subject} added ${title} to ${shelf}` : `${subject} added ${title}`;
    case "shelf_updated":
      return shelf ? `${subject} moved ${title} to ${shelf}` : `${subject} updated ${title}`;
    case "book_finished":
    case "reading_finished":
      return `${subject} finished ${title}`;
    case "reading_started":
      return `${subject} started reading ${title}`;
    case "review_created":
    case "review_added":
      return rating != null
        ? `${subject} reviewed ${title} (${rating}★)`
        : `${subject} reviewed ${title}`;
    case "review_updated":
      return `${subject} updated their review of ${title}`;
    default:
      return `${subject} updated their library`;
  }
}

type ProfileLite = {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

function subjectName(profile: ProfileLite | undefined): string {
  return profile?.display_name?.trim() || profile?.username?.trim() || "Someone";
}

export async function fetchPublicFeed(limit = 30): Promise<FeedItem[]> {
  const { data, error } = await supabase
    .from("activity_events")
    .select(ACTIVITY_SELECT)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (error) throw error;

  const rows = ((data ?? []) as ActivityRow[]).filter((r) =>
    FEED_EVENT_TYPES.has(r.event_type)
  );
  const selected = rows.slice(0, limit);
  if (!selected.length) return [];

  const userIds = [...new Set(selected.map((r) => r.user_id))];
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", userIds);

  const profilesById = new Map<string, ProfileLite>(
    (profileRows ?? []).map((p) => [
      p.id as string,
      {
        username: p.username as string | null,
        display_name: p.display_name as string | null,
        avatar_url: p.avatar_url as string | null,
      },
    ])
  );

  // Hydrate covers for events that carry a book_id in metadata.
  const bookIds = [
    ...new Set(
      selected
        .map((r) =>
          typeof r.metadata_json?.book_id === "string" ? r.metadata_json.book_id : null
        )
        .filter((id): id is string => Boolean(id))
    ),
  ];

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

  return selected.map((row) => {
    const profile = profilesById.get(row.user_id);
    const metadata = row.metadata_json;
    const bookId = typeof metadata?.book_id === "string" ? metadata.book_id : null;
    const book = bookId ? bookMap.get(bookId) : undefined;
    const metaCover = typeof metadata?.cover_url === "string" ? metadata.cover_url : null;

    return {
      id: row.id,
      user_id: row.user_id,
      event_type: row.event_type,
      created_at: row.created_at,
      authorName: subjectName(profile),
      authorUsername: profile?.username ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      message: formatMessage(row.event_type, metadata, subjectName(profile)),
      ratingEmoji: ratingEmoji(metadata),
      coverUrl: metaCover ?? book?.cover_url ?? null,
      bookTitle: bookTitle(metadata) !== "a book" ? bookTitle(metadata) : book?.title ?? "",
      bookAuthor: bookAuthor(metadata) ?? book?.author ?? null,
    };
  });
}
