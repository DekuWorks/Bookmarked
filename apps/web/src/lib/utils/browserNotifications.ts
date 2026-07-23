/**
 * Local browser notifications via the Notification API.
 *
 * Limitations: alerts only fire while this site has an open tab (or is in the
 * background). Full push when the browser is closed requires a service worker
 * and Web Push (VAPID) subscription — not implemented here.
 */

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isBrowserNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isBrowserNotificationSupported()) return "unsupported";
  return Notification.requestPermission();
}

export function showBrowserNotification(
  title: string,
  options?: { body?: string; tag?: string; url?: string }
): void {
  if (!isBrowserNotificationSupported() || Notification.permission !== "granted") {
    return;
  }

  const notification = new Notification(title, {
    body: options?.body,
    tag: options?.tag,
    icon: "/favicon.ico",
  });

  if (options?.url) {
    notification.onclick = () => {
      window.focus();
      window.location.href = options.url!;
      notification.close();
    };
  }
}
