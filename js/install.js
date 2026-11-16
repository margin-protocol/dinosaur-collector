// 放到主畫面：Android Chrome 會丟出 beforeinstallprompt，接住後由遊戲自己跳「安裝」卡片；
// 其他瀏覽器（iPhone Safari、沒觸發事件時）改顯示手動步驟。
const SNOOZE_KEY = 'siang-collector:install-snooze';
const SNOOZE_DAYS = 3;
let deferred = window.__installPrompt || null;
const listeners = new Set();

export const isInstalled = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const canPrompt = () => !!deferred;
export const platform = () => /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : /android/i.test(navigator.userAgent) ? 'android' : 'other';
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = (type) => listeners.forEach(fn => fn(type));

addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); deferred = event; emit('available'); });
if (deferred) queueMicrotask(() => emit('available'));
addEventListener('appinstalled', () => { deferred = null; emit('installed'); });

export function snoozed(now = Date.now()) {
  try { const at = Number(localStorage.getItem(SNOOZE_KEY)); return at > 0 && now - at < SNOOZE_DAYS * 864e5; } catch { return false; }
}
export function snooze(now = Date.now()) { try { localStorage.setItem(SNOOZE_KEY, String(now)); } catch {} }

// 回傳 'accepted' | 'dismissed' | 'unavailable'
export async function promptInstall() {
  if (!deferred) return 'unavailable';
  const event = deferred; deferred = null;
  try { await event.prompt(); const choice = await event.userChoice; emit(choice.outcome); return choice.outcome; }
  catch { return 'unavailable'; }
}
