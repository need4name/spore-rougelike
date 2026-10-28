// Primordia's offline helper. It keeps a copy of the game on the phone so it opens without internet,
// and fetches the newest page first whenever there is a connection, so updates arrive on their own.
// tools/stamp.py updates VERSION with every release; a new VERSION makes the browser install this again.
const VERSION = '21.4';
const CACHE = `primordia-${VERSION}`;
const FONTS = 'primordia-fonts';
const FILES = ['parts', 'world', 'events'].map((f) => `js/data/${f}.js?v=${VERSION}`)
  .concat(['game', 'render', 'ui'].map((f) => `js/${f}.js?v=${VERSION}`))
  .concat([`css/style.css?v=${VERSION}`, './', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png']);

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// Old releases are thrown away once this one is in charge. Saves live elsewhere and are never touched.
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('primordia-') && k !== CACHE && k !== FONTS).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // The page itself: newest from the internet if it answers within a few seconds, otherwise the saved copy.
  if (req.mode === 'navigate') {
    e.respondWith(new Promise((resolve) => {
      let done = false;
      const fallback = () => caches.match('index.html', { ignoreSearch: true }).then((r) => r || caches.match('./'));
      const timer = setTimeout(() => { if (!done) { done = true; fallback().then(resolve); } }, 4000);
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('index.html', copy)); }
        if (!done) { done = true; clearTimeout(timer); resolve(res); }
      }).catch(() => { if (!done) { done = true; clearTimeout(timer); fallback().then(resolve); } });
    }));
    return;
  }
  // Fonts: use the saved copy at once and refresh it in the background.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then((c) => c.match(req).then((hit) => {
      const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  // The game's own files carry their release in the address, so a saved copy is always the right one.
  if (url.origin === self.location.origin) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })));
  }
});
