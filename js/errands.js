// 派小湘出門：跑腿、系列加成、遠行帶回縣市蛋、在家幫忙、兩隻一起出門的隱藏故事
// 出發時就決定好帶回什麼（存進存檔），重新整理不會重抽。
import { CHARACTERS, COUNTY_CHARACTER } from './eggs.js';

export const ERRAND_SLOTS = 2; // 同時最多兩趟
export const STORY_BONUS = 3; // 第一次發現故事 +3 化石
export const CARD_BONUS = 3; // 第一次收到某縣市的家鄉明信片 +3 化石
const HOUR = 3600e3;

export const PLACES = {
  conv: { name: '便利商店', emoji: '🏪', hours: 1, affinity: ['daily'], energy: [10, 16],
    lines: ['買了一瓶牛奶回來，還有找零。', '店員說她很可愛，送了一張集點貼紙。', '在門口被自動門嚇了一跳，假裝沒事走進去。'] },
  park: { name: '公園', emoji: '🌳', hours: 2, affinity: ['animals', 'friends'], energy: [18, 28],
    lines: ['撿了好多葉子回來，還跟松鼠打了招呼。', '盪鞦韆盪太高，回來有點暈。', '在草地上睡了一個午覺，頭上沾了一根草。'] },
  market: { name: '夜市', emoji: '🏮', hours: 3, affinity: ['date', 'holiday'], energy: [25, 35], snack: true,
    lines: ['夜市好香！帶了一個布丁回來給你。', '撈金魚失敗了，但老闆送她一隻小鴨。', '吃了一整條大腸包小腸，現在很撐。'] },
  beach: { name: '海邊', emoji: '🌊', hours: 4, affinity: ['weather'], energy: [12, 18], fossils: [1, 2],
    lines: ['在沙灘挖到一塊奇怪的石頭，好像是化石！', '海浪把鞋子捲走了一下下，又自己漂回來。', '撿了一整口袋的貝殼，倒出來都是沙。'] },
  mountain: { name: '山上', emoji: '⛰️', hours: 6, affinity: ['animals', 'weather'], energy: [15, 22], fossils: [2, 3], egg: 0.15,
    lines: ['爬到山頂看到好多雲，還撿到一塊會發亮的石頭。', '山上好冷，但她說風景值得。', '在步道旁邊發現一顆圓圓的東西，抱回來了。'] },
  faraway: { name: '遠行', emoji: '🚃', hours: 8, affinity: ['county'], energy: [18, 26], fossils: [2, 2], countyEgg: 0.35,
    lines: ['坐了好久的車，去了好遠好遠的地方。', '在陌生的城市迷路了，還好遇到好心人。', '車窗外一直在下雨，她數了一路的雨滴。'] },
};

export const HOME_TASKS = {
  guard: { name: '顧蛋', emoji: '🥚', hours: 4, desc: '守在培養架旁邊，回來時蛋 +20 溫度' },
  note: { name: '寫紙條', emoji: '✏️', hours: 3, desc: '寫一張紙條給你，寫好會放進紙條收藏' },
  dino: { name: '陪小恐龍', emoji: '🦖', hours: 3, desc: '陪小恐龍玩，回來 +15 能量，下一個小恐龍委託獎勵加倍' },
};

const NOTES = [
  '今天幫你偷偷數了蛋的心跳，一百零三下。',
  '我把布丁藏在冰箱最裡面，不准偷吃。（可以吃一口）',
  '小恐龍說牠想要一頂帽子，你覺得紅色還是黃色？',
  '今天天氣很好，我把一點陽光收在口袋裡，晚點分你。',
  '你今天有喝水嗎？沒有的話現在去！',
  '我練習了一個新表情，下次見面給你看。',
  '我在圖鑑裡找到一根頭髮，應該是你的。',
  '累了就先休息，蛋會等你，我也會。',
  '今天的願望我幫你多許了一個，是秘密。',
  '我覺得你拍照越來越好看了，真的。',
  '剛剛夢到我們一起去吃火鍋，醒來好餓。',
  '謝謝你把我孵出來，我很喜歡這裡。',
];

// 兩隻一起出門的隱藏故事（由上往下找第一個符合的）
export const STORIES = [
  { id: 'origin', title: '原味帶路', test: (a, b) => a.no === '001' || b.no === '001',
    text: (p) => `原味小湘自告奮勇當導遊，結果把大家帶到${p.name}的反方向。繞了一大圈，大家反而玩得更開心。` },
  { id: 'date', title: '偷偷約會', test: (a, b) => a.series === 'date' && b.series === 'date',
    text: (p) => `兩個人在${p.name}拍了一張好像約會的合照，回來以後誰都不肯先拿出來給你看。` },
  { id: 'county', title: '雙城記', test: (a, b) => a.series === 'county' && b.series === 'county',
    text: () => '兩隻縣市小湘一路互相炫耀自己家鄉的名產，吵到最後交換了伴手禮。' },
  { id: 'animals', title: '動物派對', test: (a, b) => a.series === 'animals' && b.series === 'animals',
    text: (p) => `她們在${p.name}開了一場只有動物聽得懂的派對，回來的時候身上都是毛。` },
  { id: 'friends', title: '摯友聚會', test: (a, b) => a.series === 'friends' && b.series === 'friends',
    text: () => '兩位摯友小湘聊了一整路，聊到忘記自己是出去做什麼的。' },
  { id: 'weather', title: '追著天氣跑', test: (a, b) => a.series === 'weather' || b.series === 'weather',
    text: (p) => `出門前還是晴天，到了${p.name}突然下雨，又突然出彩虹。她們說是自己叫來的。` },
  { id: 'holiday', title: '每天都是節日', test: (a, b) => a.series === 'holiday' || b.series === 'holiday',
    text: () => '節日小湘堅持今天也是某個節日，硬是帶著另一隻一路慶祝回家。' },
  { id: 'daily', title: '平凡的一天', test: (a, b) => a.series === 'daily' && b.series === 'daily',
    text: () => '沒有發生什麼特別的事，只是一起走了一段路。她們說這樣最好。' },
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
    countyWeek: str(old.countyWeek) ? old.countyWeek : '',
    total: Number.isSafeInteger(old.total) ? old.total : 0,
    departed: Number.isSafeInteger(old.departed) ? old.departed : 0,
  };
  return state.errands;
}

export const busyNos = (state) => new Set((state.errands?.active || []).flatMap((e) => e.nos));
// 出門在外（不在首頁）的小湘；在家幫忙的不算
export const awayNos = (state, now = Date.now()) => new Set((state.errands?.active || []).filter((e) => e.place && Date.parse(e.until) > now).flatMap((e) => e.nos));
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
    loot.line = pick(spot.lines, rand);
    if (spot.countyEgg) {
      const week = weekOf(now);
      const pending = new Set(state.travel?.eggs || []);
      const unmet = Object.entries(COUNTY_CHARACTER).filter(([county, no]) => !state.dex?.[no] && !pending.has(county)).map(([county]) => county);
      if (er.countyWeek !== week && unmet.length && rand() < spot.countyEgg * (boost ? 1.5 : 1)) { loot.county = pick(unmet, rand); er.countyWeek = week; }
      const homes = nos.map(homeCounty).filter(Boolean);
      if (homes.length) loot.cards = homes;
    }
    const story = storyFor(nos);
    if (story) loot.story = story.id;
  } else if (task === 'guard') loot.warmth = 20;
  else if (task === 'note') loot.note = pick(NOTES, rand);
  else if (task === 'dino') { loot.energy = 15; loot.dino = true; }

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
  const cards = [];
  for (const county of loot.cards || []) {
    const first = !er.cards[county];
    er.cards[county] = er.cards[county] || now.toISOString();
    if (first) { state.fossils = (state.fossils || 0) + CARD_BONUS; gains.push(`${county}的家鄉明信片（第一次 +${CARD_BONUS} 化石）`); }
    else gains.push(`${county}的家鄉明信片`);
    cards.push(county);
  }
  let story = null;
  if (loot.story) {
    const s = STORIES.find((x) => x.id === loot.story);
    const first = !er.stories[loot.story];
    if (first) { er.stories[loot.story] = now.toISOString(); state.fossils = (state.fossils || 0) + STORY_BONUS; }
    story = { id: s.id, title: s.title, text: s.text(PLACES[errand.place]), first };
    if (first) gains.push(`發現新故事（+${STORY_BONUS} 化石）`);
  }
  er.total += 1;
  const entry = { id: errand.id, place: errand.place || null, task: errand.task || null, nos: errand.nos, at: now.toISOString(), line: loot.line || '', gains, story: story ? { id: story.id, title: story.title, text: story.text } : null, cards };
  if (errand.place) er.album.unshift(entry);
  er.album = er.album.slice(0, 40);
  return { ...entry, names, boost: Boolean(loot.boost), storyFirst: story?.first || false };
}

export const fmtLeft = (errand, now = Date.now()) => {
  const ms = Math.max(0, Date.parse(errand.until) - now);
  const h = Math.floor(ms / HOUR); const m = Math.ceil((ms % HOUR) / 60e3);
  return h ? `${h} 小時 ${m} 分` : `${Math.max(1, m)} 分鐘`;
};
