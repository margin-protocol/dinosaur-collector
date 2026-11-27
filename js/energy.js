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
    pets: { date: day(old.pets).date, count: Number.isSafeInteger(old.pets?.count) ? old.pets.count : 0 },
    snacks: { date: day(old.snacks).date, count: Number.isSafeInteger(old.snacks?.count) ? old.snacks.count : 0 },
    // 累計次數（成就用，不會每天歸零）
    total: Object.fromEntries(['pets', 'snacks', 'snaps', 'greets', 'taps', 'tasks', 'nightHatch', 'explores', 'gifts'].map((k) => [k, Number.isSafeInteger(old.total?.[k]) ? old.total[k] : 0])),
    // 今天拍過的照片指紋（只存雜湊，不存照片），用來提醒重複的照片
    photos: { date: day(old.photos).date, hashes: Array.isArray(old.photos?.hashes) ? old.photos.hashes.filter((h) => typeof h === 'string').slice(-40) : [] },
  };
  return state.bonus;
}

export function accruePassive(state, eggs, now = Date.now()) {
  const b = ensureBonus(state);
  const since = b.passiveAt ? Date.parse(b.passiveAt) : NaN;
  if (!Number.isFinite(since) || since > now) { b.passiveAt = new Date(now).toISOString(); return 0; }
  const hours = Math.floor((now - since) / HOUR);
  if (hours < 1) return 0;
  const amount = Math.min(hours, PASSIVE.maxHours) * (PASSIVE.perHour + (state.title?.buff?.passive | 0)); // 孵化類稱號 +1/小時
  const warm = (egg) => { const need = eggs[egg.id]?.warmthNeeded || 0; const add = Math.max(0, Math.min(amount, need - egg.warmth)); egg.warmth += add; return add; };
  // 還在三選一時，培養架上沒有真正的蛋，不保溫
  const add = state.eggOffer ? 0 : warm(state.egg);
  // 副架上的蛋也會保溫（蛋架升級後）
  const extra = Math.max(0, (state.cradle?.slots || 1) - 1);
  (state.shelf || []).slice(0, extra).forEach(warm);
  b.passiveAt = new Date(hours > PASSIVE.maxHours ? now : since + hours * HOUR).toISOString();
  return add;
}

export const giftReady = (state, today) => state.bonus?.gift !== today;
export function claimGift(state, today) {
  const b = ensureBonus(state);
  if (b.gift === today) return 0;
  b.gift = today; b.total.gifts += 1; state.energy += DAILY_GIFT; return DAILY_GIFT;
}

export const snapsToday = (state, today) => (state.bonus?.snaps?.date === today ? state.bonus.snaps.count : 0);
export function takeSnap(state, today) {
  const b = ensureBonus(state);
  if (b.snaps.date !== today) b.snaps = { date: today, count: 0 };
  if (b.snaps.count >= SNAP.perDay) return 0;
  b.snaps.count += 1; b.total.snaps += 1; state.energy += SNAP.reward; return SNAP.reward;
}

export function greet(state, no, today) {
  const b = ensureBonus(state);
  b.total.taps = (b.total.taps || 0) + 1; // 每點一次都算（每日願望「打招呼」用）
  if (b.greets.date !== today) b.greets = { date: today, ids: [] };
  if (b.greets.ids.includes(no)) return 0;
  b.greets.ids.push(no); b.total.greets += 1; state.energy += GREET_REWARD; return GREET_REWARD;
}

// 摸摸頭：每次 +2 能量，每天最多 5 次（之後還是可以摸，只是不給能量）
export const PET = { reward: 2, perDay: 5 };
// 餵點心：把點心拖到小湘身上，每次 +5 能量，每天 3 份
export const SNACK = { reward: 5, perDay: 3 };
const countFor = (state, field, today) => (state.bonus?.[field]?.date === today ? state.bonus[field].count : 0);
function bump(state, field, today, limit, reward) {
  ensureBonus(state);
  const cur = state.bonus[field]?.date === today ? state.bonus[field] : { date: today, count: 0 };
  state.bonus.total[field] = (state.bonus.total[field] || 0) + 1;
  if (cur.count >= limit) { state.bonus[field] = cur; return 0; }
  state.bonus[field] = { date: today, count: cur.count + 1 }; state.energy += reward; return reward;
}
export const petsToday = (state, today) => countFor(state, 'pets', today);
export const snacksLeft = (state, today) => SNACK.perDay - countFor(state, 'snacks', today);
export const pet = (state, today) => bump(state, 'pets', today, PET.perDay, PET.reward);
export const feedSnack = (state, today) => bump(state, 'snacks', today, SNACK.perDay, SNACK.reward);

// 照片指紋：今天拍過很像的照片就提醒（只比對同一天）
export function photoSeen(state, hash, today, similar) {
  const p = state.bonus?.photos;
  return Boolean(p && p.date === today && p.hashes.some((h) => similar(h, hash)));
}
export function rememberPhoto(state, hash, today) {
  const b = ensureBonus(state);
  if (b.photos.date !== today) b.photos = { date: today, hashes: [] };
  b.photos.hashes = [...b.photos.hashes, hash].slice(-40);
}
