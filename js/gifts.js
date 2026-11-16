// 湘送的禮物：暗號、照片委託、約會碼的獎勵都從這裡發。
// 獎勵格式：{ type: 'energy', amount } | { type: 'egg', egg: 'wish' | 'weather' | 'cipher' } | { type: 'character', no }
const str = (v) => typeof v === 'string';

export function ensureGifts(state) {
  const old = state.gifts || {};
  state.gifts = {
    eggs: Array.isArray(old.eggs) ? old.eggs.filter((e) => e && str(e.egg)) : [], // 尚未拿出來的禮物蛋
    redeemed: Array.isArray(old.redeemed) ? [...new Set(old.redeemed.filter(str))] : [], // 已兌換的暗號（雜湊）
    reviews: Array.isArray(old.reviews) ? [...new Set(old.reviews.filter(str))] : [], // 已領過獎勵的審核結果
    dates: Array.isArray(old.dates) ? [...new Set(old.dates.filter(str))] : [], // 已使用的約會碼
    keepsakes: Array.isArray(old.keepsakes) ? [...new Set(old.keepsakes.filter(str))] : [], // 已送過的紀念蛋（節日-年份、taiwan）
  };
  return state.gifts;
}

export function validReward(r, characters) {
  if (!r || typeof r !== 'object') return false;
  if (r.type === 'energy') return Number.isSafeInteger(r.amount) && r.amount > 0 && r.amount <= 1000;
  if (r.type === 'egg') return ['wish', 'weather', 'cipher', 'date'].includes(r.egg);
  if (r.type === 'character') return Boolean(characters[r.no]);
  return false;
}

export function applyReward(state, reward, from) {
  const g = ensureGifts(state);
  const at = new Date().toISOString();
  if (reward.type === 'energy') state.energy += reward.amount;
  else if (reward.type === 'egg' && reward.egg === 'wish') state.wishEgg.stock += 1;
  else if (reward.type === 'egg' && reward.egg === 'weather') state.weather.stock += 1;
  else if (reward.type === 'egg') g.eggs.push({ egg: reward.egg, from, at });
  else if (reward.type === 'character') g.eggs.push({ egg: 'cipher', character: reward.no, from, at });
}

export function describeReward(reward, characters, eggs) {
  if (reward.type === 'energy') return `${reward.amount} 能量`;
  if (reward.type === 'egg') return `一顆${eggs[reward.egg]?.name || '蛋'}`;
  if (reward.type === 'character') return `一顆暗號蛋（裡面是${characters[reward.no]?.name || '某位小湘'}）`;
  return '神秘獎勵';
}
