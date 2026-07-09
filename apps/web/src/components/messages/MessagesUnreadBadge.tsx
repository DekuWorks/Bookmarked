"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUnreadMessageCount } from "@/lib/services/messages";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
};

export function MessagesUnreadBadge({ className }: Props) {
  const user = useAuthUser();
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    if (!user?.id) return;
    void getUnreadMessageCount(user.id)
      .then(setCount)
      .catch((error) => {
        console.warn("[messages] unread count failed:", error);
      });
  }, [user?.id]);

  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();
    const topic = `messages-unread:${user.id}`;

    for (const existing of supabase.getChannels()) {
      if (existing.topic === `realtime:${topic}`) {
        void supabase.removeChannel(existing);
      }
    }

    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => refreshRef.current()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversation_participants" },
        () => refreshRef.current()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-puce-red px-1 text-[10px] font-bold text-white",
        className
      )}
      aria-hidden
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
