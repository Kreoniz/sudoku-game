const CACHE_MESSAGE_TIMEOUT = 8000;
let cacheMessageId = 0;

export function registerServiceWorker(saveStatus) {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;

  const start = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      registration.update?.()?.catch(() => {});

      setStatus(saveStatus, "Offline setup");
      const firstResult = await sendCacheUrls(registration);
      setStatus(saveStatus, firstResult.failed.length ? "Offline pending" : "Offline ready");

      window.setTimeout(async () => {
        const secondResult = await sendCacheUrls(registration);
        setStatus(saveStatus, secondResult.failed.length ? "Offline pending" : "Offline ready");
      }, 4000);
    } catch {
      setStatus(saveStatus, "Offline pending");
    }
  };

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start, { once: true });
  }
}

function sendCacheUrls(registration) {
  const worker = registration.active || navigator.serviceWorker.controller;
  if (!worker) return Promise.resolve({ failed: ["missing-service-worker"] });

  const id = `cache-${Date.now()}-${++cacheMessageId}`;

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      resolve({ failed: ["timeout"] });
    }, CACHE_MESSAGE_TIMEOUT);

    function handleMessage(event) {
      if (event.data?.type !== "CACHE_URLS_COMPLETE" || event.data.id !== id) return;

      window.clearTimeout(timeout);
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      resolve(event.data);
    }

    navigator.serviceWorker.addEventListener("message", handleMessage);
    worker.postMessage({ type: "CACHE_URLS", id, urls: collectLocalUrls() });
  });
}

function collectLocalUrls() {
  const urls = [
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

  document.querySelectorAll('script[src], link[rel="stylesheet"][href]').forEach((node) => {
    const src = node.getAttribute("src") || node.getAttribute("href");
    if (src) urls.push(new URL(src, location.origin).pathname);
  });

  performance.getEntriesByType("resource").forEach((entry) => {
    const url = new URL(entry.name, location.origin);
    if (url.origin === location.origin) urls.push(url.pathname);
  });

  return [...new Set(urls)];
}

function setStatus(saveStatus, text) {
  if (saveStatus) saveStatus.textContent = text;
}
