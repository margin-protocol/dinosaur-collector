// 手機通知（湘 11/21）：湘審完委託、寄紙條、回覆照片、出新委託時，後台推一則通知到這支手機。
// 只有小湘雲端（邀請碼）的玩家能開；iPhone 要先「加入主畫面」從主畫面打開才支援。
// 這是 VAPID 公鑰（公開無妨）；對應的私鑰只放在 Cloudflare Worker 的 secret 裡，不在 repo。
import { SIANG_API } from './cloud.js';
export const VAPID_PUBLIC = 'BMJ_vSyH_euNa31NzElsFkEzUIAW9kvRXenbnWvWmlisZzOqtzqpcN6P8XR9lvGy4SCXGQPSdeB84P17uDsN3Ls';
const apiBase = () => globalThis.SIANG_API_OVERRIDE || SIANG_API;
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

export const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isStandalone = () => Boolean(navigator.standalone) || matchMedia('(display-mode: standalone)').matches;
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// 'unsupported' | 'need-home-screen' | 'denied' | 'on' | 'off'
export async function pushState() {
  if (!pushSupported()) return isIOS() && !isStandalone() ? 'need-home-screen' : 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === 'granted' ? 'on' : 'off';
}
async function post(route, token, body) {
  const res = await fetch(`${apiBase()}${route}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `小湘雲端回應 ${res.status}`);
}
export async function enablePush(token) {
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('沒有允許通知。要開的話，到手機設定把這個遊戲的通知打開。');
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: unb64u(VAPID_PUBLIC) });
  await post('/push/subscribe', token, sub.toJSON());
}
// keepSubscription：回家／討伐提醒還開著時（同一個訂閱），只跟後台說不要再推湘的消息
export async function disablePush(token, { keepSubscription = false } = {}) {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await post('/push/unsubscribe', token, { endpoint: sub.endpoint }).catch(() => {});
  if (!keepSubscription) await sub.unsubscribe();
}
// 開著通知的手機，每次打開遊戲重新告訴後台一次（換邀請碼、後台清掉時補回來）
export async function refreshPush(token) {
  if ((await pushState()) !== 'on') return;
  const sub = await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription();
  if (sub) await post('/push/subscribe', token, sub.toJSON()).catch(() => {});
}
