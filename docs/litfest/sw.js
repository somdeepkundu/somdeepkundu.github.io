/* LitFest Companion service worker.
   - Keeps the app, fonts and map on the phone, so it opens even when the NCPA Wi-Fi or mobile data is patchy.
   - Programme and map data are fetched network-first, so a fix published on the day reaches people quickly.
   - Opens the right session when someone taps a reminder notification.
   Bump VERSION whenever you publish a change. */
var VERSION = "litfest-1.0.2";
var SHELL = [
  "./", "./index.html", "./manifest.webmanifest",
  "./assets/css/app.css", "./assets/js/app.js",
  "./data/programme.js", "./data/campus.js",
  "./assets/icons/icon.svg", "./assets/icons/icon-192.png", "./assets/icons/icon-512.png",
  "./assets/fonts/poppins-latin-400-normal.woff2", "./assets/fonts/poppins-latin-500-normal.woff2",
  "./assets/fonts/poppins-latin-600-normal.woff2", "./assets/fonts/poppins-latin-700-normal.woff2",
  "./assets/fonts/literata-latin-400-italic.woff2", "./assets/fonts/literata-latin-500-italic.woff2",
  "./assets/fonts/literata-latin-600-normal.woff2"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("litfest-") === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  var isData = /\/data\/[^/]+\.js$/.test(new URL(req.url).pathname) || req.mode === "navigate";
  if (isData) {
    e.respondWith(fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return caches.match(req).then(function (hit) { return hit || caches.match("./index.html"); }); }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    });
  }));
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var id = e.notification.data && e.notification.data.id;
  var url = new URL("./index.html" + (id ? "#" + id : ""), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(self.registration.scope) === 0 && "focus" in list[i]) {
        list[i].postMessage({ type: "open-session", id: id });
        return list[i].focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
