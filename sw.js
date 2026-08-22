/* Offline shell for relative-path hosting (including GitHub project pages). */
'use strict';

const CACHE_PREFIX = 'dttd-shell-';
const CACHE_VERSION = 'v6';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icons/icon.svg',
  './assets/css/main.css',
  './assets/css/learning-games.css',
  './assets/js/storage.js',
  './assets/js/core.js',
  './assets/js/question-bank.js',
  './assets/js/arena.js',
  './assets/js/data/typing-content.js',
  './assets/data/english-vocabulary.json',
  './assets/js/games/typing.js',
  './assets/js/games/sudoku.js',
  './assets/js/bootstrap.js',
];

function scopedUrl(relativePath) {
  return new URL(relativePath, self.registration.scope).href;
}

async function warmShellCache() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(CORE_ASSETS.map(async (asset) => {
    const url = scopedUrl(asset);
    try {
      const response = await fetch(new Request(url, { cache: 'reload' }));
      if (response && response.ok) await cache.put(url, response);
    } catch (error) {
      // One optional/missing asset must not prevent the rest of the app installing.
    }
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(warmShellCache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function navigationResponse(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request, { ignoreSearch: true }))
      || (await cache.match(scopedUrl('./index.html')))
      || new Response('Đấu Trường Tư Duy đang ngoại tuyến. Hãy mở lại sau khi có mạng.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
  }
}

async function cachedAssetResponse(request, event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  const update = fetch(request).then(async (response) => {
    if (response && response.ok && response.type !== 'opaque') {
      await cache.put(request, response.clone());
    }
    return response;
  });

  if (cached) {
    event.waitUntil(update.catch(() => undefined));
    return cached;
  }
  try {
    return await update;
  } catch (error) {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const requestUrl = new URL(request.url);
  const scopeUrl = new URL(self.registration.scope);
  if (requestUrl.origin !== scopeUrl.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(request));
    return;
  }
  event.respondWith(cachedAssetResponse(request, event));
});
