import { supabase } from "./supabase";
import type { NotificationWithActor } from "../types";

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
