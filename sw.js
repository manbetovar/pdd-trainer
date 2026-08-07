/* ПДД-тренажёр: офлайн-кэш. Всё зашито в два html — кэшируем целиком. */
var CACHE = "pdd-v24";
var ASSETS = [
  "./",
  "./index.html",
  "./trenazher.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./data-imgs-a.js",
  "./data-imgs-b.js",
  "./data-imgs-c.js",
  "./data-ref.js"
];
self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  /* API-запросы чата — только сеть */
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return resp;
      });
    })
  );
});
