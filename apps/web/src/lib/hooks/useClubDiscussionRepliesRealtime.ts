"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type ReplyChange =
  | { type: "insert" | "update"; id: string }
  | { type: "delete"; id: string };

/**
 * Subscribe to replies for one discussion only. RLS still gates delivery.
 * Resubscribes on tab focus / reconnect and asks the caller to refetch+merge.
 */
export function useClubDiscussionRepliesRealtime(
  discussionId: string | undefined,
  onChange: (change: ReplyChange) => void
): void {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!discussionId) return;

    const supabase = createClient();
    let cancelled = false;
    const topic = `club_discussion_replies:${discussionId}`;

    function subscribe() {
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
        .subscribe((status) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            // Caller refetches on reconnect via visibility handler; no-op here.
          }
        });

      return channel;
    }

    let channel = subscribe();

    function handleVisibility() {
      if (document.visibilityState !== "visible" || cancelled) return;
      void supabase.removeChannel(channel);
      channel = subscribe();
      onChangeRef.current({ type: "insert", id: "" });
    }

    function handleOnline() {
      if (cancelled) return;
      void supabase.removeChannel(channel);
      channel = subscribe();
      onChangeRef.current({ type: "insert", id: "" });
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
      void supabase.removeChannel(channel);
    };
  }, [discussionId]);
}
