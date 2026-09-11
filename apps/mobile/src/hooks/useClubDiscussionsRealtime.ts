import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { supabase } from "../services/supabase";

export type ClubDiscussionRealtimeChange =
  | { type: "insert"; id: string }
  | {
      type: "update";
      id: string;
      reply_count?: number;
      latest_activity_at?: string;
      title?: string;
      body?: string;
      updated_at?: string;
      edited_at?: string | null;
      is_pinned?: boolean;
      is_locked?: boolean;
    }
  | { type: "delete"; id: string }
  | { type: "reconnect" };

export function useClubDiscussionsRealtime(
  clubId: string | undefined,
  onChange: (change: ClubDiscussionRealtimeChange) => void
): void {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!clubId) return;

    let cancelled = false;
    const topic = `club_discussions:${clubId}`;

    function subscribe() {
      for (const existing of supabase.getChannels()) {
        if (existing.topic === `realtime:${topic}`) {
          void supabase.removeChannel(existing);
        }
      }

      return supabase
        .channel(topic)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "book_club_discussions",
            filter: `club_id=eq.${clubId}`,
          },
          (payload) => {
            if (cancelled) return;
            if (payload.eventType === "DELETE") {
              const id = (payload.old as { id?: string } | null)?.id;
              if (id) onChangeRef.current({ type: "delete", id });
              return;
            }
            const row = payload.new as {
              id?: string;
              reply_count?: number;
              latest_activity_at?: string;
              title?: string;
              body?: string;
              updated_at?: string;
              edited_at?: string | null;
              is_pinned?: boolean;
              is_locked?: boolean;
            } | null;
            if (!row?.id) return;
            if (payload.eventType === "UPDATE") {
              onChangeRef.current({
                type: "update",
                id: row.id,
                reply_count: row.reply_count,
                latest_activity_at: row.latest_activity_at,
                title: row.title,
                body: row.body,
                updated_at: row.updated_at,
                edited_at: row.edited_at,
                is_pinned: row.is_pinned,
                is_locked: row.is_locked,
              });
              return;
            }
            onChangeRef.current({ type: "insert", id: row.id });
          }
        )
        .subscribe();
    }

    let channel = subscribe();

    function handleAppState(next: AppStateStatus) {
      if (next !== "active" || cancelled) return;
      void supabase.removeChannel(channel);
      channel = subscribe();
      onChangeRef.current({ type: "reconnect" });
    }

    const sub = AppState.addEventListener("change", handleAppState);

    return () => {
      cancelled = true;
      sub.remove();
      void supabase.removeChannel(channel);
    };
  }, [clubId]);
}
