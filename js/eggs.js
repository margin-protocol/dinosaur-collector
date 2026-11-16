// 恐龍蛋與小湘的資料表。新增蛋或角色只要在這裡加一筆，不用改其他程式。
// 圖片路徑規則見 docs/ASSET_SPEC.md：檔案放對位置就會自動取代佔位圖。

// 蛋本身只有三層；培養架是首頁的固定裝置，所有蛋共用（見 incubatorSources）
export const EGG_LAYERS = ['shell', 'glow', 'cracks'];

export const EGGS = {
  origin: {
    id: 'origin',
    name: '小湘本源蛋',
    code: 'ORIGIN-001', // 標本編號，顯示在培育槽名牌上
    warmthNeeded: 100,
    hatches: '001', // 固定孵出原味小湘
  },
  ordinary: {
    id: 'ordinary',
    name: '普通蛋',
    code: 'STD',
    warmthNeeded: 200,
    hatches: null, // 從 pool 依權重隨機孵出
    // 前期池：N 每隻 14、R 每隻 8、SR 每隻 2，合計 100。
    // No.010 星塵、No.013 琥珀是比較難抽的 SR；No.011、012、014、015 保留特殊取得，不進一般池。
    pool: {
      '001': 14, '005': 14, '007': 14, '008': 14, // N
      '002': 8, '003': 8, '004': 8, '006': 8, '009': 8, // R
      '010': 2, '013': 2, // SR
    },
    // 暫用：正式的普通蛋素材還沒到，先借本源蛋的圖並改色。素材到了就刪掉這兩行。
    art: 'origin',
    tint: 'hue-rotate(150deg) saturate(0.75)',
  },
};

export const DUPLICATE_FOSSILS = 3; // 孵到已擁有的小湘時，轉換成幾個化石碎片

// 依權重從蛋池抽一隻
export function rollHatch(egg) {
  if (egg.hatches) return egg.hatches;
  const entries = Object.entries(egg.pool);
  let r = Math.random() * entries.reduce((sum, [, w]) => sum + w, 0);
  for (const [no, w] of entries) {
    r -= w;
    if (r < 0) return no;
  }
  return entries[0][0];
}

export const CHARACTERS = {
  '001': {
    no: '001',
    name: '原味小湘',
    rarity: 'N',
    line: '「欸？你就是我的飼養員嗎？」',
    image: 'siang-001-hd/idle-open',
    series: 'daily',
  },
  // 第一批正式名單（2026-11-16 湘定案）
  '002': { no: '002', name: '草莓小湘', rarity: 'R', line: '「今天找到紅色的東西了嗎？我要最甜的那個！」', image: 'siang-002-strawberry', series: 'daily' },
  '003': { no: '003', name: '雨傘小湘', rarity: 'R', line: '「過來一點，傘都歪到你那邊了啦。」', image: 'siang-003-umbrella', series: 'weather' },
  '004': { no: '004', name: '夜貓小湘', rarity: 'R', line: '「我還沒睡……但你不准陪我熬夜喔。」', image: 'siang-004-nightowl', series: 'weather' },
  '005': { no: '005', name: '甜點小湘', rarity: 'N', line: '「只分你一口喔……好啦，兩口！」', image: 'siang-005-dessert', series: 'daily' },
  '006': { no: '006', name: '園丁小湘', rarity: 'R', line: '「花要慢慢養，喜歡的人也是。」', image: 'siang-006-gardener', series: 'daily' },
  '007': { no: '007', name: '書頁小湘', rarity: 'N', line: '「這一頁先不要翻，我還想跟你待一下。」', image: 'siang-007-bookpage', series: 'daily' },
  '008': { no: '008', name: '晴空小湘', rarity: 'N', line: '「今天的天空好漂亮！我們把它收藏起來吧。」', image: 'siang-008-clearsky', series: 'daily' },
  '009': { no: '009', name: '膠卷小湘', rarity: 'R', line: '「等一下！這張不准刪，我還沒看夠呢。」', image: 'siang-009-film', series: 'daily' },
  '010': { no: '010', name: '星塵小湘', rarity: 'SR', line: '「把手伸出來，我分你一小片宇宙。」', image: 'siang-010-stardust', series: 'weather' },
  // 011、012、014、015 為特殊取得，不進一般蛋池（013 琥珀可從普通蛋低機率抽到）
  '011': { no: '011', name: '草莓蛋糕小湘', rarity: 'SR', line: '「草莓是我的，蛋糕是你的……不對，都是我的！」', image: 'siang-011-strawberry-cake', series: 'recipe', special: true },
  '012': { no: '012', name: '雨中花園小湘', rarity: 'SSR', line: '「你看，雨停之前，我們的花已經開了。」', image: 'siang-012-rain-garden', series: 'recipe', special: true },
  '013': { no: '013', name: '琥珀小湘', rarity: 'SR', line: '「有些心事藏得太久，會變成亮晶晶的寶物。」', image: 'siang-013-amber', series: 'daily' },
  '014': { no: '014', name: '約會小湘', rarity: 'SSR', line: '「今天的回憶，我偷偷幫你存了一份喔♡」', image: 'siang-014-date', series: 'date', special: true },
  '015': { no: '015', name: '壽星小湘', rarity: 'UR', line: '「今天我最大！所以你要陪我一整天！」', image: 'siang-015-birthday', series: 'memorial', special: true },
};

// 圖鑑系列：顯示順序就是這裡的順序
export const SERIES = {
  daily: { name: '日常系列', short: '日常' },
  weather: { name: '天氣與時間', short: '天氣' },
  recipe: { name: '隱藏配方', short: '配方' },
  date: { name: '約會系列', short: '約會' },
  memorial: { name: '紀念限定', short: '限定' },
};

const FORMATS = ['webp', 'png'];

// 依序嘗試正式素材（webp → png），都沒有就用佔位圖
export function eggLayerSources(eggId, layer) {
  return [
    ...FORMATS.map((ext) => `assets/eggs/${eggId}/${layer}.${ext}`),
    `assets/eggs/_placeholder/${layer}.svg`,
  ];
}

// 共用培養架：cradle-back 在蛋後面、cradle-front 蓋在蛋前面
export function incubatorSources(part) {
  return [
    ...FORMATS.map((ext) => `assets/incubator/${part}.${ext}`),
    `assets/incubator/_placeholder/${part}.svg`,
  ];
}

export function characterSources(image) {
  return [
    ...FORMATS.map((ext) => `assets/characters/${image}.${ext}`),
    'assets/characters/_placeholder.png',
  ];
}

// 讓 <img> 在載入失敗時自動換下一個候選路徑
export function loadWithFallback(img, sources) {
  let i = 0;
  img.onerror = () => {
    i += 1;
    if (i < sources.length) img.src = sources[i];
    else img.onerror = null;
  };
  img.src = sources[0];
}
