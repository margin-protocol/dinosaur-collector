// 小湘口味（與 data/SIANG_KITCHEN_TASTE_PROFILES.json 對齊，新增角色時同步維護）
// like／dislike 是食物標籤；secret 是隱藏最愛的精確食材組合（順序無關）
export const TASTES = {
  '001': { like: '怪味', dislike: '濃甜', secret: ["mushroom", "strawberry"] }, // 原味小湘
  '002': { like: '果香', dislike: '菇香', secret: ["moon", "strawberry"] }, // 草莓小湘
  '003': { like: '奶香', dislike: '刺激', secret: ["cloud", "milk"] }, // 雨傘小湘
  '004': { like: '濃甜', dislike: '清涼', secret: ["caramel", "gear"] }, // 夜貓小湘
  '005': { like: '濃甜', dislike: '菇香', secret: ["caramel", "milk", "pudding"] }, // 甜點小湘
  '006': { like: '菇香', dislike: '怪味', secret: ["cloud", "mushroom"] }, // 園丁小湘
  '007': { like: '奶香', dislike: '刺激', secret: ["milk", "star"] }, // 書頁小湘
  '008': { like: '清涼', dislike: '濃甜', secret: ["moon", "rainbow"] }, // 晴空小湘
  '009': { like: '濃甜', dislike: '怪味', secret: ["caramel", "moon"] }, // 膠卷小湘
  '010': { like: '星光', dislike: '菇香', secret: ["cloud", "star"] }, // 星塵小湘
  '011': { like: '果香', dislike: '怪味', secret: ["cloud", "pudding", "strawberry"] }, // 草莓蛋糕小湘
  '012': { like: '菇香', dislike: '刺激', secret: ["cloud", "moon", "mushroom"] }, // 雨中花園小湘
  '013': { like: '濃甜', dislike: '刺激', secret: ["caramel", "star"] }, // 琥珀小湘
  '014': { like: '奶香', dislike: '怪味', secret: ["milk", "rainbow"] }, // 約會小湘
  '015': { like: '濃甜', dislike: '菇香', secret: ["caramel", "cloud", "star"] }, // 壽星小湘
  '016': { like: '奶香', dislike: '怪味', secret: ["gear", "milk"] }, // 臺北市小湘
  '017': { like: '星光', dislike: '菇香', secret: ["moon", "star"] }, // 新北市小湘
  '018': { like: '清涼', dislike: '酥脆', secret: ["moon", "mushroom"] }, // 基隆市小湘
  '019': { like: '果香', dislike: '怪味', secret: ["gear", "strawberry"] }, // 桃園市小湘
  '020': { like: '菇香', dislike: '濃甜', secret: ["gear", "mushroom"] }, // 新竹市小湘
  '021': { like: '酥脆', dislike: '刺激', secret: ["cloud", "gear"] }, // 新竹縣小湘
  '022': { like: '星光', dislike: '怪味', secret: ["pudding", "star"] }, // 苗栗縣小湘
  '023': { like: '酥脆', dislike: '菇香', secret: ["caramel", "gear"] }, // 臺中市小湘
  '024': { like: '奶香', dislike: '刺激', secret: ["cloud", "gear", "milk"] }, // 彰化縣小湘
  '025': { like: '清涼', dislike: '怪味', secret: ["moon", "star"] }, // 南投縣小湘
  '026': { like: '菇香', dislike: '刺激', secret: ["gear", "mushroom"] }, // 雲林縣小湘
  '027': { like: '濃甜', dislike: '清涼', secret: ["caramel", "pudding"] }, // 嘉義市小湘
  '028': { like: '星光', dislike: '怪味', secret: ["cloud", "moon", "star"] }, // 嘉義縣小湘
  '029': { like: '濃甜', dislike: '菇香', secret: ["caramel", "gear", "milk"] }, // 臺南市小湘
  '030': { like: '清涼', dislike: '濃甜', secret: ["moon", "rainbow", "star"] }, // 高雄市小湘
  '031': { like: '綿軟', dislike: '刺激', secret: ["cloud", "pudding"] }, // 屏東縣小湘
  '032': { like: '酥脆', dislike: '怪味', secret: ["gear", "moon"] }, // 宜蘭縣小湘
  '033': { like: '清涼', dislike: '濃甜', secret: ["cloud", "moon"] }, // 花蓮縣小湘
  '034': { like: '果香', dislike: '怪味', secret: ["rainbow", "strawberry"] }, // 臺東縣小湘
  '035': { like: '清涼', dislike: '刺激', secret: ["glitch", "moon"] }, // 綠島小湘
  '036': { like: '奶香', dislike: '刺激', secret: ["milk", "pudding"] }, // 摯友小湘（把拔ver）
  '037': { like: '酥脆', dislike: '怪味', secret: ["gear", "lightning"] }, // 摯友小湘（ㄊㄧver）
  '038': { like: '星光', dislike: '菇香', secret: ["rainbow", "star"] }, // 摯友小湘（史蒂芬灰ver）
  '039': { like: '清涼', dislike: '濃甜', secret: ["gear", "moon", "star"] }, // 摯友小湘（Sherry ver）
  '040': { like: '果香', dislike: '濃甜', secret: ["lightning", "strawberry"] }, // 摯友小湘（Achio ver）
  '041': { like: '菇香', dislike: '奶香', secret: ["gear", "moon", "mushroom"] }, // 摯友小湘（Bois ver）
  '042': { like: '綿軟', dislike: '刺激', secret: ["cloud", "milk"] }, // 蝰蝰♡
  '043': { like: '濃甜', dislike: '怪味', secret: ["caramel", "moon", "star"] }, // 戀愛小湘（聞止水ver）
  '044': { like: '奶香', dislike: '刺激', secret: ["milk", "pudding"] }, // 貓咪小湘
  '045': { like: '清涼', dislike: '菇香', secret: ["moon", "rainbow"] }, // 小丑魚小湘
  '046': { like: '酥脆', dislike: '綿軟', secret: ["gear", "mushroom"] }, // 螃蟹小湘
  '047': { like: '綿軟', dislike: '刺激', secret: ["cloud", "milk", "star"] }, // 無尾熊小湘
  '048': { like: '酥脆', dislike: '怪味', secret: ["gear", "pudding"] }, // 狗狗小湘
  '049': { like: '果香', dislike: '菇香', secret: ["moon", "star", "strawberry"] }, // 狐狸小湘
  '050': { like: '清涼', dislike: '怪味', secret: ["gear", "moon"] }, // 浣熊小湘
  '051': { like: '刺激', dislike: '清涼', secret: ["gear", "glitch", "lightning"] }, // 恐龍小湘
  '052': { like: '菇香', dislike: '濃甜', secret: ["mushroom", "star"] }, // 守宮小湘
  '053': { like: '酥脆', dislike: '清涼', secret: ["gear", "milk"] }, // 老鼠小湘
  '054': { like: '綿軟', dislike: '刺激', secret: ["cloud", "moon", "pudding"] }, // 企鵝小湘
  '055': { like: '果香', dislike: '菇香', secret: ["cloud", "strawberry"] }, // 兔兔小湘
  '056': { like: '濃甜', dislike: '菇香', secret: ["caramel", "strawberry"] }, // 情人節小湘
  '057': { like: '奶香', dislike: '刺激', secret: ["cloud", "milk", "star"] }, // 白色情人節小湘
  '058': { like: '酥脆', dislike: '怪味', secret: ["caramel", "cloud", "gear"] }, // 聖誕小湘
  '059': { like: '星光', dislike: '菇香', secret: ["moon", "rainbow", "star"] }, // 七夕小湘
  '060': { like: '怪味', dislike: '奶香', secret: ["glitch", "mushroom"] }, // 萬聖節小湘
  '061': { like: '果香', dislike: '怪味', secret: ["gear", "moon", "strawberry"] }, // 台灣小湘
  '062': { like: '酥脆', dislike: '怪味', secret: ["caramel", "gear"] }, // 騎士小湘
  '063': { like: '刺激', dislike: '綿軟', secret: ["glitch", "lightning", "star"] }, // 魔法師小湘
  '064': { like: '濃甜', dislike: '菇香', secret: ["caramel", "pudding"] }, // 勇者小湘
  '065': { like: '清涼', dislike: '怪味', secret: ["moon", "star"] }, // 天氣觀測師
  '066': { like: '綿軟', dislike: '刺激', secret: ["cloud", "moon"] }, // 陰天小湘
  '067': { like: '刺激', dislike: '奶香', secret: ["gear", "lightning"] }, // 打雷小湘
  '068': { like: '果香', dislike: '菇香', secret: ["star", "strawberry"] }, // 晴天小湘
  '069': { like: '綿軟', dislike: '濃甜', secret: ["cloud", "mushroom"] }, // 起霧小湘
  '070': { like: '清涼', dislike: '濃甜', secret: ["lightning", "moon"] }, // 冰雹小湘
  '071': { like: '清涼', dislike: '刺激', secret: ["cloud", "moon"] }, // 下雨小湘
  '072': { like: '奶香', dislike: '菇香', secret: ["cloud", "milk", "moon"] }, // 下雪小湘
  '073': { like: '酥脆', dislike: '奶香', secret: ["gear", "star"] }, // 大風小湘
  '074': { like: '果凍', dislike: '菇香', secret: ["rainbow", "star"] }, // 彩虹小湘
  '075': { like: '濃甜', dislike: '怪味', secret: ["caramel", "moon"] }, // 夕陽小湘
  '076': { like: '星光', dislike: '刺激', secret: ["milk", "moon", "star"] }, // 星夜書房小湘
  '077': { like: '濃甜', dislike: '怪味', secret: ["caramel", "moon", "star"] }, // 日落底片小湘
  '078': { like: '奶香', dislike: '刺激', secret: ["gear", "milk", "pudding"] }, // 貓咪咖啡館小湘
  '079': { like: '菇香', dislike: '清涼', secret: ["gear", "lightning", "mushroom"] }, // 史前探險小湘
  '080': { like: '菇香', dislike: '濃甜', secret: ["moon", "mushroom", "star"] }, // 月光花園小湘
  '081': { like: '果凍', dislike: '怪味', secret: ["cloud", "rainbow", "star"] }, // 彩虹畫家小湘
  '082': { like: '酥脆', dislike: '怪味', secret: ["gear", "rainbow"] }, // 摯友小湘（哥哥ver）
  '083': { like: '綿軟', dislike: '刺激', secret: ["cloud", "milk", "moon"] }, // 約會小湘・蝰蝰睡著版
  '084': { like: '奶香', dislike: '怪味', secret: ["milk", "pudding", "star"] }, // 約會小湘・換我睡著版
  '085': { like: '綿軟', dislike: '刺激', secret: ["cloud", "moon", "pudding"] }, // 約會小湘・雙雙睡著版
  '086': { like: '刺激', dislike: '菇香', secret: ["lightning", "star"] }, // 加班皮寶
  '087': { like: '怪味', dislike: '濃甜', secret: ["gear", "glitch"] }, // 崩潰德寶
  '088': { like: '刺激', dislike: '奶香', secret: ["lightning", "rainbow", "star"] }, // 靈感爆發小湘
  '089': { like: '奶香', dislike: '刺激', secret: ["gear", "milk", "star"] }, // 研究所小湘
  '090': { like: '濃甜', dislike: '菇香', secret: ["caramel", "cloud", "pudding"] }, // 再接再厲小湘
  '091': { like: '星光', dislike: '怪味', secret: ["cloud", "moon", "star"] }, // 未完待續小湘
  '092': { like: '清涼', dislike: '濃甜', secret: ["gear", "moon", "star"] }, // 馬祖小湘
  '093': { like: '清涼', dislike: '怪味', secret: ["cloud", "moon", "rainbow"] }, // 澎湖小湘
  '094': { like: '濃甜', dislike: '刺激', secret: ["caramel", "gear", "star"] }, // 金門小湘：貢糖＝焦糖＋酥脆，星星是守護
  '095': { like: '奶香', dislike: '刺激', secret: ["cloud", "milk", "pudding"] }, // Koda 小湘：老姐姐貓咪，軟軟的奶味（德寶補）
  '096': { like: '果香', dislike: '怪味', secret: ["moon", "rainbow", "strawberry"] }, // 爬爬小湘：守宮愛吃水果泥（德寶補）
  '097': { like: '綿軟', dislike: '刺激', secret: ["cloud", "milk", "strawberry"] }, // 貓爬小湘：Koda 的牛奶＋爬爬的草莓，中間夾一朵雲（德寶補）
  '098': { like: '酥脆', dislike: '綿軟', secret: ["caramel", "gear", "lightning"] }, // 派派ver：牌桌上的消夜要喀滋喀滋、還要提神（德寶補）
  '099': { like: '清涼', dislike: '怪味', secret: ["milk", "star", "strawberry"] }, // 公民小湘：查證完來一杯草莓牛奶，再撒一點星星（德寶補）
  '101': { like: '綿軟', dislike: '刺激', secret: ["caramel", "pudding", "star"] }, // 普通非酋小湘（德寶依皮寶口味定位補）
  '102': { like: '濃甜', dislike: '怪味', secret: ["caramel", "cloud", "milk"] }, // 中級非酋小湘（德寶依皮寶口味定位補）
  '103': { like: '清涼', dislike: '刺激', secret: ["gear", "moon", "mushroom"] }, // 究級非酋小湘（德寶依皮寶口味定位補）
  '104': { like: '果香', dislike: '怪味', secret: ["milk", "moon", "pudding"] }, // 普通歐皇小湘（德寶依皮寶口味定位補）
  '105': { like: '星光', dislike: '菇香', secret: ["caramel", "rainbow", "star"] }, // 中級歐皇小湘（德寶依皮寶口味定位補）
  '106': { like: '果凍', dislike: '怪味', secret: ["cloud", "pudding", "star"] }, // 究級歐皇小湘（德寶依皮寶口味定位補）
  '107': { like: '濃甜', dislike: '怪味', secret: ["caramel", "moon", "pudding"] }, // 府城燈籠小湘：府城燈火豆花＝布丁粉＋焦糖糖水＋月光露（冰）
  '108': { like: '果香', dislike: '怪味', secret: ["gear", "moon", "strawberry"] }, // 柴郡貓小湘：彎月莓果塔＝齒輪餅乾（酥脆塔皮）＋月光露（彎月）＋草莓（酸甜莓果餡）
  '109': { like: '酥脆', dislike: '怪味', secret: ["caramel", "gear", "mushroom"] }, // 白虎小湘：金穗豐收飯＝焦糖（金黃）＋齒輪餅乾（烘烤穀物）＋魔法蘑菇（濃郁香氣）
  '110': { like: '濃甜', dislike: '刺激', secret: ["caramel", "cloud", "moon"] }, // 禿小湘：月見糰子＝焦糖（蜜）＋雲朵棉花糖（白白軟軟的糰子）＋月光露（賞月）
  '111': { like: '菇香', dislike: '怪味', secret: ["gear", "milk", "mushroom"] }, // 番頭新造小湘：暖心味噌飯糰＝齒輪餅乾（烤過的米香）＋牛奶（溫暖）＋魔法蘑菇（味噌般的鹹香）
  '112': { like: '濃甜', dislike: '清涼', secret: ["caramel", "pudding", "rainbow"] }, // 太鼓新造小湘：祭典蜜糖糰子＝焦糖（蜜糖）＋布丁粉（Q 彈糰子）＋彩虹果凍（祭典的彩色）
  '113': { like: '清涼', dislike: '怪味', secret: ["cloud", "moon", "strawberry"] }, // 振袖新造小湘：櫻花茶香和菓子＝雲朵棉花糖（柔軟外皮）＋月光露（清爽茶香）＋草莓（櫻花粉色）
  '114': { like: '滑順', dislike: '刺激', secret: ["moon", "pudding", "strawberry"] }, // 花魁小湘：月下櫻花御膳＝月光露（月下）＋布丁粉（層次滑順）＋草莓（櫻花）
  '115': { like: '酥脆', dislike: '怪味', secret: ["gear", "mushroom", "strawberry"] }, // 小湘 × 律師ㄊㄧ：友情無罪雙拼飯糰＝齒輪餅乾（烤米香）＋魔法蘑菇（鹹口味）＋草莓（甜口味），兩種口味一人一顆
  '116': { like: '清涼', dislike: '刺激', secret: ["gear", "milk", "moon"] }, // 小湘 × 檢察官ㄊㄧ：真相大白雙人茶泡飯＝齒輪餅乾（米果）＋牛奶（溫暖）＋月光露（清爽茶湯）
  '117': { like: '果香', dislike: '怪味', secret: ["gear", "sakura", "strawberry"] }, // 海棠新娘小湘：海棠同心酥＝齒輪餅乾（酥脆外皮）＋櫻花蜜（海棠花香）＋草莓（淡淡果香、海棠紅）
  'MO-001': { like: '清涼', dislike: '刺激', secret: ["caramel", "pudding"] },
  'MO-005': { like: '菇香', dislike: '清涼', secret: ["mushroom", "tangyuan"] }, // 靖安司捕頭・杜今朝：最愛家常湯麵；喜歡鹹香（菇香）、不喜歡生冷（清涼）
  'MO-008': { like: '濃甜', dislike: '清涼', secret: ["caramel", "rainbow", "strawberry"] }, // 巧匠公子・簡牧陽：最愛糖葫蘆；喜歡甜（濃甜）、不喜歡苦（抹茶＝清涼） // 墨衣護衛・聞止水：最愛焦糖布丁；喜歡清淡（清涼）、不喜歡過辣（刺激）
  'MO-009': { like: '濃甜', dislike: '清涼', secret: ["osmanthus", "star"] }, // 江湖百曉・皮寶：金桂＋星星糖（桂花糕是游未遲的，湘 11/26 要兩樣）；喜歡甜食，不喜歡苦（抹茶＝清涼）
  'MO-010': { like: '清涼', dislike: '刺激', secret: ["bamboo", "matcha"] }, // 千機巧匠・德寶：竹筍＋抹茶（山筍清湯是林晏洄的）；喜歡清淡，不喜歡辣
  'MO-011': { like: '濃甜', dislike: '怪味', secret: ["osmanthus", "sakura"] }, // 頁邊教主・湘寶：金桂＋櫻花蜜（海棠金冠）；喜歡甜食，不喜歡苦怪的
  'MO-012': { like: '清涼', dislike: '刺激', secret: ["caramel", "sakura"] }, // 此生護卿：合巹酥＝焦糖（止水的布丁）＋櫻花蜜（海棠花香），各取兩人一樣
  'MO-003': { like: '濃甜', dislike: '刺激', secret: ["osmanthus", "tangyuan"] }, // 白衣仵作・游未遲：最愛桂花糕（金桂＋白玉湯圓）；喜歡甜（濃甜）、不喜歡辣（刺激）
  'MO-004': { like: '清涼', dislike: '酥脆', secret: ["matcha", "redbean"] }, // 天機閣主・徐汀云：最愛茶香點心（抹茶＋蜜紅豆）；喜歡清淡（清涼）、不喜歡油膩（酥脆）
  'MO-006': { like: '菇香', dislike: '刺激', secret: ["moon", "mushroom", "tangyuan"] }, // 無訟先生・程不言：最愛清蒸魚（月光露＋蘑菇＋湯圓）；喜歡鹹香（菇香）、不喜歡辣（刺激）
  'MO-007': { like: '菇香', dislike: '酥脆', secret: ["bamboo", "mushroom"] }, // 山野隱士・林晏洄：最愛山筍清湯（雨後竹筍＋魔法蘑菇）；喜歡蔬菜（菇香）、不喜歡酥炸（酥脆）
};
