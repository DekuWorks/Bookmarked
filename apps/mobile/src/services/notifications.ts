import { supabase } from "./supabase";
import type { NotificationWithActor, Profile } from "../types";
import { validateNotificationPreferences } from "../../../../packages/utils/profileValidation";
import { shouldCreateStandardNotification } from "../../../../packages/utils/notifiableEvents";

export type NotificationPreferences = Pick<
  Profile,
  | "notify_messages"
  | "notify_follows"
  | "notify_feed"
  | "notify_likes"
  | "notify_comments"
  | "notify_mentions"
>;

/**
 * Mobile notifications service. Mirrors the web service
 * (apps/web/src/lib/services/notifications.ts) against the same `notifications`
 * table + RLS. Feed-link enrichment is simplified: the stored `link_url` is
 * kept as-is and mapped to a mobile route at the screen level.
 */

const PROFILE_SELECT = "id, username, display_name, avatar_url";

export async function getNotifications(
  userId: string,
  limit = 40
): Promise<NotificationWithActor[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(`*, actor:profiles!notifications_actor_id_fkey (${PROFILE_SELECT})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return ((data ?? []) as Array<NotificationWithActor & { actor: NotificationWithActor["actor"] }>).map(
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
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
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
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}

export async function updateNotificationPreferences(
  userId: string,
  prefs: Partial<NotificationPreferences>
): Promise<{ error?: string }> {
  const validation = validateNotificationPreferences(prefs);
  if (!validation.ok) return { error: validation.error };

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

// ---- Notification creation (mirrors apps/web/src/lib/services/notifications.ts)
// All go through the `create_notification` RPC, which no-ops on self-notify,
// respects per-user prefs, and dedups on metadata_json->>'dedup_key'.

/** Deep link stored on post-engagement notifications (matches web postFeedPath). */
export function postFeedPath(postId: string): string {
  return `/feed/?post=${postId}`;
}

export async function getActorDisplayName(userId: string): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", userId)
    .maybeSingle();
  return data?.display_name?.trim() || data?.username?.trim() || "A reader";
}

async function createNotification(params: {
  recipientId: string;
  type: "message" | "follow" | "feed";
  title: string;
  body: string;
  actorId: string;
  linkUrl: string;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const kind =
    typeof params.metadata.notification_kind === "string"
      ? params.metadata.notification_kind
      : null;
  if (!shouldCreateStandardNotification({ type: params.type, notificationKind: kind })) {
    return;
  }
  try {
    await supabase.rpc("create_notification", {
      p_user_id: params.recipientId,
      p_type: params.type,
      p_title: params.title,
      p_body: params.body,
      p_actor_id: params.actorId,
      p_link_url: params.linkUrl,
      p_metadata: params.metadata,
    });
  } catch {
    // Notifications are best-effort; never block the underlying mutation.
  }
}

/** Deep link for a reader's public profile (matches web readerProfilePath shape for mapLinkToRoute). */
export function readerProfilePath(username: string): string {
  return `/reader/?username=${encodeURIComponent(username)}`;
}

export async function createFollowNotification(input: {
  recipientId: string;
  actorId: string;
  actorDisplayName: string;
  actorUsername: string | null;
}): Promise<void> {
  const link = input.actorUsername
    ? readerProfilePath(input.actorUsername)
    : "/feed/";

  await createNotification({
    recipientId: input.recipientId,
    type: "follow",
    title: `${input.actorDisplayName} followed you`,
    body: "Tap to view their profile.",
    actorId: input.actorId,
    linkUrl: link,
    metadata: {},
  });
}

export async function createMentionNotification(input: {
  recipientId: string;
  actorId: string;
  actorDisplayName: string;
  linkUrl: string;
  preview: string;
  dedupKey: string;
  postId?: string;
}): Promise<void> {
  await createNotification({
    recipientId: input.recipientId,
    type: "feed",
    title: `${input.actorDisplayName} mentioned you`,
    body: input.preview.slice(0, 160),
    actorId: input.actorId,
    linkUrl: input.linkUrl,
    metadata: {
      notification_kind: "mention",
      dedup_key: input.dedupKey,
      ...(input.postId ? { post_id: input.postId } : {}),
    },
  });
}

export async function createPostLikeNotification(input: {
  recipientId: string;
  actorId: string;
  actorDisplayName: string;
  postId: string;
}): Promise<void> {
  await createNotification({
    recipientId: input.recipientId,
    type: "feed",
    title: `${input.actorDisplayName} liked your post`,
    body: "Tap to view the post.",
    actorId: input.actorId,
    linkUrl: postFeedPath(input.postId),
    metadata: {
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
  await createNotification({
    recipientId: input.recipientId,
    type: "feed",
    title: `${input.actorDisplayName} commented on your post`,
    body: input.preview.slice(0, 160) || "Tap to view the comment.",
    actorId: input.actorId,
    linkUrl: postFeedPath(input.postId),
    metadata: {
      post_id: input.postId,
      comment_id: input.commentId,
      notification_kind: "post_comment",
      dedup_key: `post_comment:${input.commentId}`,
    },
  });
}

export async function createPostCommentReactionNotification(input: {
  recipientId: string;
  actorId: string;
  actorDisplayName: string;
  postId: string;
  commentId: string;
}): Promise<void> {
  await createNotification({
    recipientId: input.recipientId,
    type: "feed",
    title: `${input.actorDisplayName} reacted to your comment`,
    body: "Tap to view the comment.",
    actorId: input.actorId,
    linkUrl: postFeedPath(input.postId),
    metadata: {
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
  replyId: string;
  preview: string;
}): Promise<void> {
  await createNotification({
    recipientId: input.recipientId,
    type: "feed",
    title: `${input.actorDisplayName} replied to your comment`,
    body: input.preview.slice(0, 160) || "Tap to view the reply.",
    actorId: input.actorId,
    linkUrl: postFeedPath(input.postId),
    metadata: {
      post_id: input.postId,
      reply_id: input.replyId,
      notification_kind: "post_comment_reply",
      dedup_key: `post_comment_reply:${input.replyId}`,
    },
  });
}

/** Compact relative timestamp, mirroring web `formatNotificationTimestamp`. */
export function formatNotificationTimestamp(iso: string): string {
  const date = new Date(iso);
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
