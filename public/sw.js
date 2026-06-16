const CACHE_NAME = 'finance-tracker-v2';
const STATIC_ASSETS = [
  '/vest.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Never cache API calls — financial data must always be fresh
  if (url.pathname.startsWith('/api/')) return;

  // Never cache auth routes
  if (url.pathname.startsWith('/login') || url.pathname.startsWith('/api/auth')) return;

  // Cache-first for static assets (images, fonts, etc.)
  if (
    url.pathname.match(/\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2|css)$/) ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return res;
      }))
    );
    return;
  }

  // Network-first for all other requests (pages, navigation)
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
