// 願望：小湘（或蛋裡的聲音）想看某種顏色的東西，玩家拍照，程式分析照片顏色。
// 照片只在手機上分析，不會上傳，也不會保存。

import { WISH_COPY, STAGE_COLUMN, STAGE_SPEAKER } from './wish-copy.js';

export const WISH_REWARD = 35; // 每個願望給的保溫能量
export const WISHES_PER_DAY = 3;
export const PASS_RATIO = 0.18; // 目標顏色要佔畫面至少 18%（11/17 玩家回饋：原本 25% 太嚴格）

const inHue = (h, from, to) => (from <= to ? h >= from && h < to : h >= from || h < to);

// 色彩範圍刻意互相重疊一點：偏紅的淡粉紅（像衛生紙包裝）同時算粉紅，也不會漏掉
export const WISH_POOL = [
  { id: 'red', color: '紅色', swatch: '#d2203f', line: '想看紅色的東西……', test: (h, s, v) => inHue(h, 335, 18) && s >= 0.35 && v >= 0.2 },
  { id: 'yellow', color: '黃色或橘色', swatch: '#f0b03a', line: '想看黃色或橘色的東西！', test: (h, s, v) => inHue(h, 18, 72) && s >= 0.25 && v >= 0.3 },
  { id: 'green', color: '綠色', swatch: '#4fae6a', line: '想看綠綠的東西，植物也可以。', test: (h, s, v) => inHue(h, 70, 175) && s >= 0.18 && v >= 0.15 },
  { id: 'blue', color: '藍色', swatch: '#3f8fe0', line: '想看藍色，天空也可以。', test: (h, s, v) => inHue(h, 170, 262) && s >= 0.18 && v >= 0.2 },
  { id: 'pink', color: '粉紅色或紫色', swatch: '#e07ac0', line: '想看粉紅色或紫色的東西～', test: (h, s, v) => (inHue(h, 255, 345) && s >= 0.14 && v >= 0.25) || (inHue(h, 330, 12) && s >= 0.1 && s < 0.6 && v >= 0.5) },
  { id: 'white', color: '白色', swatch: '#f4f1ec', line: '想看白白的東西。', test: (h, s, v) => s < 0.18 && v > 0.7 },
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

// 改版前的抽法（全部是單色）。改版當天已經開始的願望沿用這個，不會中途換掉。
export function legacyWishesFor(dateKey) {
  const rand = seeded(dateKey);
  const pool = [...WISH_POOL];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, WISHES_PER_DAY).map((w) => ({ ...w, kind: 'color' }));
}

// ── 每日三個願望：一個顏色類、一個不用拍照的、一個主題拍照
const byId = (id) => WISH_POOL.find((w) => w.id === id);
const VARIANTS = [ // 顏色類的變化與出現權重
  ['color', 45], ['duo', 20], ['rainbow', 10], ['bright', 8], ['dark', 7], ['morning', 5], ['night', 5],
];
const DUOS = [['red', 'green'], ['yellow', 'blue'], ['pink', 'green'], ['blue', 'white'], ['red', 'white'], ['yellow', 'pink'], ['green', 'blue'], ['red', 'yellow']];

export const THEMES = [
  '拍一個圓形的東西', '拍今天吃的一樣東西', '拍一個讓你笑出來的東西', '拍一個有字的東西', '拍你的鞋子',
  '拍一個毛茸茸的東西', '拍窗外的風景', '拍一個很小很小的東西', '拍一個有很多個的東西', '拍一個亮晶晶的東西',
  '拍你今天的飲料', '拍一個方形的東西', '拍一個你每天都會用的東西', '拍一片葉子或一朵花', '拍一個影子',
  '拍天花板', '拍一個像臉的東西', '拍你現在坐的地方', '拍一個有條紋的東西', '拍一個軟軟的東西',
  '拍一個有點舊的東西', '拍一個你想送給湘的東西', '拍一個門或一扇窗', '拍一個有數字的東西', '拍一個會發光的東西',
  '拍地板上的花紋', '拍一個你覺得可愛的東西', '拍一個有圖案的杯子或碗', '拍一個交通工具', '拍一個招牌',
  '拍今天的天空', '拍一個透明的東西', '拍一個有洞的東西', '拍你包包裡的一樣東西', '拍一個像小湘的東西',
  '拍一個有愛心形狀的東西', '拍一個堆起來的東西', '拍一個有雲的地方', '拍一個在轉的或會動的東西', '拍一個讓你覺得放鬆的地方',
];

// 天氣小湘的委託（皮寶 docs/WEATHER_SIANG_DIALOGUE_065-075.md 的「今日願望候選」）
// 從 2026-11-20 起每 4 天有一天，第三個願望換成其中一則委託；遇見過她，就由她本人來說
export const COMMISSIONS = [
  { no: '065', task: '拍一張你覺得最像心情的天空', line: '今天的委託：拍一張你覺得最像心情的天空，讓我幫它取名字！' },
  { no: '066', task: '找一個舒服的小角落，拍下你最想待著的地方', line: '今天的委託：找一個舒服的小角落，拍下你最想待著的地方。' },
  { no: '067', task: '畫一個最帥的閃電符號，拍下來', line: '今天的委託：畫一個最帥的閃電符號給我看！不可以冒險追雷雨喔。' },
  { no: '068', task: '拍一樣讓你覺得「今天真不錯」的小東西', line: '今天的委託：拍一樣讓你覺得『今天真不錯』的小東西！' },
  { no: '069', task: '找到一個平常沒注意過的小細節，拍下來', line: '今天的委託：找到一個平常沒注意過的小細節，拍照當線索！' },
  { no: '070', task: '找一樣有冰晶或透明質感的小物，拍下來', line: '今天的委託：找一樣有冰晶或透明質感的小物，拍給我研究！' },
  { no: '071', task: '等雨停、路面安全時，拍一個小水坑的倒影', line: '今天的委託：等雨停、路面安全時，拍一個小水坑的倒影給我！' },
  { no: '072', task: '用紙或照片做一片小雪花，拍下來', line: '今天的委託：用紙或照片做一片小雪花，不用真的下雪也可以喔！' },
  { no: '073', task: '在安全的地方找一樣被微風吹動的小東西，拍下來', line: '今天的委託：在安全的地方找一樣被微風吹動的小東西，拍給我看！' },
  { no: '074', task: '在身邊找出三種不同顏色，拍成一張迷你彩虹', line: '今天的委託：在身邊找出三種不同顏色，拍成一張迷你彩虹！' },
  { no: '075', task: '拍下一個讓你想到「溫暖」的顏色或光影', line: '今天的委託：拍下一個讓你想到『溫暖』的顏色或光影。' },
];
const COMMISSION_START = '2026-11-20';

export const QUIZZES = [
  ['布丁還是蛋糕？', '布丁', '蛋糕', '布丁！我也是布丁派！', '蛋糕也好好吃，下次分我一口。'],
  ['下雨天要待在家還是出門踩水？', '待在家', '出門踩水', '那我們一起窩著，我幫你顧蛋。', '踩水！我要穿雨鞋！'],
  ['早上醒來先做什麼？', '滑手機', '賴床', '我也會先看看蛋有沒有動靜。', '再五分鐘……我也要。'],
  ['如果可以養一隻動物？', '貓', '狗', '貓咪會不會想吃恐龍蛋……', '狗狗可以陪我們散步！'],
  ['夏天還是冬天？', '夏天', '冬天', '夏天的冰最好吃了。', '冬天可以一起抱著蛋取暖。'],
  ['火鍋要吃什麼鍋？', '麻辣', '昆布', '辣辣的！我會吐火！', '清清淡淡的也很好喝。'],
  ['假日想去海邊還是山上？', '海邊', '山上', '我想撿貝殼！', '山上的空氣涼涼的。'],
  ['珍奶要大珠還是小珠？', '大珠', '小珠', 'Q 彈！嚼嚼嚼。', '小小的一口一顆。'],
  ['想要超能力的話？', '瞬間移動', '讀心術', '這樣就可以一下子到湘身邊了。', '那你猜猜我現在在想什麼？'],
  ['睡覺要抱什麼？', '枕頭', '布偶', '軟軟的枕頭最好。', '布偶！可以抱我嗎？'],
  ['甜的還是鹹的？', '甜的', '鹹的', '甜甜的人生！', '鹹酥雞也算吧？'],
  ['看電影要看什麼？', '動畫', '恐怖片', '我喜歡會唱歌的那種。', '我、我才不怕……可以牽手嗎？'],
  ['今天的心情像什麼天氣？', '晴天', '陰天', '太好了！一起曬太陽。', '沒關係，我陪你等放晴。'],
  ['如果有一天假，要做什麼？', '睡一整天', '出去玩', '睡飽飽也是很重要的事。', '帶我一起去！'],
  ['喜歡什麼顏色的恐龍？', '綠色', '粉紅色', '就是我！嘿嘿。', '粉紅色的恐龍好像也很可愛……'],
  ['如果可以替蛋挑一頂帽子？', '小皇冠', '毛帽', '那我今天是蛋殿下！', '暖呼呼！帽子先不要滑下去。'],
  ['小湘把布丁藏在哪裡最安全？', '冰箱', '肚子裡', '冰箱好！我會貼名字防止被偷吃。', '已經吃掉就不會不見！這叫保存。'],
  ['跟小恐龍探險先帶什麼？', '地圖', '點心', '有地圖就不怕迷路！……你會看嗎？', '你真懂！冒險一定會肚子餓。'],
  ['今天只剩十分鐘空閒？', '發呆', '找小湘玩', '發呆很好！我坐旁邊不吵你。', '耶！十分鐘也夠我們笑好多次。'],
  ['突然收到空白明信片？', '畫一張畫', '寫一句話', '畫我們和小恐龍！要把尾巴畫進去。', '那就寫「下次也一起」！'],
];

const ACTS = {
  pet: { name: '摸摸頭時間', line: '小湘說她今天想被摸摸頭。', hint: '在首頁摸摸小湘 3 次（點她，或手指在她身上來回滑）', metric: 'pets', need: 3, swatch: '#f0a8c0', label: '陪伴' },
  greet: { name: '說聲早安', line: '去跟大家打個招呼吧！', hint: '在首頁點小湘打招呼 3 次', metric: 'taps', need: 3, swatch: '#f0c47a', label: '陪伴' },
  errand: { name: '幫忙跑腿', line: '冰箱好像空空的……誰可以出門一下？', hint: '派一位小湘出門（首頁「出門」）', metric: 'departed', need: 1, swatch: '#8fc6a8', label: '出門' },
  explore: { name: '聽聽附近', line: '附近好像有小湘的聲音，要不要去聽聽看？', hint: '在首頁按一次「探索附近」', metric: 'explores', need: 1, swatch: '#8fb6e0', label: '探索' },
};

const KIND_INFO = {
  duo: (a, b) => ({ swatch: a.swatch, label: `${a.color.slice(0, 1)}＋${b.color.slice(0, 1)}`, name: `${a.color.replace(/或.*/, '')}遇見${b.color.replace(/或.*/, '')}`, line: `想看一張同時有${a.color}和${b.color}的照片！`, hint: `拍一張同時有${a.color}和${b.color}的照片`, condition: '兩種顏色各占畫面 8% 以上' }),
  rainbow: () => ({ swatch: '#e07ac0', label: '彩虹', name: '彩虹收集', line: '想看好多好多顏色擠在一起！', hint: '拍一張有很多顏色的照片', condition: '至少 3 種顏色、各占 5% 以上' }),
  bright: () => ({ swatch: '#fff1b8', label: '明亮', name: '亮晶晶的地方', line: '想看很亮很亮的地方，像太陽一樣。', hint: '拍一個很明亮的畫面（陽光、白天的窗邊、燈）', condition: '明亮的部分占畫面 50% 以上' }),
  dark: () => ({ swatch: '#3b3352', label: '暗暗的', name: '夜色收藏', line: '想看暗暗的、安安靜靜的地方。', hint: '拍一個暗暗的畫面（夜晚、關燈的房間）', condition: '暗的部分占畫面 55% 以上' }),
  morning: () => ({ swatch: '#bfe3f2', label: '早晨', name: '早晨的天空', line: '早上的天空是什麼顏色呢？', hint: '早上 5 點到 11 點之間，拍一張天空或窗外', condition: '限早上 5:00–10:59 · 明亮部分占 40% 以上', window: [5, 11] }),
  night: () => ({ swatch: '#2c2a4a', label: '夜晚', name: '夜裡的一盞燈', line: '晚上的燈，看起來特別溫暖。', hint: '晚上 7 點以後，拍一盞亮著的燈或夜景', condition: '限晚上 19:00–04:59 · 畫面要暗、但有亮光', window: [19, 5] }),
};

// 由 id 還原願望（id 裡帶著參數，存檔只要存 id）
export function wishById(id) {
  if (typeof id !== 'string') return null;
  const color = byId(id);
  if (color) return { ...color, kind: 'color' };
  const [kind, a, b] = id.split(':');
  if (kind === 'duo' && byId(a) && byId(b)) return { id, kind, colors: [a, b], ...KIND_INFO.duo(byId(a), byId(b)) };
  if (['rainbow', 'bright', 'dark', 'morning', 'night'].includes(kind) && !a) return { id, kind, ...KIND_INFO[kind]() };
  if (kind === 'theme' && /^c\d+$/.test(a || '') && COMMISSIONS[Number(a.slice(1))]) {
    const c = COMMISSIONS[Number(a.slice(1))];
    return { id, kind, owner: c.no, ownerLine: c.line, swatch: '#a9c6e8', label: '委託', name: c.task.replace(/^拍/, ''), line: `今天的題目：${c.task}！`, hint: c.task, condition: '拍了就算 · 照片會存進每日相簿' };
  }
  if (kind === 'theme' && THEMES[Number(a)]) {
    const text = THEMES[Number(a)];
    return { id, kind, swatch: '#c9a7e8', label: '主題', name: text.replace(/^拍/, ''), line: `今天的題目：${text}！`, hint: text, condition: '拍了就算 · 照片會存進每日相簿' };
  }
  if (kind === 'act' && ACTS[a]) return { id, kind, act: a, ...ACTS[a], condition: `進度會自動記錄，完成後按「收下」` };
  if (kind === 'quiz' && QUIZZES[Number(a)]) {
    const [q, x, y] = QUIZZES[Number(a)];
    return { id, kind, swatch: '#9bd3a8', label: '小恐龍', name: '小恐龍想問你', line: q, hint: `${x}，還是${y}？`, condition: '選一個回答就算', options: [x, y] };
  }
  return null;
}

// 換一個願望（每天一次）：換成同一類的另一個，避開今天已經有的、和現在時段做不到的（早晨、夜晚）
const PHOTO_KINDS = ['color', 'duo', 'rainbow', 'bright', 'dark', 'morning', 'night'];
export function swapWishId(dateKey, ids, index, { hour = new Date().getHours(), hasSiang = true } = {}) {
  const old = wishById(ids[index]); if (!old) return null;
  const rand = seeded(`swap:${dateKey}:${index}:${ids[index]}`);
  const pick = (list) => list[Math.floor(rand() * list.length) % list.length];
  const make = () => {
    if (PHOTO_KINDS.includes(old.kind)) {
      const r = rand();
      if (r < 0.55) return pick(WISH_POOL).id;
      if (r < 0.8) return `duo:${pick(DUOS).join(':')}`;
      return pick(['rainbow', 'bright', 'dark', 'morning', 'night']);
    }
    if (old.kind === 'act' || old.kind === 'quiz') {
      const acts = Object.keys(ACTS).filter((a) => hasSiang || !['pet', 'greet', 'errand'].includes(a));
      return rand() < 0.4 ? `quiz:${Math.floor(rand() * QUIZZES.length)}` : `act:${pick(acts)}`;
    }
    return `theme:${Math.floor(rand() * THEMES.length)}`;
  };
  for (let i = 0; i < 40; i++) {
    const id = make(); const w = wishById(id);
    if (!w || ids.includes(id)) continue;
    if (w.window && !inWindow(w.window, hour)) continue;
    return id;
  }
  return null;
}

export function wishesFor(dateKey) {
  if (globalThis.SIANG_CLASSIC_WISHES) return legacyWishesFor(dateKey); // 舊測試用：只抽單色
  const rand = seeded(`v2:${dateKey}`);
  const pickW = (list) => { const total = list.reduce((n, [, w]) => n + w, 0); let r = rand() * total; for (const [k, w] of list) { r -= w; if (r < 0) return k; } return list[0][0]; };
  const pick = (list) => list[Math.floor(rand() * list.length) % list.length];
  const variant = pickW(VARIANTS);
  let first;
  if (variant === 'color') first = pick(WISH_POOL).id;
  else if (variant === 'duo') first = `duo:${pick(DUOS).join(':')}`;
  else first = variant;
  const second = rand() < 0.3 ? `quiz:${Math.floor(rand() * QUIZZES.length)}` : `act:${pick(Object.keys(ACTS))}`;
  // 主題按日期輪替，40 天內不重複
  const [y, m, d] = dateKey.split('-').map(Number);
  const day = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  const third = dateKey >= COMMISSION_START && day % 4 === 0 ? `theme:c${Math.floor(day / 4) % COMMISSIONS.length}` : `theme:${(day * 17) % THEMES.length}`;
  return [first, second, third].map(wishById);
}

export const isPhotoWish = (w) => !['act', 'quiz'].includes(w?.kind);

// 一次算出照片的顏色分布與明暗
export async function photoStats(file, previewCanvas) {
  const img = await loadImage(file);
  const N = 48;
  const c = document.createElement('canvas'); c.width = N; c.height = N;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, N, N);
  const { data } = ctx.getImageData(0, 0, N, N);
  const colors = Object.fromEntries(WISH_POOL.map((w) => [w.id, 0]));
  let bright = 0; let dark = 0; let glow = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, v] = toHsv(data[i], data[i + 1], data[i + 2]);
    for (const w of WISH_POOL) if (w.test(h, s, v)) colors[w.id] += 1;
    if (v > 0.62) bright += 1;
    if (v < 0.25) dark += 1;
    if (v > 0.85) glow += 1;
  }
  const n = N * N;
  if (previewCanvas) {
    const size = previewCanvas.width; const side = Math.min(img.width, img.height);
    previewCanvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
  }
  for (const k of Object.keys(colors)) colors[k] /= n;
  return { colors, bright: bright / n, dark: dark / n, glow: glow / n };
}

export const inWindow = ([from, to], hour) => (from <= to ? hour >= from && hour < to : hour >= from || hour < to);
// 判定照片：回傳 { pass, pct, need, title, text }
export function judge(wish, stats, now = new Date()) {
  const pct = (x) => Math.round(x * 100);
  const fail = (title, text, value, need) => ({ pass: false, title, text, pct: pct(value), need: pct(need) });
  if (wish.window && !inWindow(wish.window, now.getHours())) {
    return { pass: false, title: '時間不對喔', text: wish.kind === 'morning' ? '這個願望要在早上 5 點到 11 點之間拍。' : '這個願望要在晚上 7 點以後拍。', pct: 0, need: 100, early: true };
  }
  switch (wish.kind) {
    case 'color': { const r = stats.colors[wish.id]; return r >= PASS_RATIO ? { pass: true } : fail('顏色不夠多', `${wish.color}只佔畫面的 ${pct(r)}%，需要 ${pct(PASS_RATIO)}%。靠近一點，讓它填滿畫面再拍一次。`, r, PASS_RATIO); }
    case 'duo': {
      const [a, b] = wish.colors; const ra = stats.colors[a]; const rb = stats.colors[b]; const low = Math.min(ra, rb);
      if (low >= 0.08) return { pass: true };
      const miss = ra < rb ? byId(a) : byId(b);
      return fail('還差一種顏色', `${byId(a).color} ${pct(ra)}%、${byId(b).color} ${pct(rb)}%，兩種都要 8% 以上。多一點${miss.color}再拍拍看。`, low, 0.08);
    }
    case 'rainbow': {
      const many = Object.values(stats.colors).filter((r) => r >= 0.05).length;
      return many >= 3 ? { pass: true } : fail('顏色還不夠多', `這張找到 ${many} 種顏色，要 3 種以上。把不同顏色的東西擺在一起拍拍看！`, many / 3, 1);
    }
    case 'bright': return stats.bright >= 0.5 ? { pass: true } : fail('還不夠亮', `明亮的部分佔 ${pct(stats.bright)}%，需要 50%。去窗邊或燈下拍拍看。`, stats.bright, 0.5);
    case 'dark': return stats.dark >= 0.55 ? { pass: true } : fail('還不夠暗', `暗的部分佔 ${pct(stats.dark)}%，需要 55%。關燈或晚上再拍拍看。`, stats.dark, 0.55);
    case 'morning': return stats.bright >= 0.4 ? { pass: true } : fail('天空好像還沒亮', `明亮的部分佔 ${pct(stats.bright)}%，需要 40%。對著天空或窗外拍拍看。`, stats.bright, 0.4);
    case 'night': return stats.dark >= 0.35 && stats.glow >= 0.02 ? { pass: true } : fail('要暗暗的、有一盞燈', `暗的部分 ${pct(stats.dark)}%（要 35%）、亮光 ${pct(stats.glow)}%（要 2%）。`, Math.min(stats.dark / 0.35, stats.glow / 0.02, 1), 1);
    case 'theme': return { pass: true };
    default: return { pass: false, title: '這個願望不用拍照', text: '', pct: 0, need: 100 };
  }
}

// 不用拍照的願望：今天的進度（以當天開始時的累計數字為基準）
export function actProgress(wish, state) {
  if (wish?.kind !== 'act') return null;
  const total = { ...(state.bonus?.total || {}), departed: state.errands?.departed || 0 };
  const base = { taps: total.taps || 0, ...(state.wishes?.base || {}) };
  const cur = Math.max(0, (total[wish.metric] || 0) - (base[wish.metric] || 0));
  return { cur: Math.min(cur, wish.need), need: wish.need, ready: cur >= wish.need };
}
export const quizReply = (wish, choice) => { const q = QUIZZES[Number(wish.id.split(':')[1])]; return q ? q[choice === 1 ? 4 : 3] : ''; };

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
