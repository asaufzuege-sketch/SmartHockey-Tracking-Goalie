const CACHE_VERSION = 'v3.4.0';
const CACHE_NAME = 'smarthockey-goalie-' + CACHE_VERSION;

const urlsToCache = [
  './',
  './index.html?v=' + CACHE_VERSION,
  './privacy.html',
  './terms.html',
  './style.css?v=' + CACHE_VERSION,
  './season_table_styles.css?v=' + CACHE_VERSION,
  './season_map_momentum.css?v=' + CACHE_VERSION,
  './js/app.js?v=' + CACHE_VERSION,
  './js/core/config.js?v=' + CACHE_VERSION,
  './js/core/helpers.js?v=' + CACHE_VERSION,
  './js/utils/indexeddb-backup.js?v=' + CACHE_VERSION,
  './js/utils/storage.js?v=' + CACHE_VERSION,
  './js/utils/marker-handler.js?v=' + CACHE_VERSION,
  './js/modules/timer.js?v=' + CACHE_VERSION,
  './js/modules/csv-handler.js?v=' + CACHE_VERSION,
  './js/modules/goalie-selection.js?v=' + CACHE_VERSION,
  './js/modules/stats-table.js?v=' + CACHE_VERSION,
  './js/modules/season-table.js?v=' + CACHE_VERSION,
  './js/modules/goal-map.js?v=' + CACHE_VERSION,
  './js/modules/season-map.js?v=' + CACHE_VERSION,
  './js/modules/goal-value.js?v=' + CACHE_VERSION,
  './js/modules/page-info.js?v=' + CACHE_VERSION,
  './js/modules/theme-toggle.js?v=' + CACHE_VERSION,
  './js/modules/billing.js?v=' + CACHE_VERSION,
  './season_table_ui_patch.js?v=' + CACHE_VERSION,
  './season_map_momentum.js?v=' + CACHE_VERSION,
  './enhancements-wakelock.js?v=' + CACHE_VERSION,
  './Spielfeld Overlay.png',
  './Tor Rot.png',
  './manifest.json',
  './icons/icon-48.png',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  const isDynamicAsset = event.request.destination === 'document' ||
    requestUrl.pathname.endsWith('.js') ||
    requestUrl.pathname.endsWith('.css');

  if (isDynamicAsset) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
