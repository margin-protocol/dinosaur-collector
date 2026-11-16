// 額外的能量來源（讓每天不只三個願望）：
// - 培養架自動保溫：每小時 +5 溫度給正在培育的蛋，離開最多累積 12 小時
// - 每日見面禮：每天一次 +30 能量（點小恐龍或首頁禮物領取）
// - 隨手收藏：拍任何喜歡的東西，每張 +10 能量，每天最多 10 張
// - 跟入住的小湘打招呼：每位每天一次 +5 能量
export const PASSIVE = { perHour: 5, maxHours: 12 };
export const DAILY_GIFT = 30;
export const SNAP = { reward: 10, perDay: 10 };
export const GREET_REWARD = 5;
const HOUR = 3600 * 1000;
const str = (v) => (typeof v === 'string' ? v : null);

export function ensureBonus(state) {
  const old = state.bonus || {};
  const day = (o) => (o && str(o.date) ? o : { date: null });
  state.bonus = {
    passiveAt: str(old.passiveAt),
    gift: str(old.gift),
    explored: str(old.explored),
    snaps: { date: day(old.snaps).date, count: Number.isSafeInteger(old.snaps?.count) ? old.snaps.count : 0 },
    greets: { date: day(old.greets).date, ids: Array.isArray(old.greets?.ids) ? old.greets.ids.filter((v) => typeof v === 'string') : [] },
  };
  return state.bonus;
}

export function accruePassive(state, eggs, now = Date.now()) {
  const b = ensureBonus(state);
  const since = b.passiveAt ? Date.parse(b.passiveAt) : NaN;
  if (!Number.isFinite(since) || since > now) { b.passiveAt = new Date(now).toISOString(); return 0; }
  const hours = Math.floor((now - since) / HOUR);
  if (hours < 1) return 0;
  const need = eggs[state.egg.id]?.warmthNeeded || 0;
  const add = Math.max(0, Math.min(Math.min(hours, PASSIVE.maxHours) * PASSIVE.perHour, need - state.egg.warmth));
  state.egg.warmth += add;
  b.passiveAt = new Date(hours > PASSIVE.maxHours ? now : since + hours * HOUR).toISOString();
  return add;
}

export const giftReady = (state, today) => state.bonus?.gift !== today;
export function claimGift(state, today) {
  const b = ensureBonus(state);
  if (b.gift === today) return 0;
  b.gift = today; state.energy += DAILY_GIFT; return DAILY_GIFT;
}

export const snapsToday = (state, today) => (state.bonus?.snaps?.date === today ? state.bonus.snaps.count : 0);
export function takeSnap(state, today) {
  const b = ensureBonus(state);
  if (b.snaps.date !== today) b.snaps = { date: today, count: 0 };
  if (b.snaps.count >= SNAP.perDay) return 0;
  b.snaps.count += 1; state.energy += SNAP.reward; return SNAP.reward;
}

export function greet(state, no, today) {
  const b = ensureBonus(state);
  if (b.greets.date !== today) b.greets = { date: today, ids: [] };
  if (b.greets.ids.includes(no)) return 0;
  b.greets.ids.push(no); state.energy += GREET_REWARD; return GREET_REWARD;
}
