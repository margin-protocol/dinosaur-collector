// 小湘出勤狀態：討伐列表上方的總覽，不用點進關卡就知道誰在家、誰在休息、誰出門了
import { CHARACTERS } from './eggs.js';
import { siangPower, restLeft } from './battle.js';

// 每位已收集的小湘一筆：kind = ready（可出戰）／rest（打完在休息）／busy（出門、討伐、調配中）
export function siangStatuses(state, now = Date.now()) {
  const busy = new Map();
  const mark = (no, label, until) => { if (!busy.has(no)) busy.set(no, { label, left: until ? Math.max(0, Date.parse(until) - now) : null }); };
  for (const a of state.battle?.active || []) {
    const back = Date.parse(a.until) <= now;
    for (const no of a.nos) mark(no, back ? '戰報待收' : '討伐中', back ? null : a.until);
  }
  for (const e of state.errands?.active || []) {
    const back = Date.parse(e.until) <= now;
    for (const no of e.nos) mark(no, back ? '回來了' : e.place ? '出門中' : '在家幫忙', back ? null : e.until);
  }
  for (const no of state.lab?.members || []) mark(no, '調配中', state.lab.until);
  const list = Object.keys(CHARACTERS).filter((no) => state.dex?.[no]).map((no) => {
    const power = siangPower(state, no).power;
    if (busy.has(no)) return { no, kind: 'busy', power, ...busy.get(no) };
    const rest = restLeft(state, no, now);
    return rest > 0 ? { no, kind: 'rest', power, label: '休息中', left: rest } : { no, kind: 'ready', power, label: '可出戰', left: null };
  });
  const order = { ready: 0, rest: 1, busy: 2 };
  // 可出戰的照戰力排；休息和忙碌的照「誰最快回來」排，沒有時間的（戰報待收）放最前面，提醒去收
  list.sort((a, b) => order[a.kind] - order[b.kind] || (a.kind === 'ready' ? b.power - a.power : (a.left ?? -1) - (b.left ?? -1)) || a.no.localeCompare(b.no));
  return list;
}

export function statusCounts(list) {
  return list.reduce((c, s) => { c[s.kind] += 1; return c; }, { ready: 0, rest: 0, busy: 0 });
}
