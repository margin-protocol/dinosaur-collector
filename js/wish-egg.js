// 願望蛋：每天三個願望全部完成，就得到一枚「願望印記」（不必連續）。
// 集滿 WISH_STAMPS_PER_EGG 枚換一顆願望蛋，存進蛋庫，可在「選擇蛋」裡拿出來培育。
export const WISH_STAMPS_PER_EGG = 3;
const count = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : 0);

export function ensureWishEgg(state) {
  const old = state.wishEgg || {};
  state.wishEgg = {
    stamps: Math.min(count(old.stamps), WISH_STAMPS_PER_EGG - 1),
    stock: count(old.stock),
    days: Array.isArray(old.days) ? [...new Set(old.days.filter((d) => typeof d === 'string'))] : [],
  };
  return state.wishEgg;
}

// 在同一筆存檔交易裡呼叫：當天第一次三願望全完成才給印記，同一天不會重複給
export function stampDay(state, date) {
  const w = ensureWishEgg(state);
  if (w.days.includes(date)) return null;
  w.days.push(date);
  w.stamps += 1;
  let egg = false;
  if (w.stamps >= WISH_STAMPS_PER_EGG) { w.stamps -= WISH_STAMPS_PER_EGG; w.stock += 1; egg = true; }
  return { stamps: w.stamps, stock: w.stock, egg };
}
