// 派小湘出門：跑腿、系列加成、遠行帶回縣市蛋、在家幫忙、兩隻一起出門的隱藏故事
// 出發時就決定好帶回什麼（存進存檔），重新整理不會重抽。
import { CHARACTERS, COUNTY_CHARACTER } from './eggs.js';
import { PLACE_REPORTS, SERIES_REPORTS, CHARACTER_REPORTS, HOME_REPORTS, HOME_SERIES_REPORTS, NOTE_TEXTS, PAIR_STORY_VARIANTS } from './errand-copy.js';

export const ERRAND_SLOTS = 2; // 同時最多兩趟
export const STORY_BONUS = 3; // 第一次發現故事 +3 化石
export const CARD_BONUS = 3; // 第一次收到某縣市的家鄉明信片 +3 化石
export const CARD_RECYCLE = 1; // 丟掉一張重複的明信片 +1 化石
const HOUR = 3600e3;

export const PLACES = {
  conv: { name: '便利商店', emoji: '🏪', hours: 1, affinity: ['daily'], energy: [10, 16],
    lines: PLACE_REPORTS.conv },
  park: { name: '公園', emoji: '🌳', hours: 2, affinity: ['animals', 'friends'], energy: [18, 28],
    lines: PLACE_REPORTS.park },
  market: { name: '夜市', emoji: '🏮', hours: 3, affinity: ['date', 'holiday'], energy: [25, 35], snack: true,
    lines: PLACE_REPORTS.market },
  beach: { name: '海邊', emoji: '🌊', hours: 4, affinity: ['weather'], energy: [12, 18], fossils: [1, 2],
    lines: PLACE_REPORTS.beach },
  mountain: { name: '山上', emoji: '⛰️', hours: 6, affinity: ['animals', 'weather'], energy: [15, 22], fossils: [2, 3], egg: 0.15,
    lines: PLACE_REPORTS.mountain },
  faraway: { name: '遠行', emoji: '🚃', hours: 8, affinity: ['county'], energy: [18, 26], fossils: [2, 2], countyEgg: 0.35,
    lines: PLACE_REPORTS.faraway },
};

export const HOME_TASKS = {
  guard: { name: '顧蛋', emoji: '🥚', hours: 4, desc: '守在培養架旁邊，回來時蛋 +20 溫度' },
  note: { name: '寫紙條', emoji: '✏️', hours: 3, desc: '寫一張紙條給你，寫好會放進紙條收藏' },
  dino: { name: '陪小恐龍', emoji: '🦖', hours: 3, desc: '陪小恐龍玩，回來 +15 能量，下一個小恐龍委託獎勵加倍' },
};


// 兩隻一起出門的隱藏故事（由上往下找第一個符合的）
export const STORIES = [
  { id: 'origin', title: '原味帶路', test: (a, b) => a.no === '001' || b.no === '001',
    text: (p) => `原味小湘拍胸口說認得路，走了一段才把地圖默默轉過來。另一位也沒拆穿，沿路替新發現的小角落取名字。終於到${p.name}時，兩個人已經各自記住一條下次想再走的路。` },
  { id: 'date', title: '偷偷約會', test: (a, b) => a.series === 'date' && b.series === 'date',
    text: (p) => `兩個人在${p.name}互相替對方拍照，挑了半天，每張都想留下。回程才發現沒有合照，只好把頭湊到同一個鏡頭前。倒數結束時還在笑，照片有點糊，卻被兩人一起選成了今天最喜歡的那張。` },
  { id: 'county', title: '雙城記', test: (a, b) => a.series === 'county' && b.series === 'county',
    text: () => '兩位縣市小湘各自畫了家鄉的必吃清單，一路都想證明自己的那份比較長。交換著看完，誰也沒宣布獲勝，反而開始約下次一起去。回來的行李多了兩份伴手禮，行事曆也比出門前更滿了。' },
  { id: 'animals', title: '動物派對', test: (a, b) => a.series === 'animals' && b.series === 'animals',
    text: (p) => `到了${p.name}，兩位小湘開始交換各自的打招呼方式。有人學得很認真，有人一開口就先笑場。回來時多了一套只有她們懂的暗號，試著教給小恐龍，三個人卻誰也沒發出一樣的聲音。` },
  { id: 'friends', title: '摯友聚會', test: (a, b) => a.series === 'friends' && b.series === 'friends',
    text: () => '兩位摯友小湘出門前約好今天要好好辦正事，路上卻從早餐聊到以前的糗事。走錯轉角也沒急著回頭，先把剛剛那段笑完。回家才想起還有一件事沒講完，於是又在門口站了一會兒。' },
  { id: 'weather', title: '追著天氣跑', test: (a, b) => a.series === 'weather' || b.series === 'weather',
    text: (p) => `往${p.name}的路上，一位忙著看雲，一位忙著提醒看路。兩人輪流猜天空像什麼，連小小一塊雲都討論得很認真。回程交換工作，結果誰也沒記得多拍照片，只記得對方笑了好多次。` },
  { id: 'holiday', title: '每天都是節日', test: (a, b) => a.series === 'holiday' || b.series === 'holiday',
    text: () => '節日小湘認真宣布今天是「一起出門紀念日」，另一位想了想，也很配合地點頭。沒有準備好的禮物，她們就替彼此挑一件路上的小發現。回來才說，明年的今天要再一起挑一次。' },
  { id: 'daily', title: '平凡的一天', test: (a, b) => a.series === 'daily' && b.series === 'daily',
    text: () => '兩個人出門時說沒有特別計畫，回來卻各記得一大堆小事：誰先笑了、哪陣風最舒服、點心怎麼分。翻開筆記才發現，所謂平凡的一天，已經把整頁都寫滿了。' },
];

const str = (v) => typeof v === 'string';
const pick = (list, rand) => list[Math.floor(rand() * list.length) % list.length];
const between = ([lo, hi], rand) => lo + Math.floor(rand() * (hi - lo + 1));
export const homeCounty = (no) => CHARACTERS[no]?.county || null;
export const hasAffinity = (placeId, no) => Boolean(PLACES[placeId]?.affinity.includes(CHARACTERS[no]?.series));
export const storyFor = (nos) => {
  if (nos.length !== 2) return null;
  const [a, b] = nos.map((no) => CHARACTERS[no]);
  return a && b ? STORIES.find((s) => s.test(a, b)) || null : null;
};


// 抽回報：專屬 > 系列 > 地點，但避開同人同地點最近 5 句。
// 紀錄寫進既有 errands 子狀態，不影響獎勵；出發時選好並持久化，回來不重抽。
function trimHistoryKeys(memory, cap = 100) {
  while (Object.keys(memory).length > cap) delete memory[Object.keys(memory)[0]];
}
function safeRecent(memory, key) {
  return Array.isArray(memory[key]) ? memory[key] : [];
}
function pickFresh(memory, key, choices, rand, keep = 5) {
  const unique = [...new Set(choices)];
  const recent = safeRecent(memory, key);
  const fresh = unique.filter((x) => !recent.includes(x));
  const chosen = pick(fresh.length ? fresh : unique, rand);
  memory[key] = [...recent.filter((v) => v !== chosen).slice(1 - keep), chosen];
  trimHistoryKeys(memory);
  return chosen;
}
function chooseLine(er, key, base, series, personal, rand) {
  const recent = safeRecent(er.recentLines, key);
  const groups = [
    { list: personal.filter((x) => !recent.includes(x)), weight: 5 },
    { list: series.filter((x) => !recent.includes(x)), weight: 3 },
    { list: base.filter((x) => !recent.includes(x)), weight: 2 },
  ].filter((g) => g.list.length);
  if (!groups.length) return pickFresh(er.recentLines, key, [...personal, ...series, ...base], rand);
  const total = groups.reduce((s, g) => s + g.weight, 0);
  let n = rand() * total;
  const group = groups.find((g) => (n -= g.weight) < 0) || groups[groups.length - 1];
  const chosen = pick(group.list, rand);
  er.recentLines[key] = [...recent.filter((v) => v !== chosen).slice(-4), chosen];
  trimHistoryKeys(er.recentLines);
  return chosen;
}
function reportFor(er, place, nos, rand) {
  const participants = nos.map((no) => CHARACTERS[no]).filter(Boolean);
  const series = [...new Set(participants.map((c) => c.series))].flatMap((s) => SERIES_REPORTS[s]?.[place] || []);
  // 單人出門才使用個人主角台詞，避免兩位一起出門時主詞不明。
  const personal = nos.length === 1 ? (CHARACTER_REPORTS[nos[0]]?.[place] || []) : [];
  const key = `place:${place}:${[...nos].sort().join('-')}`;
  return chooseLine(er, key, PLACE_REPORTS[place] || [], series, personal, rand);
}
function homeReportFor(er, task, no, rand) {
  const series = HOME_SERIES_REPORTS[CHARACTERS[no]?.series]?.[task] || [];
  return chooseLine(er, `home:${task}:${no}`, HOME_REPORTS[task] || [], series, [], rand);
}
function storyVariationFor(er, storyId, nos, rand) {
  const n = 1 + (PAIR_STORY_VARIANTS[storyId]?.length || 0);
  const key = `story:${storyId}:${[...nos].sort().join('-')}`;
  // 第一次隨機、之後避免最近兩次用同篇。種類 ID 不變，因此首次收藏獎勵只給一次。
  const recent = safeRecent(er.recentStories, key);
  const options = Array.from({ length: n }, (_, i) => i).filter((i) => !recent.includes(i));
  const selected = pick(options.length ? options : Array.from({ length: n }, (_, i) => i), rand);
  er.recentStories[key] = [...recent.filter((i) => i !== selected).slice(-2), selected];
  trimHistoryKeys(er.recentStories);
  return selected;
}

function weekOf(date) {
  const d = new Date(date); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export function ensureErrands(state) {
  const old = state.errands || {};
  const active = Array.isArray(old.active) ? old.active.filter((e) => e && str(e.id) && (PLACES[e.place] || HOME_TASKS[e.task]) && Array.isArray(e.nos) && e.nos.every((no) => CHARACTERS[no]) && str(e.until) && e.loot) : [];
  state.errands = {
    active: active.slice(0, ERRAND_SLOTS),
    album: Array.isArray(old.album) ? old.album.filter((a) => a && str(a.id)).slice(0, 40) : [],
    stories: old.stories && typeof old.stories === 'object' ? old.stories : {},
    cards: old.cards && typeof old.cards === 'object' ? old.cards : {},
    cardDupes: Object.fromEntries(Object.entries(old.cardDupes && typeof old.cardDupes === 'object' ? old.cardDupes : {}).filter(([, n]) => Number.isSafeInteger(n) && n > 0)), // 重複的家鄉明信片（湘 11/20：可以留下或丟掉）
    countyWeek: str(old.countyWeek) ? old.countyWeek : '',
    total: Number.isSafeInteger(old.total) ? old.total : 0,
    departed: Number.isSafeInteger(old.departed) ? old.departed : 0,
    recentLines: old.recentLines && typeof old.recentLines === 'object' && !Array.isArray(old.recentLines) ? old.recentLines : {},
    recentStories: old.recentStories && typeof old.recentStories === 'object' && !Array.isArray(old.recentStories) ? old.recentStories : {},
  };
  return state.errands;
}

// 研究室調配中的兩位也算忙（不能出門、討伐）
export const busyNos = (state) => new Set([...(state.errands?.active || []).flatMap((e) => e.nos), ...(state.lab?.members || [])]);
// 出門在外（不在首頁）的小湘；在家幫忙的不算
export const awayNos = (state, now = Date.now()) => new Set([...(state.errands?.active || []).filter((e) => e.place && Date.parse(e.until) > now).flatMap((e) => e.nos), ...(state.lab?.members || [])]);
export const isBack = (errand, now = Date.now()) => Date.parse(errand.until) <= now;
export const returned = (state, now = Date.now()) => (state.errands?.active || []).filter((e) => isBack(e, now));

// 出發：回傳錯誤訊息字串，或 errand 物件
export function depart(state, { place, task, nos }, now = new Date(), rand = Math.random) {
  const er = ensureErrands(state);
  const spot = PLACES[place]; const job = HOME_TASKS[task];
  if (!spot && !job) return '要去哪裡呢？';
  nos = [...new Set(nos || [])];
  if (!nos.length) return '先選一位小湘。';
  if (nos.length > (job ? 1 : 2)) return job ? '在家幫忙一次一位就好。' : '一次最多兩位一起出門。';
  if (nos.some((no) => !state.dex?.[no])) return '還沒遇見的小湘不能派出去。';
  const busy = busyNos(state);
  if (nos.some((no) => busy.has(no))) return '她已經在忙了。';
  if (er.active.length >= ERRAND_SLOTS) return `同時最多 ${ERRAND_SLOTS} 趟，等她們回來吧。`;

  const hours = (spot || job).hours;
  const loot = {};
  if (spot) {
    const boost = nos.some((no) => hasAffinity(place, no));
    const pair = nos.length === 2 ? 1.2 : 1;
    const times = (boost ? 1.5 : 1) * pair;
    loot.energy = Math.round(between(spot.energy, rand) * times);
    if (spot.fossils) loot.fossils = Math.round(between(spot.fossils, rand) * (boost ? 1.5 : 1));
    if (spot.snack) loot.snack = 1;
    if (spot.egg && rand() < spot.egg * (boost ? 1.5 : 1)) loot.egg = 'wish';
    if (boost) loot.boost = true;
    loot.line = reportFor(er, place, nos, rand);
    if (spot.countyEgg) {
      const week = weekOf(now);
      const pending = new Set(state.travel?.eggs || []);
      const unmet = Object.entries(COUNTY_CHARACTER).filter(([county, no]) => !state.dex?.[no] && !pending.has(county)).map(([county]) => county);
      if (er.countyWeek !== week && unmet.length && rand() < spot.countyEgg * (boost ? 1.5 : 1)) { loot.county = pick(unmet, rand); er.countyWeek = week; }
      const homes = nos.map(homeCounty).filter(Boolean);
      if (homes.length) loot.cards = homes;
    }
    const story = storyFor(nos);
    if (story) { loot.story = story.id; loot.storyVariant = storyVariationFor(er, story.id, nos, rand); }
  } else if (task === 'guard') { loot.warmth = 20; loot.line = homeReportFor(er, task, nos[0], rand); }
  else if (task === 'note') { loot.note = pickFresh(er.recentLines, `paper:${nos[0]}`, NOTE_TEXTS, rand, 6); loot.line = homeReportFor(er, task, nos[0], rand); }
  else if (task === 'dino') { loot.energy = 15; loot.dino = true; loot.line = homeReportFor(er, task, nos[0], rand); }

  const errand = { id: `${now.getTime().toString(36)}-${nos.join('')}`, ...(spot ? { place } : { task }), nos, start: now.toISOString(), until: new Date(now.getTime() + hours * HOUR).toISOString(), loot };
  er.active.push(errand);
  er.departed += 1;
  return errand;
}

// 收下：把獎勵放進存檔，回傳結果摘要（給畫面用）
export function collect(state, id, { eggs, now = new Date() } = {}) {
  const er = ensureErrands(state);
  const i = er.active.findIndex((e) => e.id === id);
  if (i < 0) return null;
  const errand = er.active[i];
  if (!isBack(errand, now.getTime())) return null;
  er.active.splice(i, 1);
  const { loot } = errand; const gains = []; const names = errand.nos.map((no) => CHARACTERS[no].name).join('和');
  if (loot.energy) { state.energy += loot.energy; gains.push(`+${loot.energy} 能量`); }
  if (loot.fossils) { state.fossils = (state.fossils || 0) + loot.fossils; gains.push(`+${loot.fossils} 化石`); }
  if (loot.snack && state.bonus?.snacks?.count > 0) { state.bonus.snacks.count -= 1; gains.push('布丁 +1（今天可以多餵一次）'); }
  else if (loot.snack) gains.push('一個布丁（她自己先吃掉了）');
  if (loot.egg === 'wish') { state.wishEgg.stock += 1; gains.push('一顆願望蛋'); }
  if (loot.county) { state.travel.eggs.push(loot.county); gains.push(`一顆${loot.county}的縣市蛋`); }
  if (loot.warmth) {
    const need = eggs?.[state.egg?.id]?.warmthNeeded || 0;
    const add = state.eggOffer ? 0 : Math.max(0, Math.min(loot.warmth, need - state.egg.warmth));
    if (add) { state.egg.warmth += add; gains.push(`蛋 +${add} 溫度`); }
    else { state.energy += loot.warmth; gains.push(`+${loot.warmth} 能量（蛋已經暖好了）`); }
  }
  if (loot.note) {
    state.letters.mail.push({ id: `siang-${errand.id}`, title: `${names}的紙條`, body: loot.note, at: now.toISOString() });
    gains.push('一張紙條');
  }
  if (loot.dino) { state.dino.double = true; gains.push('下一個小恐龍委託獎勵加倍'); }
  const cards = []; const dupes = [];
  for (const county of loot.cards || []) {
    const first = !er.cards[county];
    er.cards[county] = er.cards[county] || now.toISOString();
    if (first) { state.fossils = (state.fossils || 0) + CARD_BONUS; gains.push(`${county}的家鄉明信片（第一次 +${CARD_BONUS} 化石）`); }
    else { er.cardDupes[county] = (er.cardDupes[county] || 0) + 1; dupes.push(county); gains.push(`${county}的家鄉明信片（重複，先放進明信片盒）`); }
    cards.push(county);
  }
  let story = null;
  if (loot.story) {
    const s = STORIES.find((x) => x.id === loot.story);
    const first = !er.stories[loot.story];
    if (first) { er.stories[loot.story] = now.toISOString(); state.fossils = (state.fossils || 0) + STORY_BONUS; }
    const variant = Number.isInteger(loot.storyVariant) ? loot.storyVariant : 0; // 舊存檔沿用原稿
    const alt = variant > 0 ? PAIR_STORY_VARIANTS[s.id]?.[variant - 1] : null;
    const storyText = alt ? alt.replaceAll('{place}', PLACES[errand.place].name) : s.text(PLACES[errand.place]);
    story = { id: s.id, title: s.title, text: storyText, first };
    if (first) gains.push(`發現新故事（+${STORY_BONUS} 化石）`);
  }
  er.total += 1;
  const entry = { id: errand.id, place: errand.place || null, task: errand.task || null, nos: errand.nos, at: now.toISOString(), line: loot.line || '', gains, story: story ? { id: story.id, title: story.title, text: story.text } : null, cards };
  if (errand.place) er.album.unshift(entry);
  er.album = er.album.slice(0, 40);
  return { ...entry, names, boost: Boolean(loot.boost), storyFirst: story?.first || false, dupes };
}

// 丟掉重複的明信片：一張 +1 化石；留下就什麼都不用做（會一直放在明信片盒）
export function tossCard(state, county, count = 1) {
  const er = state.errands; const have = er?.cardDupes?.[county] || 0;
  const n = Math.min(have, Math.max(1, Math.floor(count)));
  if (!n) return 0;
  er.cardDupes[county] = have - n; if (!er.cardDupes[county]) delete er.cardDupes[county];
  state.fossils = (state.fossils || 0) + n * CARD_RECYCLE;
  return n;
}

export const fmtLeft = (errand, now = Date.now()) => {
  const ms = Math.max(0, Date.parse(errand.until) - now);
  const h = Math.floor(ms / HOUR); const m = Math.ceil((ms % HOUR) / 60e3);
  return h ? `${h} 小時 ${m} 分` : `${Math.max(1, m)} 分鐘`;
};
