import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { NotificationRealtimeRow } from "@/lib/hooks/useNotificationsRealtime";

type Listener = {
  onInsert?: (row: NotificationRealtimeRow) => void;
  onUpdate?: (row: NotificationRealtimeRow) => void;
};

type ChannelState = {
  userId: string;
  channel: RealtimeChannel;
  listeners: Map<symbol, Listener>;
};

const channelsByUserId = new Map<string, ChannelState>();
const browserAlertListeners = new Set<(row: NotificationRealtimeRow) => void>();

function parseNotificationRow(
  row: Record<string, unknown> | null | undefined
): NotificationRealtimeRow | null {
  if (!row || typeof row.id !== "string" || typeof row.user_id !== "string") {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    type: typeof row.type === "string" ? row.type : "",
    title: typeof row.title === "string" ? row.title : "",
    body: typeof row.body === "string" ? row.body : "",
    actor_id: typeof row.actor_id === "string" ? row.actor_id : null,
    link_url: typeof row.link_url === "string" ? row.link_url : null,
    metadata_json:
      row.metadata_json && typeof row.metadata_json === "object"
        ? (row.metadata_json as Record<string, unknown>)
        : {},
    read_at: typeof row.read_at === "string" ? row.read_at : null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
  };
}

function notifyInsert(row: NotificationRealtimeRow): void {
  const state = channelsByUserId.get(row.user_id);
  if (!state) return;

  for (const listener of state.listeners.values()) {
    listener.onInsert?.(row);
  }

  for (const listener of browserAlertListeners) {
    listener(row);
  }
}

function notifyUpdate(row: NotificationRealtimeRow): void {
  const state = channelsByUserId.get(row.user_id);
  if (!state) return;

  for (const listener of state.listeners.values()) {
    listener.onUpdate?.(row);
  }
}

function teardownChannel(userId: string): void {
  const state = channelsByUserId.get(userId);
  if (!state) return;

  void createClient().removeChannel(state.channel);
  channelsByUserId.delete(userId);
}

function ensureChannel(userId: string): ChannelState {
  const existing = channelsByUserId.get(userId);
  if (existing) return existing;

  const supabase = createClient();
  const topic = `notifications:${userId}`;

  const channel = supabase
    .channel(topic)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = parseNotificationRow(payload.new);
        if (row) notifyInsert(row);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const row = parseNotificationRow(payload.new);
        if (row) notifyUpdate(row);
      }
    )
    .subscribe();

  const state: ChannelState = {
    userId,
    channel,
    listeners: new Map(),
  };

  channelsByUserId.set(userId, state);
  return state;
}

export function subscribeNotificationRealtime(
  userId: string,
  listener: Listener
): () => void {
  const state = ensureChannel(userId);
  const id = Symbol("notification-listener");
  state.listeners.set(id, listener);

  return () => {
    state.listeners.delete(id);
    if (state.listeners.size === 0 && browserAlertListeners.size === 0) {
      teardownChannel(userId);
    }
  };
}

export function subscribeBrowserNotificationAlerts(
  userId: string,
  onInsert: (row: NotificationRealtimeRow) => void
): () => void {
  ensureChannel(userId);
  browserAlertListeners.add(onInsert);

  return () => {
    browserAlertListeners.delete(onInsert);
    const state = channelsByUserId.get(userId);
    if (state && state.listeners.size === 0 && browserAlertListeners.size === 0) {
      teardownChannel(userId);
    }
  };
}
