// 讓遊戲加入主畫面後可以離線開啟。
// 策略：有網路時一律拿最新版並更新快取；沒網路才用快取。這樣改版不會卡在舊檔。
// cache: 'no-cache'：每次都跟伺服器確認（沒變就回 304，很快），避免瀏覽器自己的 10 分鐘快取
// 讓新的 index.html 配到舊的 app.js（按鈕出現了卻沒有功能）。
const CACHE = 'siang-collector-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true })),
  );
});
