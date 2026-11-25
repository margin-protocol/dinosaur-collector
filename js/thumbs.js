// 記憶檔案的縮圖倉庫（11/25）：縮圖改存在手機的 IndexedDB，不再塞進存檔。
//
// 為什麼：存檔放在 localStorage（大約只有 5MB），以前每張記憶都帶一張 base64 縮圖（10–15KB），
// 照片一多，存檔會默默寫不進去（進度只留在記憶體，關掉就沒了），雲端備份也會超過 1.9MB 上限被擋。
//
// 縮圖用「雲端照片路徑」當 key（submissions/<委託>/<sid>.jpg、postcards/<id>.jpg）：
// 委託送出時存的縮圖，審核通過變成記憶後還是同一個 key，不用搬。
// 縮圖不見了（換手機還原、清了瀏覽器資料）也沒關係：原圖在雲端，抓下來重新做一張縮圖就好。
import { thumbnail } from './commissions.js';

const DB = 'siang-thumbs';
const STORE = 'thumbs';
let dbPromise = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) { reject(new Error('no indexedDB')); return; }
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('indexedDB blocked'));
    }).catch((err) => { dbPromise = null; throw err; });
  }
  return dbPromise;
}

function run(mode, fn) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('aborted'));
  }));
}

export const thumbKeyFor = (missionId, sid) => `submissions/${missionId}/${sid}.jpg`;

// 成功回傳 true；IndexedDB 不能用（例如某些私密瀏覽）就回 false，呼叫的人再決定要不要退回舊做法
export async function putThumb(key, dataUrl) {
  if (!key || !dataUrl) return false;
  try { await run('readwrite', (s) => s.put(dataUrl, key)); return true; } catch { return false; }
}

export async function getThumb(key) {
  if (!key) return null;
  try { return (await run('readonly', (s) => s.get(key))) || null; } catch { return null; }
}

// 從雲端抓原圖、重新做一張縮圖收進倉庫。同一張圖同時只抓一次。
const refetching = new Map();
export function thumbFromCloud(key, cloud) {
  if (!key || !cloud) return Promise.resolve(null);
  if (!refetching.has(key)) {
    refetching.set(key, (async () => {
      try {
        const bytes = await cloud.getBytes(key);
        if (!bytes?.length) return null;
        const url = await thumbnail(new Blob([bytes], { type: 'image/jpeg' }));
        await putThumb(key, url);
        return url;
      } catch { return null; } finally { refetching.delete(key); }
    })());
  }
  return refetching.get(key);
}

// 把縮圖放進 <img>：存檔裡還有舊縮圖就直接用 → 倉庫 → 雲端原圖 → 都沒有就交給 fallback（例如角色立繪）。
// 回傳 Promise，方便測試等它畫完；畫面不用等。
export async function showThumb(img, { thumb, key, cloud, fallback } = {}) {
  if (thumb) { img.src = thumb; return 'inline'; }
  const stored = await getThumb(key);
  if (stored) { img.src = stored; return 'stored'; }
  const fetched = await thumbFromCloud(key, cloud);
  if (fetched) { img.src = fetched; return 'cloud'; }
  fallback?.();
  return 'fallback';
}

// 舊存檔搬家：把存檔裡的 base64 縮圖搬進倉庫，回傳「已經安全搬好、可以從存檔刪掉」的 key。
// 倉庫寫不進去的就留在存檔裡，不會弄丟。
export async function offloadThumbs(state) {
  const moved = new Set();
  const jobs = [];
  for (const m of state.memories || []) {
    if (typeof m?.thumb === 'string' && m.thumb.startsWith('data:') && m.photo) {
      jobs.push(putThumb(m.photo, m.thumb).then((ok) => { if (ok) moved.add(m.photo); }));
    }
  }
  for (const [id, p] of Object.entries(state.missions?.pending || {})) {
    if (typeof p?.thumb === 'string' && p.thumb.startsWith('data:') && p.sid) {
      const key = thumbKeyFor(id, p.sid);
      jobs.push(putThumb(key, p.thumb).then((ok) => { if (ok) moved.add(key); }));
    }
  }
  await Promise.all(jobs);
  return moved;
}

// 在 updateState 裡呼叫：刪掉已經搬進倉庫的縮圖（重新讀到的最新存檔，只刪確定搬好的那幾張）
export function stripThumbs(state, moved) {
  let n = 0;
  for (const m of state.memories || []) if (m?.thumb && moved.has(m.photo)) { delete m.thumb; n += 1; }
  for (const [id, p] of Object.entries(state.missions?.pending || {})) {
    if (p?.thumb && p.sid && moved.has(thumbKeyFor(id, p.sid))) { delete p.thumb; n += 1; }
  }
  return n;
}
