const CACHE_NAME = 'english-app-daughter-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => {
    return cache.addAll([
      './',
      './index.html',
      './manifest.json'
    ]).catch(() => {}); // Ignore errors if files don't exist yet
  }));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((names) => {
    return Promise.all(names.map((name) => {
      if (!name.includes('daughter')) return Promise.resolve();
      if (name !== CACHE_NAME) {
        return caches.delete(name);
      }
    }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network-first for index.html (always get fresh)
  if (e.request.url.endsWith('index.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then((resp) => {
        if (resp.ok) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resp.clone());
          });
        }
        return resp;
      }).catch(() => {
        return caches.match(e.request);
      })
    );
    return;
  }

  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resp.clone());
          });
        }
        return resp;
      }).catch(() => {
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
