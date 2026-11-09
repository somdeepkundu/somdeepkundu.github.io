/* Farm income, 2013 service worker: the page works offline once visited.
   • App shell (HTML, CSS, JS, map, English strings, fonts): cached on install, then cache-first.
   • Figures (data/*.json) and translations: network-first with a 4 s timeout, so a corrected
     release reaches readers as soon as they are online, and the last copy is used offline.
   Bump VERSION whenever any cached file changes; keep it equal to APP.version in assets/js/app.js
   and package.json. */
const VERSION = "farm-income-1.0.0";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest",
  "./assets/css/app.css", "./assets/js/app.js", "./assets/js/i18n.js", "./assets/js/dom.js",
  "./assets/js/map.js", "./assets/js/rank.js", "./assets/js/theme.js",
  "./assets/map/india-states.json", "./assets/i18n/languages.json", "./assets/i18n/en.json",
  "./assets/fonts/anek-latin.woff2", "./assets/fonts/anek-rupee.woff2",
  "./assets/icons/icon.svg", "./assets/icons/icon-192.png", "./data/farm_income_by_state.json",
];
const OPTIONAL = ["./assets/i18n/hi.json", "./assets/i18n/bn.json",
  "./assets/fonts/anek-devanagari.woff2", "./assets/fonts/anek-bangla.woff2"];
const FRESH = /\/data\/|\/assets\/i18n\//;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(SHELL);
    await Promise.all(OPTIONAL.map(u => c.add(u).catch(() => null)));   // a missing translation must not block install
  }).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("farm-income-") && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function networkFirst(req) {
  const net = fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  });
  const timeout = new Promise(resolve => setTimeout(resolve, 4000));
  return Promise.race([net, timeout.then(() => caches.match(req, { ignoreSearch: true }))])
    .then(res => res || net)
    .catch(() => caches.match(req, { ignoreSearch: true }));
}

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.mode === "navigate" || FRESH.test(url.pathname)) { e.respondWith(networkFirst(req)); return; }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
