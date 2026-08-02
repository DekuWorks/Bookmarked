import type { SupabaseClient } from "@supabase/supabase-js";

export type ActivityEventType =
  | "book_added"
  | "shelf_updated"
  | "progress_updated"
  | "book_finished"
  | "review_created"
  | "review_updated"
  | "book_removed"
  | "reading_started"
  | "reading_finished"
  | "review_added"
  | "club_discussion_created"
  | "club_shared";

export type ActivityVisibility = "public" | "followers" | "private";

type ActivityInput = {
  user_id: string;
  event_type: ActivityEventType;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata_json?: Record<string, unknown> | null;
  visibility?: ActivityVisibility;
};

const FEED_EVENT_TYPES = new Set<string>([
  "book_added",
  "shelf_updated",
  "book_finished",
  "reading_finished",
  "reading_started",
  "review_created",
  "review_added",
  "review_updated",
  "club_discussion_created",
  "club_shared",
]);

export function isFeedEligibleEvent(eventType: string): boolean {
  return FEED_EVENT_TYPES.has(eventType);
}

function defaultVisibility(eventType: ActivityEventType): ActivityVisibility {
  switch (eventType) {
    case "book_removed":
    case "progress_updated":
      return "private";
    case "shelf_updated":
    case "reading_started":
      return "followers";
    default:
      return "public";
  }
}

export async function recordActivity(
  supabase: SupabaseClient,
  input: ActivityInput
): Promise<void> {
  const visibility = input.visibility ?? defaultVisibility(input.event_type);

  await supabase.from("activity_events").insert({
    user_id: input.user_id,
    event_type: input.event_type,
    entity_type: input.entity_type ?? null,
    entity_id: input.entity_id ?? null,
    metadata_json: input.metadata_json ?? null,
    visibility,
  });
}

function bookTitle(metadata: Record<string, unknown> | null): string {
  if (typeof metadata?.title === "string") return metadata.title;
  if (typeof metadata?.book_title === "string") return metadata.book_title;
  return "a book";
}

function shelfLabel(metadata: Record<string, unknown> | null): string | null {
  const raw =
    typeof metadata?.shelf_status === "string" ? metadata.shelf_status : null;
  if (!raw) return null;
  return raw.replace(/_/g, " ");
}

function displayName(
  profile: { display_name?: string | null; username?: string | null } | null | undefined,
  fallback = "Someone"
): string {
  return profile?.display_name?.trim() || profile?.username?.trim() || fallback;
}

function formatWithSubject(
  event_type: string,
  metadata: Record<string, unknown> | null,
  subject: string
): string {
  const title = bookTitle(metadata);
  const shelf = shelfLabel(metadata);
  const percent =
    typeof metadata?.progress_percent === "number"
      ? metadata.progress_percent
      : null;
  const rating = typeof metadata?.rating === "number" ? metadata.rating : null;
  const ratingEmoji =
    typeof metadata?.rating_emoji === "string" && metadata.rating_emoji.trim()
      ? ` ${metadata.rating_emoji.trim()}`
      : "";

  switch (event_type) {
    case "book_added":
      return shelf
        ? `${subject} added ${title} to ${shelf}`
        : `${subject} added ${title}`;
    case "shelf_updated":
      return shelf
        ? `${subject} moved ${title} to ${shelf}`
        : `${subject} updated ${title}`;
    case "progress_updated":
      return percent != null
        ? `${subject} updated progress on ${title} (${percent}%)`
        : `${subject} updated progress on ${title}`;
    case "book_finished":
    case "reading_finished": {
      const pending = metadata?.page_count_pending === true;
      const pages =
        typeof metadata?.pages_read === "number" && metadata.pages_read > 0
          ? metadata.pages_read
          : null;
      const finishedAt =
        typeof metadata?.finished_at === "string" ? metadata.finished_at : null;
      const dateSuffix = finishedAt
        ? ` — ${new Date(finishedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`
        : "";

      if (pending) {
        return `${subject} finished ${title} — Page count pending`;
      }
      if (pages != null) {
        return `${subject} finished ${title} — ${pages.toLocaleString()} pages${dateSuffix}`;
      }
      return `${subject} finished ${title}${dateSuffix}`;
    }
    case "reading_started":
      return `${subject} started reading ${title}`;
    case "review_created":
    case "review_added":
      return rating != null
        ? `${subject} reviewed ${title} (${rating}★)${ratingEmoji}`
        : `${subject} reviewed ${title}${ratingEmoji}`;
    case "review_updated":
      return `${subject} updated their review of ${title}`;
    case "book_removed":
      return `${subject} removed ${title} from their library`;
    case "club_discussion_created": {
      const clubName =
        typeof metadata?.club_name === "string" && metadata.club_name.trim()
          ? metadata.club_name.trim()
          : "a book club";
      return `${subject} started a discussion in ${clubName}`;
    }
    case "club_shared": {
      const clubName =
        typeof metadata?.club_name === "string" && metadata.club_name.trim()
          ? metadata.club_name.trim()
          : "a book club";
      return `${subject} shared ${clubName}`;
    }
    default:
      return `${subject} updated their library`;
  }
}

/** Personal dashboard copy — always second person. */
export function formatActivityMessage(
  event_type: string,
  metadata: Record<string, unknown> | null
): string {
  return formatWithSubject(event_type, metadata, "You");
}

/** Social feed copy — third person with reader name. */
export function formatSocialActivityMessage(
  event_type: string,
  metadata: Record<string, unknown> | null,
  profile: { display_name?: string | null; username?: string | null } | null
): string {
  return formatWithSubject(event_type, metadata, displayName(profile));
}

type BookActivityContext = {
  book_id?: string;
  cover_url?: string | null;
  subjects?: string[] | null;
};

export function activityMetadata(
  title: string,
  extra?: Record<string, unknown> & BookActivityContext
): Record<string, unknown> {
  const { book_id, cover_url, subjects, ...rest } = extra ?? {};
  return {
    title,
    book_title: title,
    ...(book_id ? { book_id } : {}),
    ...(cover_url ? { cover_url } : {}),
    ...(subjects?.length ? { subjects } : {}),
    ...rest,
  };
}

/**
 * Self-describing metadata for a club discussion activity event. Kept flat so
 * both the web and mobile feeds can render it without extra lookups. Only emit
 * these events for public clubs (see `createDiscussion`) so private-club
 * discussions never leak into the feed.
 */
export function clubDiscussionMetadata(input: {
  clubId: string;
  clubName: string;
  bodySnippet: string;
  book?: { id: string; title: string; author?: string | null; cover_url?: string | null } | null;
}): Record<string, unknown> {
  const book = input.book;
  return {
    club_id: input.clubId,
    club_name: input.clubName,
    body_snippet: input.bodySnippet,
    ...(book
      ? {
          book_id: book.id,
          title: book.title,
          book_title: book.title,
          ...(book.author ? { author: book.author } : {}),
          ...(book.cover_url ? { cover_url: book.cover_url } : {}),
        }
      : {}),
  };
}

/**
 * Self-describing metadata for a club share activity event. Only emit for
 * public clubs so private/invite-only clubs never leak into the social feed.
 */
export function clubSharedMetadata(input: {
  clubId: string;
  clubName: string;
  description?: string | null;
  imageUrl?: string | null;
  memberCount?: number | null;
}): Record<string, unknown> {
  return {
    club_id: input.clubId,
    club_name: input.clubName,
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    ...(input.imageUrl ? { image_url: input.imageUrl, cover_url: input.imageUrl } : {}),
    ...(typeof input.memberCount === "number" ? { member_count: input.memberCount } : {}),
  };
}

export function bookActivityContext(book: {
  id: string;
  cover_url?: string | null;
  subjects?: string[] | null;
}): BookActivityContext {
  return {
    book_id: book.id,
    cover_url: book.cover_url ?? null,
    subjects: book.subjects ?? null,
  };
}

export function canViewerSeeActivity(
  visibility: ActivityVisibility,
  viewerId: string,
  authorId: string,
  isFollowingAuthor: boolean
): boolean {
  if (viewerId === authorId) return true;
  if (visibility === "private") return false;
  if (visibility === "followers") return isFollowingAuthor;
  return true;
}

/** Deletes the activity_events row only — never the underlying book/post/review. */
export async function deleteOwnActivity(
  activityId: string,
  userId: string
): Promise<{ error?: string }> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase
    .from("activity_events")
    .delete()
    .eq("id", activityId)
    .eq("user_id", userId);

  if (error) return { error: error.message };
  return {};
}
