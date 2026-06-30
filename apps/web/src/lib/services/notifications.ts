import { createClient } from "@/lib/supabase/client";
import { activityEventHref } from "@/lib/routes/activity";
import { bookDetailsReviewsPath } from "@/lib/routes/book";
import { messageThreadPath } from "@/lib/routes/messages";
import { postFeedPath } from "@/lib/routes/posts";
import { readerProfilePath } from "@/lib/routes/reader";
import type { NotificationPreferences, NotificationWithActor } from "@/types";

const PROFILE_SELECT = "id, username, display_name, avatar_url";

type ActivityLookupRow = {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata_json: Record<string, unknown> | null;
};

async function resolveBookIdsForActivities(
  activities: ActivityLookupRow[]
): Promise<Map<string, string>> {
  const bookIdByActivityId = new Map<string, string>();

  for (const row of activities) {
    const metadata = row.metadata_json;
    if (typeof metadata?.book_id === "string") {
      bookIdByActivityId.set(row.id, metadata.book_id);
    }
  }

  const userBookIds: string[] = [];
  const reviewIds: string[] = [];

  for (const row of activities) {
    if (bookIdByActivityId.has(row.id) || !row.entity_id) continue;
    if (row.entity_type === "user_book") userBookIds.push(row.entity_id);
    if (row.entity_type === "review") reviewIds.push(row.entity_id);
  }

  const supabase = createClient();

  if (userBookIds.length) {
    const { data } = await supabase
      .from("user_books")
      .select("id, book_id")
      .in("id", userBookIds);

    for (const userBook of data ?? []) {
      for (const row of activities) {
        if (row.entity_type === "user_book" && row.entity_id === userBook.id) {
          bookIdByActivityId.set(row.id, userBook.book_id);
        }
      }
    }
  }

  if (reviewIds.length) {
    const { data } = await supabase
      .from("reviews")
      .select("id, book_id")
      .in("id", reviewIds);

    for (const review of data ?? []) {
      for (const row of activities) {
        if (row.entity_type === "review" && row.entity_id === review.id) {
          bookIdByActivityId.set(row.id, review.book_id);
        }
      }
    }
  }

  return bookIdByActivityId;
}

async function enrichFeedNotificationLinks(
  notifications: NotificationWithActor[]
): Promise<NotificationWithActor[]> {
  const feedNotifications = notifications.filter((notification) => notification.type === "feed");
  if (!feedNotifications.length) return notifications;

  const activityIds = [
    ...new Set(
      feedNotifications
        .map((notification) => notification.metadata_json?.activity_id)
        .filter((id): id is string => typeof id === "string")
    ),
  ];

  if (!activityIds.length) return notifications;

  const supabase = createClient();
  const { data: activities, error } = await supabase
    .from("activity_events")
    .select("id, event_type, entity_type, entity_id, metadata_json")
    .in("id", activityIds);

  if (error || !activities?.length) return notifications;

  const activityRows = activities as ActivityLookupRow[];
  const bookIdByActivityId = await resolveBookIdsForActivities(activityRows);
  const activityById = new Map(activityRows.map((row) => [row.id, row]));

  return notifications.map((notification) => {
    if (notification.type !== "feed") return notification;

    const activityId = notification.metadata_json?.activity_id;
    if (typeof activityId !== "string") return notification;

    const activity = activityById.get(activityId);
    const bookId = bookIdByActivityId.get(activityId) ?? null;
    if (!activity || !bookId) return notification;

    const link_url = activityEventHref(
      activity.event_type,
      bookId,
      notification.actor?.username
    );

    return {
      ...notification,
      link_url,
      metadata_json: {
        ...notification.metadata_json,
        book_id: bookId,
        event_type: activity.event_type,
      },
    };
  });
}

export async function getNotifications(
  userId: string,
  limit = 40
): Promise<NotificationWithActor[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("notifications")
    .select(`*, actor:profiles!notifications_actor_id_fkey (${PROFILE_SELECT})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const mapped = ((data ?? []) as Array<NotificationWithActor & { actor: NotificationWithActor["actor"] }>).map(
    (row) => ({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      body: row.body,
      actor_id: row.actor_id,
      link_url: row.link_url,
      metadata_json: row.metadata_json,
      read_at: row.read_at,
      created_at: row.created_at,
      actor: row.actor ?? null,
    })
  );

  return enrichFeedNotificationLinks(mapped);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = createClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}

export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("notify_messages, notify_follows, notify_feed, notify_browser")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return data as NotificationPreferences;
}

export async function updateNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreferences>
): Promise<{ error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      ...prefs,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { error: error.message };
  return {};
}

export async function createFollowNotification(input: {
  recipientId: string;
  actorId: string;
  actorDisplayName: string;
  actorUsername: string | null;
}): Promise<void> {
  const supabase = createClient();

  const link = input.actorUsername
    ? readerProfilePath(input.actorUsername)
    : "/feed/";

  await supabase.rpc("create_notification", {
    p_user_id: input.recipientId,
    p_type: "follow",
    p_title: `${input.actorDisplayName} followed you`,
    p_body: "Tap to view their profile.",
    p_actor_id: input.actorId,
    p_link_url: link,
    p_metadata: {},
  });
}

export async function createMessageNotifications(input: {
  conversationId: string;
  senderId: string;
  senderDisplayName: string;
  recipientIds: string[];
  preview: string;
}): Promise<void> {
  if (!input.recipientIds.length) return;

  const supabase = createClient();
  const link = messageThreadPath(input.conversationId);

  await Promise.all(
    input.recipientIds.map((recipientId) =>
      supabase.rpc("create_notification", {
        p_user_id: recipientId,
        p_type: "message",
        p_title: `New message from ${input.senderDisplayName}`,
        p_body: input.preview.slice(0, 160),
        p_actor_id: input.senderId,
        p_link_url: link,
        p_metadata: {
          conversation_id: input.conversationId,
          dedup_key: `message:${input.conversationId}:${input.senderId}:${input.preview.slice(0, 80)}`,
        },
      })
    )
  );
}

export async function createPostLikeNotification(input: {
  recipientId: string;
  actorId: string;
  actorDisplayName: string;
  postId: string;
}): Promise<void> {
  const supabase = createClient();

  await supabase.rpc("create_notification", {
    p_user_id: input.recipientId,
    p_type: "feed",
    p_title: `${input.actorDisplayName} liked your post`,
    p_body: "Tap to view the post.",
    p_actor_id: input.actorId,
    p_link_url: postFeedPath(input.postId),
    p_metadata: {
      post_id: input.postId,
      notification_kind: "post_like",
      dedup_key: `post_like:${input.postId}:${input.actorId}`,
    },
  });
}

export async function createPostCommentNotification(input: {
  recipientId: string;
  actorId: string;
  actorDisplayName: string;
  postId: string;
  commentId: string;
  preview: string;
}): Promise<void> {
  const supabase = createClient();

  await supabase.rpc("create_notification", {
    p_user_id: input.recipientId,
    p_type: "feed",
    p_title: `${input.actorDisplayName} commented on your post`,
    p_body: input.preview.slice(0, 160),
    p_actor_id: input.actorId,
    p_link_url: postFeedPath(input.postId),
    p_metadata: {
      post_id: input.postId,
      comment_id: input.commentId,
      notification_kind: "post_comment",
      dedup_key: `post_comment:${input.commentId}`,
    },
  });
}

export async function createReviewReactionNotification(input: {
  recipientId: string;
  actorId: string;
  actorDisplayName: string;
  reviewId: string;
  bookId: string;
  reaction: "like" | "dislike";
}): Promise<void> {
  const supabase = createClient();
  const label = input.reaction === "like" ? "liked" : "disliked";

  await supabase.rpc("create_notification", {
    p_user_id: input.recipientId,
    p_type: "feed",
    p_title: `${input.actorDisplayName} ${label} your review`,
    p_body: "Tap to view the review.",
    p_actor_id: input.actorId,
    p_link_url: bookDetailsReviewsPath(input.bookId),
    p_metadata: {
      review_id: input.reviewId,
      book_id: input.bookId,
      notification_kind: "review_reaction",
      dedup_key: `review_reaction:${input.reviewId}:${input.actorId}`,
    },
  });
}

export async function createReviewReplyNotification(input: {
  recipientId: string;
  actorId: string;
  actorDisplayName: string;
  reviewId: string;
  bookId: string;
  replyId: string;
  preview: string;
}): Promise<void> {
  const supabase = createClient();

  await supabase.rpc("create_notification", {
    p_user_id: input.recipientId,
    p_type: "feed",
    p_title: `${input.actorDisplayName} replied to your review`,
    p_body: input.preview.slice(0, 160),
    p_actor_id: input.actorId,
    p_link_url: bookDetailsReviewsPath(input.bookId),
    p_metadata: {
      review_id: input.reviewId,
      book_id: input.bookId,
      reply_id: input.replyId,
      notification_kind: "review_reply",
      dedup_key: `review_reply:${input.replyId}`,
    },
  });
}

export async function createPostCommentReactionNotification(input: {
  recipientId: string;
  actorId: string;
  actorDisplayName: string;
  postId: string;
  commentId: string;
  reaction: "like" | "dislike";
}): Promise<void> {
  const supabase = createClient();
  const label = input.reaction === "like" ? "liked" : "disliked";

  await supabase.rpc("create_notification", {
    p_user_id: input.recipientId,
    p_type: "feed",
    p_title: `${input.actorDisplayName} ${label} your comment`,
    p_body: "Tap to view the post.",
    p_actor_id: input.actorId,
    p_link_url: postFeedPath(input.postId),
    p_metadata: {
      post_id: input.postId,
      comment_id: input.commentId,
      notification_kind: "post_comment_reaction",
      dedup_key: `post_comment_reaction:${input.commentId}:${input.actorId}`,
    },
  });
}

export async function createPostCommentReplyNotification(input: {
  recipientId: string;
  actorId: string;
  actorDisplayName: string;
  postId: string;
  commentId: string;
  replyId: string;
  preview: string;
}): Promise<void> {
  const supabase = createClient();

  await supabase.rpc("create_notification", {
    p_user_id: input.recipientId,
    p_type: "feed",
    p_title: `${input.actorDisplayName} replied to your comment`,
    p_body: input.preview.slice(0, 160),
    p_actor_id: input.actorId,
    p_link_url: postFeedPath(input.postId),
    p_metadata: {
      post_id: input.postId,
      comment_id: input.commentId,
      reply_id: input.replyId,
      notification_kind: "post_comment_reply",
      dedup_key: `post_comment_reply:${input.replyId}`,
    },
  });
}

export async function createMentionNotification(input: {
  recipientId: string;
  actorId: string;
  actorDisplayName: string;
  linkUrl: string;
  preview: string;
  dedupKey: string;
}): Promise<void> {
  const supabase = createClient();

  await supabase.rpc("create_notification", {
    p_user_id: input.recipientId,
    p_type: "feed",
    p_title: `${input.actorDisplayName} mentioned you`,
    p_body: input.preview.slice(0, 160),
    p_actor_id: input.actorId,
    p_link_url: input.linkUrl,
    p_metadata: {
      notification_kind: "mention",
      dedup_key: input.dedupKey,
    },
  });
}

export function formatNotificationTimestamp(iso: string, locale?: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(locale, { month: "short", day: "numeric" });
}
