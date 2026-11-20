// 月簽到（湘 11/20）：每天打開遊戲按一次「簽到」，同一個月累積到 7／14／21／28 天各有獎勵；28 天送一顆星光蛋（一定是 SR 以上）。
// 每個月 1 號重新開始；漏掉的日子不能補簽。用手機的本地日期。
export const CHECKIN_REWARDS = [
  { days: 7, label: '20 能量', energy: 20 },
  { days: 14, label: '3 化石', fossils: 3 },
  { days: 21, label: '30 能量', energy: 30 },
  { days: 28, label: '星光蛋（SR 以上）', egg: 'star' },
];

const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function ensureCheckin(state, now = new Date()) {
  const old = state.checkin && typeof state.checkin === 'object' ? state.checkin : {};
  const month = monthKey(now);
  if (old.month !== month) {
    state.checkin = { month, days: [], claimed: [], total: Number.isSafeInteger(old.total) ? old.total : 0, months: Number.isSafeInteger(old.months) ? old.months : 0 };
    return state.checkin;
  }
  const days = [...new Set((Array.isArray(old.days) ? old.days : []).filter((d) => Number.isSafeInteger(d) && d >= 1 && d <= 31))].sort((a, b) => a - b);
  const claimed = [...new Set((Array.isArray(old.claimed) ? old.claimed : []).filter((d) => CHECKIN_REWARDS.some((r) => r.days === d)))];
  state.checkin = { month, days, claimed, total: Number.isSafeInteger(old.total) ? old.total : days.length, months: Number.isSafeInteger(old.months) ? old.months : 0 };
  return state.checkin;
}

export const checkedToday = (state, now = new Date()) => state.checkin?.month === monthKey(now) && state.checkin.days.includes(now.getDate());

// 簽到：回傳 null（今天簽過了）或 { count, rewards: [獎勵] }；獎勵直接發
export function checkIn(state, now = new Date()) {
  const c = ensureCheckin(state, now);
  if (c.days.includes(now.getDate())) return null;
  c.days.push(now.getDate()); c.days.sort((a, b) => a - b); c.total += 1;
  const rewards = [];
  for (const r of CHECKIN_REWARDS) {
    if (c.days.length < r.days || c.claimed.includes(r.days)) continue;
    c.claimed.push(r.days);
    if (r.energy) state.energy = (state.energy || 0) + r.energy;
    if (r.fossils) state.fossils = (state.fossils || 0) + r.fossils;
    if (r.egg) { state.gifts.eggs.push({ egg: r.egg, from: `checkin-${c.month}`, at: now.toISOString() }); c.months += 1; }
    rewards.push(r);
  }
  return { count: c.days.length, rewards };
}

export const daysInMonth = (now = new Date()) => new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
