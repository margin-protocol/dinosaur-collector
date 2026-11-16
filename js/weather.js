// 天氣與時間事件。
// 天氣：用手機定位查目前天氣（Open-Meteo，免費、免金鑰）。座標只用來查詢，不保存；存檔只記「今天的天氣種類」。
// - 下雨的日子，每天最多送一顆天氣蛋（蛋庫最多放 WEATHER_STOCK_MAX 顆，避免梅雨季堆滿）
// - 當天下雨時，普通蛋、願望蛋孵出雨傘小湘的機率提高
// 時間：深夜（23:00–04:59）孵化時，夜貓小湘的機率提高
export const WEATHER_STOCK_MAX = 2;
export const RAIN_BOOST = { no: '003', times: 3 };
export const NIGHT_BOOST = { no: '004', times: 4 };

const isDate = (v) => typeof v === 'string';
export function ensureWeather(state) {
  const old = state.weather || {};
  state.weather = {
    date: isDate(old.date) ? old.date : null, // 最近一次查天氣的日期
    kind: ['rain', 'clear', 'cloudy'].includes(old.kind) ? old.kind : null,
    stock: Number.isSafeInteger(old.stock) && old.stock > 0 ? old.stock : 0,
    granted: isDate(old.granted) ? old.granted : null, // 最近一次送天氣蛋的日期
  };
  return state.weather;
}

// WMO weather code → 簡單分類
export function kindOf(code, precipitation = 0) {
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95 || precipitation > 0.1) return 'rain';
  if (code <= 1) return 'clear';
  return 'cloudy';
}

export async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}&current=weather_code,precipitation&timezone=auto`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error('weather');
    const data = await res.json();
    return kindOf(Number(data.current?.weather_code), Number(data.current?.precipitation) || 0);
  } finally { clearTimeout(timer); }
}

// 在存檔交易裡記錄天氣；下雨且今天還沒送過、蛋庫沒滿，就送一顆天氣蛋
export function recordWeather(state, kind, date) {
  const w = ensureWeather(state);
  w.date = date; w.kind = kind;
  let egg = false;
  if (kind === 'rain' && w.granted !== date && w.stock < WEATHER_STOCK_MAX) { w.stock += 1; w.granted = date; egg = true; }
  return { kind, egg, stock: w.stock };
}

export const isNight = (d = new Date()) => d.getHours() >= 23 || d.getHours() < 5;
export const rainingToday = (state, today) => state.weather?.date === today && state.weather.kind === 'rain';
