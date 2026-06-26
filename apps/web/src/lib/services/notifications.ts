import { createClient } from "@/lib/supabase/client";
import type { NotificationPreferences, NotificationWithActor } from "@/types";

const PROFILE_SELECT = "id, username, display_name, avatar_url";

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
    ? `/reader/?username=${encodeURIComponent(input.actorUsername)}`
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
  const link = `/messages/thread/?id=${encodeURIComponent(input.conversationId)}`;

  await Promise.all(
    input.recipientIds.map((recipientId) =>
      supabase.rpc("create_notification", {
        p_user_id: recipientId,
        p_type: "message",
        p_title: `New message from ${input.senderDisplayName}`,
        p_body: input.preview.slice(0, 160),
        p_actor_id: input.senderId,
        p_link_url: link,
        p_metadata: { conversation_id: input.conversationId },
      })
    )
  );
}

export function formatNotificationTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
