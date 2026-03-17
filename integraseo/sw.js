const CACHE_NAME = 'integraseo-cache-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/calendario.html',
  '/recordatorios.html',
  '/brigadas.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE.map(path => new Request(path, {cache: 'reload'})));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip caching for chrome-extension and other unsupported schemes
  if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Put a copy in cache for future
        return caches.open(CACHE_NAME).then((cache) => {
          // Avoid caching opaque responses (cross-origin) blindly
          try {
            if (response && response.status === 200 && response.type === 'basic') {
              cache.put(event.request, response.clone());
            }
          } catch (e) {
            // ignore
          }
          return response.clone();
        }).catch(() => response.clone());
      }).catch(() => {
        // Network fails: try to return an offline fallback page for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});