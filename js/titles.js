// 稱號櫃（湘 11/27）：活動稱號＋系列支線稱號放在一起，全遊戲只戴一個，顯示在研究者等級旁邊
// key：活動＝`event:<活動>:<稱號>`；支線＝`side:<線>`
import { EVENT_DEFS, wearTitle as wearEventTitle, wornTitle as wornEventTitle } from './events.js';
import { SIDE_LINES, ensureSide } from './side.js';
import { CHARACTERS, SERIES } from './eggs.js';

export function ownedTitles(state) {
  const out = [];
  for (const [id, line] of Object.entries(SIDE_LINES)) if (line.title) out.push({ key: `side:${id}`, name: line.title, group: '系列支線', owned: Boolean(state.side?.lines?.[id]?.titleAt), how: `「${line.name}」全部三星` });
  for (const [eid, def] of Object.entries(EVENT_DEFS)) for (const [tid, name] of Object.entries(def.titles || {})) {
    const owned = Boolean(state.events?.[eid]?.titles?.includes(tid));
    if (owned) out.push({ key: `event:${eid}:${tid}`, name, group: '活動', owned: true, how: def.name });
  }
  return out;
}
export function wornTitle(state) {
  const sw = state.side?.worn; if (sw && SIDE_LINES[sw]?.title && state.side.lines?.[sw]?.titleAt) return { key: `side:${sw}`, name: SIDE_LINES[sw].title };
  const ev = wornEventTitle(state); return ev ? { key: `event:${ev.eventId}:${ev.id}`, name: ev.name } : null;
}
// key 為 null＝拿下來；回傳戴上的名字或 null
export function wearTitle(state, key) {
  const [kind, a, b] = (key || '').split(':');
  if (kind === 'side' && !state.side?.lines?.[a]?.titleAt) return null;
  if (kind === 'event' && !state.events?.[a]?.titles?.includes(b)) return null;
  wearEventTitle(state, Object.keys(EVENT_DEFS)[0], null); // 清掉活動稱號
  if (state.side) delete state.side.worn;
  if (kind === 'side') { ensureSide(state).worn = a; return SIDE_LINES[a].title; }
  if (kind === 'event') return wearEventTitle(state, a, b);
  return null;
}
// 圖鑑系列徽章：有支線的系列一枚。打通支線＝亮；系列居民也收齊＝金框
export function seriesBadges(state) {
  const seen = new Set(); const out = [];
  for (const line of Object.values(SIDE_LINES)) {
    if (seen.has(line.series)) continue; seen.add(line.series);
    const lines = Object.values(SIDE_LINES).filter((l) => l.series === line.series);
    const lit = lines.some((l) => state.side?.lines?.[l.id]?.doneAt);
    const nos = Object.keys(CHARACTERS).filter((no) => CHARACTERS[no].series === line.series);
    out.push({ series: line.series, name: SERIES[line.series]?.short || line.series, lit, gold: lit && nos.every((no) => state.dex?.[no]) });
  }
  return out;
}
