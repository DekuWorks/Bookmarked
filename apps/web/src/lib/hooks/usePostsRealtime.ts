"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const POSTS_TABLES = ["posts", "post_likes", "post_comments"] as const;

/** Refetch the posts feed when posts, likes, or comments change. */
export function usePostsRealtime(
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
    const topic = `feed_posts:${userId}`;

    for (const existing of supabase.getChannels()) {
      if (existing.topic === `realtime:${topic}`) {
        void supabase.removeChannel(existing);
      }
    }

    let channel = supabase.channel(topic);

    for (const table of POSTS_TABLES) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        () => {
          if (cancelled) return;
          void Promise.resolve(onChangeRef.current()).catch((error) => {
            console.warn("[posts-realtime] refresh failed:", error);
          });
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
