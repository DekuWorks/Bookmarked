"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/** Refetch library data when the signed-in user's shelves change. */
export function useUserBooksRealtime(
  userId: string | undefined,
  onChange: () => void
): void {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let cancelled = false;
    const topic = `user_books:${userId}`;

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
          table: "user_books",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          if (cancelled) return;
          void Promise.resolve(onChangeRef.current()).catch((error) => {
            console.warn("[user-books-realtime] refresh failed:", error);
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [userId]);
}
