// 星光糖（湘 11/26 選 B：遞增＋合糖、介面 A 膠囊）
// 重複遇見居民會拿到同稀有度的星光糖；同稀有度的任何居民都能吃來升星（最高 ★5）
export const CANDY_TIERS = ['N', 'R', 'SR', 'SSR', 'UR'];
export const MAX_CANDY_STARS = 5;
export const STAR_CANDY_COST = [1, 1, 2, 2, 3]; // 升到 ★1…★5 各要幾顆，0→★5 共 9 顆
export const DUP_CANDY = 1; // 重複遇見給 1 顆
export const FULL_DUP_CANDY = 2; // 已經 ★5 的居民再遇見給 2 顆（滿星不浪費）
export const MERGE_CANDY = 3; // 3 顆低一階 → 1 顆高一階
export const CANDY_PRICES = { N: 25, R: 40, SR: 75, SSR: 125, UR: 200 }; // 化石交換所一顆的價錢（湘 11/26：朋友說太便宜，原本 5/8/15/25/40 改成 ×5）
export const CANDY_WEEKLY = 3; // 化石購買：每種每週最多 3 顆

export function candyOf(state) {
  const c = state.candy && typeof state.candy === 'object' ? state.candy : (state.candy = {});
  for (const r of CANDY_TIERS) c[r] = Math.max(0, Math.floor(Number(c[r]) || 0));
  return c;
}
export const candyCount = (state, rarity) => Math.max(0, Math.floor(Number(state.candy?.[rarity]) || 0));

// 重複遇見時：先算給幾顆（看遇見前是不是已經滿星），再加進糖罐
export function grantDupCandy(state, rarity, starsBefore) {
  if (!CANDY_TIERS.includes(rarity)) return 0;
  const n = starsBefore >= MAX_CANDY_STARS ? FULL_DUP_CANDY : DUP_CANDY;
  candyOf(state)[rarity] += n;
  return n;
}

// 下一星要幾顆；已滿星回傳 0
export const nextStarCost = (stars) => (stars >= MAX_CANDY_STARS ? 0 : STAR_CANDY_COST[Math.max(0, stars | 0)]);

// 餵一次糖升一星
export function feedCandy(state, chars, no) {
  const c = chars[no]; const entry = state.dex?.[no];
  if (!c || !entry || !CANDY_TIERS.includes(c.rarity)) return null;
  const stars = Math.min(MAX_CANDY_STARS, entry.dup || 0);
  const cost = nextStarCost(stars);
  if (!cost) return null;
  const jar = candyOf(state);
  if (jar[c.rarity] < cost) return null;
  jar[c.rarity] -= cost;
  entry.dup = stars + 1;
  return { no, rarity: c.rarity, cost, stars: entry.dup, left: jar[c.rarity] };
}

// 合糖：3 顆低一階 → 1 顆高一階
export function mergeCandy(state, rarity) {
  const i = CANDY_TIERS.indexOf(rarity);
  if (i < 0 || i >= CANDY_TIERS.length - 1) return null;
  const jar = candyOf(state);
  if (jar[rarity] < MERGE_CANDY) return null;
  jar[rarity] -= MERGE_CANDY; jar[CANDY_TIERS[i + 1]] += 1;
  return { from: rarity, to: CANDY_TIERS[i + 1] };
}

// 每週從星期一（本地日期）開始算
export function weekKey(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function boughtThisWeek(state, rarity, now = new Date()) {
  const b = state.candyBuy;
  return b && b.week === weekKey(now) ? Math.max(0, b[rarity] | 0) : 0;
}
export const buyLeft = (state, rarity, now = new Date()) => Math.max(0, CANDY_WEEKLY - boughtThisWeek(state, rarity, now));

export function buyCandy(state, rarity, now = new Date()) {
  if (!CANDY_TIERS.includes(rarity)) return null;
  const price = CANDY_PRICES[rarity];
  if (buyLeft(state, rarity, now) <= 0 || (state.fossils || 0) < price) return null;
  const week = weekKey(now);
  if (!state.candyBuy || state.candyBuy.week !== week) state.candyBuy = { week };
  state.candyBuy[rarity] = (state.candyBuy[rarity] | 0) + 1;
  state.fossils -= price;
  candyOf(state)[rarity] += 1;
  return { rarity, price, left: buyLeft(state, rarity, now) };
}
