// 稱號櫃（湘 11/27）：成就稱號＋活動稱號＋系列支線稱號放在一起，全遊戲只戴一個，顯示在研究者等級旁邊
// key：成就＝`ach:<成就 id>`；活動＝`event:<活動>:<稱號>`；支線＝`side:<線>`；特別＝`special:<id>`
// 11/27 湘要 A＋B＋C：正式服開放（支線稱號、徽章仍等支線開放）、戴著才有加成（B）、集稱號給獎勵（C）
import { EVENT_DEFS, wearTitle as wearEventTitle, wornTitle as wornEventTitle } from './events.js';
import { SIDE_LINES, ensureSide, sideOn } from './side.js';
import { CHARACTERS, SERIES } from './eggs.js';
import { ACHIEVEMENTS } from './achievements.js';
import { candyOf } from './candy.js';
import { guguOn, pagesOwned, GUGU_PAGES, GUGU_BOOK } from './gugu.js';

const ACH_GROUP = { 孵化: '孵化', 收藏: '收藏', 願望: '願望', 旅行: '旅行', 陪伴: '陪伴', 廚房: '廚房', 討伐: '討伐', 隱藏: '隱藏' };
export const TITLE_GROUPS = ['限定', '孵化', '收藏', '願望', '旅行', '陪伴', '廚房', '討伐', '隱藏', '活動', '系列支線', '特別'];
// 限定稱號：畫面上本來就寫「稱號「…」」的成就
const LIMITED = new Set(['tsukimi-5', 'law-ti-2']);
// C：集稱號獎勵（湘 11/27）
export const TITLE_MILESTONES = [
  { n: 5, fossils: 30, text: '化石 30' },
  { n: 10, fossils: 60, text: '化石 60' },
  { n: 20, candy: 'SR', text: 'SR 星光糖 1' },
  { n: 30, candy: 'SSR', text: 'SSR 星光糖 1' },
  { n: 40, fossils: 150, title: 'collector', text: '化石 150＋稱號「稱號收藏家」' },
];
const SPECIAL = { collector: '稱號收藏家' };
// B：戴著才有效（湘 11/27 OK）。一次只戴一個，不疊加。buff 存在 state.title.buff，其他模組直接讀，不用再 import 這裡
const GROUP_BUFF = {
  孵化: { passive: 1, text: '自動保溫每小時 +1' }, 收藏: { power: 0.03, text: '討伐戰力 +3%' }, 旅行: { errand: 0.05, text: '出門時間 −5%' },
  願望: { wish: 0.1, text: '完成願望的能量 +10%' }, 陪伴: { bond: 1, text: '摸頭、打招呼的好感 +1' }, 廚房: { food: 0.02, text: '料理的戰力加成 +2%' }, 討伐: { power: 0.03, text: '討伐戰力 +3%' },
  限定: { power: 0.05, text: '討伐戰力 +5%' }, 隱藏: { power: 0.05, text: '討伐戰力 +5%' }, 特別: { power: 0.05, text: '討伐戰力 +5%' },
};
const EVENT_BUFF = { 'mo:mo-pen': { eventPower: 0.05, event: 'mo', text: '墨痕江湖關卡戰力 +5%' }, 'mo:mo-unwed': { eventPower: 0.08, event: 'mo', text: '墨痕江湖關卡戰力 +8%' } };
export function buffOf(key, group) {
  const [kind, a, b] = (key || '').split(':');
  if (kind === 'event') return EVENT_BUFF[`${a}:${b}`] || null;
  if (kind === 'side') return null;
  return GROUP_BUFF[group] || null;
}
// 戴著的稱號 → state.title.buff（開遊戲時也同步一次，舊存檔戴著活動稱號的人也會有）
export function syncBuff(state) {
  const w = wornTitle(state); const t = titleState(state);
  const g = w && ownedTitles(state).find((x) => x.key === w.key)?.group;
  const buff = w ? buffOf(w.key, g) : null;
  if (buff) t.buff = buff; else delete t.buff;
  return t.buff || null;
}

function titleState(state) {
  const t = state.title && typeof state.title === 'object' ? state.title : {};
  const got = Array.isArray(t.got) ? [...new Set(t.got.filter((n) => Number.isSafeInteger(n)))] : [];
  const buff = t.buff && typeof t.buff === 'object' ? t.buff : null;
  state.title = { ...(typeof t.worn === 'string' ? { worn: t.worn } : {}), got, ...(buff ? { buff } : {}) };
  return state.title;
}

export function ownedTitles(state) {
  const out = [];
  const claimed = new Set(state.achievements?.claimed || []);
  for (const a of ACHIEVEMENTS) {
    const owned = claimed.has(a.id);
    out.push({ key: `ach:${a.id}`, name: a.title, group: LIMITED.has(a.id) ? '限定' : ACH_GROUP[a.group] || '收藏', owned, secret: Boolean(a.secret), how: a.secret ? (owned ? a.reveal : '隱藏成就') : `成就：${a.hint}` });
  }
  for (const [eid, def] of Object.entries(EVENT_DEFS)) for (const [tid, name] of Object.entries(def.titles || {})) {
    const owned = Boolean(state.events?.[eid]?.titles?.includes(tid));
    if (owned) out.push({ key: `event:${eid}:${tid}`, name, group: '活動', owned: true, how: def.name });
  }
  if (sideOn()) for (const [id, line] of Object.entries(SIDE_LINES)) if (line.title) out.push({ key: `side:${id}`, name: line.title, group: '系列支線', owned: Boolean(state.side?.lines?.[id]?.titleAt), how: `「${line.name}」全部三星` });
  // 咕咕禁書收齊的限定稱號（湘 11/28）
  if (guguOn()) out.push({ key: 'special:gugu-accomplice', name: GUGU_BOOK.title_reward.name, group: '限定', owned: pagesOwned(state).length >= GUGU_PAGES.length, how: `${GUGU_BOOK.title_reward.text}（收齊 ${GUGU_PAGES.length} 頁《咕咕禁書》）` });
  const got = new Set(state.title?.got || []);
  for (const m of TITLE_MILESTONES) if (m.title) out.push({ key: `special:${m.title}`, name: SPECIAL[m.title], group: '特別', owned: got.has(m.n), how: `收集 ${m.n} 個稱號` });
  return out;
}
const ownedKey = (state, key) => ownedTitles(state).some((t) => t.key === key && t.owned);
export function wornTitle(state) {
  const tw = state.title?.worn; if (tw && ownedKey(state, tw)) return { key: tw, name: ownedTitles(state).find((t) => t.key === tw).name };
  const sw = state.side?.worn; if (sideOn() && sw && SIDE_LINES[sw]?.title && state.side.lines?.[sw]?.titleAt) return { key: `side:${sw}`, name: SIDE_LINES[sw].title };
  const ev = wornEventTitle(state); return ev ? { key: `event:${ev.eventId}:${ev.id}`, name: ev.name } : null;
}
// C：已經收集幾個（不算「特別」那一個）、下一個門檻、可以領的
export function titleCount(state) { return ownedTitles(state).filter((t) => t.owned && t.group !== '特別').length; }
export function milestones(state) {
  const n = titleCount(state); const got = new Set(state.title?.got || []);
  return TITLE_MILESTONES.map((m) => ({ ...m, ready: n >= m.n && !got.has(m.n), done: got.has(m.n) }));
}
export function claimMilestones(state) {
  const t = titleState(state); const n = titleCount(state); const out = [];
  for (const m of TITLE_MILESTONES) {
    if (n < m.n || t.got.includes(m.n)) continue;
    t.got.push(m.n);
    if (m.fossils) state.fossils = (state.fossils || 0) + m.fossils;
    if (m.candy) candyOf(state)[m.candy] += 1;
    out.push(m);
  }
  return out;
}
// key 為 null＝拿下來；回傳戴上的名字或 null
export function wearTitle(state, key) {
  const [kind, a, b] = (key || '').split(':');
  if (key && !ownedKey(state, key)) return null;
  wearEventTitle(state, Object.keys(EVENT_DEFS)[0], null); // 清掉活動稱號
  if (state.side) delete state.side.worn;
  const t = titleState(state); delete t.worn;
  let name = null;
  if (kind === 'side') { ensureSide(state).worn = a; name = SIDE_LINES[a].title; }
  else if (kind === 'event') name = wearEventTitle(state, a, b);
  else if (kind === 'ach' || kind === 'special') { t.worn = key; name = ownedTitles(state).find((x) => x.key === key).name; }
  syncBuff(state);
  return name;
}
// 圖鑑系列徽章：有支線的系列一枚。打通支線＝亮；系列居民也收齊＝金框
// 湘 11/27 畫了五枚（assets/badges/<系列>.webp）；還沒有支線的系列也先擺出來，標「之後開放」
export const BADGE_SERIES = ['county', 'animals', 'holiday', 'weather', 'friends'];
export const badgeArt = (series) => (BADGE_SERIES.includes(series) ? `assets/badges/${series}.webp` : null);
export function seriesBadges(state) {
  const seen = new Set(); const out = [];
  const series = [...new Set([...BADGE_SERIES, ...Object.values(SIDE_LINES).map((l) => l.series)])];
  for (const sr of series) {
    if (seen.has(sr)) continue; seen.add(sr);
    const line = Object.values(SIDE_LINES).find((l) => l.series === sr);
    if (!line) { out.push({ series: sr, name: SERIES[sr]?.short || sr, lit: false, gold: false, soon: true }); continue; }
    const lines = Object.values(SIDE_LINES).filter((l) => l.series === line.series);
    const lit = lines.some((l) => state.side?.lines?.[l.id]?.doneAt);
    const nos = Object.keys(CHARACTERS).filter((no) => CHARACTERS[no].series === line.series);
    out.push({ series: line.series, name: SERIES[line.series]?.short || line.series, lit, gold: lit && nos.every((no) => state.dex?.[no]) });
  }
  return out;
}
