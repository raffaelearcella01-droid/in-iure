/* In Iure — Service Worker (offline cache) */
var CACHE = "iniure-v17";
var ASSETS = [
  "./",
  "./index.html",
  "./privacy.html",
  "./cookie.html",
  "./note-legali.html",
  "./css/styles.css",
  "./css/auth.css",
  "./css/legal.css",
  "./js/app.js",
  "./js/firebase-config.js",
  "./js/auth.js",
  "./js/update-config.js",
  "./js/versioni.js",
  "./js/codici-index.js",
  "./js/codici-versioni.json",
  "./js/data-quiz.js",
  "./js/data-quiz-extra.js",
  "./js/data-atti.js",
  "./js/data-atti-extra.js",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/logo.svg",
  "./icons/bg-codici.svg",
  "./icons/bg-quiz.svg",
  "./icons/bg-scrittura.svg"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(ASSETS.map(function (a) {
        return c.add(a).catch(function () { /* ignora asset mancanti */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  var sameOrigin = url.origin === self.location.origin;
  // Script statici di Firebase (gstatic): li mettiamo in cache per l'uso offline.
  var isFirebaseSdk = url.hostname === "www.gstatic.com" && url.pathname.indexOf("/firebasejs/") === 0;

  // Le chiamate ai server Firebase/Google (login, database, Stripe) NON vanno
  // intercettate: devono sempre passare dirette e in tempo reale.
  if (!sameOrigin && !isFirebaseSdk) return;

  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy).catch(function () { }); });
        return res;
      }).catch(function () { return sameOrigin ? caches.match("./index.html") : undefined; });
    })
  );
});
