"use client";

import { useEffect, useRef } from "react";
import { clubReplyRealtimeTopic } from "../../../../../packages/utils/clubReplyThread";
import { createClient } from "@/lib/supabase/client";

export type ClubReplyRealtimeChange =
  | { type: "insert" | "update"; id: string }
  | { type: "delete"; id: string }
  | { type: "reconnect" };

/**
 * Subscribe to replies for one discussion only. RLS still gates delivery.
 * Resubscribes on tab focus / reconnect and asks the caller to refetch+merge.
 */
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

    const supabase = createClient();
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

    function resubscribeAndRefetch() {
      if (cancelled) return;
      void supabase.removeChannel(channel);
      channel = subscribe();
      onChangeRef.current({ type: "reconnect" });
    }

    function handleVisibility() {
      if (document.visibilityState !== "visible") return;
      resubscribeAndRefetch();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", resubscribeAndRefetch);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", resubscribeAndRefetch);
      void supabase.removeChannel(channel);
    };
  }, [discussionId]);
}
