"use client";

import { Suspense, useEffect, useState } from "react";
import { EmptyNotificationsState, NotificationItem } from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/services/notifications";
import { layout } from "@/lib/constants/layout";
import type { NotificationWithActor } from "@/types";

function NotificationsPageContent() {
  const user = useAuthUser();
  const [notifications, setNotifications] = useState<NotificationWithActor[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!user) return;

    setLoadError(null);
    void getNotifications(user.id)
      .then(setNotifications)
      .catch((error) => {
        console.error("[notifications] load failed:", error);
        setLoadError("Could not load notifications. Please refresh and try again.");
      });
  }, [user]);

  async function handleRead(id: string, _linkUrl: string | null) {
    await markNotificationRead(id);
    setNotifications((current) =>
      (current ?? []).map((item) =>
        item.id === id ? { ...item, read_at: new Date().toISOString() } : item
      )
    );
  }

  async function handleMarkAllRead() {
    if (!user) return;
    setMarkingAll(true);
    await markAllNotificationsRead(user.id);
    setNotifications((current) =>
      (current ?? []).map((item) => ({
        ...item,
        read_at: item.read_at ?? new Date().toISOString(),
      }))
    );
    setMarkingAll(false);
  }

  if (user === undefined || (user && notifications === null && !loadError)) {
    return <LoadingState message="Loading notifications…" />;
  }

  if (loadError) {
    return (
      <div className={`${layout.pageStackWide} text-center`}>
        <p className="text-rust">{loadError}</p>
      </div>
    );
  }

  if (!user || !notifications) return null;

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className={layout.pageStackWide}>
      <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h1 className="text-3xl font-bold text-puce-red sm:text-4xl">Notifications</h1>
          <p className="mt-1 text-text-muted">
            Messages, followers, and activity from readers you follow.
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={markingAll}
            onClick={() => void handleMarkAllRead()}
          >
            Mark all read
          </Button>
        ) : null}
      </header>

      {notifications.length === 0 ? (
        <EmptyNotificationsState />
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <NotificationItem notification={notification} onRead={handleRead} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading notifications…" />}>
      <NotificationsPageContent />
    </Suspense>
  );
}
