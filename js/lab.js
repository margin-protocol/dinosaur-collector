// 研究室調配（湘 11/19）：找到配方的兩位小湘放進研究室，照配方設定的天數（recipe.days × 24 小時）調配，
// 時間到送來一顆紀念蛋。一次只能調配一組；調配中的兩位不在首頁，也不能出門、討伐。
// 舊的「一起入住首頁累積天數」不再使用；配方的 rain／night 只留作文案紀錄，研究室不看天氣和時段。
import { RECIPES, ensureRecipes } from './recipes.js';

export const DAY_MS = 24 * 60 * 60 * 1000;
export const labNos = (state) => (state.lab?.members || []).slice();
export const recipeOf = (id) => RECIPES.find((r) => r.id === id) || null;

export function labStatus(state, now = Date.now()) {
  const lab = state.lab;
  const recipe = lab && recipeOf(lab.recipe);
  if (!recipe) return null;
  const start = Date.parse(lab.start), until = Date.parse(lab.until);
  const left = Math.max(0, until - now);
  const day = Math.min(recipe.days, Math.floor((now - start) / DAY_MS) + 1);
  return { recipe, members: lab.members, start, until, left, day, ready: left === 0 };
}

export const recipeDone = (state, recipe) => Boolean(state.recipes?.[recipe.id]?.done || state.dex?.[recipe.target]);

// 回傳錯誤訊息字串，或 { recipe }
export function startBrew(state, recipeId, { now = Date.now(), busy = new Set() } = {}) {
  const recipe = recipeOf(recipeId);
  if (!recipe) return '找不到這個配方。';
  ensureRecipes(state);
  if (state.lab) return '研究室正在調配另一組，等她們完成再來吧。';
  if (recipeDone(state, recipe)) return '這個配方已經完成了。';
  if (!recipe.members.every((no) => state.dex?.[no])) return '還沒遇見這組配方的兩位小湘。';
  const out = recipe.members.find((no) => busy.has(no));
  if (out) return '有一位小湘正在出門或討伐，等她回來再放進研究室。';
  state.lab = { recipe: recipe.id, members: [...recipe.members], start: new Date(now).toISOString(), until: new Date(now + recipe.days * DAY_MS).toISOString() };
  return { recipe };
}

// 時間到：送紀念蛋、清空研究室。沒到時間回傳 null
export function finishBrew(state, now = Date.now()) {
  const st = labStatus(state, now);
  if (!st) { if (state.lab) state.lab = null; return null; }
  if (!st.ready) return null;
  ensureRecipes(state);
  if (!recipeDone(state, st.recipe)) {
    state.recipes[st.recipe.id].done = true;
    state.gifts = state.gifts || {}; state.gifts.eggs = state.gifts.eggs || [];
    state.gifts.eggs.push({ egg: 'keepsake', character: st.recipe.target, from: `recipe:${st.recipe.id}`, at: new Date(now).toISOString() });
  }
  state.lab = null;
  return st.recipe;
}

// 提早帶回來：不會有紀念蛋，之後可以重新放
export function cancelBrew(state) {
  const had = Boolean(state.lab);
  state.lab = null;
  return had;
}

export function fmtLeft(ms) {
  const h = Math.ceil(ms / 3600000);
  if (h >= 24) { const d = Math.floor(h / 24), r = h % 24; return r ? `${d} 天 ${r} 小時` : `${d} 天`; }
  return `${Math.max(1, h)} 小時`;
}
