const CACHE_NAME = "sudoku-game-v11";
const CACHE_PREFIX = "sudoku-game-";
const CORE_ASSETS = [
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
    isCurrentShellReady()
      .then((ready) => (ready ? deleteOldCaches() : null))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "CACHE_URLS") return;

  event.waitUntil(cacheRequestedUrls(event));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  event.respondWith(handleAsset(request));
});

async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok && isSameOrigin(request.url)) {
      cacheFetchedShell(response.clone()).catch(() => {});
    }
    return response;
  } catch {
    return (
      (await findCached(request)) ||
      (await findCached("/")) ||
      (await findCached("/index.html")) ||
      offlineFallback()
    );
  }
}

async function handleAsset(request) {
  const cached = await findCached(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok && isSameOrigin(request.url)) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  } catch {
    return (await findCached(request)) || Response.error();
  }
}

async function cacheAppShell() {
  const response = await fetch("/", { cache: "reload" });
  if (!response.ok) throw new Error("Unable to fetch app shell");
  await cacheFetchedShell(response);
}

async function cacheFetchedShell(response) {
  const html = await response.clone().text();
  const urls = [...CORE_ASSETS, ...extractLocalAssetUrls(html)];
  const cache = await caches.open(CACHE_NAME);

  await cacheUrlsStrict(cache, urls);
  await cache.put("/", response.clone());
  await cache.put("/index.html", response.clone());
}

async function cacheRequestedUrls(event) {
  const urls = (event.data.urls || []).filter(isCacheableSameOriginUrl);
  const cache = await caches.open(CACHE_NAME);
  const result = await cacheUrlsReport(cache, urls);

  event.source?.postMessage({
    type: "CACHE_URLS_COMPLETE",
    id: event.data.id,
    cached: result.cached,
    failed: result.failed
  });
}

async function cacheUrlsStrict(cache, urls) {
  const result = await cacheUrlsReport(cache, urls);
  if (result.failed.length > 0) {
    throw new Error(`Unable to cache: ${result.failed.join(", ")}`);
  }
}

async function cacheUrlsReport(cache, urls) {
  const uniqueUrls = [...new Set(urls)];
  const settled = await Promise.allSettled(uniqueUrls.map((url) => cacheUrl(cache, url)));

  return settled.reduce(
    (result, item, index) => {
      if (item.status === "fulfilled") {
        result.cached.push(uniqueUrls[index]);
      } else {
        result.failed.push(uniqueUrls[index]);
      }
      return result;
    },
    { cached: [], failed: [] }
  );
}

async function cacheUrl(cache, url) {
  if (await cache.match(url, { ignoreSearch: true })) return;
  await cache.add(url);
}

async function findCached(requestOrUrl) {
  const request = typeof requestOrUrl === "string" ? new Request(requestOrUrl) : requestOrUrl;
  const url = new URL(request.url);
  const candidates = [request, url.href, url.pathname];

  const currentCache = await caches.open(CACHE_NAME);
  const currentMatch = await findInCache(currentCache, candidates);
  if (currentMatch) return currentMatch;

  const keys = (await caches.keys()).filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME);
  for (const key of keys) {
    const cache = await caches.open(key);
    const match = await findInCache(cache, candidates);
    if (match) return match;
  }

  return null;
}

async function findInCache(cache, candidates) {
  for (const candidate of candidates) {
    const match = await cache.match(candidate, { ignoreSearch: true });
    if (match) return match;
  }
  return null;
}

async function isCurrentShellReady() {
  const cache = await caches.open(CACHE_NAME);
  return Boolean((await cache.match("/")) && (await cache.match("/index.html")));
}

async function deleteOldCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)));
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

function isCacheableSameOriginUrl(url) {
  try {
    return isSameOrigin(new URL(url, self.location.origin).href);
  } catch {
    return false;
  }
}

function isSameOrigin(url) {
  return new URL(url, self.location.origin).origin === self.location.origin;
}

function offlineFallback() {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sudoku offline</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #17191c; color: #fff7e8; }
      main { width: min(28rem, calc(100% - 2rem)); text-align: center; }
      h1 { margin: 0 0 .5rem; font-size: 1.5rem; }
      p { margin: 0; color: #d9d1c4; }
    </style>
  </head>
  <body>
    <main>
      <h1>Sudoku is not cached yet</h1>
      <p>Open the game once with internet, wait for Offline ready, then it can run without internet.</p>
    </main>
  </body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      }
    }
  );
}
