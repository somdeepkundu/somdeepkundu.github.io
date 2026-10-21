/* Mumbai Durga Pujo Map: keeps the app, fonts, map library and recently seen map tiles on the phone,
   so the list and map still open when the network is patchy between pandals. */
var VERSION = "pujo-1.12.1";
var SHELL = VERSION + "-shell", RUNTIME = "pujo-runtime", TILES = "pujo-tiles", MAX_TILES = 400;
var PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./dhak.mp3"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) { return Promise.all(PRECACHE.map(function (u) { return c.add(u).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return /-shell$/.test(k) && k !== SHELL; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function trim(name, max) {
  return caches.open(name).then(function (c) {
    return c.keys().then(function (ks) { return ks.length > max ? Promise.all(ks.slice(0, ks.length - max).map(function (k) { return c.delete(k); })) : null; });
  });
}
function swr(req, name, max) {
  return caches.open(name).then(function (c) {
    return c.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === "opaque")) { c.put(req, res.clone()).then(function () { if (max) trim(name, max); }); }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  });
}
function networkFirst(req) {
  return fetch(req).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(SHELL).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || caches.match("./index.html"); });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === "navigate" || /\.(html|webmanifest|json)$/.test(url.pathname) || /\/$/.test(url.pathname)) { e.respondWith(networkFirst(req)); return; }
    e.respondWith(swr(req, RUNTIME)); return;
  }
  if (url.hostname === "tile.openstreetmap.org") { e.respondWith(swr(req, TILES, MAX_TILES)); return; }
  if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname) || url.hostname === "cdn.jsdelivr.net" || url.hostname === "cdnjs.cloudflare.com") { e.respondWith(swr(req, RUNTIME)); return; }
});
