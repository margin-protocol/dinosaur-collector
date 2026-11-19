// 開發團隊系列（No.086–088）：用玩家平常的遊玩累積解鎖，達成後送一顆固定角色的紀念蛋（每位只送一次）
// 1. 加班皮寶：圖鑑收集 20 位不同小湘（開發團隊不算）＋外出合照 5 次
// 2. 崩潰德寶：已擁有加班皮寶＋今日願望累積完成 30 個＋討伐打贏 10 次
// 3. 靈感爆發小湘：加班皮寶與崩潰德寶一起入住首頁，且當天三個今日願望全部完成，累積 3 個不同日子
// 三位都入住首頁時，每天最多一次觸發《今天也沒有下班》彩蛋對話
import { CHARACTERS } from './eggs.js';

export const PIBAO = '086', DEBAO = '087', IDEA = '088';
export const NEED = { dex: 20, photos: 5, wishes: 30, wins: 10, days: 3 };

const isStr = (v) => typeof v === 'string';
export function ensureDevteam(state) {
  const old = state.devteam && typeof state.devteam === 'object' ? state.devteam : {};
  state.devteam = {
    granted: Object.fromEntries(Object.entries(old.granted || {}).filter(([k, v]) => [PIBAO, DEBAO, IDEA].includes(k) && isStr(v))),
    days: Array.isArray(old.days) ? [...new Set(old.days.filter(isStr))] : [],
    event: isStr(old.event) ? old.event : '', // 最近一次看到彩蛋的日期
    eventSeen: old.eventSeen === true,
  };
  return state.devteam;
}

const has = (state, no) => Boolean(state.dex?.[no]);
export const collected = (state) => Object.keys(state.dex || {}).filter((no) => CHARACTERS[no] && CHARACTERS[no].series !== 'devteam').length;
const wishesDone = (state) => state.player?.stats?.wishes || 0;
const photos = (state) => state.player?.stats?.photos || 0;
const wins = (state) => state.battle?.wins || 0;
const owned = (state, no) => has(state, no) || Boolean(state.devteam?.granted?.[no]);

// 今天三個願望是不是全部完成
export function allWishesDone(state, today) {
  const w = state.wishes;
  return Boolean(w && w.date === today && Array.isArray(w.ids) && w.ids.length && w.ids.every((id) => w.done?.includes(id)));
}

// 各角色的進度（給圖鑑顯示）
export function progress(state, no) {
  if (no === PIBAO) return [{ label: '圖鑑收集不同小湘', now: collected(state), need: NEED.dex }, { label: '外出合照', now: photos(state), need: NEED.photos }];
  if (no === DEBAO) return [{ label: '擁有加班皮寶', now: has(state, PIBAO) ? 1 : 0, need: 1 }, { label: '完成今日願望', now: wishesDone(state), need: NEED.wishes }, { label: '討伐打贏', now: wins(state), need: NEED.wins }];
  if (no === IDEA) return [{ label: '加班皮寶和崩潰德寶一起入住首頁、當天三個願望都完成', now: state.devteam?.days?.length || 0, need: NEED.days, unit: '天' }];
  return [];
}

function grant(state, no, now) {
  const d = ensureDevteam(state);
  if (d.granted[no] || has(state, no)) return false;
  d.granted[no] = now.toISOString();
  state.gifts.eggs.push({ egg: 'keepsake', character: no, from: `devteam:${no}`, at: now.toISOString() });
  return true;
}

// 現在有沒有需要寫進存檔的事（app 用來決定要不要開存檔交易）
export function devteamDue(state, { residents, today }) {
  const d = state.devteam || {};
  if (!owned(state, PIBAO) && collected(state) >= NEED.dex && photos(state) >= NEED.photos) return true;
  if (!owned(state, DEBAO) && has(state, PIBAO) && wishesDone(state) >= NEED.wishes && wins(state) >= NEED.wins) return true;
  if (!owned(state, IDEA) && has(state, PIBAO) && has(state, DEBAO) && residents.includes(PIBAO) && residents.includes(DEBAO) && allWishesDone(state, today) && !(d.days || []).includes(today)) return true;
  return false;
}

// 結算：回傳這次新送出的紀念蛋 [{ no }] 與第三位的進度 { day }
export function tickDevteam(state, { residents, today, now = new Date() }) {
  const d = ensureDevteam(state);
  const eggs = []; let day = null;
  if (!owned(state, PIBAO) && collected(state) >= NEED.dex && photos(state) >= NEED.photos && grant(state, PIBAO, now)) eggs.push(PIBAO);
  if (!owned(state, DEBAO) && has(state, PIBAO) && wishesDone(state) >= NEED.wishes && wins(state) >= NEED.wins && grant(state, DEBAO, now)) eggs.push(DEBAO);
  if (!owned(state, IDEA) && has(state, PIBAO) && has(state, DEBAO) && residents.includes(PIBAO) && residents.includes(DEBAO) && allWishesDone(state, today) && !d.days.includes(today)) {
    d.days.push(today); day = d.days.length;
    if (d.days.length >= NEED.days && grant(state, IDEA, now)) eggs.push(IDEA);
  }
  return { eggs, day };
}

// 三寶同住彩蛋：三位都入住時，每天擲一次；第一次一定出現，之後每天 40% 機率
export function eventDue(state, { residents, today }) {
  if (![PIBAO, DEBAO, IDEA].every((no) => has(state, no) && residents.includes(no))) return false;
  return (state.devteam?.event || '') !== today;
}
export function rollEvent(state, today, rand = Math.random) {
  const d = ensureDevteam(state);
  if (d.event === today) return false;
  d.event = today;
  const show = !d.eventSeen || rand() < 0.4;
  if (show) d.eventSeen = true;
  return show;
}
