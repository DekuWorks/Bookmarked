import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { clubReplyRealtimeTopic } from "../../../../packages/utils/clubReplyThread";
import { supabase } from "../services/supabase";

export type ClubReplyRealtimeChange =
  | { type: "insert" | "update"; id: string }
  | { type: "delete"; id: string }
  | { type: "reconnect" };

export function useClubDiscussionRepliesRealtime(
  discussionId: string | undefined,
  onChange: (change: ClubReplyRealtimeChange) => void
): void {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!discussionId) return;

    let cancelled = false;
    const topic = clubReplyRealtimeTopic(discussionId);

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
            table: "book_club_discussion_replies",
            filter: `discussion_id=eq.${discussionId}`,
          },
          (payload) => {
            if (cancelled) return;
            if (payload.eventType === "DELETE") {
              const id = (payload.old as { id?: string } | null)?.id;
              if (id) onChangeRef.current({ type: "delete", id });
              return;
            }
            const id = (payload.new as { id?: string } | null)?.id;
            if (!id) return;
            onChangeRef.current({
              type: payload.eventType === "UPDATE" ? "update" : "insert",
              id,
            });
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
  }, [discussionId]);
}
