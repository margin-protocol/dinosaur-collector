// 普通蛋的個性：孵完一顆後三選一（每顆有線索），偶爾出現閃亮的蛋、調皮的蛋
export const FLAVORS = {
  warm: { name: '暖暖的蛋', hint: '摸起來暖暖的、毛茸茸的', tip: '動物小湘比較容易出現', match: (c) => c.series === 'animals', times: 3 },
  pattern: { name: '有花紋的蛋', hint: '殼上有熟悉的花紋', tip: '摯友小湘比較容易出現', match: (c) => c.series === 'friends', times: 3 },
  moving: { name: '會動的蛋', hint: '好像在裡面動來動去', tip: '日常系列比較容易出現', match: (c) => c.series === 'daily', times: 2 },
  starry: { name: '閃著星光的蛋', hint: '殼上有一點點星光', tip: '稀有的小湘比較容易出現', match: (c) => c.rarity === 'SR' || c.rarity === 'SSR', times: 2 },
};
export const SHINY_CHANCE = 0.08;
export const NAUGHTY_CHANCE = 0.15;
export const SHINY_BOOST = { SR: 2, SSR: 3 };
export const NAUGHTY_BONUS = 20; // 完成調皮蛋的要求，加這麼多溫度

export function makeOffer(rand = Math.random) {
  const ids = Object.keys(FLAVORS).sort(() => rand() - 0.5).slice(0, 3);
  return ids.map((flavor) => {
    const shiny = rand() < SHINY_CHANCE;
    const naughty = !shiny && rand() < NAUGHTY_CHANCE;
    return { flavor, ...(shiny ? { shiny: true } : {}), ...(naughty ? { naughty: true } : {}) };
  });
}

// 依蛋的個性調整蛋池權重
export function traitPool(pool, egg, chars) {
  const f = FLAVORS[egg.flavor];
  if (!f && !egg.shiny) return pool;
  const out = { ...pool };
  for (const no of Object.keys(out)) {
    const c = chars[no]; if (!c) continue;
    if (f?.match(c)) out[no] *= f.times;
    if (egg.shiny && SHINY_BOOST[c.rarity]) out[no] *= SHINY_BOOST[c.rarity];
  }
  return out;
}

export function eggLabel(egg, base) {
  const name = FLAVORS[egg.flavor]?.name || base;
  return `${egg.shiny ? '✨閃亮的' : egg.naughty ? '調皮的' : ''}${egg.shiny || egg.naughty ? name.replace(/的蛋$/, '蛋') : name}`;
}

// 調皮蛋：孵到 1/3 想被摸摸，孵到 2/3 想看某個顏色
export function naughtyRequest(egg, need, colors) {
  if (!egg.naughty) return null;
  const asks = egg.asks || [];
  const pct = egg.warmth / need;
  if (pct >= 2 / 3 && !asks.includes(2)) {
    const color = colors[(egg.since || '').split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) % colors.length];
    return { step: 2, type: 'color', color };
  }
  if (pct >= 1 / 3 && !asks.includes(1)) return { step: 1, type: 'pet' };
  return null;
}
