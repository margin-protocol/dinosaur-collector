// 新玩家計數（湘 11/26）：這支手機第一次打開遊戲（全新存檔）時，跟後台說一聲「新玩家 +1」。
// - 只送一個空的 POST /hello：後台只記日期和是哪個網址，不送存檔、名字、token 或任何裝置識別。
// - 已經在玩的人（打開時本機已經有存檔）直接記成 done，不會補算。
// - 測試服（?test）不送（test-boot.js 也會擋 workers.dev）。
// - 送不出去（沒網路）就留著 pending，下次打開或連上網路再試；成功一次之後這支手機就不會再送。
// 必須是 app.js 的第一個 import：要在任何程式寫入存檔之前，先看「本機原本有沒有存檔」。
import { SIANG_API } from './cloud.js';

export const HELLO_KEY = 'siang-collector:hello:v1';
const SAVE_KEY = 'siang-collector:v1';

let status = 'done';
try {
  status = localStorage.getItem(HELLO_KEY) || (localStorage.getItem(SAVE_KEY) ? 'done' : 'pending');
  localStorage.setItem(HELLO_KEY, status);
} catch { status = 'done'; }

export const helloStatus = () => status;

let sending = false;
export async function sayHello() {
  if (globalThis.__SIANG_TEST__ || status !== 'pending' || sending) return status === 'pending' ? 'skip' : status;
  sending = true;
  try {
    const res = await fetch(`${globalThis.SIANG_API_OVERRIDE || SIANG_API}/hello`, { method: 'POST', keepalive: true, cache: 'no-store' });
    if (res.ok) { status = 'done'; try { localStorage.setItem(HELLO_KEY, 'done'); } catch {} return 'sent'; }
    if (res.status === 403) { status = 'done'; try { localStorage.setItem(HELLO_KEY, 'done'); } catch {} return 'refused'; } // 不是正式網址（例如本機）就算了
  } catch {} finally { sending = false; }
  return 'later';
}

if (typeof addEventListener === 'function') {
  addEventListener('online', () => { void sayHello(); });
  setTimeout(() => { void sayHello(); }, 2500);
}
