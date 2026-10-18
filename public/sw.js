// SHELL-011: shell precache, network-first pages with an offline fallback.
// Ordering, kitchen, admin and API requests are never served from cache.
const VERSION = 'jt-v1'
const PRECACHE = ['/offline', '/manifest.webmanifest', '/icons/icon-192.png']
const CACHEABLE = ['/', '/menu', '/specials', '/events', '/on-tap', '/visit', '/burger-challenge', '/private-events', '/accessibility']
const NEVER = ['/order', '/kitchen', '/admin', '/api']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(VERSION).then((c) => c.put(req, copy))
            }
            return res
          }),
      ),
    )
    return
  }

  if (req.mode !== 'navigate') return
  const never = NEVER.some((p) => url.pathname === p || url.pathname.startsWith(p + '/'))
  const cacheable = !never && CACHEABLE.includes(url.pathname)
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (cacheable && res.ok) {
          const copy = res.clone()
          caches.open(VERSION).then((c) => c.put(url.pathname, copy))
        }
        return res
      })
      .catch(async () => {
        if (cacheable) {
          const hit = await caches.match(url.pathname)
          if (hit) return hit
        }
        return (await caches.match('/offline')) || new Response("You're offline.", { status: 503, headers: { 'Content-Type': 'text/plain' } })
      }),
  )
})
