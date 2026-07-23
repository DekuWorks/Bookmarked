"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import type { NotificationRealtimeRow } from "@/lib/hooks/useNotificationsRealtime";
import { subscribeBrowserNotificationAlerts } from "@/lib/hooks/notificationRealtimeManager";
import { getNotificationPreferences } from "@/lib/services/notifications";
import {
  BROWSER_NOTIFICATION_PREF_EVENT,
  getBrowserNotificationPermission,
  getBrowserNotificationPreferenceEnabled,
  registerNotificationServiceWorker,
  setBrowserNotificationPreferenceEnabled,
  showBrowserNotification,
} from "@/lib/utils/browserNotifications";

const SHOWN_BROWSER_NOTIFICATIONS_KEY = "bookmarked:shown-browser-notifications";
const MAX_STORED_BROWSER_NOTIFICATION_IDS = 200;

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

type Props = {
  children: React.ReactNode;
};

export function BrowserNotificationsProvider({ children }: Props) {
  const user = useAuthUser();
  const [browserAlertsEnabled, setBrowserAlertsEnabled] = useState(
    () => getBrowserNotificationPreferenceEnabled() ?? false
  );
  const shownBrowserNotificationIdsRef = useRef(loadShownBrowserNotificationIds());

  useEffect(() => {
    void registerNotificationServiceWorker();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setBrowserAlertsEnabled(false);
      return;
    }

    const cached = getBrowserNotificationPreferenceEnabled();
    if (cached !== null) {
      setBrowserAlertsEnabled(cached);
    }

    void getNotificationPreferences(user.id)
      .then((prefs) => {
        if (!prefs) return;
        const enabled = prefs.notify_browser ?? false;
        setBrowserAlertsEnabled(enabled);
        setBrowserNotificationPreferenceEnabled(enabled);
      })
      .catch((error) => {
        console.warn("[notifications] preference load failed:", error);
      });
  }, [user?.id]);

  useEffect(() => {
    function handlePreferenceChange(event: Event) {
      const detail = (event as CustomEvent<boolean>).detail;
      if (typeof detail === "boolean") {
        setBrowserAlertsEnabled(detail);
      }
    }

    window.addEventListener(BROWSER_NOTIFICATION_PREF_EVENT, handlePreferenceChange);
    return () => {
      window.removeEventListener(BROWSER_NOTIFICATION_PREF_EVENT, handlePreferenceChange);
    };
  }, []);

  const handleBrowserAlert = useCallback(
    async (row: NotificationRealtimeRow) => {
      if (!browserAlertsEnabled) return;
      if (getBrowserNotificationPermission() !== "granted") return;
      if (shownBrowserNotificationIdsRef.current.has(row.id)) return;

      const shown = await showBrowserNotification(row.title || "Bookmarked", {
        body: row.body,
        tag: row.id,
        url: row.link_url ?? "/notifications/",
      });

      if (shown) {
        rememberShownBrowserNotificationId(
          shownBrowserNotificationIdsRef.current,
          row.id
        );
      }
    },
    [browserAlertsEnabled]
  );

  const handleBrowserAlertRef = useRef(handleBrowserAlert);

  useEffect(() => {
    handleBrowserAlertRef.current = handleBrowserAlert;
  }, [handleBrowserAlert]);

  useEffect(() => {
    if (!user?.id) return;

    return subscribeBrowserNotificationAlerts(user.id, (row) => {
      void handleBrowserAlertRef.current(row);
    });
  }, [user?.id]);

  return children;
}
