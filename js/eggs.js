// 恐龍蛋與小湘的資料表。新增蛋或角色只要在這裡加一筆，不用改其他程式。
// 圖片路徑規則見 docs/ASSET_SPEC.md：檔案放對位置就會自動取代佔位圖。

export const EGG_LAYERS = ['cradle', 'glow', 'shell', 'cracks'];

export const EGGS = {
  origin: {
    id: 'origin',
    name: '小湘本源蛋',
    warmthNeeded: 100,
    hatches: '001', // 固定孵出原味小湘
  },
  ordinary: {
    id: 'ordinary',
    name: '普通蛋',
    warmthNeeded: 100,
    hatches: null, // 之後接蛋池
  },
};

export const CHARACTERS = {
  '001': {
    no: '001',
    name: '原味小湘',
    rarity: 'N',
    line: '「欸？你就是我的飼養員嗎？」',
    image: 'siang-001-original',
  },
};

const FORMATS = ['webp', 'png'];

// 依序嘗試正式素材（webp → png），都沒有就用佔位圖
export function eggLayerSources(eggId, layer) {
  return [
    ...FORMATS.map((ext) => `assets/eggs/${eggId}/${layer}.${ext}`),
    `assets/eggs/_placeholder/${layer}.svg`,
  ];
}

export function characterSources(image) {
  return [
    ...FORMATS.map((ext) => `assets/characters/${image}.${ext}`),
    'assets/characters/_placeholder.svg',
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
