import { bookDetailsPath, bookDetailsReviewsPath } from "@/lib/routes/book";
import { clubDetailPath } from "@/lib/routes/clubs";
import { messageThreadPath, messagesInboxPath } from "@/lib/routes/messages";
import { readerProfilePath } from "@/lib/routes/reader";
import type { FeedItem } from "@/lib/services/socialFeed";
import type { NotificationWithActor } from "@/types";

const REVIEW_ACTIVITY_EVENTS = new Set([
  "review_created",
  "review_added",
  "review_updated",
]);

const CLUB_ACTIVITY_EVENTS = new Set(["club_discussion_created", "club_shared"]);

export function isReviewActivityEvent(eventType: string): boolean {
  return REVIEW_ACTIVITY_EVENTS.has(eventType);
}

export function isClubActivityEvent(eventType: string): boolean {
  return CLUB_ACTIVITY_EVENTS.has(eventType);
}

export function activityEventHref(
  eventType: string,
  bookId: string | null | undefined,
  fallbackUsername?: string | null
): string {
  if (bookId) {
    return isReviewActivityEvent(eventType)
      ? bookDetailsReviewsPath(bookId)
      : bookDetailsPath(bookId);
  }

  const username = fallbackUsername?.trim();
  if (username) return readerProfilePath(username);

  return "/feed/";
}

export function feedItemHref(
  item: Pick<FeedItem, "event_type" | "bookId" | "profiles" | "clubId">
): string {
  // Club discussions link to the club, even when a book is attached.
  if (isClubActivityEvent(item.event_type) && item.clubId) {
    return clubDetailPath(item.clubId);
  }
  return activityEventHref(item.event_type, item.bookId, item.profiles?.username);
}

export function notificationHref(notification: NotificationWithActor): string {
  if (notification.link_url) return notification.link_url;

  if (notification.type === "message") {
    const conversationId = notification.metadata_json?.conversation_id;
    if (typeof conversationId === "string") {
      return messageThreadPath(conversationId);
    }
    return messagesInboxPath();
  }

  if (notification.type === "follow") {
    const username = notification.actor?.username?.trim();
    if (username) return readerProfilePath(username);
    return "/feed/";
  }

  if (notification.type === "feed") {
    const bookId = notification.metadata_json?.book_id;
    const eventType = notification.metadata_json?.event_type;
    if (typeof bookId === "string" && typeof eventType === "string") {
      return activityEventHref(eventType, bookId, notification.actor?.username);
    }
    const username = notification.actor?.username?.trim();
    if (username) return readerProfilePath(username);
    return "/feed/";
  }

  if (notification.type === "club") {
    const clubId = notification.metadata_json?.club_id;
    if (typeof clubId === "string") {
      return clubDetailPath(clubId);
    }
    return "/clubs/";
  }

  return "/notifications/";
}
