"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const ACTIVITY_FEED_TABLES = ["activity_events", "follows"] as const;

/** Refetch the activity feed when events or follows change. */
export function useActivityFeedRealtime(
  userId: string | undefined,
  enabled: boolean,
  onChange: () => void
): void {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!userId || !enabled) return;

    const supabase = createClient();
    let cancelled = false;
    const topic = `feed_activity:${userId}`;

    for (const existing of supabase.getChannels()) {
      if (existing.topic === `realtime:${topic}`) {
        void supabase.removeChannel(existing);
      }
    }

    let channel = supabase.channel(topic);

    for (const table of ACTIVITY_FEED_TABLES) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        () => {
          if (cancelled) return;
          onChangeRef.current();
        }
      );
    }

    channel.subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [userId, enabled]);
}
