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
    pool: { '002': 35, '003': 30, '004': 15, '001': 20 },
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
    image: 'siang-001-original',
  },
  // 以下三隻是暫定名單（取自企劃書的舉例），等湘確認第一批小湘後再改
  '002': { no: '002', name: '草莓小湘', rarity: 'R', line: '「紅紅的東西最可愛了。」', image: 'siang-002-strawberry' },
  '003': { no: '003', name: '雨傘小湘', rarity: 'R', line: '「下雨天也要出門嗎？」', image: 'siang-003-umbrella' },
  '004': { no: '004', name: '熬夜小湘', rarity: 'SR', line: '「再五分鐘……再五分鐘就睡。」', image: 'siang-004-nightowl' },
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
