// 隱藏配方：指定的小湘一起入住首頁，累積足夠的日子，就會送來一顆紀念蛋，固定孵出配方小湘
export const RECIPES = [
  { id: 'strawberry-cake', target: '011', members: ['002', '005'], days: 3, text: '草莓小湘和甜點小湘一起住 3 天' },
  { id: 'rain-garden', target: '012', members: ['006', '003'], days: 2, rain: true, text: '園丁小湘和雨傘小湘一起住，度過 2 個下雨天' },
];
const str = (v) => typeof v === 'string';

export function ensureRecipes(state) {
  const old = state.recipes || {};
  state.recipes = Object.fromEntries(RECIPES.map((r) => [r.id, {
    days: Array.isArray(old[r.id]?.days) ? [...new Set(old[r.id].days.filter(str))] : [],
    done: old[r.id]?.done === true,
  }]));
  return state.recipes;
}

// 今天這組配方能不能累積一天
export const recipeActive = (r, residents, raining) => r.members.every((no) => residents.includes(no)) && (!r.rain || raining);

// 每天第一次符合條件時記一天；滿了就送蛋。回傳 { progressed: [...], completed: [...] }
export function tickRecipes(state, { residents, raining, today }) {
  ensureRecipes(state);
  const progressed = []; const completed = [];
  for (const r of RECIPES) {
    const rec = state.recipes[r.id];
    if (rec.done || !recipeActive(r, residents, raining) || rec.days.includes(today)) continue;
    rec.days.push(today); progressed.push(r);
    if (rec.days.length >= r.days) {
      rec.done = true;
      state.gifts.eggs.push({ egg: 'keepsake', character: r.target, from: `recipe:${r.id}`, at: new Date().toISOString() });
      completed.push(r);
    }
  }
  return { progressed, completed };
}
