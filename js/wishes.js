// 願望：小湘（或蛋裡的聲音）想看某種顏色的東西，玩家拍照，程式分析照片顏色。
// 照片只在手機上分析，不會上傳，也不會保存。

import { WISH_COPY, STAGE_COLUMN, STAGE_SPEAKER } from './wish-copy.js';

export const WISH_REWARD = 35; // 每個願望給的保溫能量
export const WISHES_PER_DAY = 3;
export const PASS_RATIO = 0.25; // 目標顏色要佔畫面至少 25%

const inHue = (h, from, to) => (from <= to ? h >= from && h < to : h >= from || h < to);

export const WISH_POOL = [
  { id: 'red', color: '紅色', swatch: '#d2203f', line: '想看紅色的東西……', test: (h, s, v) => inHue(h, 340, 15) && s >= 0.4 && v >= 0.25 },
  { id: 'yellow', color: '黃色或橘色', swatch: '#f0b03a', line: '想看黃色或橘色的東西！', test: (h, s, v) => inHue(h, 20, 70) && s >= 0.35 && v >= 0.35 },
  { id: 'green', color: '綠色', swatch: '#4fae6a', line: '想看綠綠的東西，植物也可以。', test: (h, s, v) => inHue(h, 70, 170) && s >= 0.25 && v >= 0.2 },
  { id: 'blue', color: '藍色', swatch: '#3f8fe0', line: '想看藍色，天空也可以。', test: (h, s, v) => inHue(h, 170, 260) && s >= 0.25 && v >= 0.25 },
  { id: 'pink', color: '粉紅色或紫色', swatch: '#e07ac0', line: '想看粉紅色或紫色的東西～', test: (h, s, v) => inHue(h, 260, 340) && s >= 0.2 && v >= 0.3 },
  { id: 'white', color: '白色', swatch: '#f4f1ec', line: '想看白白的東西。', test: (h, s, v) => s < 0.14 && v > 0.78 },
];

export function todayKey(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 用日期當種子洗牌：同一天打開幾次都是同樣的三個願望
function seeded(seedText) {
  let h = 2166136261;
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function wishesFor(dateKey) {
  const rand = seeded(dateKey);
  const pool = [...WISH_POOL];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, WISHES_PER_DAY);
}

function toHsv(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return [h, max ? d / max : 0, max / 255];
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('照片讀取失敗'));
    };
    img.src = url;
  });
}

// 分析照片：回傳目標顏色佔畫面的比例（0–1），並把縮圖畫到 previewCanvas 上
export async function analyzePhoto(file, wish, previewCanvas) {
  const img = await loadImage(file);
  const N = 48;
  const c = document.createElement('canvas');
  c.width = N;
  c.height = N;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, N, N);
  const { data } = ctx.getImageData(0, 0, N, N);
  let hit = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, v] = toHsv(data[i], data[i + 1], data[i + 2]);
    if (wish.test(h, s, v)) hit += 1;
  }
  if (previewCanvas) {
    const size = previewCanvas.width;
    const side = Math.min(img.width, img.height);
    previewCanvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
  }
  return hit / (N * N);
}

// 今天這個願望要顯示的名稱與台詞。
// 由「日期」決定用文案池的第幾筆：同一天不管重整幾次都一樣，而且每種顏色要輪完整個文案池才會重複。
// stage 是願望產生當下的成長階段（存在存檔裡），當天中途長大也不會換文案。
export function wishCopy(wish, dateKey, stage) {
  const pool = WISH_COPY[wish.id] || [];
  const [y, m, d] = dateKey.split('-').map(Number);
  const day = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  const colorIndex = WISH_POOL.findIndex((w) => w.id === wish.id);
  // 每天往前跳 7 筆（7 與常見的池子大小互質），再依顏色錯開，避免同一天的名稱風格太像
  const entry = pool.length ? pool[(day * 7 + colorIndex * 4) % pool.length] : null;
  const column = STAGE_COLUMN[stage] || STAGE_COLUMN.egg;
  return {
    name: entry ? entry[0] : `尋找${wish.color}`,
    line: entry ? entry[column] || entry[STAGE_COLUMN.young] || entry[STAGE_COLUMN.egg] : wish.line,
    speaker: STAGE_SPEAKER[stage] || STAGE_SPEAKER.egg,
    hint: `拍下含${wish.color}的東西`,
  };
}
