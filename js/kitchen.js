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
  { id: 'redbean', name: '蜜紅豆', short: '紅豆', tag: '濃甜', icon: '🫘', chapter: 4 },
  { id: 'tangyuan', name: '白玉湯圓', short: '湯圓', tag: '滑順', icon: '🍡', chapter: 4 },
  { id: 'sakura', name: '櫻花蜜', short: '櫻花', tag: '果香', icon: '🌸', chapter: 4 },
  { id: 'matcha', name: '抹茶粉', short: '抹茶', tag: '清涼', icon: '🍵', chapter: 4 },
  // 墨痕江湖活動食材（11/25）：只從活動關卡掉落，活動結束後手上的照樣能煮
  { id: 'osmanthus', name: '金桂', short: '金桂', tag: '濃甜', icon: '🌼', event: 'mo', art: 'assets/kitchen/event-mo/osmanthus.webp' },
  { id: 'bamboo', name: '雨後竹筍', short: '竹筍', tag: '清涼', icon: '🎋', event: 'mo', art: 'assets/kitchen/event-mo/bamboo.webp' },
  { id: 'plum', name: '青梅釀', short: '青梅', tag: '果香', icon: '🍶', event: 'mo', art: 'assets/kitchen/event-mo/plum.webp' },
];
export const BASE_INGREDIENTS = INGREDIENTS.filter((i) => !i.event);
export const ING = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));
// 能煮出的料理種類＝任選 2 或 3 種食材的組合數（12 種時 286、16 種時 680）
export const COMBO_TOTAL = ((n) => n * (n - 1) / 2 + n * (n - 1) * (n - 2) / 6)(BASE_INGREDIENTS.length); // 活動食材不算進總數
export const isBaseDish = (id) => String(id).split('+').every((i) => ING[i] && !ING[i].event);

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
  // 墨痕江湖限定料理（湘 11/25 交給德寶配）：不算進「全部 8 道特色料理」
  { id: 'MO1', name: '桂花糕', ings: ['osmanthus', 'tangyuan'], type: '親密', event: 'mo', clue: '軟糯的白玉，淋一勺金色的花蜜。' },
  { id: 'MO2', name: '山筍清湯', ings: ['bamboo', 'mushroom'], type: '採集', event: 'mo', effect: { kind: 'gather', value: 1 }, clue: '雨後山裡冒出來的兩樣東西，熬一鍋清湯。' },
  { id: 'MO3', name: '江湖一盞', ings: ['moon', 'osmanthus', 'plum'], type: '戰力', event: 'mo', effect: { kind: 'power', value: 0.05 }, clue: '青梅入酒，兌一點月光，再撒一把桂花。敬江湖。' },
];
export const BASE_RECIPES = RECIPES.filter((r) => !r.event);
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
export const TAGS = [...new Set(INGREDIENTS.map((i) => i.tag))];
export const tagIngredients = (tag) => INGREDIENTS.filter((i) => i.tag === tag);
// 口味筆記（湘 11/22 選 B）：只看玩家餵過的結果，推理出這位小湘可能喜歡／討厭哪個口味（不偷看答案）。
// 每一組（喜歡, 討厭）都拿去對照吃過的評價，留下說得通的；剩一種就是「確定」。秘密最愛（3）不算線索，只記錄找到了沒。
export function tasteNotes(state, no) {
  const list = state.kitchen?.tasted?.[no] || {};
  const clues = Object.entries(list).filter(([, r]) => r !== 3).map(([id, r]) => ({ tags: dishById(id)?.tags, r })).filter((c) => c.tags);
  const fits = [];
  for (const like of TAGS) for (const dislike of TAGS) {
    if (like === dislike) continue;
    if (clues.every(({ tags, r }) => { const l = tags.includes(like), h = tags.includes(dislike); return (l && !h ? 2 : h && !l ? 0 : 1) === r; })) fits.push([like, dislike]);
  }
  const likes = [...new Set(fits.map((f) => f[0]))], dislikes = [...new Set(fits.map((f) => f[1]))];
  const secret = Object.entries(list).find(([, r]) => r === 3)?.[0] || null;
  return { tries: Object.keys(list).length, likes, dislikes, like: likes.length === 1 ? likes[0] : null, dislike: dislikes.length === 1 ? dislikes[0] : null, secret: secret ? dishById(secret) : null, fits };
}
// 根據筆記猜這道菜她會不會喜歡（沒吃過的菜才用）；說不準就回傳 null。秘密最愛猜不到，所以只說「應該」
export function guessRating(state, no, dish) {
  const n = tasteNotes(state, no);
  if (!dish || !n.tries) return null;
  const rs = new Set(n.fits.map(([l, h]) => { const a = dish.tags.includes(l), b = dish.tags.includes(h); return a && !b ? 2 : b && !a ? 0 : 1; }));
  return rs.size === 1 ? [...rs][0] : null;
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
    made: {}, // 每道料理做過幾次（料理小書用）；11/21 以前做過的至少算 1 次
    tasted: {},
    buffs: {},
    darkFed: Number.isFinite(old?.darkFed) ? Math.max(0, Math.floor(old.darkFed)) : 0,
    cooked: Number.isFinite(old?.cooked) ? Math.max(0, Math.floor(old.cooked)) : 0,
  };
  for (const id of Object.keys(k.known)) { const n = old?.made?.[id]; k.made[id] = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1; }
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
  k.made ||= {}; k.made[dish.id] = (k.made[dish.id] || 0) + 1;
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
  const before = tasteNotes(state, no);
  k.meals[dish.id] -= 1; if (!k.meals[dish.id]) delete k.meals[dish.id];
  const tasted = (k.tasted[no] ||= {});
  const firstTaste = !(dish.id in tasted);
  const secretFound = r === 3 && tasted[dish.id] !== 3;
  tasted[dish.id] = r;
  if (dish.dark) k.darkFed += 1;
  const g = gain(state, no, 'cook', today, rating.points);
  let buff = null, replaced = null;
  const eff = dish.effect;
  if (eff) {
    const value = eff.kind === 'gather' ? (r >= 2 ? 1 : 0) : Math.round(eff.value * rating.effect * 1000) / 1000;
    if (value > 0) { replaced = k.buffs[no] || null; buff = { kind: eff.kind, value, dish: dish.id }; k.buffs[no] = buff; }
  }
  const after = tasteNotes(state, no);
  const learned = { like: !before.like && after.like ? after.like : null, dislike: !before.dislike && after.dislike ? after.dislike : null };
  return { no, dish, learned, rating: r, points: rating.points, added: g.added, up: g.up, capped: g.added < rating.points, buff, replaced, secretFound, firstTaste, line: reaction(no, dish, r) };
}

// 小格子用的短字：🍳戰力+5%／🍳減時5%／🍳採集+1
export const buffShort = (b) => (!b ? '' : b.kind === 'power' ? `🍳戰力+${Math.round(b.value * 100)}%` : b.kind === 'speed' ? `🍳減時${Math.round(b.value * 100)}%` : '🍳採集+1');
// 這道料理餵下去會不會換掉原本的加成：會換＝true、不會＝false、還不知道她喜不喜歡＝null
export function replacesBuff(state, no, dish) {
  const old = state.kitchen?.buffs?.[no]; const eff = dish?.effect;
  if (!old || !eff) return false;
  const r = state.kitchen?.tasted?.[no]?.[dish.id];
  if (r === undefined) return null;
  return eff.kind === 'gather' ? r >= 2 : RATINGS[r].effect > 0;
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
export function dropsFor(chapter, { win, boss, gather = 0, event = null }, rand = Math.random) {
  if (!win) return [];
  const pool = INGREDIENTS.filter((i) => (event ? i.event === event : i.chapter === chapter)); // 活動關卡掉活動食材
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
// 料理小書：做過的每一道（新的在前），附做過次數、第一次的時間、吃過的小湘
export function cookbook(state) {
  const k = state.kitchen || {};
  const order = Object.entries(k.known || {}).filter(([id]) => dishById(id)).sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]));
  return order.map(([id, at], i) => {
    const dish = dishById(id);
    const eaters = Object.entries(k.tasted || {}).filter(([, list]) => id in list).map(([no, list]) => ({ no, rating: list[id] }));
    eaters.sort((a, b) => b.rating - a.rating || a.no.localeCompare(b.no));
    return { dish, no: i + 1, at, times: Math.max(1, k.made?.[id] || 0), left: k.meals?.[id] || 0, eaters, kind: dish.dark ? 'dark' : dish.recipe ? 'recipe' : 'home' };
  }).reverse();
}
export const recipesFound = (state) => BASE_RECIPES.filter((r) => state.kitchen?.known?.[key(r.ings)]).length;
export const eventRecipesFound = (state, event) => RECIPES.filter((r) => r.event === event && state.kitchen?.known?.[key(r.ings)]).length;
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
  if (r === 1 && !dish.dark && sp?.tags) { const t = Object.keys(sp.tags).find(t => dish.tags.includes(t)); if (t) return sp.tags[t]; } // 依口味的專屬反應（MO-005／MO-008）
  if (sp?.[r] && !dish.dark) return sp[r]; // 有些小湘四種評價都有專屬台詞（非酋三部曲）
  if (r === 0 && sp?.[0]) return sp[0];
  const list = dish.dark && r < 2 ? DARK : LINES[r];
  return list[hash(no + dish.id) % list.length];
}
