const CACHE_NAME = "sudoku-game-v10";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/favicon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon.svg",
  "/icons/maskable.svg",
  "/fonts/lexend-latin.woff2",
  "/fonts/nunito-sans-latin.woff2",
  "/fonts/roboto-mono-latin.woff2"
];

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "CACHE_URLS") return;

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const urls = event.data.urls.filter((url) => {
        try {
          return new URL(url, self.location.origin).origin === self.location.origin;
        } catch {
          return false;
        }
      });

      return cacheUrls(cache, urls);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(async () => (await findCached(request)) || (await caches.match("/")) || caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(
    findCached(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (response && response.ok && new URL(request.url).origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => Response.error());
    })
  );
});

async function findCached(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);
  return (
    (await cache.match(request, { ignoreSearch: true })) ||
    (await cache.match(url.href, { ignoreSearch: true })) ||
    (await cache.match(url.pathname, { ignoreSearch: true }))
  );
}

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await cacheUrls(cache, CORE_ASSETS);

  try {
    const response = await fetch("/", { cache: "reload" });
    if (!response.ok) return;

    await cache.put("/", response.clone());
    await cache.put("/index.html", response.clone());

    const html = await response.text();
    await cacheUrls(cache, extractLocalAssetUrls(html));
  } catch {
    // Offline install attempt: runtime fetch handler will fill cache later.
  }
}

async function cacheUrls(cache, urls) {
  const uniqueUrls = [...new Set(urls)];
  await Promise.allSettled(uniqueUrls.map((url) => cache.add(url)));
}

function extractLocalAssetUrls(html) {
  const urls = [];
  const pattern = /\b(?:src|href)="([^"]+)"/g;
  let match;

  while ((match = pattern.exec(html))) {
    try {
      const url = new URL(match[1], self.location.origin);
      if (url.origin === self.location.origin) urls.push(url.pathname);
    } catch {
      // Ignore malformed markup URLs.
    }
  }

  return urls;
}
