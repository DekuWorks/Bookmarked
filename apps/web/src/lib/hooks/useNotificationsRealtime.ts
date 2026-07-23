"use client";

import { useEffect, useRef } from "react";
import { subscribeNotificationRealtime } from "@/lib/hooks/notificationRealtimeManager";

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
};

/** Subscribe to notification inserts/updates for the signed-in user. */
export function useNotificationsRealtime({
  userId,
  enabled = true,
  onInsert,
  onUpdate,
}: Options): void {
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onInsertRef.current = onInsert;
  }, [onInsert]);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!userId || !enabled) return;

    return subscribeNotificationRealtime(userId, {
      onInsert: (row) => onInsertRef.current?.(row),
      onUpdate: (row) => onUpdateRef.current?.(row),
    });
  }, [userId, enabled]);
}
