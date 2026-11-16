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
    warmthNeeded: 150,
    hatches: null, // 從 pool 依權重隨機孵出
    // 前期池：N 每隻 14、R 每隻 8、SR 每隻 2，合計 100。
    // No.010 星塵、No.013 琥珀是比較難抽的 SR；No.011、012、014、015 保留特殊取得，不進一般池。
    pool: {
      '001': 14, '005': 14, '007': 14, '008': 14, // N
      '002': 8, '003': 8, '004': 8, '006': 8, '009': 8, // R
      '010': 2, '013': 2, // SR
      '036': 2, '037': 2, '038': 2, '039': 2, '040': 2, '041': 2, // SR 摯友小湘
      '044': 8, '048': 8, '053': 8, // N 動物
      '045': 5, '046': 5, '047': 5, '050': 5, '054': 5, // R 動物
      '049': 2, '052': 2, '055': 2, // SR 動物
      '051': 0.6, // SSR 恐龍小湘
    },
    // 正式三層素材：assets/eggs/ordinary/{shell,glow,cracks}.webp
  },
  wish: {
    id: 'wish',
    name: '願望蛋',
    code: 'WISH',
    warmthNeeded: 150,
    hatches: null,
    stocked: true, // 要從蛋庫取出（集滿願望印記獲得），不是隨時可選
    // 比普通蛋更容易遇到 R 與 SR：N 每隻 6、R 每隻 12、SR 每隻 8，合計 100
    pool: {
      '001': 6, '005': 6, '007': 6, '008': 6, // N
      '002': 12, '003': 12, '004': 12, '006': 12, '009': 12, // R
      '010': 8, '013': 8, // SR
      '043': 3, // SSR 戀愛小湘（聞止水ver），只在願望蛋
      '045': 6, '046': 6, '047': 6, '050': 6, '054': 6, // R 動物
      '049': 5, '052': 5, '055': 5, // SR 動物
      '051': 2, // SSR 恐龍小湘
    },
    // 正式三層素材：assets/eggs/wish/{shell,glow,cracks}.webp
  },
  weather: {
    id: 'weather',
    name: '天氣蛋',
    code: 'RAIN',
    warmthNeeded: 150,
    hatches: null,
    stocked: true, // 下雨天打開遊戲（已允許定位）時取得，每天最多一顆
    // 雨天的蛋：雨傘小湘最常見，喜歡雨的園丁、書頁也比較容易出現
    pool: {
      '003': 40, '006': 12, '007': 12, // 雨傘、園丁、書頁
      '001': 8, '005': 8, '004': 8, // 原味、甜點、夜貓
      '010': 6, '013': 6, // SR
    },
    // 正式天氣蛋圖層：assets/eggs/weather/{shell,glow,cracks}.webp
  },
  cipher: {
    id: 'cipher',
    name: '暗號蛋',
    code: 'CODE',
    warmthNeeded: 100,
    hatches: null,
    stocked: true, // 湘的暗號、照片委託送的蛋
    // 湘指定角色時固定孵出該角色（存在蛋上的 character）；沒指定就從這個池子抽
    pool: {
      '001': 6, '005': 6, '007': 6, '008': 6,
      '002': 12, '003': 12, '004': 12, '006': 12, '009': 12,
      '010': 8, '013': 8,
    },
    // 正式三層素材：assets/eggs/cipher/{shell,glow,cracks}.webp
  },
  keepsake: {
    id: 'keepsake',
    name: '紀念蛋',
    code: 'GIFT',
    warmthNeeded: 100,
    hatches: null,
    stocked: true, // 節日、生日、集滿縣市時收到，蛋上記著固定孵出的小湘
    // 正式紀念／節日蛋圖層：assets/eggs/keepsake/{shell,glow,cracks}.webp
  },
  county: {
    id: 'county',
    name: '縣市蛋',
    code: 'CITY',
    warmthNeeded: 150,
    hatches: null,
    stocked: true, // 在新縣市打卡取得，每個縣市一顆
    byCounty: true, // 固定孵出該縣市的小湘（見 rollFor）
    // 正式三層素材：assets/eggs/county/{shell,glow,cracks}.webp
  },
};

// 暫放架：換蛋時，已經注入能量的蛋放在這裡，進度保留
export const SHELF_MAX = 6;
export function ensureShelf(state) {
  state.shelf = (Array.isArray(state.shelf) ? state.shelf : []).filter((e) => e && EGGS[e.id] && Number.isSafeInteger(e.warmth) && e.warmth >= 0 && typeof e.since === 'string').slice(0, SHELF_MAX);
  return state.shelf;
}

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
  // 縣市小湘（台詞為德寶初稿，名稱暫定，等湘定案）：在該縣市打卡取得縣市蛋，固定孵出
  '016': { no: '016', name: '臺北市小湘', rarity: 'R', line: '「我最近在研究一個題目：為什麼一看到你就想笑？」', image: 'siang-016-taipei', series: 'county', county: '臺北市', special: true },
  '017': { no: '017', name: '新北市小湘', rarity: 'R', line: '「天燈上我只寫了一個願望，偷看的話就不靈了喔。」', image: 'siang-017-new-taipei', series: 'county', county: '新北市', special: true },
  '018': { no: '018', name: '基隆市小湘', rarity: 'R', line: '「港口的船都會回來，你也要記得回來找我。」', image: 'siang-018-keelung', series: 'county', county: '基隆市', special: true },
  '019': { no: '019', name: '桃園市小湘', rarity: 'R', line: '「飛去哪裡都好，回來的時候要第一個見我喔。」', image: 'siang-019-taoyuan', series: 'county', county: '桃園市', special: true },
  '020': { no: '020', name: '新竹市小湘', rarity: 'R', line: '「風好大！快抓緊我……順便請我喝一碗貢丸湯。」', image: 'siang-020-hsinchu-city', series: 'county', county: '新竹市', special: true },
  '021': { no: '021', name: '新竹縣小湘', rarity: 'R', line: '「擂茶要慢慢磨，柿餅要慢慢曬，喜歡你也是。」', image: 'siang-021-hsinchu-county', series: 'county', county: '新竹縣', special: true },
  '022': { no: '022', name: '苗栗縣小湘', rarity: 'R', line: '「桐花落下來的時候，要許個願才不會浪費喔。」', image: 'siang-022-miaoli', series: 'county', county: '苗栗縣', special: true },
  '023': { no: '023', name: '臺中市小湘', rarity: 'R', line: '「高美的夕陽我包下來了，太陽餅分你一半。」', image: 'siang-023-taichung', series: 'county', county: '臺中市', special: true },
  '024': { no: '024', name: '彰化縣小湘', rarity: 'R', line: '「大佛在看喔，今天要對我特別好一點。」', image: 'siang-024-changhua', series: 'county', county: '彰化縣', special: true },
  '025': { no: '025', name: '南投縣小湘', rarity: 'R', line: '「這杯茶要慢慢喝，就像日月潭邊要慢慢走。」', image: 'siang-025-nantou', series: 'county', county: '南投縣', special: true },
  '026': { no: '026', name: '雲林縣小湘', rarity: 'R', line: '「戲台上我是大俠，戲台下只想當你的小湘。」', image: 'siang-026-yunlin', series: 'county', county: '雲林縣', special: true },
  '027': { no: '027', name: '嘉義市小湘', rarity: 'R', line: '「車票買好了，從北門驛出發，終點站是你。」', image: 'siang-027-chiayi-city', series: 'county', county: '嘉義市', special: true },
  '028': { no: '028', name: '嘉義縣小湘', rarity: 'R', line: '「搭小火車上山看日出，起不來的話……我叫你。」', image: 'siang-028-chiayi-county', series: 'county', county: '嘉義縣', special: true },
  '029': { no: '029', name: '臺南市小湘', rarity: 'R', line: '「劍獅幫我顧家，你只要負責陪我吃遍臺南。」', image: 'siang-029-tainan', series: 'county', county: '臺南市', special: true },
  '030': { no: '030', name: '高雄市小湘', rarity: 'R', line: '「搭渡輪去旗津吧，海風很大，手要牽好喔。」', image: 'siang-030-kaohsiung', series: 'county', county: '高雄市', special: true },
  '031': { no: '031', name: '屏東縣小湘', rarity: 'R', line: '「剛蒸好的吉拿富，第一口要留給你。」', image: 'siang-031-pingtung', series: 'county', county: '屏東縣', special: true },
  '032': { no: '032', name: '宜蘭縣小湘', rarity: 'R', line: '「泡完溫泉來吃蔥油餅，小狐狸說牠也要一口。」', image: 'siang-032-yilan', series: 'county', county: '宜蘭縣', special: true },
  '033': { no: '033', name: '花蓮縣小湘', rarity: 'R', line: '「七星潭撿到一顆最圓的石頭，送你。晚上去逛東大門！」', image: 'siang-033-hualien', series: 'county', county: '花蓮縣', special: true },
  '034': { no: '034', name: '臺東縣小湘', rarity: 'R', line: '「我騎車載你！……騙你的，你載我。」', image: 'siang-034-taitung', series: 'county', county: '臺東縣', special: true },
  // 特別地點小湘：在縣市裡的特定地點打卡取得（地點範圍見 js/geo.js 的 SPOTS）
  '035': { no: '035', name: '綠島小湘', rarity: 'SR', line: '「燈塔幫我們看著海，你只要負責看著我就好。」', image: 'siang-035-green-island', series: 'county', county: '綠島', special: true },
  // 摯友小湘（台詞為德寶初稿）：普通蛋可開出
  '036': { no: '036', name: '摯友小湘（把拔ver）', rarity: 'SR', line: '「把拔又累到睡著了，我們小聲一點喔。」', image: 'siang-036-friend-baba', series: 'friends' },
  '037': { no: '037', name: '摯友小湘（ㄊㄧver）', rarity: 'SR', line: '「ㄊㄧ說抱抱可以充電，你要不要也來一下？」', image: 'siang-037-friend-ti', series: 'friends' },
  '038': { no: '038', name: '摯友小湘（史蒂芬灰ver）', rarity: 'SR', line: '「史蒂芬灰在聽歌，我們一起跟著哼吧～」', image: 'siang-038-friend-steven-gray', series: 'friends' },
  '039': { no: '039', name: '摯友小湘（Serry ver）', rarity: 'SR', line: '「Serry 說今天的光線很好，來拍一張！」', image: 'siang-039-friend-serry', series: 'friends' },
  '040': { no: '040', name: '摯友小湘（Achio ver）', rarity: 'SR', line: '「Achio 說運動完要補充水分，你今天喝水了嗎？」', image: 'siang-040-friend-achio', series: 'friends' },
  '041': { no: '041', name: '摯友小湘（Bois ver）', rarity: 'SR', line: '「Bois 撿到一根超大的漂流木，說要送給你。」', image: 'siang-041-friend-bois', series: 'friends' },
  // 約會：約會蛋（約會 QR Code）取得
  '042': { no: '042', name: '蝰蝰♡', rarity: 'SSR', line: '「蝰蝰今天有想我嗎🥺」', image: 'siang-042-kuikui', series: 'date', special: true },
  // 特別：願望蛋可開出
  '043': { no: '043', name: '戀愛小湘（聞止水ver）', rarity: 'SSR', line: '「我老婆超漂亮❤️」', image: 'siang-043-love-wen', series: 'special' },
  // 動物小湘系列（台詞為德寶初稿）：普通蛋、願望蛋可開出
  '044': { no: '044', name: '貓咪小湘', rarity: 'N', line: '「喵～快點摸摸我的頭，不然要咬你了喔。」', image: 'siang-044-cat', series: 'animals' },
  '045': { no: '045', name: '小丑魚小湘', rarity: 'R', line: '「不管游多遠，我都找得到回家的路，因為家裡有你。」', image: 'siang-045-clownfish', series: 'animals' },
  '046': { no: '046', name: '螃蟹小湘', rarity: 'R', line: '「我會橫著走，但喜歡你這件事是直直走的！」', image: 'siang-046-crab', series: 'animals' },
  '047': { no: '047', name: '無尾熊小湘', rarity: 'R', line: '「讓我抱一下下就好……好吧，抱一整天。」', image: 'siang-047-koala', series: 'animals' },
  '048': { no: '048', name: '狗狗小湘', rarity: 'N', line: '「汪！你回來了！我等你好久好久了！」', image: 'siang-048-puppy', series: 'animals' },
  '049': { no: '049', name: '狐狸小湘', rarity: 'SR', line: '「狐狸會一直記得帶給牠溫暖的人喔。」', image: 'siang-049-fox', series: 'animals' },
  '050': { no: '050', name: '浣熊小湘', rarity: 'R', line: '「洗乾淨的點心最好吃，第一個給你！」', image: 'siang-050-raccoon', series: 'animals' },
  '051': { no: '051', name: '恐龍小湘', rarity: 'SSR', line: '「嗷嗚！我是孵化室最強的恐龍，要好好照顧我喔！」', image: 'siang-051-dino', series: 'animals' },
  '052': { no: '052', name: '守宮小湘', rarity: 'SR', line: '「我會黏在你身邊，甩都甩不掉的那種。」', image: 'siang-052-gecko', series: 'animals' },
  '053': { no: '053', name: '老鼠小湘', rarity: 'N', line: '「起司我偷偷藏了一塊，要分你一半嗎？」', image: 'siang-053-mouse', series: 'animals' },
  '054': { no: '054', name: '企鵝小湘', rarity: 'R', line: '「天氣再冷，跟你擠在一起就不冷了。」', image: 'siang-054-penguin', series: 'animals' },
  '055': { no: '055', name: '兔兔小湘', rarity: 'SR', line: '「兔兔公主駕到！今天要被寵一整天喔。」', image: 'siang-055-bunny', series: 'animals' },
  // 節日小湘：節日期間收到紀念蛋（js/holidays.js）
  '056': { no: '056', name: '情人節小湘', rarity: 'SSR', line: '「巧克力是真心的，你要好好收下喔♡」', image: 'siang-056-valentine', series: 'holiday', special: true },
  '057': { no: '057', name: '白色情人節小湘', rarity: 'SSR', line: '「上個月的心意，我加倍還給你。」', image: 'siang-057-white-day', series: 'holiday', special: true },
  '058': { no: '058', name: '聖誕小湘', rarity: 'SSR', line: '「聖誕快樂！今年最好的禮物，是遇見你。」', image: 'siang-058-christmas', series: 'holiday', special: true },
  '059': { no: '059', name: '七夕小湘', rarity: 'SSR', line: '「鵲橋搭好了，這次換我去找你。」', image: 'siang-059-qixi', series: 'holiday', special: true },
  '060': { no: '060', name: '萬聖節小湘', rarity: 'SSR', line: '「不給糖就搗蛋！……給了糖也要搗蛋。」', image: 'siang-060-halloween', series: 'holiday', special: true },
  // 集滿 19 位縣市小湘時送出
  '061': { no: '061', name: '台灣小湘', rarity: 'UR', line: '「我們把整座島都走過一遍了，謝謝你帶我回家。」', image: 'siang-061-taiwan', series: 'county', special: true },
};

// 圖鑑系列：顯示順序就是這裡的順序
export const SERIES = {
  daily: { name: '日常系列', short: '日常' },
  weather: { name: '天氣與時間', short: '天氣' },
  recipe: { name: '隱藏配方', short: '配方' },
  date: { name: '約會系列', short: '約會' },
  memorial: { name: '紀念限定', short: '限定' },
  county: { name: '縣市系列', short: '縣市' },
  friends: { name: '摯友系列', short: '摯友' },
  animals: { name: '動物小湘', short: '動物' },
  holiday: { name: '節日系列', short: '節日' },
  special: { name: '特別收藏', short: '特別' },
};

// 縣市 → 縣市小湘編號
export const COUNTY_CHARACTER = Object.fromEntries(Object.values(CHARACTERS).filter((c) => c.county).map((c) => [c.county, c.no]));

// 依培育中的蛋決定孵出誰：縣市蛋固定孵出該縣市的小湘，其他蛋照蛋池抽
// boosts：[{ no, times }]，例如深夜時夜貓小湘權重 ×4（只影響蛋池裡本來就有的角色）
export function rollFor(eggState, boosts = []) {
  const egg = EGGS[eggState.id];
  if (eggState.character && CHARACTERS[eggState.character]) return eggState.character;
  if (egg.byCounty) return COUNTY_CHARACTER[eggState.county] || '001';
  if (!egg.pool || !boosts.length) return rollHatch(egg);
  const pool = { ...egg.pool };
  for (const b of boosts) if (pool[b.no]) pool[b.no] *= b.times;
  return rollHatch({ ...egg, pool });
}

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
