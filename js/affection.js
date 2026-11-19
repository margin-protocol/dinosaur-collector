// 小湘好感度：每位小湘各自累積，不花能量。
// 在首頁點她、摸摸頭、餵布丁（每位每天上限 15 點）、住在首頁、一起出門、重複孵到她都會增加。
// 升級送獎勵，並解鎖新台詞、小故事；滿級在圖鑑變成閃亮卡。
import { CHARACTERS } from './eggs.js';
import { BOND_STORIES, BOND_LINES } from './bond-copy.js';

export const LEVELS = [0, 10, 30, 60, 100]; // Lv.1～Lv.5 需要的累計點數
export const MAX_LEVEL = LEVELS.length;
export const DAILY_CAP = 15; // 首頁互動（點、摸、布丁）每位每天最多加這麼多
export const GAIN = { tap: 1, pet: 1, snack: 3, home: 2, errand: 4, story: 2, duplicate: 10, photo: 3 }; // photo：外出合照，每位每天一次
const CAPPED = new Set(['tap', 'pet', 'snack']);
export const LEVEL_REWARDS = { 2: { energy: 10 }, 3: { fossils: 3 }, 4: { energy: 20 }, 5: { fossils: 10 } };

// 系列預設台詞與後備故事；個別人物文案優先。{name} 會換成小湘的名字。
const SERIES_TEXT = {
  daily: {
    lines: ['今天也有好好吃飯嗎？我有喔！', '跟你在一起的普通日子，是我最喜歡的日子。', '不管明天怎樣，今天有你就夠了。'],
    story: '{name}偷偷在冰箱貼了一張便條：「記得喝水、記得休息、記得我。」字有點歪，但很認真。',
  },
  friends: {
    lines: ['今天要聊近況，還是先一起去吃點東西？', '不用特地找話題啊，我就是來陪你坐一下。', '以後也這樣，想到什麼好笑的，就拿來跟你講。'],
    story: '{name}把合照印出來，卻發現每張都有一個人眨眼。挑了半天，她乾脆全部留下，說這樣才知道大家是輪流笑場的。',
  },
  animals: {
    lines: ['（蹭蹭）……這是我們的打招呼方式！', '我把最喜歡的地方讓給你坐。', '你的手好溫暖，可以再摸一下嗎？'],
    story: '{name}今天在窗邊曬了一整個下午的太陽，等你回來的時候，把曬得暖暖的位置讓給了你。',
  },
  county: {
    lines: ['下次來我家鄉，我帶你去吃最好吃的那家！', '我家鄉的風景，想跟你一起看。', '不管走到哪裡，我都會記得你來看過我。'],
    story: '{name}畫了一張家鄉的手繪地圖，上面標了十幾個「一定要帶你去」的地方，最後一個寫著：「我們家」。',
  },
  holiday: {
    lines: ['每一個節日，我都想跟你一起過。', '我偷偷幫你準備了禮物，猜猜看是什麼？', '有你在的日子，每天都像在過節。'],
    story: '{name}在月曆上把每個節日都圈起來，旁邊寫滿計畫。仔細一看，每個計畫裡都有你。',
  },
  date: {
    lines: ['今天也很想你……這樣說會不會太直接？', '牽手的時候，你的手心是不是也有點熱？', '我最喜歡的人，一直都是你。'],
    story: '{name}把你們第一次約會的電影票根夾在日記裡。那一頁只寫了一句：「好想再去一次。」',
  },
  weather: {
    lines: ['下雨的時候，我會想起你撐傘的樣子。', '不管什麼天氣，有你就是好天氣。', '我想當你的晴天，也想陪你淋雨。'],
    story: '{name}每天早上都會先看天氣預報，不是為了自己，是想知道今天要不要提醒你帶傘。',
  },
  recipe: {
    lines: ['我做了新的點心，你要當第一個試吃的人！', '最好吃的調味料，是想著你一起做。', '今天的味道，是不是有比較甜？'],
    story: '{name}失敗了好幾次，終於做出一個像樣的蛋糕。上面歪歪的奶油字寫著：「給最重要的人」。',
  },
  memorial: {
    lines: ['這一天，我會一直記得。', '謝謝你，讓我成為重要的回憶。', '以後的每一個紀念日，也要一起過喔。'],
    story: '{name}有一個小盒子，裡面收著你們一起的每個小東西：票根、貼紙、一片葉子。她說這是寶藏。',
  },
  hero: {
    lines: ['今天的冒險也平安結束了，因為有你在後面喊加油。', '打倒魔王很帥，可是跟你一起回家更好。', '我會變得更強的，這樣就能一直站在你旁邊。'],
    story: '{name}把這次討伐的徽章收進小盒子，跟上次的排在一起。她說每一枚都記著一次「大家都平安回來了」。',
  },
  special: {
    lines: ['被你找到，是我最幸運的事。', '我很特別嗎？那是因為你很特別。', '能一直待在你身邊就好了。'],
    story: '{name}說，她出現之前許了一個願望：希望遇到一個會好好珍惜她的人。後來，她遇到了你。',
  },
};
const FALLBACK = SERIES_TEXT.daily;
const fill = (text, no) => text.replaceAll('{name}', CHARACTERS[no]?.name || '小湘');

export function bondText(no) {
  const t = SERIES_TEXT[CHARACTERS[no]?.series] || FALLBACK;
  const lines = BOND_LINES[no] || {};
  return { 2: fill(lines[2] || t.lines[0], no), 3: fill(BOND_STORIES[no] || t.story, no), 4: fill(lines[4] || t.lines[1], no), 5: fill(lines[5] || t.lines[2], no) };
}
export const UNLOCK_LABEL = { 2: '新台詞', 3: '小故事', 4: '新台詞', 5: '閃亮卡＋最後的悄悄話' };

export function levelOf(pts) {
  let lv = 1;
  for (let i = 0; i < LEVELS.length; i++) if (pts >= LEVELS[i]) lv = i + 1;
  return lv;
}

export function ensureAffection(state) {
  const old = state.affection && typeof state.affection === 'object' ? state.affection : {};
  const clean = {};
  for (const [no, v] of Object.entries(old)) {
    if (!CHARACTERS[no] || !v || !Number.isFinite(v.pts)) continue;
    clean[no] = { pts: Math.max(0, Math.floor(v.pts)), day: typeof v.day === 'string' ? v.day : '', today: Number.isFinite(v.today) ? v.today : 0, home: typeof v.home === 'string' ? v.home : '', ...(typeof v.photo === 'string' ? { photo: v.photo } : {}) };
  }
  state.affection = clean;
  return clean;
}

function entry(state, no) {
  const a = state.affection || ensureAffection(state);
  return (a[no] ||= { pts: 0, day: '', today: 0, home: '' });
}

// 還能從首頁互動拿到幾點
export function capLeft(state, no, today) {
  const e = state.affection?.[no];
  if (!e || e.day !== today) return DAILY_CAP;
  return Math.max(0, DAILY_CAP - e.today);
}

// 加好感度。回傳 { added, level, up: [{ level, reward, unlock }] }
export function gain(state, no, kind, today, times = 1) {
  if (!CHARACTERS[no] || !state.dex?.[no]) return { added: 0, level: 1, up: [] };
  const e = entry(state, no);
  let amount = (GAIN[kind] || 0) * times;
  if (kind === 'photo') { if (e.photo === today) amount = 0; else e.photo = today; }
  if (CAPPED.has(kind)) {
    if (e.day !== today) { e.day = today; e.today = 0; }
    amount = Math.min(amount, DAILY_CAP - e.today);
    e.today += Math.max(0, amount);
  }
  if (amount <= 0) return { added: 0, level: levelOf(e.pts), up: [] };
  const before = levelOf(e.pts);
  e.pts += amount;
  const after = levelOf(e.pts);
  const up = [];
  for (let lv = before + 1; lv <= after; lv++) {
    const r = LEVEL_REWARDS[lv] || {};
    if (r.energy) state.energy += r.energy;
    if (r.fossils) state.fossils = (state.fossils || 0) + r.fossils;
    up.push({ level: lv, reward: r, unlock: UNLOCK_LABEL[lv], text: bondText(no)[lv] });
  }
  return { added: amount, level: after, up };
}

// 住在首頁的小湘，每天各加一次
export function homeTick(state, residents, today) {
  const ups = [];
  for (const no of residents) {
    if (!state.dex?.[no]) continue;
    const e = entry(state, no);
    if (e.home === today) continue;
    e.home = today;
    const r = gain(state, no, 'home', today);
    if (r.up.length) ups.push({ no, up: r.up });
  }
  return ups;
}

export function bondInfo(state, no, today) {
  const pts = state.affection?.[no]?.pts || 0;
  const level = levelOf(pts);
  const next = LEVELS[level] ?? null;
  return { pts, level, next, prev: LEVELS[level - 1], left: capLeft(state, no, today), max: level >= MAX_LEVEL };
}

export const describeLevelReward = (r) => [r.energy && `${r.energy} 能量`, r.fossils && `${r.fossils} 化石`].filter(Boolean).join('、');
