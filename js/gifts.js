// 湘送的禮物：暗號、照片委託、約會碼的獎勵都從這裡發。
// 獎勵格式：{ type: 'energy', amount } | { type: 'egg', egg: 'wish' | 'weather' | 'cipher' | 'date' | 'star' | 'mohen' } | { type: 'character', no }
// 全服信箱／兌換碼（湘 11/27）另外加：{ type: 'fossils', amount } | { type: 'token', event: 'mo', amount }（墨玉）| { type: 'candy', rarity, amount }（星光糖）
import { progressOf, EVENT_DEFS } from './events.js';
import { candyOf, CANDY_TIERS } from './candy.js';
const str = (v) => typeof v === 'string';
const amountOk = (n, max) => Number.isSafeInteger(n) && n > 0 && n <= max;
export const GIFT_EGG_IDS = ['wish', 'weather', 'cipher', 'date', 'star', 'mohen'];
export const MAX_REWARDS = 8;

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
  if (r.type === 'energy') return amountOk(r.amount, 9999);
  if (r.type === 'egg') return GIFT_EGG_IDS.includes(r.egg) && (r.count === undefined || amountOk(r.count, 20));
  if (r.type === 'character') return Boolean(characters[r.no]);
  if (r.type === 'fossils') return amountOk(r.amount, 9999);
  if (r.type === 'token') return Boolean(EVENT_DEFS[r.event]?.token) && amountOk(r.amount, 9999);
  if (r.type === 'candy') return CANDY_TIERS.includes(r.rarity) && amountOk(r.amount, 50);
  return false;
}
// 一封信／一組碼可以附好幾樣（rewards 陣列）；舊的只有一樣（reward）
export function rewardList(p, characters) {
  const list = Array.isArray(p?.rewards) ? p.rewards : p?.reward ? [p.reward] : [];
  return list.length <= MAX_REWARDS && list.every((r) => validReward(r, characters)) ? list : null;
}

export function applyReward(state, reward, from) {
  const g = ensureGifts(state);
  const at = new Date().toISOString();
  if (reward.type === 'energy') state.energy += reward.amount;
  else if (reward.type === 'egg') {
    for (let i = 0; i < (reward.count || 1); i += 1) {
      if (reward.egg === 'wish') state.wishEgg.stock += 1;
      else if (reward.egg === 'weather') state.weather.stock += 1;
      else g.eggs.push({ egg: reward.egg, from, at });
    }
  }
  else if (reward.type === 'character') g.eggs.push({ egg: 'cipher', character: reward.no, from, at });
  else if (reward.type === 'fossils') state.fossils = (state.fossils || 0) + reward.amount;
  else if (reward.type === 'token') { const p = progressOf(state, reward.event); p.tokens += reward.amount; p.earned += reward.amount; }
  else if (reward.type === 'candy') candyOf(state)[reward.rarity] += reward.amount;
}
// 要不要提醒玩家「到選擇蛋把它拿出來」
export const rewardIsEgg = (r) => r.type === 'egg' || r.type === 'character';

export function describeReward(reward, characters, eggs) {
  if (reward.type === 'energy') return `${reward.amount} 能量`;
  if (reward.type === 'egg') return `${reward.count > 1 ? `${reward.count} 顆` : '一顆'}${eggs[reward.egg]?.name || '蛋'}`;
  if (reward.type === 'character') return `一顆暗號蛋（裡面是${characters[reward.no]?.name || '某位小湘'}）`;
  if (reward.type === 'fossils') return `${reward.amount} 化石碎片`;
  if (reward.type === 'token') return `${reward.amount} ${EVENT_DEFS[reward.event]?.token?.name || '活動代幣'}`;
  if (reward.type === 'candy') return `${reward.amount} 顆 ${reward.rarity} 星光糖`;
  return '神秘獎勵';
}
