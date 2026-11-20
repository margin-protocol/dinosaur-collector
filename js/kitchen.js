// 小湘廚房 v1（皮寶企劃 docs/SIANG_KITCHEN.md，湘 11/20）
// 討伐撿食材 → 任選 2～3 種「開煮！」→ 餵小湘：依口味加好感（和點她、摸頭、布丁共用每天 15 點）、拿到一次性的討伐加成。
// 同樣的食材組合一定煮出同一道菜（不看順序、不靠亂數）；沒有失敗、不會過期，黑暗料理也不扣好感。
import { CHARACTERS } from './eggs.js';
import { TASTES } from './taste-profiles.js';
import { gain } from './affection.js';
import { KITCHEN_LINES } from './kitchen-lines.js';

export const INGREDIENTS = [
  { id: 'strawberry', name: '草莓', short: '草莓', tag: '果香', icon: '🍓', chapter: 1 },
  { id: 'milk', name: '牛奶', short: '牛奶', tag: '奶香', icon: '🥛', chapter: 1 },
  { id: 'caramel', name: '焦糖', short: '焦糖', tag: '濃甜', icon: '🍯', chapter: 1 },
  { id: 'pudding', name: '布丁粉', short: '布丁', tag: '滑順', icon: '🍮', chapter: 1 },
  { id: 'mushroom', name: '魔法蘑菇', short: '蘑菇', tag: '菇香', icon: '🍄', chapter: 2 },
  { id: 'cloud', name: '雲朵棉花糖', short: '雲朵', tag: '綿軟', icon: '☁️', chapter: 2 },
  { id: 'lightning', name: '雷電糖', short: '雷電', tag: '刺激', icon: '⚡', chapter: 2 },
  { id: 'moon', name: '月光露', short: '月光', tag: '清涼', icon: '🌙', chapter: 2 },
  { id: 'star', name: '星星糖', short: '星星', tag: '星光', icon: '⭐', chapter: 3 },
  { id: 'rainbow', name: '彩虹果凍', short: '彩虹', tag: '果凍', icon: '🌈', chapter: 3 },
  { id: 'gear', name: '齒輪餅乾', short: '齒輪', tag: '酥脆', icon: '⚙️', chapter: 3 },
  { id: 'glitch', name: '故障糖漿', short: '故障', tag: '怪味', icon: '👾', chapter: 3 },
];
export const ING = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

// 8 道特色料理。effect：power 戰力、speed 討伐時間、gather 打贏多 1 份食材；沒有 effect 的是好感度專用
export const RECIPES = [
  { id: 'R01', name: '草莓牛奶', ings: ['milk', 'strawberry'], type: '親密', clue: '粉紅色的、會冒小泡泡的那一杯。' },
  { id: 'R02', name: '焦糖奶布丁', ings: ['caramel', 'milk', 'pudding'], type: '戰力', effect: { kind: 'power', value: 0.05 }, clue: '甜點小湘說：三樣東西，一個都不能少。' },
  { id: 'R03', name: '雲朵星星糖', ings: ['cloud', 'star'], type: '速刷', effect: { kind: 'speed', value: 0.05 }, clue: '軟軟的天空裡，撒一點會發光的東西。' },
  { id: 'R04', name: '月光蘑菇湯', ings: ['moon', 'mushroom'], type: '採集', effect: { kind: 'gather', value: 1 }, clue: '晚上在森林裡煮的湯。' },
  { id: 'R05', name: '彩虹雲朵凍', ings: ['cloud', 'rainbow'], type: '親密', clue: '雨停以後，把天上的兩樣東西裝進碗裡。' },
  { id: 'R06', name: '雷電齒輪餅乾', ings: ['gear', 'lightning'], type: '戰力', effect: { kind: 'power', value: 0.05 }, clue: '咬下去會「喀啦——滋滋滋」。' },
  { id: 'R07', name: '草莓蘑菇湯', ings: ['mushroom', 'strawberry'], type: '黑暗料理', dark: true, clue: '紅紅的，還有一朵不該出現在甜湯裡的東西。' },
  { id: 'R08', name: '故障宇宙糖漿', ings: ['glitch', 'lightning', 'star'], type: '黑暗料理', dark: true, clue: '玩具星球上最不穩定的三種糖。' },
];
const key = (ids) => [...new Set(ids)].sort().join('+');
const RECIPE_BY_KEY = Object.fromEntries(RECIPES.map((r) => [key(r.ings), r]));

const NORMAL_SUFFIX = ['小點心', '甜湯', '拼盤', '鬆餅', '冰沙', '派', '蛋糕捲', '奶昔'];
const DARK_SUFFIX = ['謎之濃湯', '冒泡泡燉菜', '會動的果凍', '黑暗糊糊', '發光的不明物體'];
const CLASH = [['mushroom', 'strawberry'], ['mushroom', 'caramel'], ['lightning', 'milk']];
const hash = (s) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

// 一道菜（ids 不分順序）。不合法回傳 null
export function dishOf(ids) {
  const list = [...new Set(ids || [])].filter((id) => ING[id]).sort();
  if (list.length < 2 || list.length > 3 || list.length !== (ids || []).length) return null;
  const id = list.join('+');
  const tags = list.map((i) => ING[i].tag);
  const r = RECIPE_BY_KEY[id];
  if (r) return { id, ings: list, tags, name: r.name, dark: Boolean(r.dark), recipe: r.id, type: r.type, effect: r.effect || null };
  const dark = list.includes('glitch') || CLASH.some(([a, b]) => list.includes(a) && list.includes(b));
  const words = list.map((i) => ING[i].short).join('');
  const pool = dark ? DARK_SUFFIX : NORMAL_SUFFIX;
  return { id, ings: list, tags, name: `${words}${pool[hash(id) % pool.length]}`, dark, recipe: null, type: dark ? '黑暗料理' : '家常料理', effect: null };
}
export const dishById = (id) => dishOf(String(id || '').split('+'));

// 口味評價：3 超喜歡（隱藏最愛）、2 喜歡、1 普通、0 討厭
export const RATINGS = [
  { id: 0, label: '討厭', icon: '🤢', points: 1, effect: 0 },
  { id: 1, label: '普通', icon: '🙂', points: 3, effect: 0.6 },
  { id: 2, label: '喜歡', icon: '😋', points: 5, effect: 0.8 },
  { id: 3, label: '超喜歡', icon: '💖', points: 7, effect: 1 },
];
export function rate(no, dish) {
  const t = TASTES[no];
  if (!t || !dish) return 1;
  if (key(t.secret) === dish.id) return 3;
  const like = dish.tags.includes(t.like), hate = dish.tags.includes(t.dislike);
  return like && !hate ? 2 : hate && !like ? 0 : 1;
}
export const isSecret = (no, dish) => Boolean(TASTES[no] && dish && key(TASTES[no].secret) === dish.id);

export const STARTER = { strawberry: 2, milk: 2, caramel: 2, pudding: 2 }; // 第一次打開廚房的見面禮
export function ensureKitchen(state) {
  const old = state.kitchen && typeof state.kitchen === 'object' ? state.kitchen : null;
  const count = (obj, ok) => Object.fromEntries(Object.entries(obj || {}).filter(([k, v]) => ok(k) && Number.isFinite(v) && v > 0).map(([k, v]) => [k, Math.floor(v)]));
  const k = {
    ingredients: old ? count(old.ingredients, (id) => ING[id]) : { ...STARTER },
    meals: count(old?.meals, (id) => dishById(id)),
    known: Object.fromEntries(Object.entries(old?.known || {}).filter(([id, v]) => dishById(id) && typeof v === 'string')),
    tasted: {},
    buffs: {},
    darkFed: Number.isFinite(old?.darkFed) ? Math.max(0, Math.floor(old.darkFed)) : 0,
    cooked: Number.isFinite(old?.cooked) ? Math.max(0, Math.floor(old.cooked)) : 0,
  };
  for (const [no, list] of Object.entries(old?.tasted || {})) {
    if (!CHARACTERS[no] || !list || typeof list !== 'object') continue;
    const clean = Object.fromEntries(Object.entries(list).filter(([id, r]) => dishById(id) && [0, 1, 2, 3].includes(r)));
    if (Object.keys(clean).length) k.tasted[no] = clean;
  }
  for (const [no, b] of Object.entries(old?.buffs || {})) {
    if (CHARACTERS[no] && b && ['power', 'speed', 'gather'].includes(b.kind) && Number.isFinite(b.value) && b.value > 0 && dishById(b.dish)) k.buffs[no] = { kind: b.kind, value: b.value, dish: b.dish };
  }
  state.kitchen = k;
  return k;
}

// 開煮：扣食材、多一份料理。回傳錯誤字串或 { dish, first }
export function cook(state, ids, now = new Date()) {
  const k = state.kitchen || ensureKitchen(state);
  const dish = dishOf(ids);
  if (!dish) return '選 2～3 種不同的食材。';
  if (dish.ings.some((id) => !(k.ingredients[id] > 0))) return '食材不夠了，去討伐撿一些回來吧。';
  for (const id of dish.ings) { k.ingredients[id] -= 1; if (!k.ingredients[id]) delete k.ingredients[id]; }
  k.meals[dish.id] = (k.meals[dish.id] || 0) + 1;
  const first = !k.known[dish.id];
  if (first) k.known[dish.id] = now.toISOString();
  k.cooked += 1;
  return { dish, first };
}

// 餵食：扣一份料理、加好感、留下加成。回傳錯誤字串或結果
export function feed(state, no, dishId, today) {
  const k = state.kitchen || ensureKitchen(state);
  const dish = dishById(dishId);
  if (!dish || !(k.meals[dish.id] > 0)) return '這道料理已經吃完了。';
  if (!CHARACTERS[no] || !state.dex?.[no]) return '還沒遇見這位小湘。';
  const r = rate(no, dish);
  const rating = RATINGS[r];
  k.meals[dish.id] -= 1; if (!k.meals[dish.id]) delete k.meals[dish.id];
  const tasted = (k.tasted[no] ||= {});
  const firstTaste = !(dish.id in tasted);
  const secretFound = r === 3 && tasted[dish.id] !== 3;
  tasted[dish.id] = r;
  if (dish.dark) k.darkFed += 1;
  const g = gain(state, no, 'cook', today, rating.points);
  let buff = null;
  const eff = dish.effect;
  if (eff) {
    const value = eff.kind === 'gather' ? (r >= 2 ? 1 : 0) : Math.round(eff.value * rating.effect * 1000) / 1000;
    if (value > 0) { buff = { kind: eff.kind, value, dish: dish.id }; k.buffs[no] = buff; }
  }
  return { no, dish, rating: r, points: rating.points, added: g.added, up: g.up, capped: g.added < rating.points, buff, secretFound, firstTaste, line: reaction(no, dish, r) };
}

export const buffText = (b) => (!b ? '' : b.kind === 'power' ? `戰力 +${Math.round(b.value * 100)}%` : b.kind === 'speed' ? `討伐時間 −${Math.round(b.value * 100)}%` : '打贏多撿 1 份食材');

// 這一隊會用哪一份料理加成（最多一份）：戰力優先，其次減時、採集；同類取數值大的
const BUFF_ORDER = { power: 3, speed: 2, gather: 1 };
export function teamFood(state, nos) {
  let best = null;
  for (const no of nos || []) {
    const b = state.kitchen?.buffs?.[no];
    if (b && (!best || BUFF_ORDER[b.kind] > BUFF_ORDER[best.kind] || (b.kind === best.kind && b.value > best.value))) best = { ...b, no };
  }
  return best;
}
export function useFood(state, food) { if (food && state.kitchen?.buffs?.[food.no]) delete state.kitchen.buffs[food.no]; }

// 討伐撿到的食材：一般關卡贏了保底 1 份、35% 多 1 份；Boss 2～3 份；輸了沒有。在出發時就決定好
export function dropsFor(chapter, { win, boss, gather = 0 }, rand = Math.random) {
  if (!win) return [];
  const pool = INGREDIENTS.filter((i) => i.chapter === chapter);
  if (!pool.length) return [];
  const n = (boss ? 2 + (rand() < 0.5 ? 1 : 0) : 1 + (rand() < 0.35 ? 1 : 0)) + gather;
  return Array.from({ length: n }, () => pool[Math.floor(rand() * pool.length) % pool.length].id);
}
export function addIngredients(state, ids) {
  const k = state.kitchen || ensureKitchen(state);
  for (const id of ids || []) if (ING[id]) k.ingredients[id] = (k.ingredients[id] || 0) + 1;
}
export const ingredientText = (ids) => {
  const c = {}; for (const id of ids || []) c[id] = (c[id] || 0) + 1;
  return Object.entries(c).map(([id, n]) => `${ING[id]?.icon || ''}${ING[id]?.name || id} +${n}`).join('、');
};

export const secretsFound = (state) => Object.values(state.kitchen?.tasted || {}).reduce((n, list) => n + Object.values(list).filter((r) => r === 3).length, 0);
export const recipesFound = (state) => RECIPES.filter((r) => state.kitchen?.known?.[key(r.ings)]).length;
export const darkFound = (state) => Object.keys(state.kitchen?.known || {}).filter((id) => dishById(id)?.dark).length;

// 反應台詞：先看每位小湘的專屬台詞（js/kitchen-lines.js），再看評價
const LINES = {
  0: ['嗚……這個……我可以喝水嗎？', '（努力吞下去）……謝謝你的心意！真的！', '我、我今天其實不太餓啦……'],
  1: ['嗯，還不錯吃喔！', '謝謝你煮給我吃～', '原來這兩樣放在一起是這個味道！'],
  2: ['好好吃！可以再一口嗎？', '這個我喜歡！你怎麼知道的？', '哇！下次也要煮這個給我！'],
  3: ['……你怎麼知道這是我最喜歡的？！我要把它畫成愛心貼在食譜旁邊！', '就是這個味道！！我一直在等人煮給我吃！', '嗚嗚嗚太好吃了……你是不是偷看過我的日記？'],
};
const DARK = ['這、這是什麼……它剛剛是不是動了一下？', '顏色有點……勇敢。我吃吃看喔……', '吃完覺得自己變強了，大概是因為活下來了。'];
export function reaction(no, dish, r) {
  const sp = KITCHEN_LINES[no];
  if (r === 3 && sp?.[3]) return sp[3];
  if (dish.dark && sp?.dark) return sp.dark;
  if (sp?.[r] && !dish.dark) return sp[r]; // 有些小湘四種評價都有專屬台詞（非酋三部曲）
  if (r === 0 && sp?.[0]) return sp[0];
  const list = dish.dark && r < 2 ? DARK : LINES[r];
  return list[hash(no + dish.id) % list.length];
}
