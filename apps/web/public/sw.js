/**
 * Minimal service worker for page-context browser notifications.
 * Enables reliable system toasts while Bookmarked has an open tab.
 * Full push when the browser is closed requires Web Push (not implemented).
 */

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url;
  if (!url || typeof url !== "string") return;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client && "navigate" in client) {
          return client.navigate(url).then(() => client.focus());
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }

      return undefined;
    })
  );
});
