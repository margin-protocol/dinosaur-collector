// 回家／討伐提醒（湘 11/25）：小湘出門回家、討伐打完時推手機通知。所有玩家都能開，不用邀請碼。
// 遊戲把「什麼時候回來」整份排好送到後台（server/worker.js 的 /timers），後台每分鐘看一次，時間到了推出去。
// - 合併：10 分鐘內接連回來的合成一則（在最後一位回來時推），免得手機一直響。
// - 晚上安靜：23:00–08:00 回來的，留到早上 8 點一起說（照這支手機的時間）。
// - 叫回來、提早領取、關掉通知：重新送一份清單，後台整份換掉。
// - 測試服（?test）不送：test-boot.js 本來就擋 workers.dev，這裡也先看 __SIANG_TEST__。
import { SIANG_API } from './cloud.js';
import { CHARACTERS } from './eggs.js';
import { PLACES, HOME_TASKS } from './errands.js';
import { ENEMIES } from './battle.js';
import { isMoVoice, MO_PUSH } from './world-voice.js';

export const TIMER_PREFS_KEY = 'siang-collector:timer-push:v1';
export const MERGE_MS = 10 * 60e3;
export const QUIET_FROM = 23; export const QUIET_TO = 8;
export const DEFAULT_PREFS = { on: false, home: true, battle: true, quiet: true };
const TEAM_NAMES = ['第一隊', '第二隊', '第三隊', '第四隊', '第五隊'];

const nameOf = (no) => CHARACTERS[no]?.name || '小湘';
const pick = (list, seed) => list[[...String(seed)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % list.length];
const HOME_LINES = [
  (where) => `「${where}好好玩！快來看我帶了什麼～」`,
  () => '「我回來了！東西都幫你收好囉。」',
  (where) => `「從${where}回來了，有點累，可是想先見你。」`,
  () => '「到家了！門口那包是給你的喔。」',
];
const HELP_LINES = [
  (what) => `「${what}做完了！快來誇我～」`,
  () => '「交代的事都做好了，換你陪我了吧？」',
];
const BATTLE_LINES = [
  '「打完了！快來看看我們表現得怎麼樣～」',
  '「大家都平安回來了，快來領獎勵！」',
  '「呼……結束了！先摸摸頭再看結果好不好？」',
];

// 從存檔找出還沒回來的行程（只看時間，不看結果，免得通知先爆雷）
export function upcoming(state, now = Date.now(), prefs = DEFAULT_PREFS) {
  const list = [];
  if (prefs.home) for (const e of state.errands?.active || []) {
    const at = Date.parse(e.until); if (!(at > now)) continue;
    list.push({ kind: 'home', id: e.id, at, nos: e.nos, where: PLACES[e.place]?.name, task: HOME_TASKS[e.task]?.name });
  }
  if (prefs.battle) (state.battle?.active || []).forEach((b, i) => {
    const at = Date.parse(b.until); if (!(at > now)) return;
    list.push({ kind: 'battle', id: b.id, at, nos: b.nos, team: TEAM_NAMES[i] || `第${i + 1}隊`, enemy: (ENEMIES[b.enemy] || b.snapshot)?.name });
  });
  return list.sort((a, b) => a.at - b.at);
}

// 晚上安靜：23:00–08:00 的時間改成那個早上 8 點（照這支手機的時區）
export function quietShift(at) {
  const d = new Date(at); const h = d.getHours();
  if (h >= QUIET_FROM || h < QUIET_TO) {
    const m = new Date(d); if (h >= QUIET_FROM) m.setDate(m.getDate() + 1);
    m.setHours(QUIET_TO, 0, 0, 0); return { at: m.getTime(), quiet: true };
  }
  return { at, quiet: false };
}

function single(ev) {
  const mo = isMoVoice(ev.nos[0]); // 異世居民帶頭時用江湖口吻（world-voice.js）
  if (ev.kind === 'battle') {
    const lead = nameOf(ev.nos[0]);
    return { title: `${ev.team}打完了 ⚔️`, body: `${lead}：${pick(mo ? MO_PUSH.battle : BATTLE_LINES, ev.id)}` };
  }
  const who = ev.nos.length > 1 ? `${nameOf(ev.nos[0])}${ev.nos.some(isMoVoice) ? '一行人' : '她們'}` : nameOf(ev.nos[0]);
  if (ev.task) return { title: `${who}忙完了`, body: pick(mo ? MO_PUSH.help : HELP_LINES, ev.id)(ev.task) };
  return { title: `${who}回來囉`, body: pick(mo ? MO_PUSH.home : HOME_LINES, ev.id)(ev.where || '外面') };
}
function merged(group, quiet) {
  const homes = group.filter((e) => e.kind === 'home'); const fights = group.filter((e) => e.kind === 'battle');
  const people = [...new Set(homes.flatMap((e) => e.nos))];
  const parts = [];
  if (people.length) parts.push(people.length <= 2 ? `${people.map(nameOf).join('、')}回家了` : `${nameOf(people[0])}等 ${people.length} 位回家了`);
  if (fights.length) parts.push(fights.length === 1 ? `${fights[0].team}也打完了` : `${fights.length} 隊都打完了`);
  const they = group.some((e) => e.nos.some(isMoVoice)) ? '大家' : '她們';
  if (quiet) return { title: '早安 ☀️', body: `昨晚${parts.join('，')}，${they}乖乖等你起床喔。` };
  return { title: '大家都回來了 ♡', body: `${parts.join('，')}！快來收下${they}帶回來的東西～` };
}

// 排出要推的通知：[{at, title, body, tag}]，最多 8 則
export function planNotes(state, { now = Date.now(), prefs = DEFAULT_PREFS } = {}) {
  const evs = upcoming(state, now, prefs).map((e) => ({ ...e, ...(prefs.quiet ? quietShift(e.at) : { quiet: false }) })).sort((a, b) => a.at - b.at);
  const groups = [];
  for (const e of evs) {
    const g = groups.at(-1);
    if (g && e.at - g[0].at <= MERGE_MS) g.push(e); else groups.push([e]);
  }
  return groups.slice(0, 8).map((g) => {
    const at = Math.max(...g.map((e) => e.at));
    const quiet = g.every((e) => e.quiet);
    const copy = g.length === 1 && !quiet ? single(g[0]) : merged(g, quiet);
    return { at, ...copy, tag: `${g.length === 1 ? g[0].kind : 'back'}-${String(g[0].id).replace(/[^\w-]/g, '').slice(0, 24)}` };
  });
}

/* ---------- 設定與同步 ---------- */
export function timerPrefs() {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(TIMER_PREFS_KEY) || '{}') }; } catch { return { ...DEFAULT_PREFS }; }
}
export function saveTimerPrefs(next) {
  const cur = timerPrefs(); const merged = { ...cur, ...next };
  if (!merged.key) merged.key = randomKey();
  try { localStorage.setItem(TIMER_PREFS_KEY, JSON.stringify(merged)); } catch {}
  return merged;
}
function randomKey() {
  const a = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const apiBase = () => globalThis.SIANG_API_OVERRIDE || SIANG_API;
async function currentSub() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) || null;
}
let lastSent = ''; let timer = 0;
// 送出目前的清單（內容跟上次一樣就不送）
export async function syncTimers(state, { force = false } = {}) {
  if (globalThis.__SIANG_TEST__) return 'test';
  const prefs = timerPrefs();
  if (!prefs.on || !prefs.key) return 'off';
  const sub = await currentSub().catch(() => null);
  if (!sub || Notification.permission !== 'granted') return 'no-sub';
  const timers = planNotes(state, { prefs });
  const json = sub.toJSON();
  const sig = JSON.stringify([json.endpoint, timers]);
  if (!force && sig === lastSent) return 'same';
  const res = await fetch(`${apiBase()}/timers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, key: prefs.key, timers }) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `通知後台回應 ${res.status}`);
  lastSent = sig; return 'sent';
}
// 存檔改變後呼叫：等一下再送，連續改很多次只送一次
export function queueTimerSync(getState, delay = 1500) {
  clearTimeout(timer);
  timer = setTimeout(() => { syncTimers(getState()).catch(() => {}); }, delay);
}
export async function timersOff() {
  const prefs = timerPrefs(); saveTimerPrefs({ on: false }); lastSent = '';
  if (globalThis.__SIANG_TEST__ || !prefs.key) return;
  const sub = await currentSub().catch(() => null);
  if (sub) await fetch(`${apiBase()}/timers/off`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint, key: prefs.key }) }).catch(() => {});
}
// 開啟：問通知權限 → 訂閱（跟「湘的消息」共用同一個訂閱）→ 送出清單
export async function enableTimers(state) {
  if (globalThis.__SIANG_TEST__) { saveTimerPrefs({ on: true }); return 'test'; }
  const { pushSupported, VAPID_PUBLIC } = await import('./push.js');
  if (!pushSupported()) throw new Error('這支手機的瀏覽器不支援通知。iPhone 要先「加入主畫面」，從主畫面打開。');
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('沒有允許通知。要開的話，到手機設定把這個遊戲的通知打開。');
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const raw = VAPID_PUBLIC.replace(/-/g, '+').replace(/_/g, '/');
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(atob(raw + '==='.slice((raw.length + 3) % 4)), (c) => c.charCodeAt(0)) });
  }
  saveTimerPrefs({ on: true });
  return syncTimers(state, { force: true });
}
