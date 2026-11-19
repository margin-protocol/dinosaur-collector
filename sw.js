// 讓遊戲加入主畫面後可以離線開啟。
// 策略：有網路時一律拿最新版並更新快取；沒網路才用快取。這樣改版不會卡在舊檔。
// cache: 'no-cache'：每次都跟伺服器確認（沒變就回 304，很快），避免瀏覽器自己的 10 分鐘快取
// 讓新的 index.html 配到舊的 app.js（按鈕出現了卻沒有功能）。
// 圖片（assets/ 底下）改成「有快取就先用快取、背景再更新」：網路不穩也不會變成佔位圖（11/18）。
const CACHE = 'siang-collector-v2';
// 主畫面 icon 換圖時要換檔名（例如 siang-icon-v2-180.png）：圖片是快取優先，同檔名會一直拿到舊圖（11/19）
const isAsset = (url) => url.pathname.includes('/assets/') && /\.(webp|png|jpe?g|svg|gif)$/i.test(url.pathname);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (isAsset(url)) {
    event.respondWith(caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const fresh = fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then((response) => { if (response.ok) cache.put(request.url, response.clone()); return response; })
        .catch(() => null);
      if (cached) { event.waitUntil(fresh); return cached; }
      return (await fresh) || Response.error();
    }));
    return;
  }
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
