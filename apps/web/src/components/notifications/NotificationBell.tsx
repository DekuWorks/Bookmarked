"use client";

import { AppNavLink } from "@/components/layout/AppNavLink";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { BellIcon } from "@/components/notifications/BellIcon";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { createClient } from "@/lib/supabase/client";
import { getUnreadNotificationCount } from "@/lib/services/notifications";
import {
  getBrowserNotificationPermission,
  showBrowserNotification,
} from "@/lib/utils/browserNotifications";
import { cn } from "@/lib/utils/cn";

const SHOWN_BROWSER_NOTIFICATIONS_KEY = "bookmarked:shown-browser-notifications";
const MAX_STORED_BROWSER_NOTIFICATION_IDS = 200;

let sharedNotificationChannel: RealtimeChannel | null = null;
let sharedNotificationUserId: string | null = null;

function loadShownBrowserNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();

  try {
    const raw = window.sessionStorage.getItem(SHOWN_BROWSER_NOTIFICATIONS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function rememberShownBrowserNotificationId(
  ids: Set<string>,
  notificationId: string
): void {
  ids.add(notificationId);

  while (ids.size > MAX_STORED_BROWSER_NOTIFICATION_IDS) {
    const oldest = ids.values().next().value;
    if (!oldest) break;
    ids.delete(oldest);
  }

  try {
    window.sessionStorage.setItem(
      SHOWN_BROWSER_NOTIFICATIONS_KEY,
      JSON.stringify([...ids])
    );
  } catch {
    // Ignore quota / private-mode storage errors.
  }
}

function teardownSharedNotificationChannel(
  supabase: ReturnType<typeof createClient>
): void {
  if (!sharedNotificationChannel) return;
  void supabase.removeChannel(sharedNotificationChannel);
  sharedNotificationChannel = null;
  sharedNotificationUserId = null;
}

export function NotificationBell() {
  const user = useAuthUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = user?.id;
  const shownBrowserNotificationIdsRef = useRef(loadShownBrowserNotificationIds());

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
    const topic = `notifications:${userId}`;

    if (sharedNotificationUserId && sharedNotificationUserId !== userId) {
      teardownSharedNotificationChannel(supabase);
    }

    if (!sharedNotificationChannel || sharedNotificationUserId !== userId) {
      for (const existing of supabase.getChannels()) {
        if (existing.topic === `realtime:${topic}`) {
          void supabase.removeChannel(existing);
        }
      }

      sharedNotificationChannel = supabase
        .channel(topic)
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

            rememberShownBrowserNotificationId(
              shownBrowserNotificationIdsRef.current,
              notificationId
            );

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

      sharedNotificationUserId = userId;
    }

    return () => {
      cancelled = true;
      if (sharedNotificationUserId === userId) {
        teardownSharedNotificationChannel(supabase);
      }
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
