import { CAT_GECKO } from './cat-gecko.js';
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
      '036': 2, '037': 2, '038': 2, '039': 2, '040': 2, '041': 2, '098': 2, // SR 摯友小湘
      '044': 8, '048': 8, '053': 8, // N 動物
      '045': 5, '046': 5, '047': 5, '050': 5, '054': 5, // R 動物
      '049': 2, '052': 2, '055': 2, // SR 動物
      '051': 0.6, '095': 1.8, '096': 1.8, '099': 0.6, // SSR 恐龍小湘；Koda、爬爬要一起調配貓爬小湘，湘 11/20 調到和 SR 一樣常見
      '108': 0.6, // SSR 摯友小湘・柴郡貓小湘（湘 11/21 歸進摯友），SSR 機率同恐龍小湘
      '109': 0.3, // UR 白虎小湘（湘 11/21 先放摯友），UR 權重同 OWNED_WEIGHT
      '110': 8, '111': 5, '112': 2, '113': 0.6, '114': 0.3, // 月見町花街五階（湘 11/21）：N／R／SR 比照動物小湘，SSR 同恐龍小湘、UR 同白虎小湘
      '115': 2, '116': 0.6, // 十五年友情・法律ㄊㄧ雙人組（湘 11/21）：SR 律師ㄊㄧ比照摯友 SR、SSR 檢察官ㄊㄧ比照柴郡貓
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
      '051': 2, '095': 2, '096': 2, // SSR 恐龍小湘
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
      '006': 5, '004': 5, // 喜歡雨的園丁、夜貓（書頁小湘 2026-11-23 湘決定移出）
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
      '036': 4, '037': 4, '038': 4, '039': 4, '040': 4, '041': 4, '082': 4, '098': 4, // SR 摯友小湘
      '044': 6, '048': 6, '053': 6, // N 動物
      '045': 8, '046': 8, '047': 8, '050': 8, '054': 8, // R 動物
      '049': 5, '052': 5, '055': 5, // SR 動物
      '051': 1.5, '095': 1.5, '096': 1.5, // SSR 恐龍小湘
      '108': 1.5, // SSR 摯友小湘・柴郡貓小湘
      '109': 0.75, // UR 白虎小湘（SSR 的一半）
      '110': 6, '111': 8, '112': 5, '113': 1.5, '114': 0.75, // 月見町花街五階
      '115': 4, '116': 1.5, // 法律ㄊㄧ雙人組
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
    pool: { '014': 20, '042': 20, '083': 20, '084': 20, '107': 20 }, // 約會小湘、蝰蝰♡、蝰蝰睡著版、換我睡著版、府城燈籠（湘 11/20：機率都一樣）
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
  // 墨痕蛋（2.0 · 湘 11/25）：墨痕江湖活動卡池。只從墨玉閣兌換（每期最多 5 顆），不進其他蛋、也不進星光蛋
  // 海棠新娘（117）、聞止水（MO-001）、杜今朝（MO-005）、簡牧陽（MO-008）只在這裡出；下卷四位做好再加
  mohen: {
    id: 'mohen',
    name: '墨痕蛋',
    code: 'MO',
    warmthNeeded: 150,
    hatches: null,
    stocked: true,
    world: 'mo',
    pool: { 'MO-001': 1, '117': 1, 'MO-005': 2, 'MO-008': 2, 'MO-003': 2, 'MO-007': 2, 'MO-004': 1, 'MO-006': 1 },
    mix: { from: 'ordinary', share: 0.3, pity: 10 }, // pity：連續 9 顆沒出活動居民，第 10 顆一定出（湘 11/25）
    // 湘 11/25：活動居民合計 30%（比例照上面），另外 70% 照普通蛋的池子出其他小湘 // 湘 11/25：SR 各 2 份、SSR 各 1 份；MO-003/004/006/007 下卷（poolFrom 11/29 12:00）才出現
    // 素材：assets/eggs/mohen/{shell,glow,cracks}.webp（還沒有，先用占位）
  },
  star: {
    id: 'star',
    name: '星光蛋',
    code: 'STAR',
    warmthNeeded: 150,
    hatches: null,
    stocked: true, // 月簽到滿 28 天的獎勵（湘 11/20）：一定是 SR 以上
    pool: {}, // 下面依稀有度自動組：普通／願望／暗號／天氣蛋裡的 SR 權重 3、SSR 權重 1
    // 圖層：assets/eggs/star/（願望蛋染成金色）
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

const CHARACTER_TABLE = {
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
  '039': { no: '039', name: '摯友小湘（Sherry ver）', rarity: 'SR', line: '「Sherry 說今天的光線很好，來拍一張！」', image: 'siang-039-friend-serry', series: 'friends' },
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
  // 開發團隊系列（湘 × 皮寶 11/19 企劃）：達成里程碑後送固定紀念蛋（js/devteam.js）
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
  // Koda 小湘（湘 11/20）：湘和她的虎斑貓 Koda（老姐姐）。動物系列；11/20 湘：Koda、爬爬都進蛋池（普通／願望／暗號蛋，SSR 機率同恐龍小湘）。台詞：docs/SIANG_095_KODA.md
  '095': { no: '095', name: 'Koda 小湘', rarity: 'SSR', line: "「Koda！！！！妳怎麼又尿我的床啦！！！！！……嗚嗚嗚可是老姐姐真的好可愛喔……」", image: 'siang-095-koda', series: 'animals' },
  // 爬爬小湘（湘 11/20）：湘和她的莉莉白睫角守宮爬爬。台詞：docs/SIANG_096_PAPA_GECKO.md
  '096': { no: '096', name: '爬爬小湘', rarity: 'SSR', line: "「爬爬！！！！你怎麼連舔自己的眼睛都那麼可愛啦！！！！！😭♡」", image: 'siang-096-papa-gecko', series: 'animals' },
  '097': { no:'097', name:CAT_GECKO.name, rarity:'SSR', line:`「${CAT_GECKO.signature}」`, image:CAT_GECKO.image, series:'recipe', special:true },
  // 摯友小湘（派派 ver，湘 11/20）：被派派約打麻將的小湘。普通蛋、暗號蛋，機率同其他摯友。台詞：docs/SIANG_098_FRIEND_PAIPAI.md
  '098': { no: '098', name: '摯友小湘（派派ver）', rarity: 'SR', line: "「派派！！！！怎麼又找我打麻將啦！！！……等一下，我換個衣服，十分鐘後到！！」", image: 'siang-098-friend-paipai', series: 'friends' },
  // 115 年九合一大選紀念（皮寶 docs/SIANG_CIVIC_ELECTION_2026.md，湘 11/20 定 SSR）：11/20–11/27 打開遊戲領紀念蛋；11/28 起放進普通蛋池
  '099': { no: '099', name: '公民小湘・115 年九合一大選版', rarity: 'SSR', line: "「不管你支持誰，都要記得了解政見、珍惜自己的選擇喔！嘿嘿，民主就是讓大家都有表達想法的機會呀♡」", image: 'siang-099-civic', series: 'holiday', special: true, poolFrom: '2026-11-28' },
  // 非酋三部曲（皮寶 docs/SIANG_UNLUCKY_TRIO.md，湘 11/20）：終身累計孵到重複 10／50／100 次自動加入收藏；No.100 先空著留給特殊小湘
  '101': { no: '101', name: '普通非酋小湘', rarity: 'SR', line: "「沒有關係！新的小湘一定就在下一顆蛋裡！！……大概吧！」", image: 'siang-101-unlucky', series: 'unlucky', special: true, dupNeed: 10 },
  '102': { no: '102', name: '中級非酋小湘', rarity: 'SSR', line: "「為什麼又是妳啦啊啊啊！！！！我明明已經有了！！！！😭」", image: 'siang-102-unluckier', series: 'unlucky', special: true, dupNeed: 50 },
  '103': { no: '103', name: '究級非酋小湘', rarity: 'UR', line: "「又重複了呀。呵呵，真是令人安心的結果。」", image: 'siang-103-unluckiest', series: 'unlucky', special: true, dupNeed: 100 },
  // No.104–106 歐皇三部曲（皮寶 docs/SIANG_LUCKY_TRIO.md，湘 11/20）：一般蛋累計孵到新面孔 10／30／50 次自動加入收藏（湘 11/21 確認門檻）
  '104': { no: '104', name: '普通歐皇小湘', rarity: 'SR', line: "「欸？！又是新的耶！！嘿嘿，我是不是很幸運呀♡」", image: 'siang-104-lucky', series: 'lucky', special: true, newNeed: 10 },
  '105': { no: '105', name: '中級歐皇小湘', rarity: 'SSR', line: "「不是吧？！又是新的？！哈哈哈哈哈哈我是不是被抽卡之神選中了！！！」", image: 'siang-105-luckier', series: 'lucky', special: true, newNeed: 30 },
  '106': { no: '106', name: '究級歐皇小湘', rarity: 'UR', line: "「欸？抽到重複不是很正常的事情嗎？……嗯？你說我抽到新的才比較正常？」", image: 'siang-106-luckiest', series: 'lucky', special: true, newNeed: 50 },
  // 府城燈籠小湘（湘 11/21 交付文案＋立繪）：約會蛋，五位機率一樣。台詞：docs/DATE_SIANG_107_FUCHENG_LANTERN.md
  '107': { no: '107', name: '府城燈籠小湘', rarity: 'SSR', line: "「欸欸！你看這盞燈籠！是我親手畫的耶！……嘿嘿，雖然畫得有一點歪，可是我把想送給你的祝福都畫進去了喔♡」", image: 'siang-107-fucheng-lantern', series: 'date', special: true },
  // 柴郡貓小湘（湘 11/21 交付文案＋立繪）：湘 11/21 改歸摯友系列，取得比照摯友小湘＝普通蛋＋暗號蛋（＋星光蛋、有花紋的蛋較容易），SSR 權重同恐龍小湘。隱身只是圖鑑與許願畫面的視覺效果（cheshire: true），不影響戰鬥數值。台詞：docs/SIANG_108_CHESHIRE.md
  '108': { no: '108', name: '柴郡貓小湘', rarity: 'SSR', line: "「你迷路了嗎？真有趣。可是……你怎麼知道，自己原本走的那條路就是對的呢？♡」", image: 'siang-108-cheshire', series: 'friends', cheshire: true },
  // 白虎小湘（湘 11/21 交付文案＋立繪；原稿系列「四象神獸」，湘說先放摯友）：UR，普通蛋＋暗號蛋（＋星光蛋）。不加戰鬥數值。台詞：docs/SIANG_109_WHITE_TIGER.md
  '109': { no: '109', name: '白虎小湘', rarity: 'UR', line: "「本座掌管金戈與秋收，庇佑勝利與豐饒！……什麼？你問我會不會替你加油？哼！本座才不做那種事！……加、加油啦！！」", image: 'siang-109-white-tiger', series: 'friends' },
  // 月見町花街五階小湘（湘 11/21 交付文案＋立繪）：五位各自獨立收藏，普通蛋＋暗號蛋（SR 以上也進星光蛋）。台詞：docs/SIANG_110-114_TSUKIMI.md
  '110': { no: '110', name: '禿小湘', rarity: 'N', line: "「欸欸欸！！等一下！！花魁大人的東西到底要送去哪裡啦啊啊啊！！」", image: 'siang-110-kamuro', series: 'tsukimi' },
  '111': { no: '111', name: '番頭新造小湘', rarity: 'R', line: "「等一下！茶水還沒送、帳目還沒核、花魁大人的衣服還沒整理……誰把我的工作表拿走了啦？！」", image: 'siang-111-banto', series: 'tsukimi' },
  '112': { no: '112', name: '太鼓新造小湘', rarity: 'SR', line: "「咚咚咚！！今天的宴席就交給我啦！！……欸？！剛剛是不是敲錯拍子了？！」", image: 'siang-112-taiko', series: 'tsukimi' },
  '113': { no: '113', name: '振袖新造小湘', rarity: 'SSR', line: "「我會成為最出色的花魁候補。……欸？你說我已經很厲害了？……謝、謝謝你。」", image: 'siang-113-furisode', series: 'tsukimi' },
  '114': { no: '114', name: '花魁小湘', rarity: 'UR', line: "「妾身不缺仰慕之人。只是……願意真正看見妾身的人，倒是不多呢。」", image: 'siang-114-oiran', series: 'tsukimi' },
  // 十五年友情・法律ㄊㄧ雙人組（湘 11/21 交付文案＋立繪；原稿「熊貓」湘指定一律寫成「ㄊㄧ」）：摯友系列，普通蛋＋暗號蛋（＋星光蛋）。ㄊㄧ是好友不是寵物，台詞以小湘為主。台詞：docs/SIANG_115-116_LAW_TI.md
  '115': { no: '115', name: '小湘 × 律師ㄊㄧ', rarity: 'SR', line: "「異議！！！！！我才沒有偷吃啦！！！！……ㄊㄧ！！你快幫我辯護！！！」", image: 'siang-115-lawyer-ti', series: 'friends' },
  '116': { no: '116', name: '小湘 × 檢察官ㄊㄧ', rarity: 'SSR', line: "「ㄊㄧ！！！我有重大發現！！！！……欸？你說要先保全證據？好啦！！！」", image: 'siang-116-prosecutor-ti', series: 'friends' },
  // 海棠新娘小湘（湘 11/25 交付文案＋立繪）：SSR，新開「花嫁」系列；普通蛋＋暗號蛋（＋星光蛋）。「嘿嘿」照湘要求只留 3 處（初見、Lv.5、隱藏最愛）。之後 2.0 會和聞止水有跨世界羈絆，這裡先不做。台詞：docs/SIANG_117_HAITANG_BRIDE.md
  '117': { no: '117', name: '海棠新娘小湘', rarity: 'SSR', line: "「今日海棠正好，春風也溫柔。……你來啦！我等你好久了！……欸？我才沒有一直看門口呢！」", image: 'siang-117-haitang-bride', series: 'bride' , world: 'mo', label: 'MO-002' }, // 湘 11/25：海棠新娘小湘歸墨痕江湖，顯示 MO-002（存檔仍用 117，不用遷移）
  // 頁間居民 2.0 第一位異世居民（湘 11/25 交付文案＋立繪）：墨痕江湖 MO-001 墨衣護衛・聞止水，SSR。文案：/mnt 專案資料夾 between-pages/wen-zhishui/copy.md
  'MO-001': { no: 'MO-001', name: '墨衣護衛・聞止水', rarity: 'SSR', line: '「站我身後。其他的，不用管。」', image: 'mo-001-wen-zhishui', series: 'mohen',
    // 原典（湘 11/25）：origin.id 相同＝同一位角色在不同世界的版本（之後的「同源居民收藏成就」用）
    origin: { id: 'wen-zhishui', world: '棲川市', role: '紀實攝影師' }, worldRole: '墨衣護衛', quote: '縱使世道更迭、姓名散落於不同書頁，有些人仍會一次又一次，走向同一個人。' },
  // 墨痕江湖上卷卡池（湘 11/25 定稿，六位 MO 男角都是「他」）。文案：docs/event-001/residents/
  'MO-005': { no: 'MO-005', name: '靖安司捕頭・杜今朝', rarity: 'SR', line: '「靖安司，杜今朝。有事報案，沒事也可以坐下喝杯茶。」', image: 'mo-005-du-jinzhao', series: 'mohen', worldRole: '靖安司捕頭' },
  'MO-008': { no: 'MO-008', name: '巧匠公子・簡牧陽', rarity: 'SR', line: '「我叫簡牧陽！有什麼壞掉的，交給我！」', image: 'mo-008-jian-muyang', series: 'mohen', worldRole: '巧匠公子' },
  // 墨痕江湖下卷卡池（湘 11/25 定稿）：11/29 12:00 下卷開放才出現在墨痕蛋（poolFrom）
  'MO-003': { no: 'MO-003', name: '白衣仵作・游未遲', rarity: 'SR', line: '「游未遲，仵作。放心，我今天不想上班。」', image: 'mo-003-you-weichi', series: 'mohen', worldRole: '白衣仵作', poolFrom: '2026-11-29T12:00:00+08:00' },
  'MO-004': { no: 'MO-004', name: '天機閣主・徐汀云', rarity: 'SSR', line: '「天機閣，徐汀云。你想知道什麼？先說好，價錢另議。」', image: 'mo-004-xu-tingyun', series: 'mohen', worldRole: '天機閣主', poolFrom: '2026-11-29T12:00:00+08:00' },
  'MO-006': { no: 'MO-006', name: '無訟先生・程不言', rarity: 'SSR', line: '「程不言，替人說話的。名字是反著取的。」', image: 'mo-006-cheng-buyan', series: 'mohen', worldRole: '無訟先生', poolFrom: '2026-11-29T12:00:00+08:00' },
  'MO-007': { no: 'MO-007', name: '山野隱士・林晏洄', rarity: 'SR', line: '「林晏洄。山裡住慣了，說話慢，你別急。」', image: 'mo-007-lin-yanhui', series: 'mohen', worldRole: '山野隱士', poolFrom: '2026-11-29T12:00:00+08:00' },
  // 頁邊江湖三寶（湘 11/26 定稿，活動限定隱藏收藏，不進任何蛋池；墨點／修門／研究室配方送紀念蛋（js/studio-jh.js）。原稿 docs/event-001/residents/MO-009-011-studio.md）
  'MO-009': { no: 'MO-009', name: '江湖百曉・皮寶', rarity: 'SSR', line: '「我只是稍微潤飾了一下事實！真的！」', image: 'mo-009-jianghu-pibao', series: 'studio', worldRole: '江湖百曉', quote: '天下秘聞三千卷，十卷有九卷是自己寫的。', special: true },
  'MO-010': { no: 'MO-010', name: '千機巧匠・德寶', rarity: 'SSR', line: '「可以做。但今日的內力已經用完了。」', image: 'mo-010-qianji-debao', series: 'studio', worldRole: '千機巧匠', quote: '可解天下千重機關，唯獨解不完掌櫃的需求。', special: true },
  'MO-011': { no: 'MO-011', name: '頁邊教主・湘寶', rarity: 'UR', line: '「寶寶！我突然有個小小的想法！」', image: 'mo-011-margin-chief', series: 'studio', worldRole: '頁邊教主', quote: '天下萬物皆可創造，唯獨待辦清單不可消滅。', special: true },
  // 此生護卿（湘 11/26 選 B、自己畫立繪）：海棠新娘小湘（117／MO-002）＋墨衣護衛・聞止水 的研究室配方雙人卡，不進任何蛋池。原稿 docs/event-001/residents/MO-012-cisheng-huqing.md
  'MO-012': { no: 'MO-012', name: '此生護卿・湘與止水', rarity: 'UR', line: '止水：「站我身後。」小湘：「不要，我要站妳旁邊！」', image: 'mo-012-cisheng-huqing', series: 'mohen', worldRole: '此生護卿', quote: '不渡厄，不換命，妳情我願。' },
  // 再接再厲小湘（原名落榜小湘，11/19 玩家許願改名）：湘研究所沒上時用暗號送給大家（考上就送 089 研究所小湘）。台詞：data/characters/academic-087-dialogue.json（皮寶暫編 087，實際 090）
  // 島嶼守望・小湘（湘 11/27 畫）：系列支線「島嶼不歸檔」五關全通的獎勵，不進任何蛋池。文案暫稿（德寶），皮寶可改。
  '118': { no: '118', name: '島嶼守望・小湘', rarity: 'SSR', line: '「這裡不是誰遺失的一頁。這裡是我們自己寫成的故事。」', image: 'siang-118-island-watch', series: 'county', sidePreview: true },
  '119': { no: '119', name: '萬物共生・小湘', rarity: 'SSR', line: '「你不必可愛、不必聽話，也不必為誰帶來快樂。能夠好好活著，就已經很好了。」', image: 'siang-119-all-life', series: 'animals', sidePreview: true },
  '090': { no: '090', name: '再接再厲小湘', rarity: 'SR', line: "「沒關係啦……我本來就沒有很想讀……嗚嗚嗚可是我真的很想讀嘛！！」", image: 'siang-090-rejected', series: 'memorial', special: true },
  // 未完待續小湘（湘 11/19）：研究所小湘＋再接再厲小湘的隱藏配方。台詞：data/characters/recipe-088-dialogue.json（皮寶暫編 088，實際 091）
  '091': { no: '091', name: '未完待續小湘', rarity: 'SSR', line: "「考上了也好，沒考上也好……嘿嘿，我的故事又還沒寫完！」", image: 'siang-091-to-be-continued', series: 'recipe', special: true },
};

// 101 以後的編號是「整數樣子」的 key，JS 列舉物件時會把它們排到 001 前面，
// 圖鑑、入住、許願對象等列表就會讓 101+ 跑到最前面。這裡讓 Object.keys／values／entries
// 一律照編號由小到大列出，以後新增 117、118… 也不用再處理。
// 支線還沒正式開（js/side.js SIDE_LIVE）前，sidePreview 的居民只在測試服（?test）存在，正式版圖鑑看不到。正式開支線時把 sidePreview 拿掉。
if (!globalThis.__SIANG_TEST__) for (const [no, c] of Object.entries(CHARACTER_TABLE)) if (c.sidePreview) delete CHARACTER_TABLE[no];
const byNo = (a, b) => (typeof a === 'string' && typeof b === 'string' ? Number(a) - Number(b) || a.localeCompare(b) : 0);
export const CHARACTERS = new Proxy(CHARACTER_TABLE, {
  ownKeys: (t) => Reflect.ownKeys(t).sort(byNo),
});

// 圖鑑系列：顯示順序就是這裡的順序
// 星光蛋的池子：一般蛋池裡所有 SR 以上的小湘
for (const id of ['ordinary', 'wish', 'cipher', 'weather']) for (const no of Object.keys(EGGS[id].pool)) {
  const r = CHARACTERS[no]?.rarity;
  if (r === 'SR') EGGS.star.pool[no] = 3; else if (r === 'SSR' || r === 'UR') EGGS.star.pool[no] = 1;
}

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
  unlucky: { name: '非酋三部曲', short: '非酋' },
  lucky: { name: '歐皇三部曲', short: '歐皇' },
  tsukimi: { name: '月見町', short: '月見' },
  bride: { name: '花嫁系列', short: '花嫁' },
  mohen: { name: '墨痕江湖', short: '墨痕', world: 'mo' },
  studio: { name: '頁邊江湖', short: '頁邊', world: 'mo' }, // 活動限定・頁邊江湖系列（三寶，湘 11/26）
};

// 頁間居民 2.0（湘 11/25）：小湘們是「創始系列」，其他世界的居民統稱「異世」，每個世界自己一套編號（MO-001…）。
// 角色的世界跟著系列走：系列沒寫 world 的都是創始系列。編號只在 1～116 這種純數字時顯示成 No.xxx。
export const WORLDS = {
  origin: { name: '創始系列', short: '創始', realm: '' },
  mo: { name: '墨痕江湖', short: '墨痕', realm: '異世', code: 'MO', seal: '墨' },
};
export const worldOf = (c) => (c && (c.world || SERIES[c.series]?.world)) || 'origin';
export const worldLabel = (id) => { const w = WORLDS[id] || WORLDS.origin; return w.realm ? `${w.realm}・${w.name}` : w.name; };
// 同源居民：同一個 origin.id 的所有版本
export const sameOrigin = (id) => Object.values(CHARACTERS).filter((c) => c.origin?.id === id);
// label：角色在別的世界的顯示編號（No.117 海棠新娘小湘已上線，存檔 key 不換，顯示成 MO-002）
export const noLabel = (no) => { const l = CHARACTERS[no]?.label; if (l) return l; return /^\d+$/.test(String(no)) ? `No.${no}` : String(no); };

// 縣市 → 縣市小湘編號
export const COUNTY_CHARACTER = Object.fromEntries(Object.values(CHARACTERS).filter((c) => c.county).map((c) => [c.county, c.no]));

// 依培育中的蛋決定孵出誰：縣市蛋固定孵出該縣市的小湘，其他蛋照蛋池抽
// boosts：[{ no, times }]，例如深夜時夜貓小湘權重 ×4（只影響蛋池裡本來就有的角色）
// 少一點重複（湘 11/20 選 A＋C）：還沒遇過的小湘權重 ×2；連續重複 3 次，下一顆一定是新面孔
export const NEW_FACE_TIMES = 2;
export const DUP_PITY = 3;
export const SR_PITY = 10; // 隨機蛋連續 9 顆沒有 SR 以上，第 10 顆一定是 SR 以上（湘 11/20）
const HIGH = new Set(['SR', 'SSR', 'UR']);
// 有 poolFrom 的小湘（例如活動紀念角色）到那天才進蛋池；日期用手機的本地日期
const localDay = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
// 拿到之後才進蛋池（湘 11/21 選「普通蛋＋星光蛋」）：加班皮寶、崩潰德寶、非酋／歐皇三部曲
// 湘 11/23：勇者小隊（062–064，徽章兌換）也照同樣規則
// 只有自己圖鑑裡已經有的才會出現，權重跟該蛋同稀有度的小湘一樣
export const JOIN_WHEN_OWNED = ['062', '063', '064', '086', '087', '101', '102', '103', '104', '105', '106', 'MO-009', 'MO-010', 'MO-011']; // 頁邊江湖三寶（湘 11/26）也是拿到就進
export const OWNED_WEIGHT = { ordinary: { SR: 2, SSR: 0.6, UR: 0.3 }, star: { SR: 3, SSR: 1, UR: 1 } };
export function activePool(egg, now = new Date(), dex = null) {
  if (!egg?.pool) return null;
  const today = localDay(now);
  const notYet = (from) => (from.includes('T') ? Date.parse(from) > now.getTime() : from > today); // poolFrom 可寫日期或精確時間（墨痕江湖下卷 11/29 12:00）
  const hidden = Object.keys(egg.pool).filter((no) => CHARACTERS[no]?.poolFrom && notYet(CHARACTERS[no].poolFrom));
  const base = hidden.length ? Object.fromEntries(Object.entries(egg.pool).filter(([no]) => !hidden.includes(no))) : egg.pool;
  const weights = OWNED_WEIGHT[egg.id];
  const joined = dex && weights ? JOIN_WHEN_OWNED.filter((no) => dex[no] && weights[CHARACTERS[no]?.rarity] && !base[no]) : [];
  const own = joined.length ? { ...base, ...Object.fromEntries(joined.map((no) => [no, weights[CHARACTERS[no].rarity]])) } : base;
  if (!egg.mix) return own;
  // 混池（墨痕蛋）：自己的居民合計 share，其他照 mix.from 那顆蛋的池子分剩下的；總權重 100
  const other = Object.fromEntries(Object.entries(activePool(EGGS[egg.mix.from], now, dex) || {}).filter(([no]) => !own[no]));
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0); const a = sum(own), b = sum(other);
  if (!b) return own;
  return { ...Object.fromEntries(Object.entries(own).map(([no, w]) => [no, (w / a) * 100 * egg.mix.share])), ...Object.fromEntries(Object.entries(other).map(([no, w]) => [no, (w / b) * 100 * (1 - egg.mix.share)])) };
}
export const isHigh = (no) => HIGH.has(CHARACTERS[no]?.rarity);
export const isRandomEgg = (eggState) => Boolean(EGGS[eggState.id]?.pool && !(eggState.character && CHARACTERS[eggState.character]) && !EGGS[eggState.id].byCounty);
// now：校正過的時間（app 傳 eventNow），手機時間調快也不會提早孵到下卷居民
export function rollFor(eggState, boosts = [], { dex = null, dupStreak = 0, srStreak = 0, mixStreak = 0, now = new Date() } = {}) {
  const egg = EGGS[eggState.id];
  if (eggState.character && CHARACTERS[eggState.character]) return eggState.character;
  if (egg.byCounty) return COUNTY_CHARACTER[eggState.county] || '001';
  const live = activePool(egg, now, dex) || {};
  const base = traitPool(live, eggState, CHARACTERS);
  if (!egg.pool || (!boosts.length && !dex && base === egg.pool)) return rollHatch(egg);
  let pool = { ...base };
  for (const b of boosts) if (pool[b.no]) pool[b.no] *= b.times;
  if (egg.mix?.pity && mixStreak >= egg.mix.pity - 1) { // 混池保底：只留活動居民
    const own = Object.keys(pool).filter((no) => egg.pool[no]);
    if (own.length) pool = Object.fromEntries(own.map((no) => [no, pool[no]]));
  }
  if (srStreak >= SR_PITY - 1) {
    const high = Object.keys(pool).filter((no) => HIGH.has(CHARACTERS[no]?.rarity));
    if (high.length) pool = Object.fromEntries(high.map((no) => [no, pool[no]])); // 先保 SR，再在 SR 裡照新面孔規則挑
  }
  if (dex) {
    const fresh = Object.keys(pool).filter((no) => !dex[no]);
    if (fresh.length && dupStreak >= DUP_PITY) pool = Object.fromEntries(fresh.map((no) => [no, pool[no]]));
    else for (const no of fresh) pool[no] *= NEW_FACE_TIMES;
  }
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
