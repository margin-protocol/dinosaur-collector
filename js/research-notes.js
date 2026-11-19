// 研究筆記：只記錄實驗過的「兩人組合」，不消耗能量、不發放角色或蛋。
// 真正配方獎勵由 js/recipes.js 的「一起入住數日」機制結算，避免重複領獎。
import { CHARACTERS } from './eggs.js';
import { RECIPES } from './recipes.js';

export function pairKey(a, b) {
  return [a, b].sort().join(':');
}
export function studyPair(state, a, b, at = new Date().toISOString()) {
  const owned = Object.keys(state.dex || {}).filter(no => CHARACTERS[no]);
  if (owned.length < 3 || !a || !b || a === b || !owned.includes(a) || !owned.includes(b))
    return { ok: false, reason: '請先收集至少三位小湘，再挑兩位不同的已收藏夥伴。' };
  const key = pairKey(a, b);
  if (!state.research || !Array.isArray(state.research.trials)) state.research = { trials: [] };
  const prior = state.research.trials.find(entry => entry?.key === key);
  if (prior) return { ok: true, repeat: true, record: prior };
  const recipe = RECIPES.find(r => pairKey(...r.members) === key);
  const near = !recipe && RECIPES.some(r => r.members.includes(a) || r.members.includes(b));
  const record = {
    key, members: [a, b].sort(), at,
    recipe: recipe?.id || null,
    kind: recipe ? 'match' : near ? 'near' : 'unknown',
  };
  state.research.trials.push(record);
  return { ok: true, repeat: false, record };
}
