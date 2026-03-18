// Service Worker para Integraseo PWA
const CACHE_NAME = 'integraseo-v1';

// Al instalar, no pre-cacheamos nada — Next.js maneja sus propios assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Limpiar caches viejos
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network first, fallback a cache
self.addEventListener('fetch', (event) => {
  // Solo interceptar requests GET
  if (event.request.method !== 'GET') return;

  // No interceptar requests a Firebase o APIs externas
  const url = new URL(event.request.url);
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardar en cache si la respuesta es válida
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
