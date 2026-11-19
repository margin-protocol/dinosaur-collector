// 隱藏配方：找到配方的兩位小湘放進研究室調配 days 天（js/lab.js，湘 11/19），就會送來一顆紀念蛋，固定孵出配方小湘
// rain／night 是舊玩法（一起入住首頁、只算雨天或夜晚）留下的設定，研究室調配不看；tickRecipes 也已不再被遊戲呼叫
// rain：只算下雨天；night：只算晚上 19:00～隔天 05:00 打開遊戲的夜晚（凌晨算前一晚，同一晚只記一次）
// note：孵化研究室的筆記（標題、短詩、兩位搭檔的線索與找到時的句子）
export const RECIPES = [
  { id: 'strawberry-cake', target: '011', members: ['002', '005'], days: 3, text: '草莓小湘和甜點小湘一起放進研究室調配 3 天',
    note: { title: '甜甜的相遇', poem: '一位喜歡紅色，一位總把點心留給你。兩份小小的偏愛，會不會有新的味道？', clues: ['尋找喜歡甜甜紅色的夥伴', '尋找熟悉點心香氣的夥伴'], found: ['找到了甜甜的紅色。', '找到了熟悉點心香氣的夥伴。'] } },
  { id: 'rain-garden', target: '012', members: ['006', '003'], days: 2, rain: true, text: '園丁小湘和雨傘小湘一起放進研究室調配 2 天',
    note: { title: '雨後花圃', poem: '有人細心照料花草，有人總在下雨時出現。雨滴落在花瓣上，會留下什麼故事？', clues: ['尋找熱愛照顧植物的夥伴', '尋找雨天常在身邊的夥伴'], found: ['有人懂得照料花草。', '有人聽得懂雨滴的聲音。'] } },
  { id: 'starry-library', target: '076', members: ['007', '010'], days: 3, night: true, text: '書頁小湘和星塵小湘一起放進研究室調配 3 天',
    note: { title: '書頁裡的星光', poem: '一位把故事收進書頁，一位把星星裝進口袋。夜深的時候，書房會不會亮起來？', clues: ['尋找收藏故事的夥伴', '尋找和星星很熟的夥伴'], found: ['書頁翻開了。', '星光落進來了。'] } },
  { id: 'sunset-film', target: '077', members: ['009', '075'], days: 3, text: '膠卷小湘和夕陽小湘一起放進研究室調配 3 天',
    note: { title: '留住黃昏', poem: '一位總是舉著相機，一位最懂黃昏的顏色。快門按下去，天空會不會停一下？', clues: ['尋找喜歡底片的夥伴', '尋找等待黃昏的夥伴'], found: ['底片裝好了。', '天空變成橘色了。'] } },
  { id: 'cat-cafe', target: '078', members: ['044', '005'], days: 2, text: '貓咪小湘和甜點小湘一起放進研究室調配 2 天',
    note: { title: '今日特餐', poem: '一位喵喵地討摸，一位端出剛做好的布丁。如果開一間店，招牌要寫什麼？', clues: ['尋找毛茸茸的夥伴', '尋找會做點心的夥伴'], found: ['有人在打呼嚕。', '布丁香飄出來了。'] } },
  { id: 'prehistoric-explorer', target: '079', members: ['051', '065'], days: 4, text: '恐龍小湘和天氣觀測師一起放進研究室調配 4 天',
    note: { title: '很久很久以前的天氣', poem: '一位來自遠古，一位看得懂天空。那時候的天空，是什麼顏色？', clues: ['尋找來自很久以前的夥伴', '尋找會觀測天空的夥伴'], found: ['地上出現了腳印。', '觀測日誌翻開了。'] } },
  { id: 'moonlit-garden', target: '080', members: ['006', '004'], days: 3, night: true, text: '園丁小湘和夜貓小湘一起放進研究室調配 3 天',
    note: { title: '只在夜裡開的花', poem: '一位白天照顧花草，一位晚上還醒著。有些花，是不是在等人說晚安？', clues: ['尋找熱愛照顧植物的夥伴', '尋找深夜還醒著的夥伴'], found: ['有人懂得照料花草。', '有人還沒睡。'] } },
  { id: 'rainbow-painter', target: '081', members: ['074', '008'], days: 3, text: '彩虹小湘和晴空小湘一起放進研究室調配 3 天',
    note: { title: '天空的畫布', poem: '一位帶來七種顏色，一位守著乾淨的藍天。如果天空借你畫畫，你想畫什麼？', clues: ['尋找帶著顏色的夥伴', '尋找喜歡藍天的夥伴'], found: ['顏料準備好了。', '畫布攤開了。'] } },
  { id: 'sleepy-together-date', target: '085', members: ['083', '084'], days: 3, text: '蝰蝰睡著版和換我睡著版一起放進研究室調配 3 天',
    note: { title: '誰先睡著了', poem: '一位看著蝰蝰睡著，一位被蝰蝰看著睡著。如果兩個都睏了，誰來顧誰？', clues: ['尋找抱著熟睡蝰蝰的夥伴', '尋找被蝰蝰守著睡覺的夥伴'], found: ['有人輕輕拍著蝰蝰。', '有人睡得好香。'] } },
  // 未完待續小湘（湘 11/19）：天數 3 天沿用皮寶建議。研究所小湘／再接再厲小湘放榜前只用暗號發送；湘 11/19 拍板：放榜確定後兩位都進普通蛋池，這組配方就人人做得出來
  { id: 'to-be-continued', target: '091', members: ['089', '090'], days: 3, text: '研究所小湘和再接再厲小湘一起放進研究室調配 3 天',
    note: { title: "還沒寫完的那一頁", poem: "有人走進了門，有人停在門外。可是路還很長，誰說故事只能有一種開頭？", clues: ["尋找正在讀性別研究的夥伴", "尋找曾在榜單前難過的夥伴"], found: ['有人抱著一疊文獻，眼睛亮亮的。', '有人把皺巴巴的通知摺好，收進口袋。'] } },
];
export const NIGHT_FROM = 19, NIGHT_UNTIL = 5;
const pad = (n) => String(n).padStart(2, '0');
const dateOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// 現在是哪一個「夜晚」：19 點後算今天的夜晚，凌晨 5 點前算昨天的夜晚；白天回傳 null
export function nightKey(d = new Date()) {
  const h = d.getHours();
  if (h >= NIGHT_FROM) return dateOf(d);
  if (h < NIGHT_UNTIL) { const y = new Date(d); y.setDate(y.getDate() - 1); return dateOf(y); }
  return null;
}
// 這組配方今天（或今晚）要記在哪一天；不能記就回傳 null
const slotFor = (r, { today, night }) => (r.night ? night || null : today);
const str = (v) => typeof v === 'string';

export function ensureRecipes(state) {
  const old = state.recipes || {};
  state.recipes = Object.fromEntries(RECIPES.map((r) => [r.id, {
    days: Array.isArray(old[r.id]?.days) ? [...new Set(old[r.id].days.filter(str))] : [],
    done: old[r.id]?.done === true,
  }]));
  return state.recipes;
}

// 今天這組配方能不能累積一天
export const recipeActive = (r, residents, raining, night = 'n/a') => r.members.every((no) => residents.includes(no)) && (!r.rain || raining) && (!r.night || Boolean(night));

// 現在有沒有配方可以往前推進（app 用來決定要不要開存檔交易）
export function recipeDue(state, { residents, raining, today, night }) {
  return RECIPES.some((r) => { const rec = state.recipes?.[r.id]; const slot = slotFor(r, { today, night }); return rec && !rec.done && slot && recipeActive(r, residents, raining, night) && !rec.days.includes(slot); });
}

// 每天第一次符合條件時記一天；滿了就送蛋。回傳 { progressed: [...], completed: [...] }
export function tickRecipes(state, { residents, raining, today, night = null }) {
  ensureRecipes(state);
  const progressed = []; const completed = [];
  for (const r of RECIPES) {
    const rec = state.recipes[r.id];
    const slot = slotFor(r, { today, night });
    if (rec.done || !slot || !recipeActive(r, residents, raining, night) || rec.days.includes(slot)) continue;
    rec.days.push(slot); progressed.push(r);
    if (rec.days.length >= r.days) {
      rec.done = true;
      state.gifts.eggs.push({ egg: 'keepsake', character: r.target, from: `recipe:${r.id}`, at: new Date().toISOString() });
      completed.push(r);
    }
  }
  return { progressed, completed };
}
