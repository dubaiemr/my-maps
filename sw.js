/* Service worker — خريطة المنشآت. Bump CACHE whenever this file changes. */
const CACHE = 'map-v1';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.searchParams.has('v')) return;              // update checks always go straight to the network
  if (url.origin !== self.location.origin) return;     // Esri maps / libraries: leave to the browser
  if (req.mode === 'navigate') {                        // the page itself: network first, cached copy offline
    e.respondWith((async () => {
      try {
        const res = await fetch(req, {cache: 'no-store'});
        if (res && res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
        return res;
      } catch (err) {
        const c = await caches.open(CACHE);
        return (await c.match(req)) || (await c.match('./index.html')) || (await c.match('./')) || Response.error();
      }
    })());
    return;
  }
  e.respondWith((async () => {                          // icons, manifest…: cache first
    const c = await caches.open(CACHE), hit = await c.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res && res.ok) c.put(req, res.clone());
    return res;
  })());
});
