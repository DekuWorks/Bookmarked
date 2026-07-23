"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  updateNotificationPreferences,
} from "@/lib/services/notifications";
import {
  getBrowserNotificationPermission,
  isBrowserNotificationSupported,
  requestBrowserNotificationPermission,
  sendTestBrowserNotification,
  setBrowserNotificationPreferenceEnabled,
} from "@/lib/utils/browserNotifications";
import { useToast } from "@/components/ui/Toast";
import type { Profile } from "@/types";
import { cn } from "@/lib/utils/cn";

type NotificationValues = {
  notify_messages: boolean;
  notify_follows: boolean;
  notify_feed: boolean;
  notify_likes: boolean;
  notify_comments: boolean;
  notify_mentions: boolean;
  notify_browser: boolean;
};

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

function permissionLabel(permission: NotificationPermission | "unsupported"): string {
  switch (permission) {
    case "unsupported":
      return "Not supported";
    case "granted":
      return "Allowed";
    case "denied":
      return "Blocked";
    default:
      return "Not requested";
  }
}

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

  useEffect(() => {
    if (!isBrowserNotificationSupported()) return;

    function syncPermission() {
      setBrowserPermission(getBrowserNotificationPermission());
    }

    document.addEventListener("visibilitychange", syncPermission);
    window.addEventListener("focus", syncPermission);
    return () => {
      document.removeEventListener("visibilitychange", syncPermission);
      window.removeEventListener("focus", syncPermission);
    };
  }, []);

  async function savePrefs(next: NotificationValues, previous: NotificationValues) {
    setSaving(true);
    const result = await updateNotificationPreferences(profile.id, next);
    setSaving(false);

    if (result.error) {
      setValues(previous);
      toast.error(result.error);
      return;
    }

    setBrowserNotificationPreferenceEnabled(next.notify_browser);
    toast.success("Saved");
  }

  function togglePref(key: PrefKey) {
    const previous = values;
    const next = { ...values, [key]: !values[key] };
    setValues(next);
    void savePrefs(next, previous);
  }

  async function requestPermissionAndEnable(): Promise<boolean> {
    if (!isBrowserNotificationSupported()) {
      toast.error("Browser notifications are not supported on this device.");
      return false;
    }

    const permission = await requestBrowserNotificationPermission();
    setBrowserPermission(permission);

    if (permission === "denied") {
      toast.error("Browser notifications are blocked. Enable them in your browser settings.");
      return false;
    }

    if (permission !== "granted") {
      toast.error("Browser notification permission was not granted.");
      return false;
    }

    return true;
  }

  async function enableBrowserNotifications() {
    const granted = await requestPermissionAndEnable();
    if (!granted) return;

    const previous = values;
    const next = { ...values, notify_browser: true };
    setValues(next);
    await savePrefs(next, previous);
    toast.success("Browser notifications enabled.");
  }

  async function sendTestNotification() {
    if (!values.notify_browser) {
      toast.error("Turn on browser notifications first.");
      return;
    }

    if (browserPermission !== "granted") {
      const granted = await requestPermissionAndEnable();
      if (!granted) return;
    }

    const shown = await sendTestBrowserNotification();
    if (shown) {
      toast.success("Test notification sent.");
      return;
    }

    toast.error("Could not show a test notification. Check browser and system settings.");
  }

  async function toggleBrowserNotifications() {
    if (values.notify_browser) {
      const previous = values;
      const next = { ...values, notify_browser: false };
      setValues(next);
      await savePrefs(next, previous);
      return;
    }

    if (browserPermission === "denied") {
      toast.error("Notifications are blocked in your browser settings.");
      return;
    }

    if (browserPermission !== "granted") {
      const granted = await requestPermissionAndEnable();
      if (!granted) return;
    }

    const previous = values;
    const next = { ...values, notify_browser: true };
    setValues(next);
    await savePrefs(next, previous);
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
                  "absolute top-0.5 h-6 w-6 rounded-full bg-surface shadow transition",
                  values[key] ? "left-5" : "left-0.5"
                )}
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-lg border border-border bg-background p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium text-text">Browser notifications</p>
            <p className="mt-1 text-sm text-text-muted">
              Get native alerts on this device while Bookmarked is open. Works in a
              background tab; closing the browser requires full push (not yet available).
              macOS Focus / Do Not Disturb can silence alerts. iOS Safari does not
              support page notifications unless installed as a PWA with push.
            </p>
            <p className="mt-2 text-xs text-text-muted">
              Permission: {permissionLabel(browserPermission)}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={values.notify_browser}
            aria-label="Browser notifications"
            disabled={
              saving ||
              browserPermission === "unsupported" ||
              browserPermission === "denied"
            }
            onClick={() => void toggleBrowserNotifications()}
            className={cn(
              "relative mt-1 h-7 w-12 shrink-0 rounded-full transition",
              values.notify_browser && browserPermission === "granted"
                ? "bg-puce-red"
                : "bg-border"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-6 w-6 rounded-full bg-surface shadow transition",
                values.notify_browser && browserPermission === "granted"
                  ? "left-5"
                  : "left-0.5"
              )}
            />
          </button>
        </div>

        {browserPermission === "default" ? (
          <div className="mt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={saving}
              onClick={() => void enableBrowserNotifications()}
            >
              Enable
            </Button>
            <p className="mt-2 text-xs text-text-muted">
              Your browser will ask for permission when you tap Enable or turn the toggle on.
            </p>
          </div>
        ) : null}

        {browserPermission === "denied" ? (
          <p className="mt-3 text-xs text-rust">
            Notifications are blocked in your browser settings. Open site settings for
            bookmarked.online and allow notifications, then refresh this page.
          </p>
        ) : null}

        {browserPermission === "granted" && values.notify_browser ? (
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => void sendTestNotification()}
            >
              Send test notification
            </Button>
          </div>
        ) : null}
      </div>
    </Wrapper>
  );
}
