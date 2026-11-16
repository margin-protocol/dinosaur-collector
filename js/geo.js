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

export function currentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(Object.assign(new Error('unsupported'), { code: 'unsupported' })); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lon: pos.coords.longitude, lat: pos.coords.latitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

export async function geoPermission() {
  try { return (await navigator.permissions.query({ name: 'geolocation' })).state; } catch { return 'unknown'; }
}
