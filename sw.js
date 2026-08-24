/* Offline shell for relative-path hosting (including GitHub project pages). */
'use strict';

const CACHE_PREFIX = 'dttd-shell-';
const CACHE_VERSION = 'v13';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
/* Vỏ ứng dụng: nhỏ, cần có NGAY để mở được game. Nạp xong mới coi là cài đặt xong. */
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
  './assets/js/games/typing.js',
  './assets/js/games/sudoku.js',
  './assets/js/games/duel.js',
  './assets/js/games/nim.js',
  './assets/js/bootstrap.js',
];

/* Tài sản NẶNG, chỉ Gõ Chữ mới cần. Kho từ 4,6 MB trước đây nằm chung
   CORE_ASSETS nên `install` tải nó bằng `cache:'reload'` NGAY lượt ghé đầu —
   tranh băng thông với chính trang đang mở, làm chậm lần hiện hình đầu tiên
   của mọi người chơi, kể cả người không bao giờ mở Gõ Chữ.
   Nay tách ra: cài đặt xong trước, kho từ ngấm ngầm tải sau khi trang đã chạy.
   Kết quả offline y hệt, chỉ khác THỜI ĐIỂM. */
const DEFERRED_ASSETS = [
  './assets/data/english-vocabulary.json',
  './assets/images/donate-qr.jpg',
];

function scopedUrl(relativePath) {
  return new URL(relativePath, self.registration.scope).href;
}

async function cacheAll(assets, requestCache) {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(assets.map(async (asset) => {
    const url = scopedUrl(asset);
    try {
      const response = await fetch(new Request(url, { cache: requestCache }));
      if (response && response.ok) await cache.put(url, response);
    } catch (error) {
      // One optional/missing asset must not prevent the rest of the app installing.
    }
  }));
}

async function warmShellCache() {
  await cacheAll(CORE_ASSETS, 'reload');
}

/* Chạy SAU khi service worker đã kích hoạt và trang đã cầm quyền điều khiển.
   Không await trong `activate` — await ở đó thì lại chặn đúng như cũ.
   Dùng 'default' chứ không 'reload': nếu trình duyệt đã có sẵn bản hợp lệ
   trong HTTP cache thì dùng luôn, khỏi tải lại 4,6 MB lần nữa. */
async function warmDeferredCache() {
  const cache = await caches.open(CACHE_NAME);
  const pending = [];
  for (const asset of DEFERRED_ASSETS) {
    const url = scopedUrl(asset);
    if (await cache.match(url, { ignoreSearch: true })) continue;
    pending.push(asset);
  }
  if (pending.length) await cacheAll(pending, 'default');
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
    /* Cố ý KHÔNG await: kích hoạt phải xong ngay, kho từ tự ngấm phía sau. */
    warmDeferredCache().catch(() => undefined);
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
