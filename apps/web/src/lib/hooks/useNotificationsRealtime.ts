"use client";

import { useEffect, useRef } from "react";
import type { RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  getBrowserNotificationPermission,
  showBrowserNotification,
} from "@/lib/utils/browserNotifications";

const SHOWN_BROWSER_NOTIFICATIONS_KEY = "bookmarked:shown-browser-notifications";
const MAX_STORED_BROWSER_NOTIFICATION_IDS = 200;

export type NotificationRealtimeRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  actor_id: string | null;
  link_url: string | null;
  metadata_json: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

type Options = {
  userId: string | undefined;
  enabled?: boolean;
  onInsert?: (row: NotificationRealtimeRow) => void;
  onUpdate?: (row: NotificationRealtimeRow) => void;
  showBrowserAlerts?: boolean;
};

function loadShownBrowserNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();

  try {
    const raw = window.sessionStorage.getItem(SHOWN_BROWSER_NOTIFICATIONS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function rememberShownBrowserNotificationId(
  ids: Set<string>,
  notificationId: string
): void {
  ids.add(notificationId);

  while (ids.size > MAX_STORED_BROWSER_NOTIFICATION_IDS) {
    const oldest = ids.values().next().value;
    if (!oldest) break;
    ids.delete(oldest);
  }

  try {
    window.sessionStorage.setItem(
      SHOWN_BROWSER_NOTIFICATIONS_KEY,
      JSON.stringify([...ids])
    );
  } catch {
    // Ignore quota / private-mode storage errors.
  }
}

function parseNotificationRow(
  payload: RealtimePostgresInsertPayload<Record<string, unknown>> | RealtimePostgresUpdatePayload<Record<string, unknown>>
): NotificationRealtimeRow | null {
  const row = payload.new;
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

/** Subscribe to notification inserts/updates for the signed-in user. */
export function useNotificationsRealtime({
  userId,
  enabled = true,
  onInsert,
  onUpdate,
  showBrowserAlerts = false,
}: Options): void {
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const shownBrowserNotificationIdsRef = useRef(loadShownBrowserNotificationIds());

  useEffect(() => {
    onInsertRef.current = onInsert;
  }, [onInsert]);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!userId || !enabled) return;

    const supabase = createClient();
    let cancelled = false;
    const topic = `notifications:${userId}`;

    for (const existing of supabase.getChannels()) {
      if (existing.topic === `realtime:${topic}`) {
        void supabase.removeChannel(existing);
      }
    }

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
          if (cancelled) return;

          const row = parseNotificationRow(payload);
          if (!row) return;

          onInsertRef.current?.(row);

          if (!showBrowserAlerts || getBrowserNotificationPermission() !== "granted") return;
          if (shownBrowserNotificationIdsRef.current.has(row.id)) return;

          rememberShownBrowserNotificationId(
            shownBrowserNotificationIdsRef.current,
            row.id
          );

          void Promise.resolve(
            supabase
              .from("profiles")
              .select("notify_browser")
              .eq("id", userId)
              .maybeSingle()
          )
            .then(({ data }) => {
              if (!data?.notify_browser) return;
              showBrowserNotification(row.title || "Bookmarked", {
                body: row.body,
                tag: row.id,
                url: row.link_url ?? "/notifications/",
              });
            })
            .catch((error) => {
              console.warn("[notifications] browser preference check failed:", error);
            });
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
          if (cancelled) return;
          const row = parseNotificationRow(payload);
          if (!row) return;
          onUpdateRef.current?.(row);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [userId, enabled, showBrowserAlerts]);
}
