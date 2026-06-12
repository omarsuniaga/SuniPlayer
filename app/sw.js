// Service worker: cache-first shell so the app works fully offline.
const CACHE = 'suniplayer-v4';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './manifest.webmanifest',
  './js/app.js',
  './js/db.js',
  './js/ui.js',
  './js/player.js',
  './js/waveform.js',
  './js/importer.js',
  './js/collections.js',
  './js/audio/engine.js',
  './js/audio/analyzer.js',
  './js/vendor/signalsmith-stretch.mjs',
  './js/views/home.js',
  './js/views/library.js',
  './js/views/playerView.js',
  './js/views/edit.js',
  './js/views/show.js',
  './js/views/profile.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => cached)));
});
