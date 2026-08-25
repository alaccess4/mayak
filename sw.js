const CACHE = 'mayak-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for the page, cache-first for everything else. Works offline.
self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(request, copy));
        return r;
      }).catch(() => caches.match(request).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(r => {
      if (r.ok && new URL(request.url).origin === location.origin) {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(request, copy));
      }
      return r;
    }).catch(() => cached))
  );
});
