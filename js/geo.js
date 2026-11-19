// 縣市判定：手機定位 → 判斷在本島哪個縣市。座標只在這裡計算，不會保存或上傳，存檔只記縣市名稱。
// 邊界資料：assets/geo/counties.json（本島 19 縣市，簡化至約 130 公尺）
let cache = null;

export async function loadCounties(url = 'assets/geo/counties.json') {
  if (!cache) cache = fetch(url).then((r) => { if (!r.ok) throw new Error('geo'); return r.json(); }).then((d) => d.counties);
  return cache;
}

function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// 邊界簡化後海邊、交界可能落空：找不到時，取 2 公里內最近的縣市
const NEAR = 0.02;
export function countyAt(counties, lon, lat) {
  const p = [lon, lat];
  for (const c of counties) {
    let inside = false;
    for (const ring of c.rings) if (inRing(p, ring)) inside = !inside; // 奇偶規則，內環（例：臺北市在新北市中）自動挖洞
    if (inside) return c.name;
  }
  let best = null;
  let bestD = NEAR;
  for (const c of counties) {
    for (const ring of c.rings) {
      for (const [x, y] of ring) {
        const d = Math.hypot((x - lon) * Math.cos((lat * Math.PI) / 180), y - lat);
        if (d < bestD) { bestD = d; best = c.name; }
      }
    }
  }
  return best;
}

// 離島縣市：本島邊界資料沒有，用範圍框判斷（座標一樣不保存）
// 本島 19 縣市（環島成就、全臺紀念蛋只算這些；綠島與澎湖、金門、馬祖是離島）
export const MAIN_ISLAND = new Set(['基隆市','臺北市','新北市','桃園市','新竹市','新竹縣','苗栗縣','臺中市','彰化縣','南投縣','雲林縣','嘉義市','嘉義縣','臺南市','高雄市','屏東縣','宜蘭縣','花蓮縣','臺東縣']);
export const OFFSHORE = [
  { name: '澎湖縣', south: 23.15, north: 23.82, west: 119.28, east: 119.78 },
  { name: '連江縣', south: 25.90, north: 26.42, west: 119.85, east: 120.55 }, // 馬祖：南竿、北竿、莒光、東引
  { name: '金門縣', south: 24.35, north: 24.55, west: 118.13, east: 118.50 }, // 金門：烈嶼、大金門
];
export function offshoreAt(lon, lat) {
  const o = OFFSHORE.find((b) => lat >= b.south && lat <= b.north && lon >= b.west && lon <= b.east);
  return o ? o.name : null;
}

// 特別地點：在範圍內時優先於縣市（例如綠島屬於臺東縣，但有自己的小湘）
export const SPOTS = [
  { name: '綠島', lat: 22.66, lon: 121.49, radiusKm: 7 },
];
export function spotAt(lon, lat) {
  for (const s of SPOTS) {
    const km = Math.hypot((lon - s.lon) * 111.32 * Math.cos((lat * Math.PI) / 180), (lat - s.lat) * 110.57);
    if (km <= s.radiusKm) return s.name;
  }
  return null;
}

export function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(Object.assign(new Error('unsupported'), { code: 'unsupported' })); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lon: pos.coords.longitude, lat: pos.coords.latitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60 * 1000 },
    );
  });
}

export async function geoPermission() {
  try { return (await navigator.permissions.query({ name: 'geolocation' })).state; } catch { return 'unknown'; }
}
