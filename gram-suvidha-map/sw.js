/* Gram Suvidha Map service worker — works with no network once visited.
   • App files: cached on install. Pages network-first (4 s timeout), other app files cache-first.
   • Map tiles: every tile seen online is kept, up to TILE_MAX, oldest dropped first.
   • OSM answers (Nominatim, Overpass): network-first, last API_MAX kept, so villages opened before still load offline.
   • Village boundaries are not cached here: they live in IndexedDB, imported from the viewer's own file.
   Bump VERSION whenever any cached file changes, and keep it equal to APP.version in assets/js/app.js and package.json. */
const VERSION = 'gram-suvidha-1.2.1';
const TILE_CACHE = 'gram-suvidha-tiles';
const API_CACHE = 'gram-suvidha-osm';
const TILE_MAX = 3000, API_MAX = 60;
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './assets/css/app.css', './assets/js/app.js', './assets/js/theme.js',
  './assets/js/charts.js', './assets/js/villages.js', './assets/js/village-worker.js', './vendor/fflate/fflate.js',
  './assets/icons/icon.svg', './assets/icons/icon-192.png', './assets/icons/icon-512.png',
  './assets/fonts/familjen-grotesk-latin-600-normal.woff2', './assets/fonts/familjen-grotesk-latin-700-normal.woff2',
  './assets/fonts/atkinson-hyperlegible-latin-400-normal.woff2', './assets/fonts/atkinson-hyperlegible-latin-700-normal.woff2',
  './assets/fonts/jetbrains-mono-latin-400-normal.woff2', './assets/fonts/jetbrains-mono-latin-500-normal.woff2',
  './vendor/leaflet/leaflet.js', './vendor/leaflet/leaflet.css',
  './vendor/leaflet/images/layers.png', './vendor/leaflet/images/layers-2x.png'
];
const TILE_HOSTS = /(^|\.)tile\.openstreetmap\.org$|^server\.arcgisonline\.com$/;
const API_HOSTS = /^nominatim\.openstreetmap\.org$|^overpass-api\.de$|^overpass\.kumi\.systems$|^maps\.mail\.ru$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  const keep = [VERSION, TILE_CACHE, API_CACHE];
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('gram-suvidha') && !keep.includes(k)).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await withTimeout(fetch(req), 4000);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('./index.html')) || Response.error();
  }
}
async function cacheFirst(req) {
  const hit = await caches.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) { const c = await caches.open(VERSION); c.put(req, res.clone()); }
  return res;
}
const trimming = {};
async function trim(name, max) {
  if (trimming[name]) return; trimming[name] = true;
  try { const c = await caches.open(name), keys = await c.keys(); for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]); }
  finally { trimming[name] = false; }
}
async function tile(req) {
  const c = await caches.open(TILE_CACHE), hit = await c.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()).then(() => trim(TILE_CACHE, TILE_MAX));
    return res;
  } catch (e) { return Response.error(); }
}
async function osmApi(req) {
  const c = await caches.open(API_CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) { await c.delete(req); c.put(req, res.clone()).then(() => trim(API_CACHE, API_MAX)); }
    return res;
  } catch (e) {
    return (await c.match(req)) || Response.error();
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (TILE_HOSTS.test(url.hostname)) { e.respondWith(tile(req)); return; }
  if (API_HOSTS.test(url.hostname)) { e.respondWith(osmApi(req)); return; }
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate' || req.destination === 'document') e.respondWith(networkFirst(req));
  else e.respondWith(cacheFirst(req));
});
