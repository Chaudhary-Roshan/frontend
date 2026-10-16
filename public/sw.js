/* =========================================================================
   DSMS Production Service Worker - App Shell & Offline PWA Engine
   ========================================================================= */

const CACHE_VERSION = 'dsms-app-shell-v2';
const DATA_CACHE_NAME = 'dsms-data-cache-v2';

// Core App Shell assets precached on install
const APP_SHELL_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/official-seal.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon.svg'
];

// 1. INSTALL: Precache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(APP_SHELL_PRECACHE).catch((err) => {
        console.warn('[SW] Precache warning (non-fatal):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVATE: Purge stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_VERSION && key !== DATA_CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH STRATEGIES
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (e.g. POST/PUT/DELETE cannot be cached safely)
  if (request.method !== 'GET') {
    return;
  }

  // A. SPA Navigation Requests (App Shell Mode)
  // When user navigates to any URL route (e.g., /societies, /president-dashboard),
  // attempt network first; if offline, return the precached /index.html App Shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put('/index.html', clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedShell = await caches.match('/index.html');
          if (cachedShell) {
            return cachedShell;
          }
          return new Response('DSMS Offline App Shell Unavailable', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // B. Static Assets (CSS, JS bundles, Web Fonts, Images in /assets/ or /icons/)
  // Use Stale-While-Revalidate for blazing speed
  const isStaticAsset = (
    url.origin === location.origin && (
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.woff2')
    )
  ) || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(() => null);

        // Return cached immediately if found, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // C. API Requests (/api/): Network-first with Cache Fallback for read endpoints
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedData = await caches.match(request);
          if (cachedData) {
            return cachedData;
          }
          return new Response(
            JSON.stringify({
              offline: true,
              detail: 'You are currently offline. Live updates will resume when reconnected.'
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // D. Default fallback
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

// 4. Update / Skip Waiting handler from Client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
