// 小恐龍轉盤：每天 3 次，押能量轉轉盤，以小換大。
// 先決定結果並存檔，畫面再轉到那一格；重新整理不會重轉。
import { todayKey } from './wishes.js';

export const WHEEL_SPINS = 3;
export const STAKES = [10, 20, 50];

// 8 格，順時針排列；weight 是出現權重（期望值約 1.09 倍，平均來說小賺一點點）
export const SEGMENTS = [
  { id: 'zero', label: '槓龜', short: '0×', times: 0, weight: 22, color: '#4a3f5c', line: '嗚嗚，能量被轉盤吃掉了……' },
  { id: 'x2', label: '2 倍', short: '2×', times: 2, weight: 12, color: '#f0b03a', line: '兩倍！小恐龍幫你拍手！' },
  { id: 'half', label: '一半', short: '½', times: 0.5, weight: 18, color: '#6b5b84', line: '拿回一半，還好還好。' },
  { id: 'fossil', label: '化石', short: '🦴', times: 1, fossils: 2, weight: 6, color: '#b08a5a', line: '能量拿回來，還挖到 2 塊化石！' },
  { id: 'x1', label: '保本', short: '1×', times: 1, weight: 18, color: '#8a7aa8', line: '原封不動拿回來，不賺不賠。' },
  { id: 'x3', label: '3 倍', short: '3×', times: 3, weight: 6, color: '#e07ac0', line: '三倍！今天手氣超好！' },
  { id: 'x15', label: '1.5 倍', short: '1.5×', times: 1.5, weight: 16, color: '#7fb0d8', line: '小賺一點，不錯喔～' },
  { id: 'jackpot', label: '大獎', short: '5×', times: 5, weight: 2, color: '#ffd36b', line: '大、大獎！五倍！小恐龍嚇到尾巴都翹起來了！' },
];

export function ensureWheel(state, date = todayKey()) {
  const old = state.wheel || {};
  const total = old.total && typeof old.total === 'object' ? old.total : { spins: 0, won: 0, lost: 0, jackpots: 0 };
  state.wheel = old.date === date ? { ...old, total } : { date, used: 0, last: null, total };
  if (!Number.isSafeInteger(state.wheel.used) || state.wheel.used < 0) state.wheel.used = 0;
  return state.wheel;
}

export const spinsLeft = (state) => Math.max(0, WHEEL_SPINS - (state.wheel?.date === todayKey() ? state.wheel.used : 0));

function pickSegment(rand) {
  const total = SEGMENTS.reduce((n, s) => n + s.weight, 0);
  let r = rand() * total;
  for (let i = 0; i < SEGMENTS.length; i++) { r -= SEGMENTS[i].weight; if (r < 0) return i; }
  return 0;
}

// 回傳錯誤字串，或 { index, stake, payout, fossils, net }
export function spin(state, stake, rand = Math.random) {
  const wheel = ensureWheel(state);
  if (!STAKES.includes(stake)) return '請選要押多少能量。';
  if (wheel.used >= WHEEL_SPINS) return '今天的 3 次轉完了，明天再來！';
  if (state.energy < stake) return `能量不夠 ${stake} 點，先去完成願望或收下見面禮吧。`;
  const index = pickSegment(rand);
  const seg = SEGMENTS[index];
  const payout = Math.round(stake * seg.times);
  state.energy += payout - stake;
  if (seg.fossils) state.fossils = (state.fossils || 0) + seg.fossils;
  wheel.used += 1;
  const net = payout - stake;
  wheel.total.spins += 1;
  if (net > 0) wheel.total.won += net; else wheel.total.lost += -net;
  if (seg.id === 'jackpot') wheel.total.jackpots += 1;
  wheel.last = { index, stake, payout, at: new Date().toISOString() };
  return { index, stake, payout, fossils: seg.fossils || 0, net };
}
