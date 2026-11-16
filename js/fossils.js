// 化石交換所：抽到重複的小湘會得到化石碎片，可以在這裡換東西
export const FOSSIL_OFFERS = [
  { id: 'energy', name: '30 能量', cost: 3, desc: '馬上可以拿去孵蛋' },
  { id: 'wish', name: '一顆願望蛋', cost: 10, desc: '比較容易遇到稀有的小湘' },
  { id: 'cipher', name: '一顆暗號蛋', cost: 15, desc: '隨機小湘，摯友和動物也在裡面' },
  { id: 'pick', name: '指定一位小湘', cost: 25, desc: '從還沒遇見、蛋裡可以孵出的小湘中選一位' },
];

// 可以指定的小湘：一般蛋池裡有、還沒收集的（節日、縣市、約會、配方等特殊小湘不行）
export function pickable(state, eggs, chars) {
  const pool = new Set(['ordinary', 'wish', 'cipher', 'weather'].flatMap((id) => Object.keys(eggs[id]?.pool || {})));
  return [...pool].filter((no) => chars[no] && !state.dex?.[no]).sort();
}

export function exchange(state, offerId, { eggs, chars, no } = {}) {
  const offer = FOSSIL_OFFERS.find((o) => o.id === offerId);
  if (!offer || (state.fossils || 0) < offer.cost) return null;
  if (offerId === 'pick' && !pickable(state, eggs, chars).includes(no)) return null;
  state.fossils -= offer.cost;
  if (offerId === 'energy') state.energy += 30;
  else if (offerId === 'wish') state.wishEgg.stock += 1;
  else if (offerId === 'cipher') state.gifts.eggs.push({ egg: 'cipher', from: 'fossil', at: new Date().toISOString() });
  else state.gifts.eggs.push({ egg: 'cipher', character: no, from: 'fossil', at: new Date().toISOString() });
  return offer;
}
