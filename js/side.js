// 系列支線副本（湘 11/27 定案）：討伐頁「副本」分頁裡的支線。
// - 常駐支線：一直開著（第一條「島嶼不歸檔」，縣市系列）
// - 本週支線：每週一 00:00（台灣時間、可信時間）換一個系列；進度永久保留，輪回來可以補三星、補信物
// 關卡 key＝`side:<線>:<關>`；進度存在 state.side.lines[線]
// 上線前只有測試服（?test）看得到：SIDE_LIVE 改成 true 才對所有玩家開放。
import { CHARACTERS } from './eggs.js';
import { ISLAND_STORY, ISLAND_KEEPSAKE_TEXT } from './side-story.js';
import { nextStarCost, weekKey, MAX_CANDY_STARS } from './candy.js';

export const SIDE_LIVE = false;
export const sideOn = () => SIDE_LIVE || Boolean(globalThis.__SIANG_TEST__);

export const SIDE_UNLOCK = 'thunder-king'; // 打完第 2 章才開（建議戰力 60 起跳，新手打不動會挫折）

// 縣市系列的本島 19 縣市（No.016～034），「島嶼大團結」用
export const MAIN_COUNTY = Array.from({ length: 19 }, (_, i) => String(16 + i).padStart(3, '0'));

// 將軍技能（戰鬥是出發就結算、沒有回合，所以技能＝關掉某個加成或改戰報；每個都有破解方法）
// rename：戰力 −10%，隊上 2 位以上縣市居民就破解
// noBond：羈絆／勇者小隊加成不算（沒有破解）
// sanction：打贏的能量、化石減半，三位都是縣市居民就破解
// rumor：隊上戰力最高、沒吃料理也不是好感 Lv.5 的那位被謠言帶走，不算戰力
// silence：居民技能、料理、信物加成都不算，三位都是縣市居民就破解
export const SKILL_INFO = {
  rename: { name: '強制正名', text: '出戰居民的名牌被蓋上「赤印帝國所屬」，全隊戰力 −10%', counter: '隊上 2 位以上縣市小湘：名字改回來、不扣戰力' },
  noBond: { name: '禁止往來', text: '隊伍羈絆加成不算', counter: '沒有破解，靠縣市加成硬打' },
  sanction: { name: '經濟制裁', text: '打贏拿到的能量、化石減半', counter: '三位都是縣市小湘：島嶼市集開張，照常拿' },
  rumor: { name: '消息污染', text: '隊上戰力最高的一位被謠言帶走，不算戰力', counter: '吃過料理或好感 Lv.5 的小湘不會被帶走' },
  silence: { name: '不容異議', text: '居民技能、料理、信物加成都不算', counter: '三位都是縣市小湘：島嶼一起發聲，加成恢復' },
};

export const SIDE_LINES = {
  island: {
    id: 'island',
    permanent: true,
    series: 'county',
    name: '島嶼不歸檔',
    title: '島嶼守望隊', // 全線三星的稱號
    kicker: '常駐支線 · 縣市小湘',
    tagline: '「我們住在這裡，不是因為誰允許我們住在這裡。」',
    disclaimer: '本故事純屬虛構',
    intro: '頁間世界的東方海域，有一座由各縣市居民一起生活的島。海峽另一端的「赤印帝國」發布《天下頁籍統一令》，說這座島是帝國書冊裡遺失的一頁，派出五位將軍，要把島嶼重新裝訂進去。於是，各縣市小湘組成了「島嶼居民守望隊」。',
    keyArt: 'assets/events/side/island-key.webp', // 湘 11/27 主視覺（支線卡頂端，字在圖裡所以卡片字放圖下方）
    scene: 'assets/scene/side/island-harbor.webp', // 湘 11/27 畫的漁港燈塔（原檔 /mnt/project-files/side-quest/island/originals/）
    countyBonus: { per: 0.2, cap: 0.6 }, // 縣市居民每位 +20%，最多 +60%；其他居民也能上
    reward: { first: 10, firstBoss: 25, repeat: 2, repeatBoss: 4 },
    resident: '118', // 湘 11/27 畫的 SSR 島嶼守望・小湘：五關全通（＝五件信物都拿到）送紀念蛋，不進任何蛋池
    stages: [
      { id: 'isl-1', scene: 'assets/scene/side/island-harbor.webp', label: '★', name: '正名將軍・朱筆', emoji: '🖍️', power: 60, minutes: 45, skill: 'rename',
        intro: '「妳們可以存在，但只能用本將軍批准的名字存在。」',
        win: '「這、這些名字本將軍沒有批准過！……妳們怎麼還敢自己寫上去！」', lose: '「很好。從今天起，妳們的圖鑑一律加註『赤印帝國所屬』。」',
        keepsake: { id: 'nameplate', art: 'assets/keepsakes/side/island/nameplate.webp', name: '未經批准的姓名牌', text: '一塊手寫的名牌，上面的名字沒有任何人蓋章批准。它本來就不需要。' } },
      { id: 'isl-2', scene: 'assets/scene/side/island-harbor.webp', label: '★★', name: '斷交將軍・絕信', emoji: '✉️', power: 85, minutes: 60, skill: 'noBond',
        intro: '「誰敢跟妳們做朋友，本將軍就不跟誰做朋友！」',
        win: '「信……信怎麼還是寄出去了？本將軍明明把郵筒都封起來了！」', lose: '「看吧，沒有人敢回妳們的信。」',
        keepsake: { id: 'postcard', art: 'assets/keepsakes/side/island/postcard.webp', name: '沒有被寄出的明信片', text: '被將軍攔下的明信片。背面寫著：「下次換你來我們這裡玩。」' } },
      { id: 'isl-3', scene: 'assets/scene/side/island-market.webp', label: '★★★', name: '封市將軍・斂財', emoji: '💰', power: 115, minutes: 60, skill: 'sanction',
        intro: '「只要妳們乖乖聽話，本將軍就允許妳們做生意。」',
        win: '「這麼大的市集……鳳梨酥、芒果冰、太陽餅……不、不准排隊！本將軍也要買！」', lose: '「沒有帝國的訂單，妳們的水果就爛在倉庫裡吧。」',
        keepsake: { id: 'market-pass', art: 'assets/keepsakes/side/island/market-pass.webp', name: '自由市集通行證', text: '島嶼市集的入場章。誰都可以來逛，誰都可以來擺攤。' } },
      { id: 'isl-4', scene: 'assets/scene/side/island-market.webp', label: '★★★★', name: '惑心將軍・千聲', emoji: '📢', power: 150, minutes: 75, skill: 'rumor',
        intro: '「妳隔壁那個縣市的小湘，早就偷偷投靠我們了！」',
        win: '「怎麼沒有人轉傳了？妳們……妳們居然先去查證？！」', lose: '「懷疑吧，懷疑身邊的每一個人吧。」',
        keepsake: { id: 'truth-mirror', art: 'assets/keepsakes/side/island/truth-mirror.webp', name: '辨真之鏡', text: '照到傳單時，假的字會一個一個掉下來。先查證，再轉傳。' } },
      { id: 'isl-5', scene: 'assets/scene/side/island-lookout.webp', label: '★★★★★', name: '歸冊大將軍・一統', emoji: '📕', power: 190, minutes: 90, boss: true, skill: 'silence',
        intro: '「本將軍不是來詢問妳們的意見。」\n縣市小湘：「可是我們也沒有在問你的意見啊？」',
        win: '「本次戰敗不影響本帝國對該島嶼的主權聲索！」\n系統提示：五星將軍已被踢出頁間世界。', lose: '「書冊已經打開了。妳們遲早會被裝訂進來。」',
        keepsake: { id: 'island-seal', art: 'assets/keepsakes/side/island/island-seal.webp', name: '島嶼自主之印', text: '一枚小小的印章，蓋下去的是「這一頁，我們自己寫」。' } },
    ],
  },
  // 本週支線：圖、劇情還沒交，先用 emoji 和暫定文字讓測試服看得到
  animals: {
    id: 'animals',
    series: 'animals',
    name: '迷路的森林郵差',
    title: '森林守護者',
    kicker: '本週支線 · 動物小湘',
    tagline: '森林郵差掉了一整袋信，動物小湘們決定幫忙送回去。',
    scene: 'assets/places/park.webp',
    seriesBonus: { per: 0.1, cap: 0.3 },
    reward: { first: 10, firstBoss: 25, repeat: 2, repeatBoss: 4 },
    draft: true,
    stages: [
      { id: 'ani-1', label: 'SD-1', name: '搶松果的松鼠團', emoji: '🐿️', power: 60, minutes: 45, intro: '「松果是我們的！信也是我們的！」', win: '「好啦好啦，信還你們……松果可以留著嗎？」', lose: '「嘿嘿，追不到吧！」' },
      { id: 'ani-2', label: 'SD-2', name: '霸佔水池的河馬', emoji: '🦛', power: 80, minutes: 45, intro: '「這個水池今天本河馬包場了。」', win: '「噗嚕……信濕掉了不是我的錯喔。」', lose: '「噗嚕噗嚕，下次請早。」' },
      { id: 'ani-3', label: 'SD-3', name: '迷霧貓頭鷹', emoji: '🦉', power: 105, minutes: 60, intro: '「咕……地址？什麼地址？霧太大了看不見。」', win: '「咕！霧散了，原來信封背面有寫地址！」', lose: '「咕……妳們也迷路了吧。」' },
      { id: 'ani-4', label: 'SD-4', name: '撕信的大野狼', emoji: '🐺', power: 135, minutes: 90, boss: true, intro: '「沒有人會寫信給我，所以我也不讓別人收到信！」', win: '「……這封，是寫給我的？」', lose: '「嗷嗚——信全部都是我的了！」' },
    ],
  },
};

// 本週支線的輪替順序（有新線就加進來）。從 12/14（一）開始，第 0 週是 animals
export const WEEKLY_ORDER = ['animals'];
export const WEEKLY_ANCHOR = Date.parse('2026-12-14T00:00:00+08:00');
const WEEK_MS = 7 * 864e5;

export const lineDef = (id) => SIDE_LINES[id] || null;
// 皮寶 11/27 的劇本：每關標題（EX-01…）、開打前／打完後劇情、信物說明；終章接在最後一關打完後
SIDE_LINES.island.stages.forEach((st, i) => {
  const story = ISLAND_STORY[st.id]; if (!story) return;
  Object.assign(st, { code: `EX-0${i + 1}`, title: story.title, story: { before: story.before, after: story.after } });
  if (st.keepsake && ISLAND_KEEPSAKE_TEXT[st.keepsake.id]) st.keepsake.text = ISLAND_KEEPSAKE_TEXT[st.keepsake.id];
});
SIDE_LINES.island.finale = ISLAND_STORY.finale;
export const stageDef = (lineId, stageId) => SIDE_LINES[lineId]?.stages.find((s) => s.id === stageId) || null;
export const stageKey = (lineId, stageId) => `side:${lineId}:${stageId}`;
export function parseSideKey(key) {
  if (typeof key !== 'string' || !key.startsWith('side:')) return null;
  const [, lineId, stageId] = key.split(':');
  const line = SIDE_LINES[lineId]; const stage = stageDef(lineId, stageId);
  return line && stage ? { lineId, stageId, line, stage } : null;
}

// 本週是哪一條（nowMs 用可信時間）。上線前測試服固定第 0 週
export function weekIndex(nowMs) {
  const i = Math.floor((nowMs - WEEKLY_ANCHOR) / WEEK_MS);
  return i < 0 ? (globalThis.__SIANG_TEST__ ? 0 : -1) : i;
}
// 下一個台灣時間週一 00:00
export function nextMondayMs(nowMs) {
  const TPE = 8 * 3600e3; const day = Math.floor((nowMs + TPE) / 864e5); const dow = (day + 3) % 7; // 0＝週一
  return (day - dow + 7) * 864e5 - TPE;
}
export function weeklyNow(nowMs) {
  const i = weekIndex(nowMs);
  if (i < 0 || !WEEKLY_ORDER.length) return null;
  const id = WEEKLY_ORDER[i % WEEKLY_ORDER.length];
  const ends = nextMondayMs(nowMs);
  const next = WEEKLY_ORDER[(i + 1) % WEEKLY_ORDER.length];
  return { line: SIDE_LINES[id], endsMs: Math.max(ends, nowMs + 1), next: SIDE_LINES[next] };
}
// 線現在開著嗎：常駐一直開；本週支線只有輪到的那週開（已經派出去的隊伍照樣能回來領）
export const lineOpen = (lineId, nowMs) => Boolean(SIDE_LINES[lineId]?.permanent) || weeklyNow(nowMs)?.line?.id === lineId;

const NORMALIZED = new WeakSet(); // 同一個存檔物件只整理一次，避免中途換掉 state.side 讓手上的參照失效
export function ensureSide(state) {
  if (state.side && NORMALIZED.has(state.side)) return state.side;
  const old = state.side && typeof state.side === 'object' ? state.side : {};
  const lines = {};
  for (const [id, v] of Object.entries(old.lines || {})) {
    if (!SIDE_LINES[id] || !v || typeof v !== 'object') continue;
    const stages = {};
    for (const [sid, s] of Object.entries(v.stages || {})) if (stageDef(id, sid) && s) stages[sid] = { stars: s.stars | 0, best: s.best | 0, clears: s.clears | 0, tries: s.tries | 0, ...(typeof s.firstAt === 'string' ? { firstAt: s.firstAt } : {}) };
    const keepsakes = {};
    for (const [k, at] of Object.entries(v.keepsakes || {})) if (typeof at === 'string') keepsakes[k] = at;
    lines[id] = { stages, keepsakes, ...(typeof v.doneAt === 'string' ? { doneAt: v.doneAt } : {}), ...(typeof v.titleAt === 'string' ? { titleAt: v.titleAt } : {}) };
  }
  const ran = Array.isArray(old.countyRan) ? [...new Set(old.countyRan.filter((no) => typeof no === 'string'))] : [];
  const candy = {};
  for (const [k, n] of Object.entries(old.candy || {})) if (Number.isSafeInteger(n) && n > 0) candy[k] = n;
  const cw = old.candyWeek && typeof old.candyWeek.week === 'string' ? { week: old.candyWeek.week, n: Object.fromEntries(Object.entries(old.candyWeek.n || {}).filter(([, v]) => Number.isSafeInteger(v))) } : { week: '', n: {} };
  const seen = Object.fromEntries(Object.entries(old.seen || {}).filter(([k, v]) => typeof k === 'string' && typeof v === 'string'));
  state.side = { lines, countyRan: ran, candy, candyWeek: cw, seen, ...(typeof old.worn === 'string' && lines[old.worn]?.titleAt ? { worn: old.worn } : {}) };
  NORMALIZED.add(state.side);
  return state.side;
}
export const lineProgress = (state, lineId) => { const s = ensureSide(state); return (s.lines[lineId] ||= { stages: {}, keepsakes: {} }); };
export const stageProgress = (state, lineId, stageId) => state.side?.lines?.[lineId]?.stages?.[stageId] || null;

// 鎖：要先打完第 2 章；線沒開；前一關還沒打贏
export function stageLock(state, lineId, stageId, nowMs) {
  const line = SIDE_LINES[lineId]; if (!line) return '找不到這條支線。';
  if (!state.battle?.stages?.[SIDE_UNLOCK]?.clears) return '打完第 2 章就能挑戰支線。';
  if (!lineOpen(lineId, nowMs)) return '這條支線這週沒有開放。';
  const i = line.stages.findIndex((s) => s.id === stageId);
  if (i > 0 && !state.side?.lines?.[lineId]?.stages?.[line.stages[i - 1].id]?.clears) return '要先打贏前一關。';
  return null;
}

// 給 battle.js 用的敵人資料
export function sideEnemy(lineId, stageId) {
  const line = SIDE_LINES[lineId]; const s = stageDef(lineId, stageId); if (!line || !s) return null;
  return { key: stageKey(lineId, stageId), stage: s.label, name: s.name, emoji: s.emoji, art: s.art || `side/${lineId}/${stageId}`,
    power: s.power, minutes: s.minutes, boss: Boolean(s.boss), weak: [line.series], intro: s.intro, win: s.win.split('\n')[0], winNote: s.win.split('\n').slice(1).join(' ') || null, lose: s.lose,
    weakTag: line.id === 'island' ? '島嶼守望' : '系列主場', weakHit: line.id === 'island' ? '「這是我們的家，我們自己守。」' : '「這裡是我們的主場！」',
    side: lineId, sideStage: stageId, skill: s.skill || null, scene: s.scene || line.scene || null, ...(s.story ? { story: s.story, title: s.title, code: s.code } : {}) };
}

// 戰力加成：系列居民每位加一點（島嶼不歸檔＝縣市 +20%，上限 60%）
export function lineSeriesBonus(lineId, nos) {
  const line = SIDE_LINES[lineId]; const b = line?.countyBonus || line?.seriesBonus; if (!b) return { n: 0, power: 0 };
  const n = nos.filter((no) => CHARACTERS[no]?.series === line.series).length;
  return { n, power: Math.min(b.cap, Math.round(b.per * n * 100) / 100) };
}

// 將軍技能：回傳這一隊會被怎麼影響（teamPower 用）
// opts.level(no)、opts.fed(no)：好感等級、有沒有吃過料理（rumor 免疫判斷）
export function skillEffect(skill, nos, { level = () => 1, fed = () => false, power = () => 0 } = {}) {
  const county = nos.filter((no) => CHARACTERS[no]?.series === 'county').length;
  const all = nos.length > 0 && county === nos.length && nos.length >= 3;
  if (skill === 'rename') return county >= 2 ? { countered: true, mult: 1 } : { mult: 0.9 };
  if (skill === 'noBond') return { noBond: true, mult: 1 };
  if (skill === 'sanction') return all ? { countered: true, mult: 1 } : { lootHalf: true, mult: 1 };
  if (skill === 'silence') return all ? { countered: true, mult: 1 } : { noBuffs: true, mult: 1 };
  if (skill === 'rumor') {
    const open = nos.filter((no) => !fed(no) && level(no) < 5);
    if (!open.length) return { countered: true, mult: 1 };
    const out = open.reduce((a, b) => (power(b) > power(a) ? b : a));
    return { out, mult: 1 };
  }
  return { mult: 1 };
}

// 戰報上的技能行
export function skillLines(skill, eff, nos) {
  const info = SKILL_INFO[skill]; if (!info) return [];
  const name = (no) => CHARACTERS[no]?.name || no;
  if (skill === 'rename') return eff.countered ? [`🖍️ ${info.name}｜朱筆把名牌全蓋上「赤印帝國所屬」……`, '✦ 「我的名字我決定！」縣市小湘把名牌撕了下來，名字改回來了！']
    : [`🖍️ ${info.name}｜${nos.map((no) => `${name(no)}→「赤印${name(no).replace(/小湘.*$/, '')}所屬居民」`).join('、')}（戰力 −10%）`];
  if (skill === 'noBond') return [`✉️ ${info.name}｜信寄不出去，這場羈絆加成不算`];
  if (skill === 'sanction') return eff.countered ? [`💰 ${info.name}｜帝國不買了……`, '✦ 縣市小湘聯手開了一場超大型島嶼市集，照樣有收入！'] : [`💰 ${info.name}｜這場拿到的能量、化石減半`];
  if (skill === 'rumor') return eff.countered ? [`📢 ${info.name}｜傳單滿天飛……`, '✦ 大家先查證再轉傳，沒有人被帶走！'] : [`📢 ${info.name}｜「聽說${name(eff.out)}早就投靠帝國了！」${name(eff.out)}被謠言帶走，這場不算戰力`];
  if (skill === 'silence') return eff.countered ? [`📕 ${info.name}｜「不准發言！」`, '✦ 三位縣市小湘一起開口：「島嶼一起發聲！」加成全部恢復！'] : [`📕 ${info.name}｜居民技能、料理、信物加成都被封住了`];
  return [];
}

// 打完一場：記進度、算化石、首勝掉信物；回傳要顯示的獎勵
// ── 系列星光糖（湘 11/27 推薦版）：只有那個系列的居民能吃；N～SR 一顆抵一顆普通糖，SSR／UR 兩顆抵一顆
export const SERIES_CANDY_MULT = { N: 1, R: 1, SR: 1, SSR: 2, UR: 2 };
export const CANDY_FIRST = 1, CANDY_FIRST_BOSS = 2; // 首勝必給
export const CANDY_CHANCE = 0.25, CANDY_CHANCE_BOSS = 0.4, CANDY_FULL_TEAM = 0.15; // 重複打贏的機率；三位都是該系列再 +15%
export const CANDY_WEEKLY_CAP = 6; // 重複打贏掉的糖，每條線每週最多
export const seriesCandyCount = (state, series) => Math.max(0, state.side?.candy?.[series] | 0);
export function seriesCandyCost(state, no) {
  const c = CHARACTERS[no]; const entry = state.dex?.[no]; if (!c || !entry) return 0;
  const stars = Math.min(MAX_CANDY_STARS, entry.dup || 0); const base = nextStarCost(stars);
  return base ? base * (SERIES_CANDY_MULT[c.rarity] || 1) : 0;
}
export function feedSeriesCandy(state, no) {
  const c = CHARACTERS[no]; const cost = seriesCandyCost(state, no); if (!cost) return null;
  const side = ensureSide(state); if ((side.candy[c.series] | 0) < cost) return null;
  side.candy[c.series] -= cost; const entry = state.dex[no]; entry.dup = Math.min(MAX_CANDY_STARS, entry.dup || 0) + 1;
  return { no, cost, stars: entry.dup, left: side.candy[c.series], series: c.series };
}

export function recordSideRun(state, lineId, stageId, report, nos, { now = new Date(), lootHalf = false, rand = Math.random } = {}) {
  const line = SIDE_LINES[lineId]; const s = stageDef(lineId, stageId); if (!line || !s) return null;
  const prog = lineProgress(state, lineId);
  const st = (prog.stages[stageId] ||= { stars: 0, best: 0, clears: 0, tries: 0 });
  const first = report.win && !st.clears;
  st.tries += 1;
  if (report.win) { st.clears += 1; st.stars = Math.max(st.stars, report.stars | 0); if (!st.firstAt) st.firstAt = now.toISOString(); }
  if ((report.score | 0) > st.best) st.best = report.score | 0;
  const r = line.reward;
  let fossils = report.win ? (first ? (s.boss ? r.firstBoss : r.first) : (s.boss ? r.repeatBoss : r.repeat)) : 0;
  if (lootHalf) fossils = Math.floor(fossils / 2);
  state.fossils = (state.fossils || 0) + fossils;
  // 常駐線：第一次打贏該將軍就拿到信物（不靠機率）
  let keepsake = null;
  if (report.win && s.keepsake && !prog.keepsakes[s.keepsake.id]) { prog.keepsakes[s.keepsake.id] = now.toISOString(); keepsake = s.keepsake; }
  // 系列糖
  let candy = 0;
  if (report.win) {
    const sd = ensureSide(state); const wk = weekKey(now);
    if (sd.candyWeek.week !== wk) sd.candyWeek = { week: wk, n: {} };
    if (first) candy = s.boss ? CANDY_FIRST_BOSS : CANDY_FIRST;
    else if ((sd.candyWeek.n[lineId] | 0) < CANDY_WEEKLY_CAP) {
      const full = nos.length >= 3 && nos.every((no) => CHARACTERS[no]?.series === line.series);
      if (rand() < (s.boss ? CANDY_CHANCE_BOSS : CANDY_CHANCE) + (full ? CANDY_FULL_TEAM : 0)) { candy = 1; sd.candyWeek.n[lineId] = (sd.candyWeek.n[lineId] | 0) + 1; }
    }
    if (candy) sd.candy[line.series] = (sd.candy[line.series] | 0) + candy;
  }
  if (lineId === 'island') { const ran = new Set(ensureSide(state).countyRan); for (const no of nos) if (MAIN_COUNTY.includes(no)) ran.add(no); state.side.countyRan = [...ran]; }
  const done = line.stages.every((x) => prog.stages[x.id]?.clears);
  let complete = false;
  let resident = null;
  if (done && !prog.doneAt) {
    prog.doneAt = now.toISOString(); complete = true;
    const no = line.resident; const allKs = line.stages.every((x) => !x.keepsake || prog.keepsakes[x.keepsake.id]);
    if (no && CHARACTERS[no] && allKs && state.gifts && !state.dex?.[no] && !state.gifts.eggs?.some((g) => g.character === no)) {
      (state.gifts.eggs ||= []).push({ egg: 'keepsake', character: no, from: `side:${lineId}`, at: now.toISOString() }); resident = no;
    }
  }
  // 稱號：全線三星
  let title = null;
  if (line.title && !prog.titleAt && line.stages.every((x) => (prog.stages[x.id]?.stars | 0) >= 3)) { prog.titleAt = now.toISOString(); title = line.title; }
  return { first, fossils, keepsake, complete, lineName: line.name, candy, series: line.series, title, resident };
}

export const lineCleared = (state, lineId) => Boolean(state.side?.lines?.[lineId]?.doneAt);
export const keepsakeCount = (state, lineId) => Object.keys(state.side?.lines?.[lineId]?.keepsakes || {}).length;
export const stageWon = (state, lineId, stageId) => Boolean(state.side?.lines?.[lineId]?.stages?.[stageId]?.clears);
