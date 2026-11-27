// 讓遊戲加入主畫面後可以離線開啟。
// 11/28 改版（玩家被 GitHub Pages「Rate limit exceeded」擋住）：
// 以前每開一次遊戲，一百多個 js/css 都要跟伺服器確認一次、每張圖也在背景再抓一次，一次就四百多個請求。
// 現在：
// - 開遊戲（頁面本身）一律拿最新的；同時用一個 HEAD 看 changelog.json 有沒有變（每次推送都會加一筆），
//   有變才把舊的 js/css/資料清掉，接下來載入的就是新版。沒變就全部用快取，一次開遊戲只要兩個請求。
// - 圖片（assets/ 底下）快取優先，超過一天才在背景重抓一次。
// - changelog.json、sw.js 和其他網站（雲端存檔、天氣）不經過這裡。
const CACHE = 'siang-collector-v3';
const META = '__siang-version__';
const ASSET_FRESH_MS = 24 * 60 * 60 * 1000;
// 主畫面 icon 換圖時要換檔名（例如 siang-icon-v2-180.png）：圖片是快取優先，同檔名會沿用舊圖最多一天（11/19）
const isAsset = (url) => url.pathname.includes('/assets/') && /\.(webp|png|jpe?g|svg|gif|mp3)$/i.test(url.pathname);
const passThrough = (url) => /\/(changelog\.json|sw\.js)$/.test(url.pathname);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

const store = (cache, key, response) => { if (response && response.ok && response.type === 'basic') cache.put(key, response.clone()).catch(() => {}); return response; };

// 版本標記：changelog.json 的 ETag／Last-Modified。變了就清掉程式檔（圖片不清）
async function checkVersion(cache, scope) {
  try {
    const res = await fetch(new URL('changelog.json', scope).href, { method: 'HEAD', cache: 'no-store' });
    if (!res.ok) return;
    const sig = res.headers.get('etag') || res.headers.get('last-modified') || res.headers.get('content-length') || '';
    if (!sig) return;
    const old = await cache.match(META);
    if (old && (await old.text()) === sig) return;
    const keys = await cache.keys();
    await Promise.all(keys.filter((req) => !isAsset(new URL(req.url))).map((req) => cache.delete(req)));
    await cache.put(META, new Response(sig));
  } catch { /* 離線就沿用快取 */ }
}

async function page(request) {
  const cache = await caches.open(CACHE);
  const [fresh] = await Promise.all([
    fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' }).catch(() => null),
    checkVersion(cache, self.registration.scope),
  ]);
  if (fresh && fresh.ok) return store(cache, request.url, fresh);
  return (await cache.match(request, { ignoreSearch: true })) || fresh || Response.error();
}

async function asset(event, request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  const refresh = () => fetch(request.url, { credentials: 'same-origin' }).then((r) => store(cache, request.url, r)).catch(() => null);
  if (cached) {
    const age = Date.now() - Date.parse(cached.headers.get('date') || '');
    if (!(age < ASSET_FRESH_MS)) event.waitUntil(refresh());
    return cached;
  }
  return (await refresh()) || Response.error();
}

async function code(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  // 換版後第一次抓：no-cache 跳過瀏覽器自己的 10 分鐘快取，免得新的 index.html 配到舊的 app.js
  try { return store(cache, request.url, await fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' })); }
  catch { return Response.error(); }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || passThrough(url)) return;
  if (request.headers.has('range')) return; // 音樂、影片的分段請求交給瀏覽器
  if (request.mode === 'navigate') event.respondWith(page(request));
  else if (isAsset(url)) event.respondWith(asset(event, request));
  else event.respondWith(code(request));
});

// 手機通知（11/21）：後台推來的通知內容是固定的一句話，點了打開遊戲
self.addEventListener('push', (event) => {
  let note = { title: '頁間居民', body: '湘有新消息給你！', tag: 'siang' };
  try { note = { ...note, ...(event.data ? event.data.json() : {}) }; } catch {}
  event.waitUntil(self.registration.showNotification(note.title, { body: note.body, tag: note.tag, icon: 'assets/icons/siang-icon-v2-192.png', badge: 'assets/icons/siang-icon-v2-192.png', data: { url: './' } }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const open = list.find((c) => new URL(c.url).pathname.startsWith(new URL('./', self.registration.scope).pathname));
    return open ? open.focus() : self.clients.openWindow('./');
  }));
});
