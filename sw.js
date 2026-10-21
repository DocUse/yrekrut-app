// Build id is substituted by tools/build-app.mjs; a new id means a new cache and an update prompt.
var CACHE = 'yarekrut-20261021-3b3f036a';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png', './icons/hunter.png'];
var FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(SHELL); }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key.indexOf('yarekrut-') === 0 && key !== CACHE; }).map(function (key) { return caches.delete(key); }));
  }));
});

self.addEventListener('message', function (event) {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);

  if (FONT_HOSTS.indexOf(url.hostname) >= 0) {
    event.respondWith(caches.open(CACHE).then(function (cache) {
      return cache.match(request).then(function (hit) {
        var fresh = fetch(request).then(function (response) {
          if (response.ok) cache.put(request, response.clone());
          return response;
        }).catch(function () { return hit; });
        return hit || fresh;
      });
    }));
    return;
  }
  // API answers (script.google.com) are never cached: stale data is worse than an error.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request, { cache: 'no-cache' }).then(function (response) {
      if (response.ok) caches.open(CACHE).then(function (cache) { cache.put('./index.html', response.clone()); });
      return response;
    }).catch(function () {
      return caches.match('./index.html');
    }));
    return;
  }

  event.respondWith(caches.match(request).then(function (hit) {
    return hit || fetch(request);
  }));
});
