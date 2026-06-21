const CACHE_NAME = 'costshare-v2';
const SHELL_FILES = [
  '/',
  '/site.webmanifest',
  '/favicon.png',
  '/app_icon.png',
  '/icon-192.png',
  '/icon-512.png',
];

function getAssetUrlsFromHtml(html) {
  const assetUrls = new Set();
  const attrPattern = /\b(?:src|href)=["']([^"']+)["']/g;
  let match;

  while ((match = attrPattern.exec(html)) !== null) {
    const url = new URL(match[1], self.location.origin);

    if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
      assetUrls.add(url.pathname);
    }
  }

  return [...assetUrls];
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const indexResponse = await fetch('/index.html', { cache: 'no-cache' });
      const indexCopy = indexResponse.clone();
      const html = await indexResponse.text();
      const assetUrls = getAssetUrlsFromHtml(html);

      await cache.put('/index.html', indexCopy);
      await cache.addAll([...SHELL_FILES, ...assetUrls]);
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin || request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          return response;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }

        return response;
      });
    }),
  );
});
