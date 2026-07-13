"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribe to new discussions for a single club and invoke `onInsert` with the
 * new post id so the caller can hydrate + prepend it.
 *
 * Follows the hardened Realtime pattern used elsewhere (NotificationBell,
 * useUserBooksRealtime): register the handler BEFORE `.subscribe()`, tear down
 * any stale channel for this topic before creating a new one, and remove the
 * channel on unmount. RLS on `book_club_posts` gates which inserts are actually
 * delivered (members always; public-club posts to everyone).
 */
export function useClubDiscussionsRealtime(
  clubId: string | undefined,
  onInsert: (postId: string) => void
): void {
  const onInsertRef = useRef(onInsert);

  useEffect(() => {
    onInsertRef.current = onInsert;
  }, [onInsert]);

  useEffect(() => {
    if (!clubId) return;

    const supabase = createClient();
    let cancelled = false;
    const topic = `club_posts:${clubId}`;

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
          table: "book_club_posts",
          filter: `club_id=eq.${clubId}`,
        },
        (payload) => {
          if (cancelled) return;
          const id = (payload.new as { id?: string } | null)?.id;
          if (!id) return;
          void Promise.resolve(onInsertRef.current(id)).catch((error) => {
            console.warn("[club-discussions-realtime] hydrate failed:", error);
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [clubId]);
}
