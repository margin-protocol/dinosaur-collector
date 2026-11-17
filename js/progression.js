import { todayKey, wishesFor, legacyWishesFor, wishById, actProgress, QUIZZES, WISH_REWARD, WISH_POOL, WISHES_PER_DAY } from './wishes.js';
import { ensureWishEgg, stampDay } from './wish-egg.js';
import { ensureTravel } from './travel.js';
import { ensureWeather } from './weather.js';
import { ensureGifts } from './gifts.js';
import { ensureShelf, CHARACTERS } from './eggs.js';
import { ensureErrands } from './errands.js';
import { ensureBonus } from './energy.js';
import { ensureLetters } from './letters.js';
import { ensureDino } from './dino.js';
import { ensureAchievements } from './achievements.js';
import { ensureRecipes } from './recipes.js';
import { ensureBingo } from './bingo.js';
import { ensureMissions } from './commissions.js';
export const DAILY_XP = 10;
export const GROWTH_XP = 20;
export const GROWTH_ENERGY = 20;
export const XP_PER_LEVEL = 100;
const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
const unique = values => [...new Set(Array.isArray(values) ? values.filter(v => typeof v === 'string') : [])];
export const playerLevel = state => Math.floor(count(state.player?.xp) / XP_PER_LEVEL) + 1;
export const rankTitle = level => ['初見研究者', '新芽研究者', '同行研究者', '尋光研究者'][level - 1] || '星願研究者';

const dayBase = state => ({ pets: count(state.bonus?.total?.pets), greets: count(state.bonus?.total?.greets), explores: count(state.bonus?.total?.explores), departed: count(state.errands?.departed) });
export function ensureDaily(state, date = todayKey()) {
  if (!state.wishes || state.wishes.date !== date) {
    const ids = wishesFor(date).map(w => w.id);
    // 還沒有小湘的話，摸摸頭、打招呼、出門做不到，換成小恐龍的問題
    if (!Object.keys(state.dex || {}).length && /^act:(pet|greet|errand)$/.test(ids[1])) ids[1] = `quiz:${Number(date.replaceAll('-', '')) % QUIZZES.length}`;
    state.wishes = { date, done: [], stage: state.dex['001'] ? 'young' : 'egg', ids, base: dayBase(state) };
  }
  if (!state.wishes.stage) state.wishes.stage = state.dex['001'] ? 'young' : 'egg';
  // 改版當天已經開始的一天：沿用原本的三個顏色願望，不會中途換掉
  if (!Array.isArray(state.wishes.ids) || state.wishes.ids.length !== WISHES_PER_DAY || !state.wishes.ids.every(id => wishById(id))) state.wishes.ids = legacyWishesFor(date).map(w => w.id);
  if (!state.wishes.base || typeof state.wishes.base !== 'object') state.wishes.base = dayBase(state);
  const valid = state.wishes.ids;
  state.wishes.done = unique(state.wishes.done).filter(id => valid.includes(id));
}
export function todaysWishList(state) {
  ensureDaily(state);
  return state.wishes.ids.map(wishById);
}

// Old progress is preserved. Only verifiable current-day completions seed counters;
// previously paid wishes receive neither energy nor retroactive XP on migration.
export function hydrateProgression(state) {
  const oldDone = state.wishes?.date === todayKey() ? unique(state.wishes.done).filter(id => WISH_POOL.some(w => w.id === id)) : [];
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
  ensureLetters(state);
  ensureDino(state, todayKey());
  ensureAchievements(state);
  ensureRecipes(state);
  ensureBingo(state);
  ensureMissions(state);
  ensureErrands(state);
  // 三選一只給剛換上的普通蛋；蛋已經換了或開始孵，就收起選單
  if (state.eggOffer && !(Array.isArray(state.eggOffer) && state.egg?.id === 'ordinary' && !state.egg.warmth && !state.egg.flavor)) state.eggOffer = null;
  if (!state.cradle || !(state.cradle.slots >= 1)) state.cradle = { slots: 1 };
  return state;
}
export function completeDaily(state, date, id) {
  ensureDaily(state);
  const wish = date === todayKey() && state.wishes.ids.includes(id) ? wishById(id) : null;
  if (!wish || state.wishes.done.includes(id)) return { awarded: false };
  if (wish.kind === 'act' && !actProgress(wish, state)?.ready) return { awarded: false };
  const levelBefore = playerLevel(state);
  state.wishes.done.push(id);
  state.energy += WISH_REWARD;
  state.player.xp += DAILY_XP;
  state.player.stats.wishes += 1;
  if (wish.kind === 'color') state.player.stats.colors = unique([...state.player.stats.colors, id]);
  if (wish.kind === 'duo') state.player.stats.colors = unique([...state.player.stats.colors, ...wish.colors]);
  state.player.stats.days = unique([...state.player.stats.days, date]);
  const stamp = state.wishes.done.length >= WISHES_PER_DAY ? stampDay(state, date) : null;
  return { awarded: true, levelBefore, stamp };
}
const goal = (title, hint, metric, target, destination) => ({ title, hint, metric, target, destination });
export function growthGoals(level) {
  const chapters = [
    { name: '初次相遇', reward: { energy: 30 }, goals: [goal('第一次心願', '完成 1 個每日願望', 'wishes', 1, 'daily'), goal('暖暖的照顧', '為蛋注入 10 能量', 'fed', 10, 'incubate'), goal('初次相遇', '孵出原味小湘', 'origin', 1, 'incubate')] },
    { name: '一起生活', reward: { egg: 'wish' }, goals: [goal('把日常存起來', '累計完成 5 個每日願望', 'wishes', 5, 'daily'), goal('暖意慢慢累積', '累計注入 150 能量', 'fed', 150, 'incubate'), goal('新的敲門聲', '累計孵化 2 顆蛋', 'hatched', 2, 'incubate')] },
    { name: '走出門看看', reward: { fossils: 5 }, goals: [goal('第一次跑腿', '派小湘出門 1 次', 'errands', 1, 'errands'), goal('聽聽附近的訊號', '按「探索附近」1 次', 'explores', 1, 'home'), goal('第三次相遇', '累計孵化 3 顆蛋', 'hatched', 3, 'incubate')] },
    { name: '收藏世界的顏色', reward: { egg: 'wish' }, goals: [goal('四種顏色的信', '累計完成 4 種顏色願望', 'colors', 4, 'daily'), goal('十二次小心願', '累計完成 12 個每日願望', 'wishes', 12, 'daily'), goal('熱鬧起來了', '收集 5 位不同的小湘', 'dex', 5, 'dex')] },
    { name: '陪伴的練習', reward: { slot: true }, goals: [goal('五天的日常', '在 5 個不同日子完成願望，不必連續', 'days', 5, 'daily'), goal('摸摸頭', '累計幫小湘摸摸頭 20 次', 'pets', 20, 'home'), goal('常常出門', '累計派小湘出門 5 次', 'errands', 5, 'errands')] },
    { name: '小小旅行家', reward: { egg: 'weather' }, goals: [goal('路上的故事', '兩位小湘一起出門，發現 1 個旅行故事', 'stories', 1, 'errands'), goal('換個地方', '在 2 個不同縣市按「探索附近」', 'counties', 2, 'home'), goal('隨手收藏', '累計隨手拍 30 張', 'snaps', 30, 'daily')] },
    { name: '一起慢慢長大', reward: { egg: 'wish' }, goals: [goal('八日的約定', '在 8 個不同日子完成願望，不必連續', 'days', 8, 'daily'), goal('三十個小願望', '累計完成 30 個每日願望', 'wishes', 30, 'daily'), goal('熱鬧的家', '累計孵化 6 顆蛋', 'hatched', 6, 'incubate')] },
    { name: '系列收藏家', reward: { fossils: 10 }, goals: [goal('同一國的', '任一系列收集到 4 位（縣市除外）', 'seriesMax', 4, 'dex'), goal('十位夥伴', '收集 10 位不同的小湘', 'dex', 10, 'dex'), goal('跑腿達人', '累計派小湘出門 12 次', 'errands', 12, 'errands')] },
    { name: '小恐龍的好朋友', reward: { egg: 'wish' }, goals: [goal('天天打招呼', '累計跟小湘打招呼 30 次', 'greets', 30, 'home'), goal('幫小恐龍的忙', '完成小恐龍的委託 10 次', 'tasks', 10, 'home'), goal('故事收藏', '發現 3 個旅行故事', 'stories', 3, 'errands')] },
    { name: '把溫暖留下來', reward: { slot: true }, goals: [goal('十五天的日常', '在 15 個不同日子完成願望', 'days', 15, 'daily'), goal('滿滿的能量', '累計注入 2000 能量', 'fed', 2000, 'incubate'), goal('十五位夥伴', '收集 15 位不同的小湘', 'dex', 15, 'dex')] },
    { name: '走遍各地', reward: { fossils: 15 }, goals: [goal('三個地方', '在 3 個不同縣市按「探索附近」', 'counties', 3, 'home'), goal('家鄉的明信片', '收到 2 張家鄉明信片（縣市小湘去遠行）', 'cards', 2, 'errands'), goal('二十五趟旅行', '累計派小湘出門 25 次', 'errands', 25, 'errands')] },
    { name: '星願研究者', reward: { egg: 'wish', fossils: 20 }, goals: [goal('二十天的日常', '在 20 個不同日子完成願望', 'days', 20, 'daily'), goal('二十五位夥伴', '收集 25 位不同的小湘', 'dex', 25, 'dex'), goal('說不完的故事', '發現 5 個旅行故事', 'stories', 5, 'errands')] },
  ];
  const n = level - chapters.length;
  const chapter = chapters[level - 1] || { name: `同行旅程 · ${level}`, reward: { fossils: 10 }, goals: [goal('繼續一起過日子', `在 ${20 + n * 3} 個不同日子完成願望`, 'days', 20 + n * 3, 'daily'), goal('繼續出門', `累計派小湘出門 ${25 + n * 8} 次`, 'errands', 25 + n * 8, 'errands'), goal('繼續孵蛋', `累計孵化 ${6 + n * 3} 顆蛋`, 'hatched', 6 + n * 3, 'incubate')] };
  return { ...chapter, level, goals: chapter.goals.map((g, i) => ({ ...g, id: `growth:${level}:${i + 1}` })) };
}
export const SLOT_MAX = 3;
export function describeChapterReward(r) {
  const parts = [];
  if (r.energy) parts.push(`${r.energy} 能量`);
  if (r.egg === 'wish') parts.push('一顆願望蛋');
  if (r.egg === 'weather') parts.push('一顆天氣蛋');
  if (r.fossils) parts.push(`${r.fossils} 化石`);
  if (r.slot) parts.push('蛋架擴充一格（滿了改成 20 化石）');
  return parts.join(' + ');
}
// 一章三個都領完：直接升到下一級，並發章節獎勵（每章一次）
function finishChapter(state, level) {
  const chapter = growthGoals(level);
  if (!chapter.goals.every(g => state.player.claimed.includes(g.id))) return null;
  state.player.chapters = unique(state.player.chapters);
  const key = String(level);
  if (state.player.chapters.includes(key)) return null;
  state.player.chapters.push(key);
  const r = chapter.reward || {};
  if (r.energy) state.energy += r.energy;
  if (r.egg === 'wish') state.wishEgg.stock += 1;
  if (r.egg === 'weather') state.weather.stock += 1;
  if (r.fossils) state.fossils = (state.fossils || 0) + r.fossils;
  if (r.slot) {
    const slots = state.cradle?.slots || 1;
    if (slots < SLOT_MAX) state.cradle = { ...(state.cradle || {}), slots: slots + 1 };
    else state.fossils = (state.fossils || 0) + 20;
  }
  if (playerLevel(state) <= level) state.player.xp = Math.max(state.player.xp, level * XP_PER_LEVEL);
  return { level, name: chapter.name, reward: describeChapterReward(r) };
}
const owned = state => Object.keys(state.dex || {});
export function goalProgress(state, goal) {
  let current;
  const total = state.bonus?.total || {};
  if (goal.metric === 'origin') current = state.dex['001'] ? 1 : 0;
  else if (goal.metric === 'hatched') current = count(state.hatched);
  else if (['colors', 'days'].includes(goal.metric)) current = state.player.stats[goal.metric].length;
  else if (goal.metric === 'errands') current = count(state.errands?.total);
  else if (goal.metric === 'stories') current = Object.keys(state.errands?.stories || {}).length;
  else if (goal.metric === 'cards') current = Object.keys(state.errands?.cards || {}).length;
  else if (goal.metric === 'counties') current = Object.keys(state.travel?.visits || {}).length;
  else if (goal.metric === 'dex') current = owned(state).length;
  else if (goal.metric === 'seriesMax') current = goalSeriesMax(state);
  else if (['explores', 'pets', 'greets', 'tasks', 'snaps'].includes(goal.metric)) current = count(total[goal.metric]);
  else current = count(state.player.stats[goal.metric]);
  return { current: Math.min(current, goal.target), complete: current >= goal.target, claimed: state.player.claimed.includes(goal.id) };
}
const seriesOf = no => CHARACTERS[no]?.series || null;
function goalSeriesMax(state) {
  const tally = {};
  for (const no of owned(state)) { const sr = seriesOf(no); if (sr && sr !== 'county') tally[sr] = (tally[sr] || 0) + 1; }
  return Math.max(0, ...Object.values(tally));
}
// Called inside the shared save lock, never as a side effect of reading a save.
export function reconcileGrowthEnergy(state) {
  const paid = new Set(state.player.energyClaimed);
  const missing = state.player.claimed.filter(id => /^growth:[1-9]\d*:[1-3]$/.test(id) && !paid.has(id));
  state.player.energyClaimed.push(...missing);
  const amount = missing.length * GROWTH_ENERGY;
  state.energy += amount;
  // 改版前就已經領完三個的章節：補發章節獎勵並升級
  state.player.chapterNotes = [];
  for (let level = 1; level <= playerLevel(state) && level < 200; level++) {
    const done = finishChapter(state, level);
    if (done) state.player.chapterNotes.push(done);
  }
  if (!state.player.chapterNotes.length) delete state.player.chapterNotes;
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
  const chapter = finishChapter(state, level);
  return { awarded: true, levelBefore, chapter };
}
