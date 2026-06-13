export function registerServiceWorker(saveStatus) {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;

  const start = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      registration.update?.();

      sendCacheUrls(registration);
      window.setTimeout(() => sendCacheUrls(registration), 4000);
    } catch {
      if (saveStatus) saveStatus.textContent = "Offline cache pending";
    }
  };

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start, { once: true });
  }
}

function sendCacheUrls(registration) {
  registration.active?.postMessage({ type: "CACHE_URLS", urls: collectLocalUrls() });
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
