// Lapak Antre service worker: keeps the ticket page usable offline (PRD O-1, O-2)
// and shows notifications, which Android Chrome only allows from a service worker.
const CACHE = "lapak-antre-v1"
// Registered as /sw.js?dev=1 by `next dev`. Dev chunks keep their URL while their content
// changes, so caching them serves stale code. In dev the worker only handles push.
const DEV = new URL(self.location.href).searchParams.has("dev")

self.addEventListener("install", () => self.skipWaiting())

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => DEV || k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// Server push (PRD N-1): arrives even when the ticket page is closed.
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Lapak Antre", {
      body: data.body,
      // Same tag as the in-page notification for this ticket, so the phone shows one, not two.
      tag: data.tag,
      renotify: true,
      data: { url: data.url ?? "/" },
    }),
  )
})

// The ticket page asks us to keep a copy of itself and the assets it already loaded,
// so a full reload still works when the connection drops.
self.addEventListener("message", (event) => {
  if (DEV || event.data?.type !== "cache-page") return
  const urls = [event.data.url, ...(event.data.assets ?? [])]
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(urls).catch(() => {})))
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (DEV || request.method !== "GET") return
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
