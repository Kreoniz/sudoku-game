export function registerServiceWorker(saveStatus) {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const urls = ["/", "/manifest.webmanifest", "/icons/icon.svg"];
      document.querySelectorAll('script[src], link[rel="stylesheet"][href]').forEach((node) => {
        const src = node.getAttribute("src") || node.getAttribute("href");
        if (src) urls.push(new URL(src, location.origin).pathname);
      });
      performance.getEntriesByType("resource").forEach((entry) => {
        const url = new URL(entry.name, location.origin);
        if (url.origin === location.origin) urls.push(url.pathname);
      });

      registration.active?.postMessage({ type: "CACHE_URLS", urls: [...new Set(urls)] });
    } catch {
      if (saveStatus) saveStatus.textContent = "Offline cache pending";
    }
  });
}
