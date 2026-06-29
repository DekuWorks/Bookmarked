"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Refetch library data when the signed-in user's shelves change. */
export function useUserBooksRealtime(
  userId: string | undefined,
  onChange: () => void
): void {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
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
        () => onChange()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, onChange]);
}
