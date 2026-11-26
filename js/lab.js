// 研究室調配（湘 11/19）：找到配方的兩位小湘放進研究室，照配方設定的天數（recipe.days × 24 小時）調配，
// 時間到送來一顆紀念蛋。調配中的兩位不在首頁，也不能出門、討伐。
// 研究室是唯一配方發蛋入口，不看天氣和時段；舊入住日期僅保留作存檔歷史。
// 第二個研究欄位（湘 11/25，玩家許願）：化石交換所或研究室花 500 化石開，之後可以同時調配兩組。
// 存檔：第一格沿用 state.lab，第二格是 state.lab2，state.labSlots 記開了幾格（沒有就是 1）。
import { RECIPES, ensureRecipes } from './recipes.js';
import { levelOf } from './affection.js';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const LAB_SLOT_COST = 500; // 湘 11/25 定價
export const LAB_KEYS = ['lab', 'lab2'];
export const labSlots = (state) => Math.min(LAB_KEYS.length, Math.max(1, Number(state.labSlots) || 1));
const keysOf = (state) => LAB_KEYS.slice(0, labSlots(state));
export const labNos = (state) => LAB_KEYS.flatMap((k) => state[k]?.members || []);
export const recipeOf = (id) => RECIPES.find((r) => r.id === id) || null;

// slot：0＝第一格、1＝第二格
export function labStatus(state, now = Date.now(), slot = 0) {
  const lab = state[LAB_KEYS[slot]];
  const recipe = lab && recipeOf(lab.recipe);
  if (!recipe) return null;
  const start = Date.parse(lab.start), until = Date.parse(lab.until);
  const left = Math.max(0, until - now);
  const day = Math.min(recipe.days, Math.floor((now - start) / DAY_MS) + 1);
  return { slot, recipe, members: lab.members, start, until, left, day, ready: left === 0 };
}
// 每一格的狀態（空的格子是 null），長度＝目前開了幾格
export const labStatuses = (state, now = Date.now()) => keysOf(state).map((_, i) => labStatus(state, now, i));
export const labStatusFor = (state, recipeId, now = Date.now()) => LAB_KEYS.map((_, i) => labStatus(state, now, i)).find((st) => st?.recipe.id === recipeId) || null;
export const freeSlot = (state) => keysOf(state).findIndex((k) => !state[k]);

// recipe.bond（例如此生護卿 5）：兩位好感都要到這個等級才出現在研究筆記、才能調配
export const bondReady = (state, recipe) => !recipe?.bond || recipe.members.every((no) => levelOf(state.affection?.[no]?.pts || 0) >= recipe.bond);
// 研究筆記要不要藏起來：secret＝兩位都到手才出現；bond＝好感也要到
export const recipeHidden = (state, recipe) => Boolean(recipe?.secret && !recipe.members.every((no) => state.dex?.[no])) || !bondReady(state, recipe);
export const recipeDone = (state, recipe) => Boolean(state.recipes?.[recipe.id]?.done || state.dex?.[recipe.target]);

// 回傳錯誤訊息字串，或 { recipe, slot }
export function startBrew(state, recipeId, { now = Date.now(), busy = new Set() } = {}) {
  const recipe = recipeOf(recipeId);
  if (!recipe) return '找不到這個配方。';
  ensureRecipes(state);
  if (labStatusFor(state, recipe.id, now)) return '這個配方已經在研究室調配中了。';
  const slot = freeSlot(state);
  if (slot < 0) return labSlots(state) > 1 ? '研究室兩格都在調配，等其中一組完成再來吧。' : '研究室正在調配另一組，等她們完成再來吧。';
  if (recipeDone(state, recipe)) return '這個配方已經完成了。';
  if (!recipe.members.every((no) => state.dex?.[no])) return '還沒遇見這組配方的兩位小湘。';
  if (!bondReady(state, recipe)) return `兩位的好感都要到 Lv.${recipe.bond}，才能一起放進研究室。`;
  const inLab = new Set(labNos(state));
  if (recipe.members.some((no) => inLab.has(no))) return '有一位小湘正在研究室調配另一組，等她完成再來吧。';
  const out = recipe.members.find((no) => busy.has(no));
  if (out) return '有一位小湘正在出門或討伐，等她回來再放進研究室。';
  state[LAB_KEYS[slot]] = { recipe: recipe.id, members: [...recipe.members], start: new Date(now).toISOString(), until: new Date(now + recipe.days * DAY_MS).toISOString() };
  return { recipe, slot };
}

// 時間到：每一格到時間的都送紀念蛋、清空那一格。回傳完成的配方陣列（沒有就是空陣列）
export function finishBrews(state, now = Date.now()) {
  const done = [];
  LAB_KEYS.forEach((key, slot) => {
    if (!state[key]) return;
    const st = labStatus(state, now, slot);
    if (!st) { state[key] = null; return; }
    if (!st.ready) return;
    ensureRecipes(state);
    if (!recipeDone(state, st.recipe)) {
      state.recipes[st.recipe.id].done = true;
      state.gifts = state.gifts || {}; state.gifts.eggs = state.gifts.eggs || [];
      state.gifts.eggs.push({ egg: 'keepsake', character: st.recipe.target, from: `recipe:${st.recipe.id}`, at: new Date(now).toISOString() });
    }
    state[key] = null;
    done.push(st.recipe);
  });
  return done;
}
// 舊介面：回傳第一個完成的配方，沒到時間回傳 null
export const finishBrew = (state, now = Date.now()) => finishBrews(state, now)[0] || null;
export const anyReady = (state, now = Date.now()) => LAB_KEYS.some((_, i) => labStatus(state, now, i)?.ready);

// 提早帶回來：不會有紀念蛋，之後可以重新放
export function cancelBrew(state, slot = 0) {
  const key = LAB_KEYS[slot] || LAB_KEYS[0];
  const had = Boolean(state[key]);
  state[key] = null;
  return had;
}

// 開第二個研究欄位：回傳錯誤訊息字串，或 { slots }
export function buyLabSlot(state) {
  if (labSlots(state) >= LAB_KEYS.length) return '研究欄位已經全部開好了。';
  if ((state.fossils || 0) < LAB_SLOT_COST) return `化石還不夠，需要 ${LAB_SLOT_COST} 個。`;
  state.fossils -= LAB_SLOT_COST;
  state.labSlots = labSlots(state) + 1;
  return { slots: state.labSlots };
}

export function fmtLeft(ms) {
  const h = Math.ceil(ms / 3600000);
  if (h >= 24) { const d = Math.floor(h / 24), r = h % 24; return r ? `${d} 天 ${r} 小時` : `${d} 天`; }
  return `${Math.max(1, h)} 小時`;
}
