"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  updateNotificationPreferences,
} from "@/lib/services/notifications";
import {
  getBrowserNotificationPermission,
  isBrowserNotificationSupported,
  requestBrowserNotificationPermission,
} from "@/lib/utils/browserNotifications";
import { useToast } from "@/components/ui/Toast";
import type { Profile } from "@/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  profile: Profile;
  embedded?: boolean;
};

type PrefKey =
  | "notify_messages"
  | "notify_follows"
  | "notify_feed"
  | "notify_likes"
  | "notify_comments"
  | "notify_mentions";

const PREF_OPTIONS: { key: PrefKey; label: string; description: string }[] = [
  {
    key: "notify_messages",
    label: "Messages",
    description: "When someone sends you a direct or group message.",
  },
  {
    key: "notify_follows",
    label: "New followers",
    description: "When another reader follows you.",
  },
  {
    key: "notify_feed",
    label: "Feed activity",
    description: "Reading updates from people you follow — reviews, finished books, and shelf changes.",
  },
  {
    key: "notify_likes",
    label: "Likes",
    description: "When someone likes your post, review, or comment.",
  },
  {
    key: "notify_comments",
    label: "Comments and replies",
    description: "When someone comments on your post or replies to your review or comment.",
  },
  {
    key: "notify_mentions",
    label: "@Mentions",
    description: "When someone mentions you in a post or comment.",
  },
];

export function NotificationPreferencesPanel({ profile, embedded = false }: Props) {
  const toast = useToast();
  const [values, setValues] = useState({
    notify_messages: profile.notify_messages ?? true,
    notify_follows: profile.notify_follows ?? true,
    notify_feed: profile.notify_feed ?? true,
    notify_likes: profile.notify_likes ?? true,
    notify_comments: profile.notify_comments ?? true,
    notify_mentions: profile.notify_mentions ?? true,
    notify_browser: profile.notify_browser ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [browserPermission, setBrowserPermission] = useState(
    getBrowserNotificationPermission()
  );

  async function savePrefs(next: typeof values) {
    setSaving(true);
    const result = await updateNotificationPreferences(profile.id, next);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Notification preferences saved.");
  }

  function togglePref(key: PrefKey) {
    const next = { ...values, [key]: !values[key] };
    setValues(next);
    void savePrefs(next);
  }

  async function enableBrowserNotifications() {
    if (!isBrowserNotificationSupported()) {
      toast.error("Browser notifications are not supported on this device.");
      return;
    }

    const permission = await requestBrowserNotificationPermission();
    setBrowserPermission(permission);

    if (permission !== "granted") {
      toast.error("Browser notification permission was not granted.");
      const next = { ...values, notify_browser: false };
      setValues(next);
      void savePrefs(next);
      return;
    }

    const next = { ...values, notify_browser: true };
    setValues(next);
    void savePrefs(next);
    toast.success("Browser notifications enabled.");
  }

  async function disableBrowserNotifications() {
    const next = { ...values, notify_browser: false };
    setValues(next);
    void savePrefs(next);
  }

  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper
      className={cn(
        embedded
          ? "border-b border-border pb-6 last:border-0 last:pb-0"
          : "rounded-xl border border-border bg-surface p-6 shadow-sm"
      )}
    >
      <h2 className="text-lg font-semibold text-puce-red">Notifications</h2>
      <p className="mt-1 text-sm text-text-muted">
        Choose what you want to hear about.
      </p>

      <ul className="mt-5 space-y-4">
        {PREF_OPTIONS.map(({ key, label, description }) => (
          <li
            key={key}
            className="flex items-start justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
          >
            <div>
              <p className="font-medium text-text">{label}</p>
              <p className="text-sm text-text-muted">{description}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values[key]}
              disabled={saving}
              onClick={() => togglePref(key)}
              className={cn(
                "relative mt-1 h-7 w-12 shrink-0 rounded-full transition",
                values[key] ? "bg-puce-red" : "bg-border"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
                  values[key] ? "left-5" : "left-0.5"
                )}
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-lg border border-border bg-background p-4">
        <p className="font-medium text-text">Browser notifications</p>
        <p className="mt-1 text-sm text-text-muted">
          Get alerts on this device when the site is open or in the background (where supported).
        </p>
        <p className="mt-2 text-xs text-text-muted">
          Permission:{" "}
          {browserPermission === "unsupported"
            ? "Not supported"
            : browserPermission === "granted"
              ? "Allowed"
              : browserPermission === "denied"
                ? "Blocked"
                : "Not requested"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {values.notify_browser && browserPermission === "granted" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => void disableBrowserNotifications()}
            >
              Disable browser alerts
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={saving || browserPermission === "denied"}
              onClick={() => void enableBrowserNotifications()}
            >
              Enable browser alerts
            </Button>
          )}
        </div>
        {browserPermission === "denied" ? (
          <p className="mt-2 text-xs text-rust">
            Notifications are blocked in your browser settings. Unblock them for bookmarked.online to
            receive alerts.
          </p>
        ) : null}
      </div>
    </Wrapper>
  );
}
