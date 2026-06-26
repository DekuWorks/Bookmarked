"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAvatar } from "@/components/messages/UserAvatar";
import { formatNotificationTimestamp } from "@/lib/services/notifications";
import type { NotificationWithActor } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  notification: NotificationWithActor;
  onRead: (id: string, linkUrl: string | null) => void;
};

function notificationTypeLabel(type: NotificationWithActor["type"]): string {
  switch (type) {
    case "message":
      return "Message";
    case "follow":
      return "Follow";
    case "feed":
      return "Feed";
    default:
      return "Update";
  }
}

export function NotificationItem({ notification, onRead }: Props) {
  const isUnread = !notification.read_at;
  const router = useRouter();

  function handleClick() {
    onRead(notification.id, notification.link_url);
    if (notification.link_url) {
      router.push(notification.link_url);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full min-h-[72px] items-start gap-3 rounded-xl border px-4 py-3 text-left transition",
        isUnread
          ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
          : "border-border bg-surface hover:border-primary/30 hover:shadow-sm"
      )}
    >
      {notification.actor ? (
        <UserAvatar profile={notification.actor} size="sm" />
      ) : (
        <div className="h-9 w-9 shrink-0 rounded-full bg-border" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("font-semibold text-text", isUnread && "text-puce-red")}>
            {notification.title}
          </p>
          <span className="shrink-0 text-xs text-text-muted">
            {formatNotificationTimestamp(notification.created_at)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-text-muted">{notification.body}</p>
        <span className="mt-2 inline-block rounded-full bg-background px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
          {notificationTypeLabel(notification.type)}
        </span>
      </div>
    </button>
  );
}

export function EmptyNotificationsState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <p className="text-lg font-medium text-text">No notifications yet</p>
      <p className="mt-2 text-sm text-text-muted">
        You&apos;ll see messages, new followers, and feed activity here.
      </p>
      <Link
        href="/feed/"
        className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
      >
        Browse the feed
      </Link>
    </div>
  );
}
