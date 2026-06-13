# Sudoku

Vanilla JS Sudoku PWA built with Vite.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy on Vercel

Import this folder as a Vercel project. Vercel uses `npm run build` and serves `dist`.

Offline play works after the production app has loaded once in the browser.

Self-hosted fonts are lazy loaded when selected in Settings. After a selected font loads once online, the service worker caches it for offline use.
