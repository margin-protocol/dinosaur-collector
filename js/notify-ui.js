// 「手機通知」設定（湘 11/25 選 A：開關清單）
// 🔔 手機通知（總開關）／🏠 小湘回家了／⚔️ 討伐打完了／✉️ 湘的消息（要邀請碼）／🌙 晚上不吵你
// 回家、討伐提醒所有玩家都能開；湘的消息沿用 push.js（邀請碼）。兩種通知共用同一個推播訂閱，
// 所以關掉其中一種只跟後台說一聲，兩種都關了才把訂閱取消。
import { cloudConfig } from './cloud.js';
import { pushSupported, isIOS, isStandalone, enablePush, disablePush } from './push.js';
import { timerPrefs, saveTimerPrefs, enableTimers, timersOff, syncTimers } from './push-timers.js';

const $ = (id) => document.getElementById(id);
// 湘的消息有沒有開：以前開過通知（有訂閱、還沒用過新設定）的玩家當作開著
export async function msgPushOn() {
  const p = timerPrefs();
  if (typeof p.msg === 'boolean') return p.msg && cloudConfig()?.kind === 'siang';
  const sub = await currentSub();
  return Boolean(sub) && cloudConfig()?.kind === 'siang';
}
async function currentSub() {
  try { return (await (await navigator.serviceWorker.getRegistration())?.pushManager.getSubscription()) || null; } catch { return null; }
}
async function status() {
  if (globalThis.__SIANG_TEST__) return 'test';
  if (!pushSupported()) return isIOS() && !isStandalone() ? 'need-home-screen' : 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  return 'ok';
}
const HINTS = {
  test: '測試服不會連到後台，這裡的開關只會存在測試服，不會真的推通知。',
  'need-home-screen': 'iPhone 要先用 Safari 的「分享 → 加入主畫面」，再從主畫面打開，才能開通知。',
  denied: '這支手機擋掉了通知。要開的話，到手機的設定裡把這個遊戲的通知打開。',
  unsupported: '這個瀏覽器不支援通知，可以換成 Chrome，或把遊戲加入主畫面再試試。',
  ok: 'iPhone 要先「加入主畫面」，從主畫面打開才收得到。',
};

export function setupNotify({ getState, onOpen = () => {} }) {
  const dialog = $('notify-dialog');
  const sw = (key, on, disabled = false) => {
    const b = dialog.querySelector(`[data-notify="${key}"]`);
    b.setAttribute('aria-checked', String(on)); b.disabled = disabled;
  };
  async function render() {
    const st = await status();
    const p = timerPrefs(); const invite = cloudConfig()?.kind === 'siang';
    const msg = await msgPushOn();
    const main = p.on || msg;
    const usable = st === 'ok' || st === 'test';
    sw('main', main, !usable);
    $('notify-main-sub').textContent = !usable ? '這支手機還不能開' : main ? '這支手機已開啟' : '還沒開啟';
    dialog.querySelector('.notify-list').classList.toggle('is-off', !main);
    sw('home', main && p.on && p.home, !main);
    sw('battle', main && p.on && p.battle, !main);
    sw('msg', main && msg, !main || !invite);
    $('notify-msg-sub').textContent = invite ? '審核結果、紙條、新委託' : '要先在「雲端與備份」輸入邀請碼';
    sw('quiet', p.quiet, !main);
    $('notify-hint').textContent = HINTS[st];
  }
  const say = (text) => { $('notify-status').textContent = text; };
  async function busy(fn) {
    dialog.querySelectorAll('[data-notify]').forEach((b) => { b.dataset.busy = '1'; });
    try { await fn(); } catch (err) { say(`沒有設定成功：${err.message}`); }
    finally { dialog.querySelectorAll('[data-notify]').forEach((b) => { delete b.dataset.busy; }); await render(); }
  }
  async function setMsg(on) {
    const config = cloudConfig(); if (config?.kind !== 'siang') return;
    if (on) await enablePush(config.token);
    else await disablePush(config.token, { keepSubscription: timerPrefs().on });
    saveTimerPrefs({ msg: on });
  }
  dialog.addEventListener('click', (event) => {
    const b = event.target.closest('[data-notify]'); if (!b || b.disabled || b.dataset.busy) return;
    const key = b.dataset.notify; const on = b.getAttribute('aria-checked') !== 'true';
    say('');
    if (key === 'main') return busy(async () => {
      if (on) {
        if (!timerPrefs().home && !timerPrefs().battle) saveTimerPrefs({ home: true, battle: true });
        await enableTimers(getState());
        if (cloudConfig()?.kind === 'siang' && timerPrefs().msg !== false) await setMsg(true);
        say('開好了！小湘回來的時候會叫你 🔔');
      } else {
        await timersOff();
        if (cloudConfig()?.kind === 'siang') await setMsg(false).catch(() => {});
        const sub = await currentSub(); if (sub && !globalThis.__SIANG_TEST__) await sub.unsubscribe().catch(() => {});
        say('已關閉這支手機的通知。');
      }
    });
    if (key === 'msg') return busy(() => setMsg(on));
    // 回家／討伐／晚上安靜：改設定後重送清單（回家、討伐都關了就等於不送）
    return busy(async () => {
      const next = saveTimerPrefs({ [key]: on });
      if (key !== 'quiet' && !next.home && !next.battle) { await timersOff(); saveTimerPrefs({ on: false, home: next.home, battle: next.battle }); return; }
      if ((key === 'home' || key === 'battle') && on && !next.on) { await enableTimers(getState()); return; }
      if (next.on) await syncTimers(getState(), { force: true });
    });
  });
  const open = () => { say(''); void render(); dialog.showModal(); onOpen(); };
  $('open-notify').addEventListener('click', () => { $('function-center')?.close(); open(); });
  $('close-notify').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', onOpen);
  return { open, render };
}
