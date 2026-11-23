// 化石交換所：抽到重複的小湘會得到化石碎片，可以在這裡換東西
export const FOSSIL_ENERGY = 15; // 3 化石換多少能量
export const FOSSIL_OFFERS = [
  { id: 'energy', name: '15 能量', cost: 3, desc: '馬上可以拿去孵蛋' }, // 湘 11/20：從 30 調成 15，化石留著換蛋比較划算
  { id: 'wish', name: '一顆願望蛋', cost: 10, desc: '比較容易遇到稀有的小湘' },
  { id: 'cipher', name: '一顆暗號蛋', cost: 15, desc: '隨機小湘，摯友和動物也在裡面' },
  { id: 'pick', name: '指定一位小湘', cost: 30, desc: '從還沒遇見、蛋裡可以孵出的小湘中選一位；越稀有越貴', from: true },
];

// 蛋架：一開始只有主架；用化石擴充副架，放在副架（暫放架最前面）的蛋也會自動保溫
export const SLOT_COSTS = [20, 40]; // 第 2 格、第 3 格
export function slotOffer(state) {
  const slots = state.cradle?.slots || 1;
  if (slots >= 3) return null;
  return { id: 'slot', name: `擴充蛋架（第 ${slots + 1} 格）`, cost: SLOT_COSTS[slots - 1], desc: '培育室多一個副架：換蛋時，正在孵的蛋放上去也會自動保溫' };
}

// 指定小湘依稀有度分層收費（湘 11/19：25 化石誰都能換太便宜）
export const PICK_COSTS = { N: 30, R: 50, SR: 90, SSR: 150, UR: 150 }; // UR 先和 SSR 同價（湘 11/23 修 UR 沒列出來）
export const PICK_TIERS = ['N', 'R', 'SR', 'SSR', 'UR'];
export const pickCost = (chars, no) => PICK_COSTS[chars[no]?.rarity] ?? PICK_COSTS.SSR;
export const cheapestPick = (state, eggs, chars) => Math.min(Infinity, ...pickable(state, eggs, chars).map((no) => pickCost(chars, no)));

// 可以指定的小湘：一般蛋池裡有、還沒收集的（節日、縣市、約會、配方等特殊小湘不行）
// 有 poolFrom 的（例如 No.099 公民小湘 11/28 起）到那天才能指定，和蛋池同一天開放
const localDay = (now) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
export function pickable(state, eggs, chars, now = new Date()) {
  const pool = new Set(['ordinary', 'wish', 'cipher', 'weather'].flatMap((id) => Object.keys(eggs[id]?.pool || {})));
  const today = localDay(now);
  return [...pool].filter((no) => chars[no] && !state.dex?.[no] && !(chars[no].poolFrom && chars[no].poolFrom > today)).sort();
}

export const offersFor = (state) => [...FOSSIL_OFFERS, ...(slotOffer(state) ? [slotOffer(state)] : [])];
export function exchange(state, offerId, { eggs, chars, no } = {}) {
  const offer = offersFor(state).find((o) => o.id === offerId);
  if (!offer) return null;
  if (offerId === 'pick' && !pickable(state, eggs, chars).includes(no)) return null;
  const cost = offerId === 'pick' ? pickCost(chars, no) : offer.cost;
  if ((state.fossils || 0) < cost) return null;
  state.fossils -= cost;
  if (offerId === 'energy') state.energy += FOSSIL_ENERGY;
  else if (offerId === 'wish') state.wishEgg.stock += 1;
  else if (offerId === 'slot') state.cradle = { slots: (state.cradle?.slots || 1) + 1 };
  else if (offerId === 'cipher') state.gifts.eggs.push({ egg: 'cipher', from: 'fossil', at: new Date().toISOString() });
  else state.gifts.eggs.push({ egg: 'cipher', character: no, from: 'fossil', at: new Date().toISOString() });
  return { ...offer, cost };
}
