import { todayKey, wishesFor, WISH_REWARD, WISH_POOL, WISHES_PER_DAY } from './wishes.js';
import { ensureWishEgg, stampDay } from './wish-egg.js';
import { ensureTravel } from './travel.js';
import { ensureWeather } from './weather.js';
import { ensureGifts } from './gifts.js';
import { ensureShelf } from './eggs.js';
import { ensureBonus } from './energy.js';
export const DAILY_XP = 10;
export const GROWTH_XP = 20;
export const GROWTH_ENERGY = 20;
export const XP_PER_LEVEL = 100;
const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
const unique = values => [...new Set(Array.isArray(values) ? values.filter(v => typeof v === 'string') : [])];
export const playerLevel = state => Math.floor(count(state.player?.xp) / XP_PER_LEVEL) + 1;
export const rankTitle = level => ['初見研究者', '新芽研究者', '同行研究者', '尋光研究者'][level - 1] || '星願研究者';

export function ensureDaily(state, date = todayKey()) {
  if (!state.wishes || state.wishes.date !== date) state.wishes = { date, done: [], stage: state.dex['001'] ? 'young' : 'egg' };
  if (!state.wishes.stage) state.wishes.stage = state.dex['001'] ? 'young' : 'egg';
  const valid = wishesFor(date).map(w => w.id);
  state.wishes.done = unique(state.wishes.done).filter(id => valid.includes(id));
}

// Old progress is preserved. Only verifiable current-day completions seed counters;
// previously paid wishes receive neither energy nor retroactive XP on migration.
export function hydrateProgression(state) {
  const oldDone = state.wishes?.date === todayKey() ? unique(state.wishes.done).filter(id => wishesFor(todayKey()).some(w => w.id === id)) : [];
  const old = state.player;
  if (!old || old.version !== 1) {
    state.player = { version: 1, xp: 0, claimed: [], energyClaimed: [], stats: { wishes: oldDone.length, fed: Math.max(count(state.egg?.warmth), state.hatched > 0 ? 10 : 0), colors: oldDone, days: oldDone.length ? [todayKey()] : [] } };
  } else {
    state.player = { ...old, xp: count(old.xp), claimed: unique(old.claimed), energyClaimed: unique(old.energyClaimed), stats: { wishes: count(old.stats?.wishes), fed: count(old.stats?.fed), colors: unique(old.stats?.colors).filter(id => WISH_POOL.some(w => w.id === id)), days: unique(old.stats?.days) } };
  }
  ensureDaily(state);
  ensureWishEgg(state);
  ensureTravel(state);
  ensureWeather(state);
  ensureGifts(state);
  ensureShelf(state);
  ensureBonus(state);
  return state;
}
export function completeDaily(state, date, id) {
  ensureDaily(state);
  if (date !== todayKey() || !wishesFor(date).some(w => w.id === id) || state.wishes.done.includes(id)) return { awarded: false };
  const levelBefore = playerLevel(state);
  state.wishes.done.push(id);
  state.energy += WISH_REWARD;
  state.player.xp += DAILY_XP;
  state.player.stats.wishes += 1;
  state.player.stats.colors = unique([...state.player.stats.colors, id]);
  state.player.stats.days = unique([...state.player.stats.days, date]);
  const stamp = state.wishes.done.length >= WISHES_PER_DAY ? stampDay(state, date) : null;
  return { awarded: true, levelBefore, stamp };
}
const goal = (title, hint, metric, target, destination) => ({ title, hint, metric, target, destination });
export function growthGoals(level) {
  const chapters = [
    { name: '初次相遇', goals: [goal('第一次心願', '完成 1 個每日願望', 'wishes', 1, 'daily'), goal('暖暖的照顧', '為蛋注入 10 能量', 'fed', 10, 'incubate'), goal('初次相遇', '孵出原味小湘', 'origin', 1, 'incubate')] },
    { name: '一起生活', goals: [goal('把日常存起來', '累計完成 5 個每日願望', 'wishes', 5, 'daily'), goal('暖意慢慢累積', '累計注入 150 能量', 'fed', 150, 'incubate'), goal('新的敲門聲', '累計孵化 2 顆蛋', 'hatched', 2, 'incubate')] },
    { name: '收藏世界的顏色', goals: [goal('四種顏色的信', '累計完成 4 種顏色願望', 'colors', 4, 'daily'), goal('十二次小心願', '累計完成 12 個每日願望', 'wishes', 12, 'daily'), goal('第三次相遇', '累計孵化 3 顆蛋', 'hatched', 3, 'incubate')] },
    { name: '陪伴的練習', goals: [goal('五天的日常', '在 5 個不同日子完成願望，不必連續', 'days', 5, 'daily'), goal('一點一點靠近', '累計完成 20 個每日願望', 'wishes', 20, 'daily'), goal('把溫暖留下來', '累計注入 600 能量', 'fed', 600, 'incubate')] },
    { name: '一起慢慢長大', goals: [goal('八日的約定', '在 8 個不同日子完成願望，不必連續', 'days', 8, 'daily'), goal('三十個小願望', '累計完成 30 個每日願望', 'wishes', 30, 'daily'), goal('熱鬧的家', '累計孵化 5 顆蛋', 'hatched', 5, 'incubate')] },
  ];
  const chapter = chapters[level - 1] || { name: `同行旅程 · ${level}`, goals: [goal('繼續收集日常', `累計完成 ${(level - 1) * 10} 個每日願望`, 'wishes', (level - 1) * 10, 'daily'), goal('溫暖的長途旅行', `累計注入 ${(level - 1) * 200} 能量`, 'fed', (level - 1) * 200, 'incubate'), goal('下一次相遇', `累計孵化 ${level} 顆蛋`, 'hatched', level, 'incubate')] };
  return { ...chapter, goals: chapter.goals.map((g, i) => ({ ...g, id: `growth:${level}:${i + 1}` })) };
}
export function goalProgress(state, goal) {
  let current;
  if (goal.metric === 'origin') current = state.dex['001'] ? 1 : 0;
  else if (goal.metric === 'hatched') current = count(state.hatched);
  else if (['colors', 'days'].includes(goal.metric)) current = state.player.stats[goal.metric].length;
  else current = count(state.player.stats[goal.metric]);
  return { current: Math.min(current, goal.target), complete: current >= goal.target, claimed: state.player.claimed.includes(goal.id) };
}
// Called inside the shared save lock, never as a side effect of reading a save.
export function reconcileGrowthEnergy(state) {
  const paid = new Set(state.player.energyClaimed);
  const missing = state.player.claimed.filter(id => /^growth:[1-9]\d*:[1-3]$/.test(id) && !paid.has(id));
  state.player.energyClaimed.push(...missing);
  const amount = missing.length * GROWTH_ENERGY;
  state.energy += amount;
  return amount;
}
export function claimGrowth(state, level, id) {
  if (!Number.isSafeInteger(level) || level < 1 || level > playerLevel(state)) return { awarded: false };
  const goal = growthGoals(level).goals.find(g => g.id === id);
  if (!goal) return { awarded: false };
  const progress = goalProgress(state, goal);
  if (!progress.complete || progress.claimed) return { awarded: false };
  const levelBefore = playerLevel(state);
  state.player.claimed.push(id);
  state.player.xp += GROWTH_XP;
  if (!state.player.energyClaimed.includes(id)) {
    state.energy += GROWTH_ENERGY;
    state.player.energyClaimed.push(id);
  }
  return { awarded: true, levelBefore };
}
