// Lapak Antre service worker: keeps the ticket page usable offline (PRD O-1, O-2)
// and shows notifications, which Android Chrome only allows from a service worker.
const CACHE = "lapak-antre-v1"

self.addEventListener("install", () => self.skipWaiting())

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// The ticket page asks us to keep a copy of itself and the assets it already loaded,
// so a full reload still works when the connection drops.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "cache-page") return
  const urls = [event.data.url, ...(event.data.assets ?? [])]
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(urls).catch(() => {})))
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Hashed build assets never change: cache first.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
            return res
          }),
      ),
    )
    return
  }

  // Ticket pages: always try the network for fresh status, fall back to the last copy.
  if (request.mode === "navigate" && url.pathname.startsWith("/tiket/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
          return res
        })
        .catch(() => caches.match(request).then((hit) => hit ?? Response.error())),
    )
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target = event.notification.data?.url ?? "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.endsWith(target))
      return open ? open.focus() : self.clients.openWindow(target)
    }),
  )
})
