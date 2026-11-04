/* global self, URL */
/* Service worker de l'app admin VITAL FORCE: notifications push uniquement (aucune mise en cache des pages). */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "VITAL FORCE", body: event.data ? event.data.text() : "" }; }
  const title = data.title || "VITAL FORCE";
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || "",
    icon: "/admin-icons/icon-192.png",
    badge: "/admin-icons/badge-96.png",
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    vibrate: [120, 60, 120],
    data: { url: data.url || "/admin" }
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/admin", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && "focus" in client) {
        await client.focus();
        if ("navigate" in client) return client.navigate(url);
        return;
      }
    }
    return self.clients.openWindow(url);
  })());
});
