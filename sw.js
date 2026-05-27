const CACHE_NAME = 'tabuada-master-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install Event - caching the app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell...');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - cleaning up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache...', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - offline-first strategies
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Return cached file if found, otherwise perform regular web request
      return cachedResponse || fetch(e.request).then((fetchResponse) => {
        // Optional: dynamic caching of fonts or external requests if needed
        return fetchResponse;
      });
    }).catch(() => {
      // Fallback offline experience if both fail (e.g., resource not in cache & offline)
      if (e.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
