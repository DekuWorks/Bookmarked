"use client";

import { AppNavLink } from "@/components/layout/AppNavLink";
import { useCallback, useEffect, useState } from "react";
import { BellIcon } from "@/components/notifications/BellIcon";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { useNotificationsRealtime } from "@/lib/hooks/useNotificationsRealtime";
import { getUnreadNotificationCount } from "@/lib/services/notifications";
import { cn } from "@/lib/utils/cn";

export function NotificationBell() {
  const user = useAuthUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = user?.id;

  const refreshCount = useCallback(() => {
    if (!userId) return;
    void getUnreadNotificationCount(userId)
      .then(setUnreadCount)
      .catch((error) => {
        console.warn("[notifications] unread count failed:", error);
      });
  }, [userId]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  useNotificationsRealtime({
    userId,
    onInsert: refreshCount,
    onUpdate: refreshCount,
    showBrowserAlerts: true,
  });

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
