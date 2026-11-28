// 異世活動框架（2.0 · 湘 11/25）：活動全部寫成資料，程式只寫一次。
// 墨痕江湖（EVENT 001）是第一筆資料；下一個異世活動只要在 EVENT_DEFS 加一筆、放素材。
// 存檔放 state.events[活動 id]，跟 state.battle.stages 分開（ensureBattle 會清掉不認得的關卡），
// 而且永遠不清除：活動結束後，通關紀錄、劇情、信物、商店購買都留著（之後可以復刻）。
// 時間：一律用 eventNow()（GitHub Pages 回應的 Date 標頭校正過的時間，而且不會往回撥）。

import { MO_STORY, MO_KEEPSAKE_STORY } from './event-mo-story.js';

const H = 3600e3;
const D = 24 * H;
const isStr = (v) => typeof v === 'string';
const isInt = (v) => Number.isSafeInteger(v) && v >= 0;
const iso = (ms) => new Date(ms).toISOString();

// ───────── 活動資料 ─────────
// start：全服開始時間（台北時間）。null＝還沒排定，活動不顯示。
// phases[].opensAfterH：開始後幾小時開放（下卷 72h，以全服時間為準，不是個人進度）；requires：要先打完哪一卷。
// battleDays：開始後幾天關閉討伐；shopDays：開始後幾天關閉商店（之後進入封存）。
// 關卡 power／minutes／drop 依 11/25 評估草案：一般玩家一天 6～8 場、14 天約 100 場，總共約 1,100～1,300 墨玉。
export const EVENT_DEFS = {
  mo: {
    id: 'mo',
    code: 'EVENT 001',
    world: 'mo',
    name: '異世・墨痕江湖',
    subtitle: '十萬兩紅妝',
    titles: { 'mo-pen': '執筆入江湖', 'mo-unwed': '紅妝不嫁' }, // 活動稱號：墨玉閣買／信物收齊
    tagline: '江湖有盡，書頁無涯。',
    start: '2026-11-26T12:00:00+08:00', // 湘 11/25：明天開始（中午 12 點）；下卷 11/29 12:00、討伐到 12/10、墨玉閣到 12/17
    poolArt: { up: 'assets/events/mo/pool-up.webp', down: 'assets/events/mo/pool-down.webp' }, // 墨玉閣墨痕蛋上方的卡池圖：下卷開放後換 down（德寶合成，湘 11/25 OK）
    keyArt: 'assets/events/mo/key-visual.webp', // 湘 11/25 主視覺（聞止水護海棠新娘），人物在右半，左邊留給文字
    battleDays: 14,
    shopDays: 21,
    token: { id: 'moyu', name: '墨玉', icon: '🪨', art: 'assets/events/mo/moyu.webp' },
    // 墨玉加成（湘 11/25 選推薦）：每位墨痕江湖居民 +10%，聞止水 +20%，一隊最多 +40%
    tokenBonus: { world: 0.10, by: { 'MO-001': 0.20 }, cap: 0.40 },
    // 湘 11/26：墨玉加量（A＋C）——每關掉落、首通都 ×2（輸了維持 2），加每日首勝 +30（本地日期，每天第一場打贏；不吃隊伍／信物加成）
    firstClear: 60,
    loseDrop: 2,
    dailyWin: 30,
    phases: [
      { id: 'up', name: '上卷・紅妝出逃', opensAfterH: 0, stages: ['mo-01', 'mo-02', 'mo-03', 'mo-04', 'mo-05'] },
      { id: 'down', name: '下卷・江湖不嫁', opensAfterH: 72, requires: 'up', stages: ['mo-06', 'mo-07', 'mo-08', 'mo-09', 'mo-10'] },
    ],
    // 敵人圖：湘 11/25 交，assets/enemies/event-mo/（1024² 去背 WebP）；圖載不到時退回 emoji
    stages: {
      'mo-01': { scene: 'assets/scene/event-mo/mo-01-bamboo-sedan.webp', art: 'event-mo/mo-01-wedding-puppet', label: 'MO-01', title: '花轎空空', name: '迎親紙傀', emoji: '🎎', power: 30, minutes: 45, drop: 12, weak: ['bride', 'daily'] },
      'mo-02': { scene: 'assets/scene/event-mo/mo-02-inn.webp', art: 'event-mo/mo-02-bounty-swordsman', label: 'MO-02', title: '十萬兩客棧', name: '貪金刀客', emoji: '🗡️', power: 40, minutes: 45, drop: 14, weak: ['mohen', 'friends'] },
      'mo-03': { scene: 'assets/scene/event-mo/mo-03-long-street.webp', art: 'event-mo/mo-03-coin-spirit', label: 'MO-03', title: '長街買買買', name: '百寶錢妖', emoji: '🪙', power: 55, minutes: 60, drop: 16, weak: ['daily', 'recipe'] },
      'mo-04': { scene: 'assets/scene/event-mo/mo-04-misty-river.webp', art: 'event-mo/mo-04-river-ghost', label: 'MO-04', title: '煙雨渡江', name: '鎖江水鬼', emoji: '🌊', power: 70, minutes: 60, drop: 18, weak: ['weather', 'mohen'] },
      'mo-05': { scene: 'assets/scene/event-mo/mo-05-ruined-temple.webp', art: 'event-mo/mo-05-broken-blade', label: 'MO-05', title: '破廟夜談', name: '斷刃使', emoji: '⚔️', power: 95, minutes: 90, drop: 28, boss: true, weak: ['mohen', 'friends'] },
      'mo-06': { scene: 'assets/scene/event-mo/mo-06-peach-village.webp', art: 'event-mo/mo-06-mountain-imp', label: 'MO-06', title: '桃源歇腳', name: '偷糧山魈', emoji: '🐒', power: 100, minutes: 60, drop: 18, weak: ['animals', 'county'] },
      'mo-07': { scene: 'assets/scene/event-mo/mo-07-ghost-market.webp', art: 'event-mo/mo-07-masked-broker', label: 'MO-07', title: '子夜鬼市', name: '千面牙商', emoji: '🎭', power: 115, minutes: 75, drop: 20, weak: ['mohen', 'holiday'] },
      'mo-08': { scene: 'assets/scene/event-mo/mo-08-old-mortuary.webp', art: 'event-mo/mo-08-bone-puppet', label: 'MO-08', title: '白骨有言', name: '索命骨傀', emoji: '💀', power: 130, minutes: 75, drop: 22, weak: ['memorial', 'mohen'] },
      'mo-09': { scene: 'assets/scene/event-mo/mo-09-red-manor.webp', art: 'event-mo/mo-09-wedding-wraith', label: 'MO-09', title: '紅帖山莊', name: '八方喜煞', emoji: '🧧', power: 150, minutes: 90, drop: 24, weak: ['bride', 'friends'] },
      'mo-10': { scene: 'assets/scene/event-mo/mo-10-altar.webp', art: 'event-mo/mo-10-crimson-contract-lord', label: 'MO-10', title: '江湖不嫁', name: '紅契之主', emoji: '📜', power: 175, minutes: 120, drop: 34, boss: true, weak: ['mohen', 'bride', 'daily'] },
    },
    // 限定劇情信物：打完上卷後，重複討伐（打贏）才會掉；每件只拿一次。
    // 保底：連續 pity 場沒掉，下一場一定掉一件還沒有的。
    keepsakes: {
      after: 'up', chance: 0.2, pity: 6, completeScene: 'mo-02', // hint＝還沒拿到時顯示的謎面；scene＝信物劇場背景（湘 11/27 選 B 卷軸＋劇場）
       completeBonus: 50, completeTitle: 'mo-unwed',
      // perk：拿到就生效，只在這個活動的關卡有效。token＝墨玉掉落；power 的 who：origin＝小湘（非異世居民）、event-food＝吃了活動限定料理、編號＝那位居民在隊上
      list: [
        { id: 'red-contract', hint: '一紙沒寫新郎名字的東西。', scene: 'mo-09', perk: { kind: 'token', value: 0.05 }, art: 'assets/events/mo/keepsakes/red-contract.webp', name: '染朱婚書', text: '婚書上沒有新郎的姓名，卻詳細記載著新娘的生辰八字。' },
        { id: 'gold-clasp', hint: '扣上了，就解不開。', scene: 'mo-03', perk: { kind: 'power', who: 'origin', value: 0.03 }, art: 'assets/events/mo/keepsakes/gold-clasp.webp', name: '鎖命金扣', text: '藏於嫁衣內側的金扣。奇怪的是，它只能扣上，不能解開。' },
        { id: 'torn-recipe', hint: '有人病了很久、很久。', scene: 'mo-08', perk: { kind: 'power', who: 'event-food', value: 0.02 }, art: 'assets/events/mo/keepsakes/torn-recipe.webp', name: '殘缺藥方', text: '開方之人似乎患有無藥可醫的重病。最後一味藥，竟寫著「紅妝」。' },
        { id: 'broken-bangle', hint: '似乎屬於另一位新娘……', scene: 'mo-06', perk: { kind: 'power', who: '117', value: 0.05 }, art: 'assets/events/mo/keepsakes/broken-bangle.webp', name: '斷裂玉鐲', text: '曾屬於另一位新娘。內側刻著一行小字：願來世不著紅衣。' },
        { id: 'ink-tassel', hint: '某個人劍柄上的舊物。', scene: 'mo-04', perk: { kind: 'power', who: 'MO-001', value: 0.05 }, art: 'assets/events/mo/keepsakes/ink-tassel.webp', name: '墨色劍穗', text: '聞止水繫於劍柄上的舊物。她似乎已經很久沒有為誰拔劍了。' },
      ],
    },
    // 墨玉閣：reward.type 由 applyShopReward 處理；soon:true 的商品還沒做好，不顯示、不能買
    shop: [
      { id: 'wen', name: '墨衣護衛・聞止水', cost: 500, limit: 1, reward: { type: 'character', no: 'MO-001' } },
      { id: 'mohen-egg', name: '墨痕蛋', cost: 80, limit: 0, reward: { type: 'egg', egg: 'mohen' } }, // 墨痕蛋＝活動卡池
      { id: 'title', name: '限定稱號「執筆入江湖」', cost: 150, limit: 1, reward: { type: 'title', id: 'mo-pen' } },
      { id: 'theme', name: '限定主題「煙雨渡口」', cost: 200, limit: 1, reward: { type: 'theme', id: 'yanyu' } },
      { id: 'recipe', name: '限定料理食譜', cost: 60, limit: 1, reward: { type: 'recipe', id: 'mo-recipe' }, soon: true },
      { id: 'gift', name: '高級好感度禮物', cost: 30, limit: 10, reward: { type: 'gift', id: 'mo-gift' }, soon: true },
      { id: 'energy', name: '能量 ×20', cost: 20, limit: 0, reward: { type: 'energy', amount: 20 } },
    ],
    // 活動結束（商店關閉）後，剩下的墨玉 1:1 換成能量，只換一次
    leftover: { type: 'energy', rate: 1 },
  },
};

// 定稿劇情接進關卡（before／after／ending）
for (const [id, story] of Object.entries(MO_STORY)) if (EVENT_DEFS.mo.stages[id]) EVENT_DEFS.mo.stages[id].story = story;

export const eventDef = (id) => EVENT_DEFS[id] || null;
export const stageKey = (eventId, stageId) => `event:${eventId}:${stageId}`;
export function parseStageKey(key) {
  if (!isStr(key) || !key.startsWith('event:')) return null;
  const [, eventId, stageId] = key.split(':');
  const def = EVENT_DEFS[eventId];
  return def?.stages[stageId] ? { eventId, stageId, def, stage: def.stages[stageId] } : null;
}
export const stageOrder = (def) => def.phases.flatMap((p) => p.stages);
export const phaseOf = (def, stageId) => def.phases.find((p) => p.stages.includes(stageId)) || null;

// ───────── 可信時間 ─────────
// GitHub Pages 每次回應都有 Date 標頭（changelog.json 每次開遊戲都會抓），用它算出手機時間的誤差。
// 沒網路時用手機時間＋上次的誤差；而且記住看過最晚的時間，手機時間往回撥也不會倒退。
export function ensureClock(state) {
  const c = state.clock || {};
  state.clock = { offset: Number.isFinite(c.offset) ? c.offset : 0, seen: Number.isFinite(c.seen) ? c.seen : 0 };
  if (isStr(c.syncedAt)) state.clock.syncedAt = c.syncedAt;
  return state.clock;
}
export function noteServerTime(state, serverMs, deviceMs = Date.now()) {
  if (!Number.isFinite(serverMs) || serverMs <= 0) return false;
  const c = ensureClock(state);
  // 比上次採用的伺服器時間還新＝真的剛從伺服器拿到。就算比 seen 早也要採用：
  // seen 可能是手機時間曾經調快時記下的，不校正的話活動會一直提早開、提早結束。
  const last = isStr(c.syncedAt) ? Date.parse(c.syncedAt) : 0;
  const fresh = serverMs > (Number.isFinite(last) ? last : 0);
  if (!fresh && serverMs < c.seen - 60e3) return false; // 比看過的時間還舊、也不比上次新＝離線時拿到的快取回應，不採用
  c.offset = Math.round(serverMs - deviceMs);
  c.syncedAt = iso(serverMs);
  c.seen = fresh ? serverMs : Math.max(c.seen, serverMs);
  return true;
}
export function eventNow(state, deviceMs = Date.now()) {
  const c = ensureClock(state);
  const now = Math.max(deviceMs + c.offset, c.seen);
  c.seen = now;
  return now;
}

// ───────── 時程 ─────────
// 回傳 { state: 'unscheduled'|'upcoming'|'battle'|'shop'|'archived', startMs, battleEndMs, shopEndMs, phases:[{id,opensMs,open,leftMs}] }
export function schedule(def, nowMs, startOverride) {
  const start = startOverride ?? def.start;
  if (!start) return { state: 'unscheduled', phases: [] };
  const startMs = Date.parse(start);
  const battleEndMs = startMs + def.battleDays * D;
  const shopEndMs = startMs + def.shopDays * D;
  const st = nowMs < startMs ? 'upcoming' : nowMs < battleEndMs ? 'battle' : nowMs < shopEndMs ? 'shop' : 'archived';
  const phases = def.phases.map((p) => {
    const opensMs = startMs + p.opensAfterH * H;
    return { id: p.id, name: p.name, opensMs, open: nowMs >= opensMs && nowMs < battleEndMs, leftMs: Math.max(0, opensMs - nowMs) };
  });
  return { state: st, startMs, battleEndMs, shopEndMs, phases };
}
export function activeEvents(state, nowMs) {
  return Object.values(EVENT_DEFS).map((def) => ({ def, sch: schedule(def, nowMs) })).filter((x) => x.sch.state !== 'unscheduled');
}

// ───────── 存檔 ─────────
const freshProgress = () => ({ stages: {}, story: {}, tokens: 0, earned: 0, spent: 0, shop: {}, keepsakes: {}, keepsakeSeen: {}, keepsakeMiss: 0, runs: 0, wins: 0, titles: [], themes: [], leftoverAt: null, dailyWinDay: null });
function cleanProgress(old) {
  const p = freshProgress();
  if (!old || typeof old !== 'object') return p;
  for (const [id, v] of Object.entries(old.stages || {})) {
    if (!v) continue;
    p.stages[id] = { stars: v.stars | 0, best: v.best | 0, clears: v.clears | 0, tries: v.tries | 0 };
    if (isStr(v.firstAt)) p.stages[id].firstAt = v.firstAt;
  }
  for (const [k, v] of Object.entries(old.story || {})) if (isStr(v)) p.story[k] = v;
  for (const [k, v] of Object.entries(old.shop || {})) if (isInt(v)) p.shop[k] = v;
  for (const [k, v] of Object.entries(old.keepsakes || {})) if (isStr(v)) p.keepsakes[k] = v;
  for (const [k, v] of Object.entries(old.keepsakeSeen || {})) if (isStr(v)) p.keepsakeSeen[k] = v;
  for (const k of ['tokens', 'earned', 'spent', 'keepsakeMiss', 'runs', 'wins']) if (isInt(old[k])) p[k] = old[k];
  if (Array.isArray(old.titles)) p.titles = [...new Set(old.titles.filter(isStr))];
  if (Array.isArray(old.themes)) p.themes = [...new Set(old.themes.filter(isStr))];
  if (isStr(old.leftoverAt)) p.leftoverAt = old.leftoverAt;
  if (isStr(old.completeAt)) p.completeAt = old.completeAt;
  if (isStr(old.dailyWinDay)) p.dailyWinDay = old.dailyWinDay;
  if (isStr(old.wornTitle) && p.titles.includes(old.wornTitle)) p.wornTitle = old.wornTitle;
  return p;
}
// 不認得的活動 id 也保留（未來版本或復刻用），只整理認得的格式
export function ensureEvents(state) {
  // 就地整理：已經拿到的 state.events[id] 參照不會失效
  if (!state.events || typeof state.events !== 'object' || Array.isArray(state.events)) state.events = {};
  for (const [id, v] of Object.entries(state.events)) {
    const clean = cleanProgress(v);
    if (v && typeof v === 'object' && !Array.isArray(v)) { for (const k of Object.keys(v)) delete v[k]; Object.assign(v, clean); } else state.events[id] = clean;
  }
  for (const id of Object.keys(EVENT_DEFS)) state.events[id] ||= freshProgress();
  return state.events;
}
// 不會重建物件（拿到的參照可以一直改）；整理存檔請在讀檔時呼叫 ensureEvents
export function progressOf(state, eventId) {
  if (!state.events || typeof state.events !== 'object') ensureEvents(state);
  return (state.events[eventId] ||= freshProgress());
}

// ───────── 關卡 ─────────
export function phaseDone(state, def, phaseId) {
  const p = def.phases.find((x) => x.id === phaseId); if (!p) return false;
  const prog = progressOf(state, def.id);
  return p.stages.every((s) => prog.stages[s]?.clears);
}
// 回傳 null（可以打）或原因字串
export function stageLock(state, def, stageId, nowMs, startOverride) {
  const sch = schedule(def, nowMs, startOverride);
  if (sch.state === 'unscheduled' || sch.state === 'upcoming') return '活動還沒開始。';
  if (sch.state !== 'battle') return '活動討伐已經結束了。';
  const phase = phaseOf(def, stageId); if (!phase) return '找不到這一關。';
  const ph = sch.phases.find((x) => x.id === phase.id);
  if (!ph.open) return `${phase.name}還沒開放。`;
  if (phase.requires && !phaseDone(state, def, phase.requires)) return `要先打完${def.phases.find((x) => x.id === phase.requires).name}。`;
  const order = stageOrder(def); const i = order.indexOf(stageId);
  if (i > 0 && !progressOf(state, def.id).stages[order[i - 1]]?.clears) return '要先打贏前一關。';
  return null;
}
// 給 battle.js 用的敵人資料（跟 ENEMIES 同樣的欄位）；派出去時整份存成 snapshot，活動關閉後也能回來領
export function eventEnemy(eventId, stageId) {
  const def = EVENT_DEFS[eventId]; const s = def?.stages[stageId]; if (!s) return null;
  return {
    key: stageKey(eventId, stageId), event: eventId, eventStage: stageId, stage: s.label, name: s.name, emoji: s.emoji,
    art: s.art || `event-${eventId}/${stageId}`, power: s.power, minutes: s.minutes, weak: s.weak, boss: Boolean(s.boss),
    intro: s.intro || `「${s.title}」——${s.name}擋住了去路。`, win: s.win || `${s.name}退開了。`, lose: s.lose || `${s.name}太難纏了，先撤退再說。`,
    weakHit: s.weakHit || `${s.name}被看穿了破綻！`, bio: s.bio || '', ...(s.story ? { story: s.story } : {}),
  };
}

// 信物小劇情（docs/event-001/keepsakes.md → tools/event-story.py）
for (const k of EVENT_DEFS.mo.keepsakes.list) k.story = MO_KEEPSAKE_STORY[k.name] || null;
EVENT_DEFS.mo.keepsakes.completeStory = MO_KEEPSAKE_STORY['收齊'] || null;

// ───────── 墨玉 ─────────
// worldOf：(no) => 世界代碼；用參數傳進來，這個檔案不依賴 eggs.js
export function tokenBonus(def, nos, worldOf) {
  const b = def.tokenBonus; if (!b) return 0;
  const sum = nos.reduce((n, no) => n + (b.by?.[no] ?? (worldOf(no) === def.world ? b.world : 0)), 0);
  return Math.min(b.cap ?? Infinity, Math.round(sum * 100) / 100);
}
export function tokenDrop(def, stageId, { win, first = false, nos = [], worldOf = () => null, owned = {} }) {
  const s = def.stages[stageId]; if (!s) return 0;
  const base = win ? s.drop : def.loseDrop || 0;
  return Math.round(base * (1 + tokenBonus(def, nos, worldOf) + keepsakeTokenBonus(def, owned))) + (win && first ? def.firstClear || 0 : 0);
}
// ───────── 信物加成（湘選 D：劇情＋加成＋收齊稱號） ─────────
const ownedPerks = (def, owned) => (def.keepsakes?.list || []).filter((k) => k.perk && owned?.[k.id]);
export function keepsakeTokenBonus(def, owned) { return Math.round(ownedPerks(def, owned).filter((k) => k.perk.kind === 'token').reduce((n, k) => n + k.perk.value, 0) * 100) / 100; }
// 戰力加成：回傳 { power, list:[{id,name,value}] }；eventFood＝隊上用的料理是不是活動限定料理
export function keepsakePower(def, owned, nos, { worldOf = () => null, eventFood = false } = {}) {
  const list = ownedPerks(def, owned).filter((k) => k.perk.kind === 'power').filter((k) => {
    const w = k.perk.who;
    return w === 'origin' ? nos.some((no) => [null, undefined, 'origin'].includes(worldOf(no))) : w === 'event-food' ? eventFood : nos.includes(w);
  }).map((k) => ({ id: k.id, name: k.name, value: k.perk.value }));
  return { power: Math.round(list.reduce((n, k) => n + k.value, 0) * 100) / 100, list };
}
function addTokens(prog, n) { prog.tokens += n; prog.earned += n; }
// 每日首勝（本地日期）：今天還沒領就是 true
export const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const dailyWinReady = (prog, def, now = new Date()) => Boolean(def.dailyWin) && prog?.dailyWinDay !== localDay(now);

// 收下一場活動討伐（battle.js collectBattle 呼叫）。只動 state.events；回傳要顯示的收穫。
export function recordEventRun(state, eventId, stageId, report, { now = new Date(), rand = Math.random, worldOf = () => null, nos = [] } = {}) {
  const def = EVENT_DEFS[eventId]; if (!def?.stages[stageId]) return null;
  const prog = progressOf(state, eventId);
  const st = (prog.stages[stageId] ||= { stars: 0, best: 0, clears: 0, tries: 0 });
  const first = report.win && !st.clears;
  st.tries += 1; prog.runs += 1;
  if (report.win) { st.clears += 1; prog.wins += 1; st.stars = Math.max(st.stars, report.stars | 0); if (!st.firstAt) st.firstAt = now.toISOString(); }
  if ((report.score | 0) > st.best) st.best = report.score | 0;
  let tokens = tokenDrop(def, stageId, { win: report.win, first, nos, worldOf, owned: prog.keepsakes });
  if (report.night?.runs > 1) {
    // 連戰到天亮：每一場的墨玉合計後打折（首勝、信物只算一次，在下面）
    const n = report.night; const extraWins = Math.max(0, n.wins - (report.win ? 1 : 0)); const extraLose = n.runs - 1 - extraWins;
    const one = (win) => tokenDrop(def, stageId, { win, first: false, nos, worldOf, owned: prog.keepsakes });
    tokens = Math.round((tokens + extraWins * one(true) + extraLose * one(false)) * (n.mult ?? 0.5));
  }
  const out = { tokens, first, story: null, keepsake: null, complete: false };
  addTokens(prog, out.tokens);
  if (report.win && dailyWinReady(prog, def, now)) { prog.dailyWinDay = localDay(now); out.daily = def.dailyWin; addTokens(prog, def.dailyWin); }
  // 首次通關解鎖劇情（故事冊之後做，但解鎖資格現在就記）
  if (first) { const k = `${stageId}:clear`; if (!prog.story[k]) { prog.story[k] = now.toISOString(); out.story = k; } }
  // 信物：要先打完指定的卷，打贏才掉
  const ks = def.keepsakes;
  if (ks && report.win && !first && phaseDone(state, def, ks.after)) {
    const missing = ks.list.filter((x) => !prog.keepsakes[x.id]);
    if (missing.length) {
      const hit = prog.keepsakeMiss + 1 >= ks.pity || rand() < ks.chance;
      if (hit) {
        const pick = missing[Math.floor(rand() * missing.length) % missing.length];
        prog.keepsakes[pick.id] = now.toISOString(); prog.keepsakeMiss = 0; out.keepsake = pick;
        if (missing.length === 1) { addTokens(prog, ks.completeBonus || 0); out.tokens += ks.completeBonus || 0; out.complete = true; prog.completeAt = now.toISOString(); if (ks.completeTitle && !prog.titles.includes(ks.completeTitle)) { prog.titles.push(ks.completeTitle); out.title = ks.completeTitle; } }
      } else prog.keepsakeMiss += 1;
    }
  }
  return out;
}

// ───────── 墨玉閣 ─────────
export function shopList(state, def, nowMs) {
  const prog = progressOf(state, def.id);
  const sch = schedule(def, nowMs);
  const open = sch.state === 'battle' || sch.state === 'shop';
  return def.shop.filter((x) => !x.soon).map((x) => {
    const bought = prog.shop[x.id] || 0;
    const soldOut = x.limit > 0 && bought >= x.limit;
    return { ...x, bought, soldOut, short: Math.max(0, x.cost - prog.tokens), ready: open && !soldOut && prog.tokens >= x.cost, open };
  });
}
// apply(state, reward, ctx)：實際發獎勵（app 端傳進來；預設只處理能量和稱號），回傳 false/字串＝發不出去，不扣墨玉
export function buy(state, def, itemId, nowMs, apply = applyShopReward) {
  const item = shopList(state, def, nowMs).find((x) => x.id === itemId);
  if (!item) return '找不到這個商品。';
  if (!item.open) return '墨玉閣現在沒有開。';
  if (item.soldOut) return '已經換完了。';
  if (!item.ready) return `${def.token.name}不夠，還差 ${item.short} 個。`;
  const res = apply(state, item.reward, { def, item, now: new Date(nowMs) });
  if (res === false || typeof res === 'string') return res || '現在換不了。';
  const prog = progressOf(state, def.id);
  prog.tokens -= item.cost; prog.spent += item.cost; prog.shop[item.id] = (prog.shop[item.id] || 0) + 1;
  return { item, result: res };
}
export function applyShopReward(state, reward, { def, now = new Date() } = {}) {
  if (reward.type === 'energy') { state.energy = (state.energy || 0) + reward.amount; return { energy: reward.amount }; }
  if (reward.type === 'title') { const p = progressOf(state, def.id); if (!p.titles.includes(reward.id)) p.titles.push(reward.id); return { title: reward.id }; }
  if (reward.type === 'theme') { const p = progressOf(state, def.id); if (!p.themes.includes(reward.id)) p.themes.push(reward.id); return { theme: reward.id }; }
  const gifts = state.gifts || (state.gifts = { eggs: [] }); gifts.eggs ||= [];
  if (reward.type === 'character') {
    if (state.dex?.[reward.no] || gifts.eggs.some((e) => e.character === reward.no)) return '已經有了。';
    gifts.eggs.push({ egg: 'keepsake', character: reward.no, from: `event:${def.id}`, at: now.toISOString() }); return { egg: 'keepsake', no: reward.no };
  }
  if (reward.type === 'egg') { gifts.eggs.push({ egg: reward.egg, from: `event:${def.id}`, at: now.toISOString() }); return { egg: reward.egg }; }
  return '這個商品還沒準備好。';
}
// 商店關閉後：剩下的墨玉換成能量（只換一次）
export function settleLeftover(state, def, nowMs) {
  const prog = progressOf(state, def.id);
  if (prog.leftoverAt || schedule(def, nowMs).state !== 'archived' || !prog.tokens) return null;
  const amount = Math.floor(prog.tokens * (def.leftover?.rate ?? 1));
  if (def.leftover?.type === 'energy') state.energy = (state.energy || 0) + amount;
  const spent = prog.tokens; prog.tokens = 0; prog.leftoverAt = iso(nowMs);
  return { tokens: spent, energy: amount };
}
// 開遊戲／切回遊戲時呼叫：每個已封存的活動各換一次（leftoverAt 記著，不會重複發）
export function settleLeftovers(state, nowMs) {
  const out = [];
  for (const def of Object.values(EVENT_DEFS)) {
    if (!def.leftover || !state.events?.[def.id]) continue;
    const r = settleLeftover(state, def, nowMs); if (r) out.push({ eventId: def.id, ...r });
  }
  return out;
}

// ───────── 稱號：全遊戲只能戴一個，名字跟著研究者等級顯示 ─────────
export function wornTitle(state) {
  for (const [id, p] of Object.entries(state.events || {})) if (p?.wornTitle) { const name = EVENT_DEFS[id]?.titles?.[p.wornTitle]; if (name) return { eventId: id, id: p.wornTitle, name }; }
  return null;
}
// titleId 為 null＝拿下來；回傳戴上的名字或 null
// 信物櫃「新」標：點開看過就記下（湘 11/27）
export function markKeepsakeSeen(state, eventId, id, now = new Date()) {
  const p = progressOf(state, eventId); p.keepsakeSeen ||= {}; if (!p.keepsakes?.[id] || p.keepsakeSeen[id]) return false;
  p.keepsakeSeen[id] = now.toISOString(); return true;
}
// 保底：還要再贏幾場（非首通）一定拿到下一件；收齊或還沒打完指定卷＝null
export function keepsakePityLeft(def, prog) { const ks = def.keepsakes; if (!ks || ks.list.every((k) => prog.keepsakes?.[k.id])) return null; return Math.max(1, ks.pity - (prog.keepsakeMiss | 0)); }
export function wearTitle(state, eventId, titleId) {
  ensureEvents(state);
  const prog = state.events[eventId]; if (titleId && !prog?.titles.includes(titleId)) return null;
  for (const p of Object.values(state.events)) if (p && typeof p === 'object') delete p.wornTitle;
  if (!titleId) return null;
  prog.wornTitle = titleId; return EVENT_DEFS[eventId]?.titles?.[titleId] || null;
}
// 活動換到的主題（全部活動合起來）
export const ownedThemes = (state) => new Set(Object.values(state.events || {}).flatMap((p) => (Array.isArray(p?.themes) ? p.themes : [])));
