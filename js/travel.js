// 旅行紀錄與縣市蛋：每個縣市第一次打卡送一顆縣市蛋。只存縣市名稱與日期，不存座標。
const dateLike = (v) => typeof v === 'string';

export function ensureTravel(state) {
  const old = state.travel || {};
  const visits = {};
  for (const [county, v] of Object.entries(old.visits || {})) if (v && dateLike(v.first)) visits[county] = { first: v.first, last: dateLike(v.last) ? v.last : v.first };
  state.travel = {
    visits,
    eggs: Array.isArray(old.eggs) ? old.eggs.filter(dateLike) : [], // 尚未拿出來培育的縣市蛋（依取得順序）
    granted: Array.isArray(old.granted) ? [...new Set(old.granted.filter(dateLike))] : [], // 已經送過蛋的縣市
    daily: dateLike(old.daily) ? old.daily : '', // 最後一次領「每日探索蛋」的日期
    // 那天的探索禮物是什麼（開遊戲自動探索時收到也看得到，湘 11/23）
    gift: old.gift && dateLike(old.gift.date) && ['county', 'wish', 'weather'].includes(old.gift.kind) ? { date: old.gift.date, kind: old.gift.kind, county: dateLike(old.gift.county) ? old.gift.county : '', at: dateLike(old.gift.at) ? old.gift.at : '', auto: old.gift.auto === true } : null,
  };
  return state.travel;
}

// 每天第一次探索成功都送一顆蛋：大多是當地的縣市蛋，偶爾是願望蛋或天氣蛋
export const DAILY_EXPLORE = { county: 55, wish: 30, weather: 15 };
export function checkIn(state, county, date, rand = Math.random) {
  const t = ensureTravel(state);
  const first = !t.visits[county];
  if (first) t.visits[county] = { first: date, last: date };
  else t.visits[county].last = date;
  let egg = false; let daily = null;
  if (!t.granted.includes(county)) { t.granted.push(county); t.eggs.push(county); egg = true; }
  if (t.daily !== date && !globalThis.SIANG_NO_DAILY_EXPLORE) { // 舊測試可以關掉每日探索蛋
    t.daily = date;
    if (egg) daily = 'county'; // 第一次來就是今天的蛋
    else {
      const total = DAILY_EXPLORE.county + DAILY_EXPLORE.wish + DAILY_EXPLORE.weather;
      const r = rand() * total;
      daily = r < DAILY_EXPLORE.county ? 'county' : r < DAILY_EXPLORE.county + DAILY_EXPLORE.wish ? 'wish' : 'weather';
      if (daily === 'county') t.eggs.push(county);
      if (daily === 'wish') state.wishEgg.stock += 1;
      if (daily === 'weather') state.weather.stock += 1;
    }
    t.gift = { date, kind: daily, county, at: new Date().toISOString() };
  }
  return { county, first, egg, daily };
}
