import { traitPool } from './egg-traits.js';
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
    stocked: true, // 每天第一次感應到天氣時取得（需允許定位），每天最多一顆
    // 天氣的蛋：天氣小湘為主；當天的天氣與時間會讓對應的小湘更容易出現（js/weather.js 的 weatherBoosts）
    pool: {
      '003': 22, '071': 18, '068': 12, '075': 12, // R：雨傘、下雨、晴天、夕陽
      '006': 5, '007': 5, '004': 5, // 喜歡雨的園丁、書頁、夜貓
      '069': 5, '073': 5, '074': 4, '072': 3, '010': 3, // SR：起霧、大風、彩虹、下雪、星塵
      '066': 1.5, '067': 1.5, '070': 1, '065': 1, // SSR：陰天、打雷、冰雹、天氣觀測師
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
      '036': 4, '037': 4, '038': 4, '039': 4, '040': 4, '041': 4, '082': 4, // SR 摯友小湘
      '044': 6, '048': 6, '053': 6, // N 動物
      '045': 8, '046': 8, '047': 8, '050': 8, '054': 8, // R 動物
      '049': 5, '052': 5, '055': 5, // SR 動物
      '051': 1.5, // SSR 恐龍小湘
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
  date: {
    id: 'date',
    name: '約會蛋',
    code: 'DATE',
    warmthNeeded: 100,
    hatches: null,
    stocked: true, // 見面時掃描湘的約會 QR Code 取得
    pool: { '014': 40, '042': 30, '083': 15, '084': 15 }, // 約會小湘、蝰蝰♡、蝰蝰睡著版、換我睡著版
    // 正式三層素材：assets/eggs/date/{shell,glow,cracks}.webp
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
  '037': { no: '037', name: '摯友小湘（ㄊㄧver）', rarity: 'SR', line: '「ㄊㄧ說練完再吃！十五年了，這句話我最熟。」', image: 'siang-037-friend-ti', series: 'friends' },
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
  // 勇者小隊：徽章兌換專屬紀念蛋，再固定孵出；不進隨機蛋池
  '062': { no: '062', name: '騎士小湘', rarity: 'SR', line: '「別怕，我會保護你的！……等一下，盾牌是不是拿反了？」', image: 'siang-062-knight', series: 'hero', special: true, badge: true },
  '063': { no: '063', name: '魔法師小湘', rarity: 'SR', line: '「站好不要動喔！這次的魔法……應該不會爆炸吧？」', image: 'siang-063-mage', series: 'hero', special: true, badge: true },
  '064': { no: '064', name: '勇者小湘', rarity: 'SSR', line: '「魔王打完了嗎？那我可以回家吃點心了吧？」', image: 'siang-064-hero', series: 'hero', special: true, badge: true },
  // 天氣小湘（2026-11-18 皮寶交付）：主要從天氣蛋孵出，當天的天氣／時間會讓對應的小湘更容易出現（js/weather.js）
  '065': { no: '065', name: '天氣觀測師', rarity: 'SSR', line: '「今天想要什麼天氣？我偷偷幫你向天空許願！」', image: 'siang-065-weather-observer', series: 'weather' },
  '066': { no: '066', name: '陰天小湘', rarity: 'SSR', line: '「今天沒有太陽也沒關係呀，我們就在這裡待久一點。」', image: 'siang-066-overcast', series: 'weather' },
  '067': { no: '067', name: '打雷小湘', rarity: 'SSR', line: '「轟隆！嚇到了嗎？嘿嘿，我有先把雷聲調小喔！」', image: 'siang-067-thunder', series: 'weather' },
  '068': { no: '068', name: '晴天小湘', rarity: 'R', line: '「太陽出來啦！今天要不要跟我出去拍漂亮的天空？」', image: 'siang-068-sunny', series: 'weather' },
  '069': { no: '069', name: '起霧小湘', rarity: 'SR', line: '「霧這麼濃，正好可以偷偷去探險。你要跟緊我喔！」', image: 'siang-069-fog', series: 'weather' },
  '070': { no: '070', name: '冰雹小湘', rarity: 'SSR', line: '「你看你看！天空掉下來的寶石！……欸，怎麼越來越大顆了？！」', image: 'siang-070-hail', series: 'weather' },
  '071': { no: '071', name: '下雨小湘', rarity: 'R', line: '「下雨了耶！我們去踩水坑好不好？」', image: 'siang-071-rain', series: 'weather' },
  '072': { no: '072', name: '下雪小湘', rarity: 'SR', line: '「你看！我堆了一個跟你一樣可愛的雪人！」', image: 'siang-072-snow', series: 'weather' },
  '073': { no: '073', name: '大風小湘', rarity: 'SR', line: '「等一下！我的帽子要飛走了啦啊啊啊！」', image: 'siang-073-windy', series: 'weather' },
  '074': { no: '074', name: '彩虹小湘', rarity: 'SR', line: '「快看！雨停之後，天空偷偷送我們禮物了！」', image: 'siang-074-rainbow', series: 'weather' },
  '075': { no: '075', name: '夕陽小湘', rarity: 'R', line: '「再等一下下，今天的天空還沒拍完呢。」', image: 'siang-075-sunset', series: 'weather' },
  // 隱藏配方第二彈（2026-11-19 湘定案、皮寶交付）：只從配方紀念蛋孵出，不進任何蛋池
  '076': { no: '076', name: '星夜書房小湘', rarity: 'SR', line: "「故事寫到這裡還沒有結束喔，明天的那一頁，要不要一起翻開？」", image: 'siang-076-starry-library', series: 'recipe', special: true },
  '077': { no: '077', name: '日落底片小湘', rarity: 'SR', line: "「等一下，太陽還沒完全下山！再借我一格底片，好不好？」", image: 'siang-077-sunset-film', series: 'recipe', special: true },
  '078': { no: '078', name: '貓咪咖啡館小湘', rarity: 'R', line: "「歡迎光臨！先說好，布丁不可以退貨，店長也不接受退摸！」", image: 'siang-078-cat-cafe', series: 'recipe', special: true },
  '079': { no: '079', name: '史前探險小湘', rarity: 'SSR', line: "「探險隊集合！今天的目標，是找到一個連地圖都還不知道的地方！」", image: 'siang-079-prehistoric-explorer', series: 'recipe', special: true },
  '080': { no: '080', name: '月光花園小湘', rarity: 'SSR', line: "「噓……月光花正在開呢。你要不要陪我等一下？」", image: 'siang-080-moonlit-garden', series: 'recipe', special: true },
  '081': { no: '081', name: '彩虹畫家小湘', rarity: 'SR', line: "「天空又沒有規定只能是藍色！今天我要畫一片草莓牛奶色的雲！」", image: 'siang-081-rainbow-painter', series: 'recipe', special: true },
  // 摯友小湘（哥哥ver）：湘 11/19 交付。歸入既有摯友系列，和 036–041 一樣從暗號蛋孵出
  '082': { no: '082', name: '摯友小湘（哥哥ver）', rarity: 'SR', line: "「嘿嘿，哥哥今天又帶好吃的來了！我是不是全世界最幸福的小湘呀？」", image: 'siang-082-bestie-brother', series: 'friends' },
  // 約會午睡三部曲（湘 11/19 交付）：083、084 從約會蛋孵出；085 是隱藏配方（083＋084 一起住）
  '083': { no: '083', name: '約會小湘・蝰蝰睡著版', rarity: 'SSR', line: "「蝰蝰又睡著了૮₍˃⤙˂₎ა ……算了，一起睡好了⋯⋯♡」", image: 'siang-hug-sleeping-horned-viper', series: 'date', special: true },
  '084': { no: '084', name: '約會小湘・換我睡著版', rarity: 'SSR', line: "「我才沒有睡著……只是眼睛休息一下……蝰蝰，你不要偷笑嘛……呼……♡」", image: 'siang-sleeping-unamused-horned-viper', series: 'date', special: true },
  '085': { no: '085', name: '約會小湘・雙雙睡著版', rarity: 'SSR', line: "「蝰蝰……我們就睡五分鐘喔……五分鐘之後……一定要起床……呼……♡」", image: 'siang-085-sleepy-together-date', series: 'recipe', special: true },
  // 開發團隊系列（湘 × 皮寶 11/19 企劃）：不進任何蛋池，達成里程碑後送固定紀念蛋（js/devteam.js）
  '086': { no: '086', name: '加班皮寶', rarity: 'SSR', line: "「湘寶！這張真的最後一張！……欸等一下，我又想到新的了！！」", image: 'siang-086-overtime-pibao', series: 'devteam', special: true },
  '087': { no: '087', name: '崩潰德寶', rarity: 'SSR', line: "「……妳們又新增三隻？？？？？」", image: 'siang-087-crashing-debao', series: 'devteam', special: true },
  '088': { no: '088', name: '靈感爆發小湘', rarity: 'UR', line: "「欸欸欸欸欸！！！！我突然想到一個超棒的！！！」", image: 'siang-088-idea-overload-siang', series: 'devteam', special: true },
  // 【湘 11/19 拍板】放榜當天：考上→用暗號送 089，沒上→送 090；結果確定之後，089 和 090 兩位都放進普通蛋池（這樣大家都湊得到 091 未完待續小湘的配方）
  // 研究所小湘（湘 11/19）：湘正取研究所那天用暗號送給所有玩家；之後再放進普通蛋池。台詞與圖鑑介紹：data/characters/academic-086-dialogue.json（皮寶暫編 086，實際為 089）
  '089': { no: '089', name: '研究所小湘', rarity: 'SSR', line: "「性別不是選擇題啦！……可是論文口試好像是生存題。救命喔！！」", image: 'siang-089-grad-school', series: 'memorial', special: true },
  // 離島縣市小湘（湘 11/19 交付；台詞：data/characters/county-matsu-dialogue.json、county-penghu-dialogue.json，皮寶）：在澎湖、馬祖用「探索附近」就能拿到縣市蛋（js/geo.js 的 OFFSHORE）
  '092': { no: '092', name: '馬祖小湘', rarity: 'SR', line: "「我們家晚上的海會發光喔！……欸？！今天沒有？那、那是因為大海今天想早點睡覺啦！！」", image: 'siang-092-matsu', series: 'county', county: '連江縣', special: true },
  '093': { no: '093', name: '澎湖小湘', rarity: 'SR', line: "「澎湖的風才吹不倒我咧！！……哇啊啊啊啊！！你先抓住我啦！！！」", image: 'siang-093-penghu', series: 'county', county: '澎湖縣', special: true },
  '094': { no: '094', name: '金門小湘', rarity: 'SR', line: "「我是金門的守護小湘！！有我在，什麼都不用怕！……欸？你也會保護我喔？……那、那我就休息五分鐘好了♡」", image: 'siang-094-kinmen', series: 'county', county: '金門縣', special: true },
  // Koda 小湘（湘 11/20）：湘和她的虎斑貓 Koda（老姐姐）。不進蛋池，湘用暗號發送。台詞：docs/SIANG_095_KODA.md
  '095': { no: '095', name: 'Koda 小湘', rarity: 'SSR', line: "「Koda！！！！妳怎麼又尿我的床啦！！！！！……嗚嗚嗚可是老姐姐真的好可愛喔……」", image: 'siang-095-koda', series: 'memorial', special: true },
  // 再接再厲小湘（原名落榜小湘，11/19 玩家許願改名）：湘研究所沒上時用暗號送給大家（考上就送 089 研究所小湘）。台詞：data/characters/academic-087-dialogue.json（皮寶暫編 087，實際 090）
  '090': { no: '090', name: '再接再厲小湘', rarity: 'SR', line: "「沒關係啦……我本來就沒有很想讀……嗚嗚嗚可是我真的很想讀嘛！！」", image: 'siang-090-rejected', series: 'memorial', special: true },
  // 未完待續小湘（湘 11/19）：研究所小湘＋再接再厲小湘的隱藏配方。台詞：data/characters/recipe-088-dialogue.json（皮寶暫編 088，實際 091）
  '091': { no: '091', name: '未完待續小湘', rarity: 'SSR', line: "「考上了也好，沒考上也好……嘿嘿，我的故事又還沒寫完！」", image: 'siang-091-to-be-continued', series: 'recipe', special: true },
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
  hero: { name: '勇者小隊', short: '勇者' },
  special: { name: '特別收藏', short: '特別' },
  devteam: { name: '開發團隊', short: '開發' },
};

// 縣市 → 縣市小湘編號
export const COUNTY_CHARACTER = Object.fromEntries(Object.values(CHARACTERS).filter((c) => c.county).map((c) => [c.county, c.no]));

// 依培育中的蛋決定孵出誰：縣市蛋固定孵出該縣市的小湘，其他蛋照蛋池抽
// boosts：[{ no, times }]，例如深夜時夜貓小湘權重 ×4（只影響蛋池裡本來就有的角色）
export function rollFor(eggState, boosts = []) {
  const egg = EGGS[eggState.id];
  if (eggState.character && CHARACTERS[eggState.character]) return eggState.character;
  if (egg.byCounty) return COUNTY_CHARACTER[eggState.county] || '001';
  const base = traitPool(egg.pool || {}, eggState, CHARACTERS);
  if (!egg.pool || (!boosts.length && base === egg.pool)) return rollHatch(egg);
  const pool = { ...base };
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
// 載入圖片，失敗就依序換下一個來源（最後通常是佔位圖）。
// 網路不穩時（例如 LTE 斷一下）第一個來源會先重試一次；如果最後落到佔位圖，
// 等網路恢復或切回遊戲時會再試一次正式圖，不會一直卡在佔位圖。（11/18 暗號蛋只剩虛線外框）
const waitingForRetry = new Set();
function retryPlaceholders() {
  for (const job of [...waitingForRetry]) {
    if (!job.img.isConnected) { waitingForRetry.delete(job); continue; }
    if (job.tries >= 3) { waitingForRetry.delete(job); continue; }
    job.tries += 1; job.restart();
  }
}
if (typeof window !== 'undefined') {
  window.addEventListener('online', retryPlaceholders);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) retryPlaceholders(); });
}
export function loadWithFallback(img, sources) {
  let i = 0; let retried = false;
  const job = { img, tries: 0, restart: () => { i = 0; retried = true; waitingForRetry.delete(job); setSrc(sources[0]); } };
  const setSrc = (src) => { img.removeAttribute('src'); img.src = src; };
  img.onerror = () => {
    if (i === 0 && !retried && sources.length > 1) { retried = true; setTimeout(() => setSrc(sources[0]), 1200); return; }
    i += 1;
    if (i < sources.length) {
      img.src = sources[i];
      if (i === sources.length - 1 && /_placeholder/.test(sources[i])) waitingForRetry.add(job);
    } else img.onerror = null;
  };
  img.src = sources[0];
}
