"use client";

import { AppNavLink } from "@/components/layout/AppNavLink";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const userId = user?.id;
  const shownBrowserNotificationIdsRef = useRef(new Set<string>());

  const refreshCount = useCallback(() => {
    if (!userId) return;
    void getUnreadNotificationCount(userId)
      .then(setUnreadCount)
      .catch((error) => {
        console.warn("[notifications] unread count failed:", error);
      });
  }, [userId]);

  const refreshCountRef = useRef(refreshCount);

  useEffect(() => {
    refreshCountRef.current = refreshCount;
  }, [refreshCount]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let cancelled = false;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (cancelled) return;

          refreshCountRef.current();

          if (getBrowserNotificationPermission() !== "granted") return;

          const row = payload.new as {
            title?: string;
            body?: string;
            link_url?: string | null;
            id?: string;
          };

          const notificationId = row.id;
          if (!notificationId) return;
          if (shownBrowserNotificationIdsRef.current.has(notificationId)) return;
          shownBrowserNotificationIdsRef.current.add(notificationId);

          void Promise.resolve(
            supabase
              .from("profiles")
              .select("notify_browser")
              .eq("id", userId)
              .maybeSingle()
          )
            .then(({ data }) => {
              if (!data?.notify_browser) return;
              showBrowserNotification(row.title ?? "Bookmarked", {
                body: row.body,
                tag: notificationId,
                url: row.link_url ?? "/notifications/",
              });
            })
            .catch((error) => {
              console.warn("[notifications] browser preference check failed:", error);
            });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  if (!user) return null;

  return (
    <AppNavLink
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
    </AppNavLink>
  );
}
