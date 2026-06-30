"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BellIcon } from "@/components/notifications/BellIcon";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LoadingState } from "@/components/ui/LoadingState";
import {
  getNotifications,
  markNotificationRead,
} from "@/lib/services/notifications";
import type { NotificationWithActor } from "@/types";

export const PROFILE_NOTIFICATIONS_PREVIEW_LIMIT = 6;

type Props = {
  userId: string;
  className?: string;
};

export function ProfileNotificationsSection({ userId, className }: Props) {
  const [notifications, setNotifications] = useState<NotificationWithActor[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    void getNotifications(userId, PROFILE_NOTIFICATIONS_PREVIEW_LIMIT + 1)
      .then(setNotifications)
      .catch((error) => {
        console.error("[profile-notifications] load failed:", error);
        setLoadError("Could not load notifications.");
      });
  }, [userId]);

  async function handleRead(id: string, _linkUrl: string | null) {
    await markNotificationRead(id);
    setNotifications((current) =>
      (current ?? []).map((item) =>
        item.id === id ? { ...item, read_at: new Date().toISOString() } : item
      )
    );
  }

  const visibleNotifications =
    notifications?.slice(0, PROFILE_NOTIFICATIONS_PREVIEW_LIMIT) ?? null;
  const hasMoreNotifications = Boolean(
    notifications && notifications.length > PROFILE_NOTIFICATIONS_PREVIEW_LIMIT
  );
  const unreadCount = (notifications ?? []).filter((n) => !n.read_at).length;

  return (
    <section className={className}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BellIcon filled={unreadCount > 0} className="text-puce-red" />
          <h2 className="text-lg font-semibold text-puce-red">Notifications</h2>
          {unreadCount > 0 ? (
            <span className="rounded-full bg-puce-red/10 px-2 py-0.5 text-xs font-semibold text-puce-red">
              {unreadCount} unread
            </span>
          ) : null}
        </div>
        <Link
          href="/notifications/"
          className="text-sm font-medium text-primary hover:underline"
        >
          All notifications
        </Link>
      </div>

      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      ) : !notifications ? (
        <LoadingState message="Loading notifications…" />
      ) : notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center">
          <p className="text-sm text-text-muted">No notifications yet.</p>
          <Link
            href="/feed/"
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            Browse the feed
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {(visibleNotifications ?? []).map((notification) => (
              <li key={notification.id}>
                <NotificationItem notification={notification} onRead={handleRead} />
              </li>
            ))}
          </ul>
          {hasMoreNotifications ? (
            <div className="mt-4 text-center">
              <ButtonLink href="/notifications/" variant="outline" size="sm">
                View more
              </ButtonLink>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
