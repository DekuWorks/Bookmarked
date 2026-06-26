"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BellIcon } from "@/components/notifications/BellIcon";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { createClient } from "@/lib/supabase/client";
import { getUnreadNotificationCount } from "@/lib/services/notifications";
import {
  getBrowserNotificationPermission,
  showBrowserNotification,
} from "@/lib/utils/browserNotifications";
import { cn } from "@/lib/utils/cn";

export function NotificationBell() {
  const user = useAuthUser();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(() => {
    if (!user) return;
    void getUnreadNotificationCount(user.id).then(setUnreadCount);
  }, [user]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          refreshCount();

          const row = payload.new as {
            title?: string;
            body?: string;
            link_url?: string | null;
            id?: string;
          };

          if (getBrowserNotificationPermission() !== "granted") return;

          void supabase
            .from("profiles")
            .select("notify_browser")
            .eq("id", user.id)
            .maybeSingle()
            .then(({ data }) => {
              if (!data?.notify_browser) return;
              showBrowserNotification(row.title ?? "Bookmarked", {
                body: row.body,
                tag: row.id,
                url: row.link_url ?? "/notifications/",
              });
            });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refreshCount();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, refreshCount]);

  if (!user) return null;

  return (
    <Link
      href="/notifications/"
      className={cn(
        "relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg",
        "text-puce-red transition hover:bg-primary/10 hover:text-rust",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-orange focus-visible:ring-offset-2"
      )}
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
    >
      <BellIcon filled={unreadCount > 0} />
      {unreadCount > 0 ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-puce-red px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
