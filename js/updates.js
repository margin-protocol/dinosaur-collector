// 更新通知：定期用 HEAD 請求比對幾個檔案的版本標記（ETag / Last-Modified），有變就提醒重新整理；
// 重新整理後，若 changelog.json 有玩家還沒看過的版本，顯示更新內容。沒有更新就什麼都不顯示。
const WATCH = ['index.html', 'js/app.js', 'changelog.json'];
const SEEN_KEY = 'siang-collector:seen-version';
const CHECK_EVERY = 10 * 60 * 1000;
const NEW_PLAYER = 'new-player';
// 開遊戲時馬上記下「這是新玩家」，之後就算很快有了收藏，也不會把更新內容當成沒看過
export function noteNewPlayer(returning, storage = localStorage) {
  try { if (!returning && !storage.getItem(SEEN_KEY)) storage.setItem(SEEN_KEY, NEW_PLAYER); } catch {}
}

async function signature() {
  const tags = await Promise.all(WATCH.map(async (path) => {
    const res = await fetch(`${path}?v=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    return res.headers.get('etag') || res.headers.get('last-modified') || res.headers.get('content-length') || '';
  }));
  return tags.join('|');
}

export async function loadChangelog() {
  try {
    const res = await fetch(`changelog.json?v=${Date.now()}`, { cache: 'no-store' });
    const list = await res.json();
    return Array.isArray(list) ? list.filter((e) => e && typeof e.version === 'string' && Array.isArray(e.items)) : [];
  } catch { return []; }
}

// 還沒看過的版本。新玩家不顯示，直接記成已看過；已經在玩、但還沒有紀錄的玩家顯示最新一版
export function unseen(list, { returning = false, storage = localStorage } = {}) {
  if (!list.length) return [];
  let seen = null; try { seen = storage.getItem(SEEN_KEY); } catch {}
  if (seen === NEW_PLAYER || (!seen && !returning)) { markSeen(list, storage); return []; }
  if (!seen) return list.slice(0, 1);
  const i = list.findIndex((e) => e.version === seen);
  return (i < 0 ? list : list.slice(0, i)).slice(0, 3);
}
export function markSeen(list, storage = localStorage) { try { if (list[0]) storage.setItem(SEEN_KEY, list[0].version); } catch {} }

export function watchForUpdates(onUpdate) {
  let base = null; let last = 0; let told = false;
  const check = async (force = false) => {
    if (told || (!force && Date.now() - last < CHECK_EVERY) || !navigator.onLine) return;
    last = Date.now();
    try {
      const sig = await signature();
      if (base === null) base = sig;
      else if (sig !== base) { told = true; onUpdate(); }
    } catch { /* 離線或暫時失敗就等下次 */ }
  };
  void check(true);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void check(); });
  setInterval(() => { if (!document.hidden) void check(); }, CHECK_EVERY);
  return { check: () => check(true) };
}
