/* ПДД-тренажёр: офлайн-кэш. Всё зашито в два html — кэшируем целиком. */
var CACHE = "pdd-v59";
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
/* Страницу берём из сети, всё остальное из кэша.

   Раньше html тоже отдавался кэшем вперёд сети, и после каждого деплоя первый
   заход показывал прошлую версию: новый worker успевал встать, но страница уже
   была отрисована из старого кэша. Теперь при живой сети всегда свежая версия,
   а офлайн по-прежнему работает — кэш остаётся запасным вариантом.

   Данные (шарды картинок, иконки) читаем из кэша: они большие и меняются
   только вместе с версией кэша. */
function networkFirst(request) {
  return fetch(request).then(function (resp) {
    var copy = resp.clone();
    caches.open(CACHE).then(function (c) { c.put(request, copy); });
    return resp;
  }).catch(function () {
    return caches.match(request, { ignoreSearch: true }).then(function (hit) {
      return hit || caches.match("./index.html");
    });
  });
}

function cacheFirst(request) {
  return caches.match(request, { ignoreSearch: true }).then(function (hit) {
    if (hit) return hit;
    return fetch(request).then(function (resp) {
      var copy = resp.clone();
      caches.open(CACHE).then(function (c) { c.put(request, copy); });
      return resp;
    });
  });
}

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  /* API-запросы чата — только сеть */
  if (url.origin !== location.origin) return;
  var isPage = e.request.mode === "navigate" ||
               /\.html$/.test(url.pathname) ||
               url.pathname.endsWith("/");
  e.respondWith(isPage ? networkFirst(e.request) : cacheFirst(e.request));
});
