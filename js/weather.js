// 天氣與時間事件。
// 天氣：用手機定位查目前天氣（Open-Meteo，免費、免金鑰）。座標只用來查詢，不保存；存檔只記「今天的天氣種類」。
// - 每天第一次感應到天氣時送一顆天氣蛋（蛋庫最多放 WEATHER_STOCK_MAX 顆，避免堆滿）
// - 當天下雨時，普通蛋、願望蛋孵出雨傘小湘的機率提高
// - 天氣蛋孵化時，當天的天氣讓對應的天氣小湘更容易出現（weatherBoosts）
// 時間：深夜（23:00–04:59）孵化時，夜貓小湘的機率提高
export const WEATHER_STOCK_MAX = 2;
export const RAIN_BOOST = { no: '003', times: 3 };
export const NIGHT_BOOST = { no: '004', times: 4 };

const isDate = (v) => typeof v === 'string';
export const KINDS = ['rain', 'thunder', 'hail', 'snow', 'fog', 'windy', 'clear', 'cloudy'];
export const KIND_NAMES = { rain: '下雨', thunder: '打雷', hail: '下冰雹', snow: '下雪', fog: '起霧', windy: '颳大風', clear: '晴天', cloudy: '陰天' };
const WET = ['rain', 'thunder', 'hail'];
// 天氣蛋裡：今天的天氣 → 對應的天氣小湘權重加倍
export const WEATHER_CHARACTER = { rain: '071', thunder: '067', hail: '070', snow: '072', fog: '069', windy: '073', clear: '068', cloudy: '066' };
export const RAINBOW = '074', SUNSET = '075', OBSERVER = '065';
export const OBSERVER_KINDS = 4; // 感應過幾種天氣後，天氣觀測師比較容易出現
export const isSunset = (d = new Date()) => { const m = d.getHours() * 60 + d.getMinutes(); return m >= 16 * 60 + 30 && m < 18 * 60 + 30; };
export function ensureWeather(state) {
  const old = state.weather || {};
  state.weather = {
    date: isDate(old.date) ? old.date : null, // 最近一次查天氣的日期
    kind: KINDS.includes(old.kind) ? old.kind : null,
    rained: isDate(old.rained) ? old.rained : null, // 最近一次下雨的日期（雨後放晴 → 彩虹）
    seen: Array.isArray(old.seen) ? old.seen.filter(k => KINDS.includes(k)) : [], // 感應過的天氣種類
    stock: Number.isSafeInteger(old.stock) && old.stock > 0 ? old.stock : 0,
    granted: isDate(old.granted) ? old.granted : null, // 最近一次送天氣蛋的日期
  };
  return state.weather;
}

// WMO weather code → 簡單分類
export function kindOf(code, precipitation = 0, wind = 0) {
  if (code === 96 || code === 99) return 'hail';
  if (code >= 95) return 'thunder';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || precipitation > 0.1) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (wind >= 36) return 'windy'; // km/h，大約 5 級風
  if (code <= 1) return 'clear';
  return 'cloudy';
}

export async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}&current=weather_code,precipitation,wind_speed_10m&timezone=auto`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error('weather');
    const data = await res.json();
    return kindOf(Number(data.current?.weather_code), Number(data.current?.precipitation) || 0, Number(data.current?.wind_speed_10m) || 0);
  } finally { clearTimeout(timer); }
}

// 在存檔交易裡記錄天氣；今天還沒送過、蛋庫沒滿，就送一顆天氣蛋
export function recordWeather(state, kind, date) {
  const w = ensureWeather(state);
  const rainbow = kind === 'clear' && w.rained === date && w.kind !== 'clear';
  w.date = date; w.kind = kind;
  if (WET.includes(kind)) w.rained = date;
  if (KINDS.includes(kind) && !w.seen.includes(kind)) w.seen.push(kind);
  let egg = false;
  if (w.granted !== date && w.stock < WEATHER_STOCK_MAX) { w.stock += 1; w.granted = date; egg = true; }
  return { kind, egg, stock: w.stock, rainbow };
}

// 天氣蛋孵化時的加成與提示：[{ no, times, hint }]
export function weatherBoosts(state, today, now = new Date()) {
  const w = state.weather || {};
  const list = [];
  if (w.date === today && WEATHER_CHARACTER[w.kind]) list.push({ no: WEATHER_CHARACTER[w.kind], times: 4, hint: `今天${KIND_NAMES[w.kind]}……` });
  if (w.date === today && w.kind === 'clear' && w.rained === today) list.push({ no: RAINBOW, times: 5, hint: '雨停了，天空放晴……' });
  if (isSunset(now)) list.push({ no: SUNSET, times: 4, hint: '黃昏了……' });
  if ((w.seen || []).length >= OBSERVER_KINDS) list.push({ no: OBSERVER, times: 3, hint: `你已經感應過 ${w.seen.length} 種天氣……` });
  return list;
}

export const isNight = (d = new Date()) => d.getHours() >= 23 || d.getHours() < 5;
export const rainingToday = (state, today) => state.weather?.date === today && WET.includes(state.weather.kind);
