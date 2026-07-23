/**
 * Local browser notifications via the Notification API + optional service worker.
 *
 * Works while Bookmarked has an open tab (foreground or background). Full push
 * when the browser is closed requires Web Push (VAPID) — not implemented here.
 *
 * Platform notes:
 * - macOS: system toasts respect Focus / Do Not Disturb; we cannot override that.
 * - iOS Safari: page notifications are not supported; only installed PWAs with
 *   push may show alerts. Document this in settings UI.
 */

import { BRAND_ASSETS } from "@/lib/constants/brandAssets";

export const BROWSER_NOTIFICATION_PREF_KEY = "bookmarked:notify-browser";
export const BROWSER_NOTIFICATION_PREF_EVENT = "bookmarked:browser-notification-pref";

export type BrowserNotificationOptions = {
  body?: string;
  tag?: string;
  url?: string;
};

let serviceWorkerRegistration: ServiceWorkerRegistration | null | undefined;

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isBrowserNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!isBrowserNotificationSupported()) return "unsupported";
  return Notification.requestPermission();
}

export function getBrowserNotificationPreferenceEnabled(): boolean | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(BROWSER_NOTIFICATION_PREF_KEY);
    if (raw === null) return null;
    return raw === "1";
  } catch {
    return null;
  }
}

export function setBrowserNotificationPreferenceEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(BROWSER_NOTIFICATION_PREF_KEY, enabled ? "1" : "0");
    window.dispatchEvent(
      new CustomEvent(BROWSER_NOTIFICATION_PREF_EVENT, { detail: enabled })
    );
  } catch {
    // Ignore quota / private-mode storage errors.
  }
}

export function getNotificationIconUrl(): string {
  if (typeof window === "undefined") {
    return BRAND_ASSETS.logoMark.src;
  }

  return new URL(BRAND_ASSETS.logoMark.src, window.location.origin).href;
}

export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  if (serviceWorkerRegistration !== undefined) {
    return serviceWorkerRegistration;
  }

  try {
    serviceWorkerRegistration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return serviceWorkerRegistration;
  } catch (error) {
    console.warn("[notifications] service worker registration failed:", error);
    serviceWorkerRegistration = null;
    return null;
  }
}

function attachPageNotificationClick(
  notification: Notification,
  url: string | undefined
): void {
  if (!url) return;

  notification.onclick = () => {
    window.focus();
    window.location.href = url;
    notification.close();
  };
}

export async function showBrowserNotification(
  title: string,
  options?: BrowserNotificationOptions
): Promise<boolean> {
  if (!isBrowserNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  const payload = {
    body: options?.body,
    tag: options?.tag,
    icon: getNotificationIconUrl(),
    data: options?.url ? { url: options.url } : undefined,
  };

  try {
    const registration = await registerNotificationServiceWorker();
    if (registration) {
      await registration.showNotification(title, payload);
      return true;
    }
  } catch (error) {
    console.warn("[notifications] service worker notification failed:", error);
  }

  try {
    const notification = new Notification(title, {
      body: payload.body,
      tag: payload.tag,
      icon: payload.icon,
    });
    attachPageNotificationClick(notification, options?.url);
    return true;
  } catch (error) {
    console.warn("[notifications] page notification failed:", error);
    return false;
  }
}

export async function sendTestBrowserNotification(): Promise<boolean> {
  return showBrowserNotification("Bookmarked", {
    body: "Browser notifications are working.",
    tag: "bookmarked:test-notification",
    url: "/notifications/",
  });
}
