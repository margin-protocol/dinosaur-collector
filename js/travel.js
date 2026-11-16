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
  };
  return state.travel;
}

export function checkIn(state, county, date) {
  const t = ensureTravel(state);
  const first = !t.visits[county];
  if (first) t.visits[county] = { first: date, last: date };
  else t.visits[county].last = date;
  let egg = false;
  if (!t.granted.includes(county)) { t.granted.push(county); t.eggs.push(county); egg = true; }
  return { county, first, egg };
}
