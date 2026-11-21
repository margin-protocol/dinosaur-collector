import { ensureTeamBonds } from './team-bonds.js';
import { ensureKitchen, RECIPES as DISH_RECIPES } from './kitchen.js';
import { ensureCheckin } from './checkin.js';
import { ensureDupCount } from './unlucky.js';
import { todayKey, wishesFor, legacyWishesFor, wishById, swapWishId, actProgress, QUIZZES, WISH_REWARD, WISH_POOL, WISHES_PER_DAY } from './wishes.js';
import { ensureWishEgg, stampDay } from './wish-egg.js';
import { ensureTravel } from './travel.js';
import { ensureWeather } from './weather.js';
import { ensureGifts } from './gifts.js';
import { ensureShelf, CHARACTERS } from './eggs.js';
import { ensureErrands } from './errands.js';
import { ensureWheel } from './wheel.js';
import { ensureAffection, levelOf, MAX_LEVEL as BOND_MAX } from './affection.js';
import { ensureBattle, CHAPTERS as BATTLE_CHAPTERS } from './battle.js';
import { ensureGuide } from './guide.js';
import { ensureDevteam } from './devteam.js';
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
// 稱號：Lv.1～4 各一個，之後每 4 級換一個，Lv.30 起是「永恆」（湘 11/21 B 案）
export const rankTitle = level => ['初見研究者', '新芽研究者', '同行研究者', '尋光研究者'][level - 1]
  || (level <= 8 ? '星願研究者' : level <= 12 ? '拾光研究者' : level <= 16 ? '遠行研究者' : level <= 20 ? '守護研究者' : level <= 24 ? '織夢研究者' : level <= 29 ? '傳說研究者' : '永恆研究者');

const dayBase = state => ({ pets: count(state.bonus?.total?.pets), greets: count(state.bonus?.total?.greets), taps: count(state.bonus?.total?.taps), explores: count(state.bonus?.total?.explores), departed: count(state.errands?.departed) });
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
// 換一個今日願望：每天只能換一次，已經完成的不能換
export function swapTodayWish(state, index, now = new Date()) {
  ensureDaily(state, todayKey(now));
  const w = state.wishes;
  if (w.swapped) return { ok: false, reason: '今天已經換過一次了，明天再換吧。' };
  const id = w.ids[index];
  if (!id || w.done.includes(id)) return { ok: false, reason: '這個願望已經完成了。' };
  const next = swapWishId(w.date, w.ids, index, { hour: now.getHours(), hasSiang: Object.keys(state.dex || {}).length > 0 });
  if (!next) return { ok: false, reason: '暫時找不到可以換的願望。' };
  w.ids = w.ids.map((x, i) => (i === index ? next : x)); w.swapped = true;
  return { ok: true, from: id, to: next };
}
export function todaysWishList(state) {
  ensureDaily(state);
  return state.wishes.ids.map(wishById);
}

// Old progress is preserved. Only verifiable current-day completions seed counters;
// previously paid wishes receive neither energy nor retroactive XP on migration.
// 合照次數上線前已經拍過的：每位拍過的小湘至少算一次（好感資料裡留著最後合照的日期）
const photosBefore = (state) => Object.values(state.affection || {}).filter((a) => a && typeof a.photo === 'string').length;
export function hydrateProgression(state) {
  const oldDone = state.wishes?.date === todayKey() ? unique(state.wishes.done).filter(id => WISH_POOL.some(w => w.id === id)) : [];
  const old = state.player;
  if (!old || old.version !== 1) {
    state.player = { version: 1, xp: 0, claimed: [], energyClaimed: [], stats: { wishes: oldDone.length, fed: Math.max(count(state.egg?.warmth), state.hatched > 0 ? 10 : 0), colors: oldDone, days: oldDone.length ? [todayKey()] : [], photos: 0 } };
  } else {
    state.player = { ...old, xp: count(old.xp), claimed: unique(old.claimed), energyClaimed: unique(old.energyClaimed), stats: { wishes: count(old.stats?.wishes), fed: count(old.stats?.fed), colors: unique(old.stats?.colors).filter(id => WISH_POOL.some(w => w.id === id)), days: unique(old.stats?.days), photos: Number.isSafeInteger(old.stats?.photos) ? Math.max(0, old.stats.photos) : photosBefore(state) } };
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
  ensureWheel(state);
  ensureAffection(state);
  ensureTeamBonds(state);
  ensureBattle(state);
  ensureDevteam(state);
  ensureGuide(state);
  ensureKitchen(state);
  ensureCheckin(state);
  ensureDupCount(state);
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
    // 第 13～30 章（湘 11/21 選 B 案）
    { name: '遠方的來信', reward: { egg: 'weather' }, goals: [goal('三十位夥伴', '收集 30 位不同的小湘', 'dex', 30, 'dex'), goal('四張明信片', '收到 4 張家鄉明信片（縣市小湘去遠行）', 'cards', 4, 'errands'), goal('四個地方', '在 4 個不同縣市按「探索附近」', 'counties', 4, 'home')] },
    { name: '心意相通', reward: { egg: 'wish' }, goals: [goal('最親近的人', '讓 1 位小湘的好感度升到 Lv.5', 'bond5', 1, 'dex'), goal('一起拍照', '累計和小湘外出合照 10 次', 'photos', 10, 'home'), goal('摸摸頭的習慣', '累計幫小湘摸摸頭 60 次', 'pets', 60, 'home')] },
    { name: '小湘廚房開張', reward: { fossils: 25 }, goals: [goal('開火囉', '在小湘廚房做料理 15 次', 'cooked', 15, 'kitchen'), goal('第一本食譜', '解開 3 道特色料理', 'recipes', 3, 'kitchen'), goal('暖暖的爐火', '累計注入 4000 能量', 'fed', 4000, 'incubate')] },
    { name: '第一場冒險', reward: { egg: 'wish', fossils: 20 }, goals: [goal('出發討伐', '通關 4 個對戰關卡', 'battles', 4, 'battle'), goal('小恐龍的助手', '完成小恐龍的委託 25 次', 'tasks', 25, 'home'), goal('四十趟旅行', '累計派小湘出門 40 次', 'errands', 40, 'errands')] },
    { name: '二十五天的日常', reward: { egg: 'weather' }, goals: [goal('二十五天', '在 25 個不同日子完成願望', 'days', 25, 'daily'), goal('六十個小願望', '累計完成 60 個每日願望', 'wishes', 60, 'daily'), goal('三十五位夥伴', '收集 35 位不同的小湘', 'dex', 35, 'dex')] },
    { name: '熱鬧的大家庭', reward: { egg: 'wish' }, goals: [goal('十五次相遇', '累計孵化 15 顆蛋', 'hatched', 15, 'incubate'), goal('同一國的好朋友', '任一系列收集到 6 位（縣市除外）', 'seriesMax', 6, 'dex'), goal('早安晚安', '累計跟小湘打招呼 80 次', 'greets', 80, 'home')] },
    { name: '好朋友們', reward: { fossils: 30 }, goals: [goal('三位知心好友', '讓 3 位小湘的好感度升到 Lv.5', 'bond5', 3, 'dex'), goal('二十張合照', '累計和小湘外出合照 20 次', 'photos', 20, 'home'), goal('八個故事', '發現 8 個旅行故事', 'stories', 8, 'errands')] },
    { name: '守護的約定', reward: { egg: 'wish', weather: 1 }, goals: [goal('勇敢的隊伍', '通關 8 個對戰關卡', 'battles', 8, 'battle'), goal('四十五位夥伴', '收集 45 位不同的小湘', 'dex', 45, 'dex'), goal('成就收藏', '領取 20 個成就', 'achievements', 20, 'achievements')] },
    { name: '環島的路上', reward: { energy: 100 }, goals: [goal('五個地方', '在 5 個不同縣市按「探索附近」', 'counties', 5, 'home'), goal('八張明信片', '收到 8 張家鄉明信片', 'cards', 8, 'errands'), goal('六十趟旅行', '累計派小湘出門 60 次', 'errands', 60, 'errands')] },
    { name: '拿手好菜', reward: { egg: 'wish' }, goals: [goal('廚房常客', '在小湘廚房做料理 40 次', 'cooked', 40, 'kitchen'), goal('六道特色料理', '解開 6 道特色料理', 'recipes', 6, 'kitchen'), goal('隨手收藏家', '累計隨手拍 80 張', 'snaps', 80, 'daily')] },
    { name: '三十天的日常', reward: { egg: 'weather' }, goals: [goal('三十天', '在 30 個不同日子完成願望', 'days', 30, 'daily'), goal('一百個小願望', '累計完成 100 個每日願望', 'wishes', 100, 'daily'), goal('五十五位夥伴', '收集 55 位不同的小湘', 'dex', 55, 'dex')] },
    { name: '一起寫的故事', reward: { egg: 'wish', weather: 1, fossils: 40, energy: 100 }, goals: [goal('五位知心好友', '讓 5 位小湘的好感度升到 Lv.5', 'bond5', 5, 'dex'), goal('十二個故事', '發現 12 個旅行故事', 'stories', 12, 'errands'), goal('二十五次相遇', '累計孵化 25 顆蛋', 'hatched', 25, 'incubate')] },
    { name: '星星收集家', reward: { egg: 'wish' }, goals: [goal('滿天星星', '對戰關卡累計拿到 24 顆星', 'stars', 24, 'battle'), goal('全部通關', '通關全部 12 個對戰關卡', 'battles', 12, 'battle'), goal('可靠的助手', '完成小恐龍的委託 50 次', 'tasks', 50, 'home')] },
    { name: '滿滿的回憶', reward: { fossils: 30 }, goals: [goal('四十張合照', '累計和小湘外出合照 40 次', 'photos', 40, 'home'), goal('三十個成就', '領取 30 個成就', 'achievements', 30, 'achievements'), goal('六十五位夥伴', '收集 65 位不同的小湘', 'dex', 65, 'dex')] },
    { name: '走遍台灣', reward: { egg: 'weather' }, goals: [goal('六個地方', '在 6 個不同縣市按「探索附近」', 'counties', 6, 'home'), goal('十二張明信片', '收到 12 張家鄉明信片', 'cards', 12, 'errands'), goal('一百趟旅行', '累計派小湘出門 100 次', 'errands', 100, 'errands')] },
    { name: '小湘大廚', reward: { egg: 'wish' }, goals: [goal('八十道料理', '在小湘廚房做料理 80 次', 'cooked', 80, 'kitchen'), goal('食譜全收集', `解開全部 ${DISH_RECIPES.length} 道特色料理`, 'recipes', DISH_RECIPES.length, 'kitchen'), goal('一萬點溫暖', '累計注入 10000 能量', 'fed', 10000, 'incubate')] },
    { name: '四十天的日常', reward: { fossils: 40 }, goals: [goal('四十天', '在 40 個不同日子完成願望', 'days', 40, 'daily'), goal('一百五十個小願望', '累計完成 150 個每日願望', 'wishes', 150, 'daily'), goal('八十位夥伴', '收集 80 位不同的小湘', 'dex', 80, 'dex')] },
    { name: '永遠的飼養員', reward: { egg: 'wish', wish: 1, weather: 1, fossils: 60, energy: 150 }, goals: [goal('十位知心好友', '讓 10 位小湘的好感度升到 Lv.5', 'bond5', 10, 'dex'), goal('九十位夥伴', '收集 90 位不同的小湘', 'dex', 90, 'dex'), goal('五十天', '在 50 個不同日子完成願望', 'days', 50, 'daily')] },
  ];
  const n = level - chapters.length;
  // Lv.31 起自動章節：三組題目輪流換，獎勵在願望蛋／化石／天氣蛋之間輪
  const AUTO = [
    () => [goal('繼續一起過日子', `在 ${50 + n * 3} 個不同日子完成願望`, 'days', 50 + n * 3, 'daily'), goal('繼續出門', `累計派小湘出門 ${100 + n * 10} 次`, 'errands', 100 + n * 10, 'errands'), goal('繼續孵蛋', `累計孵化 ${25 + n * 3} 顆蛋`, 'hatched', 25 + n * 3, 'incubate')],
    () => [goal('更多小願望', `累計完成 ${150 + n * 9} 個每日願望`, 'wishes', 150 + n * 9, 'daily'), goal('更多合照', `累計和小湘外出合照 ${40 + n * 4} 次`, 'photos', 40 + n * 4, 'home'), goal('更多料理', `在小湘廚房做料理 ${80 + n * 8} 次`, 'cooked', 80 + n * 8, 'kitchen')],
    () => [goal('天天見面', `累計跟小湘打招呼 ${80 + n * 10} 次`, 'greets', 80 + n * 10, 'home'), goal('摸摸頭', `累計幫小湘摸摸頭 ${60 + n * 10} 次`, 'pets', 60 + n * 10, 'home'), goal('小恐龍的委託', `完成小恐龍的委託 ${50 + n * 5} 次`, 'tasks', 50 + n * 5, 'home')],
  ];
  const AUTO_REWARD = [{ egg: 'wish' }, { fossils: 20 }, { egg: 'weather' }];
  const chapter = chapters[level - 1] || { name: `同行旅程 · ${level}`, reward: AUTO_REWARD[(n - 1) % 3], goals: AUTO[(n - 1) % 3]() };
  return { ...chapter, level, goals: chapter.goals.map((g, i) => ({ ...g, id: `growth:${level}:${i + 1}` })) };
}
export const SLOT_MAX = 3;
export function describeChapterReward(r) {
  const parts = [];
  if (r.energy) parts.push(`${r.energy} 能量`);
  const wish = (r.egg === 'wish' ? 1 : 0) + (r.wish || 0), weather = (r.egg === 'weather' ? 1 : 0) + (r.weather || 0);
  const num = n => (n === 1 ? '一' : n === 2 ? '兩' : String(n));
  if (wish) parts.push(`${num(wish)}顆願望蛋`);
  if (weather) parts.push(`${num(weather)}顆天氣蛋`);
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
  if (r.wish) state.wishEgg.stock += r.wish;
  if (r.weather) state.weather.stock += r.weather;
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
  else if (goal.metric === 'bond5') current = Object.values(state.affection || {}).filter(a => a && levelOf(a.pts || 0) >= BOND_MAX).length;
  else if (goal.metric === 'cooked') current = count(state.kitchen?.cooked);
  else if (goal.metric === 'recipes') current = DISH_RECIPES.filter(r => state.kitchen?.known?.[[...new Set(r.ings)].sort().join('+')]).length;
  else if (goal.metric === 'battles') current = BATTLE_CHAPTERS.flatMap(c => c.stages).filter(id => (state.battle?.stages?.[id]?.clears || 0) > 0 || (state.battle?.stages?.[id]?.stars || 0) > 0).length;
  else if (goal.metric === 'stars') current = BATTLE_CHAPTERS.flatMap(c => c.stages).reduce((t, id) => t + Math.min(3, state.battle?.stages?.[id]?.stars || 0), 0);
  else if (goal.metric === 'achievements') current = (state.achievements?.claimed || []).length;
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
