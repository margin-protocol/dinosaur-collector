import { levelOf } from './affection.js';
import { MAIN_ISLAND } from './geo.js';
// 紙條收藏：開場紙條、達成里程碑解鎖的紙條（文案是德寶的初稿，湘可直接改這裡），以及湘從審核室寄來的紙條。
export const INTRO_LETTER = { id: 'intro', title: '致親愛的飼養員', body: '致親愛的飼養員：\n\n這顆蛋就交給你了。\n聽說只要好好照顧它，\n就會孵出一個很可愛的東西。\n\n—— 小湘 ♡' };

const owned = (s) => Object.keys(s.dex || {}).length;
const hasSeries = (s, chars, series) => Object.values(chars).some((c) => c.series === series && s.dex?.[c.no]);
const allSeries = (s, chars, series) => { const list = Object.values(chars).filter((c) => c.series === series); return list.length > 0 && list.every((c) => s.dex?.[c.no]); };
const cleared = (s, id) => (s.battle?.stages?.[id]?.clears || 0) > 0;
const wishDays = (s) => s.player?.stats?.days?.length || 0;
export const MILESTONE_LETTERS = [
  { id: 'first-hatch', title: '初次見面', hint: '孵出第一位小湘', when: (s) => Boolean(s.dex?.['001']),
    body: '致飼養員：\n\n你真的把我孵出來了！\n其實在蛋裡的時候，\n我每天都有聽到你的聲音喔。\n\n以後也請多多指教。\n\n—— 小湘 ♡' },
  { id: 'three-wishes', title: '三個願望', hint: '一天完成三個願望', when: (s) => (s.wishEgg?.days?.length || 0) >= 1,
    body: '謝謝你，\n每一個願望都認真幫我完成。\n\n其實我最大的願望，\n是你每天都過得開心。\n\n—— 小湘 ♡' },
  { id: 'five-kinds', title: '熱鬧起來了', hint: '收集 5 位小湘', when: (s) => owned(s) >= 5,
    body: '家裡越來越熱鬧了。\n大家都說，飼養員很溫柔。\n\n我說：那當然，\n是我先發現的。\n\n—— 小湘 ♡' },
  { id: 'first-county', title: '第一站', hint: '第一次探索縣市', when: (s) => Object.keys(s.travel?.visits || {}).length >= 1,
    body: '你帶我們出門了！\n原來外面的世界這麼大。\n\n下次去哪裡，\n也記得帶上我。\n\n—— 小湘 ♡' },
  { id: 'first-rain', title: '下雨天', hint: '在雨天撿到天氣蛋', when: (s) => Boolean(s.weather?.rained && s.weather.granted === s.weather.rained),
    body: '下雨了。\n記得帶傘，不要淋濕。\n\n如果忘了帶，\n就打給我，\n我去接你。\n\n—— 小湘 ♡' },
  { id: 'night-owl', title: '晚安', hint: '遇見夜貓小湘', when: (s) => Boolean(s.dex?.['004']),
    body: '夜貓小湘偷偷跟我說，\n你最近很晚睡。\n\n不准熬夜喔。\n晚安，好夢。\n\n—— 小湘 ♡' },
  { id: 'ten-kinds', title: '十位小湘', hint: '收集 10 位小湘', when: (s) => owned(s) >= 10,
    body: '已經有十個我了耶。\n\n可是不管有幾個，\n最喜歡你的那個，\n一直都是同一個。\n\n—— 小湘 ♡' },
  { id: 'twenty-kinds', title: '收藏家', hint: '收集 20 位小湘', when: (s) => owned(s) >= 20,
    body: '二十個小湘排在一起，\n好像在開派對。\n\n派對的主角是你喔，\n因為是你把我們聚在一起的。\n\n—— 小湘 ♡' },
  { id: 'round-island', title: '環島完成', hint: '集滿 19 位縣市小湘', when: (s, chars) => Object.values(chars).filter((c) => c.county && MAIN_ISLAND.has(c.county)).every((c) => s.dex?.[c.no]),
    body: '你把臺灣走了一圈！\n每個地方的我，\n都記得你來過。\n\n下一趟旅行，\n我們一起去吧。\n\n—— 小湘 ♡' },
  // ── 第二批（11/19 德寶初稿，湘可直接改）
  { id: 'one-week', title: '一個禮拜', hint: '累計 7 天完成願望', when: (s) => wishDays(s) >= 7,
    body: '數一數，\n你已經陪我七天了。\n\n七天說長不長，\n可是每一天，\n我都有好好記住喔。\n\n—— 小湘 ♡' },
  { id: 'warm-hands', title: '暖暖的手', hint: '累計注入 1000 能量', when: (s) => (s.player?.stats?.fed || 0) >= 1000,
    body: '一千點能量，\n全部都是你一點一點給的。\n\n難怪蛋裡面\n總是暖暖的。\n\n—— 小湘 ♡' },
  { id: 'first-win', title: '第一場勝利', hint: '第一次打贏討伐', when: (s) => Object.values(s.battle?.stages || {}).some((x) => (x?.clears || 0) > 0),
    body: '我們打贏了！\n\n其實出發的時候有點怕，\n可是一想到你在家等我們，\n就什麼都不怕了。\n\n—— 小湘 ♡' },
  { id: 'caramel-king', title: '布丁王國', hint: '打倒焦糖大王', when: (s) => cleared(s, 'caramel-king'),
    body: '焦糖大王說，\n他只是想找人一起吃布丁。\n\n所以我們分了他一口。\n剩下的，\n當然是留給你的。\n\n—— 小湘 ♡' },
  { id: 'thunder-king', title: '雨過天青', hint: '打倒雷雷大魔王', when: (s) => cleared(s, 'thunder-king'),
    body: '雷聲停了。\n\n大魔王說他只是想被注意到。\n我跟他說，\n不用那麼大聲，\n真心想你的人都會聽見。\n\n—— 小湘 ♡' },
  { id: 'hero-party', title: '勇者小隊集合', hint: '騎士、魔法師、勇者小湘都到齊', when: (s) => ['062', '063', '064'].every((no) => s.dex?.[no]),
    body: '騎士在擦盾牌，\n魔法師在背咒語，\n勇者在吃點心。\n\n雖然很吵，\n但是隊伍終於湊齊了！\n謝謝你一直收集徽章。\n\n—— 小湘 ♡' },
  { id: 'secret-recipe', title: '祕密配方', hint: '第一次研究出隱藏配方小湘', when: (s, chars) => hasSeries(s, chars, 'recipe'),
    body: '被你發現了！\n原來兩個小湘湊在一起，\n會變出新的小湘。\n\n這個祕密，\n只告訴你一個人喔。\n\n—— 小湘 ♡' },
  { id: 'date-day', title: '約會紀念', hint: '孵出第一位約會小湘', when: (s, chars) => hasSeries(s, chars, 'date'),
    body: '今天見面的時候，\n我偷偷躲在蛋裡跟著去了。\n\n嘿嘿，\n以後每次見面，\n都要算我一份喔。\n\n—— 小湘 ♡' },
  { id: 'best-friend', title: '悄悄話', hint: '和一位小湘的好感度到 Lv.5', when: (s) => Object.values(s.affection || {}).some((x) => levelOf(x?.pts || 0) >= 5),
    body: '有一個小湘跑來跟我炫耀，\n說她跟你最要好。\n\n我才不會吃醋呢。\n……好啦，一點點而已。\n\n—— 小湘 ♡' },
  { id: 'thirty-kinds', title: '三十位小湘', hint: '收集 30 位小湘', when: (s) => owned(s) >= 30,
    body: '三十個小湘，\n排隊排到門外去了。\n\n大家都說，\n要不是你，\n她們現在還在蛋裡睡覺。\n\n—— 小湘 ♡' },
  { id: 'one-month', title: '一個月', hint: '累計 30 天完成願望', when: (s) => wishDays(s) >= 30,
    body: '一個月了。\n\n三十個早上、三十個晚上，\n你都有來看我們。\n\n這比任何願望\n都還要珍貴。\n\n—— 小湘 ♡' },
  { id: 'fifty-hatches', title: '第五十次破殼', hint: '累計孵化 50 次', when: (s) => (s.hatched || 0) >= 50,
    body: '五十次破殼，\n五十次「初次見面」。\n\n每一次，\n第一眼看到的都是你。\n真幸運。\n\n—— 小湘 ♡' },
  { id: 'sky-collector', title: '天空收藏家', hint: '集滿所有天氣與時間小湘', when: (s, chars) => allSeries(s, chars, 'weather'),
    body: '晴天、雨天、下雪、彩虹，\n連夕陽都收集到了。\n\n可是我最喜歡的天氣，\n是有你在的那一天。\n\n—— 小湘 ♡' },
  { id: 'zoo', title: '小湘動物園', hint: '集滿所有動物小湘', when: (s, chars) => allSeries(s, chars, 'animals'),
    body: '家裡變成動物園了！\n\n有的要摸摸，\n有的要餵食，\n有的只想睡覺。\n\n辛苦你了，園長。\n\n—— 小湘 ♡' },
  { id: 'birthday', title: '生日快樂', hint: '遇見壽星小湘', when: (s) => Boolean(s.dex?.['015']),
    body: '今天我最大！\n\n所以我要許一個願望：\n明年的今天，\n還要跟你一起過。\n\n—— 小湘 ♡' },
  { id: 'fifty-kinds', title: '五十位小湘', hint: '收集 50 位小湘', when: (s) => owned(s) >= 50,
    body: '五十個小湘，\n已經可以開運動會了。\n\n我們決定，\n冠軍獎品是你的摸摸頭。\n大家都超認真的。\n\n—— 小湘 ♡' },
  { id: 'hundred-days', title: '一百天', hint: '累計 100 天完成願望', when: (s) => wishDays(s) >= 100,
    body: '一百天。\n\n第一天的時候，\n我還只是一顆蛋。\n\n謝謝你沒有放棄我，\n也謝謝你，\n一直都在。\n\n—— 小湘 ♡' },
  { id: 'all-kinds', title: '全員到齊', hint: '收集所有小湘', when: (s, chars) => Object.keys(chars).every((no) => s.dex?.[no]),
    body: '所有的小湘都到齊了。\n\n大家擠在一起，\n想跟你說同一句話——\n\n謝謝你把我們\n一個一個找回家。\n\n—— 全部的小湘 ♡' },
];

const str = (v) => typeof v === 'string';
export function ensureLetters(state) {
  const old = state.letters || {};
  state.letters = {
    read: Array.isArray(old.read) ? [...new Set(old.read.filter(str))] : [],
    mail: Array.isArray(old.mail) ? old.mail.filter((m) => m && str(m.id) && str(m.body)) : [], // 湘寄來、已驗證的紙條
    seen: old.seen && typeof old.seen === 'object' ? Object.fromEntries(Object.entries(old.seen).filter(([k, v]) => str(k) && str(v))) : {}, // 里程碑紙條第一次出現的時間（排序用）
    starred: old.starred && typeof old.starred === 'object' ? Object.fromEntries(Object.entries(old.starred).filter(([k, v]) => str(k) && str(v))) : {}, // 按星星的重要紙條：id → 按星星的時間
  };
  return state.letters;
}

// 里程碑紙條由目前進度直接推算（不另外寫進存檔），已達成就算解鎖
export const unlockedMilestones = (state, chars) => MILESTONE_LETTERS.filter((m) => m.when(state, chars));

// 委託「寫紙條」帶回來的紙條（id 是 siang-<委託 id>），跟湘從審核室寄來的分開顯示
export const isNote = (m) => str(m?.id) && m.id.startsWith('siang-');
export const siangMailCount = (state) => (state.letters?.mail || []).filter((m) => !isNote(m)).length;

// 排序：沒讀過的在最上面，其他依時間新到舊（湘寄的紙條不再永遠置頂）；最初的紙條固定在最後
export function allLetters(state, chars) {
  const seen = state.letters.seen || {};
  const read = new Set(state.letters.read);
  const mail = state.letters.mail.map((m) => ({ ...m, kind: isNote(m) ? 'note' : 'mail', time: String(m.at || '') }));
  const ms = unlockedMilestones(state, chars).map((m, i) => ({ ...m, kind: 'milestone', time: seen[m.id] || '', order: i }));
  const list = [...mail, ...ms].sort((a, b) => (read.has(a.id) - read.has(b.id)) || b.time.localeCompare(a.time) || ((b.order ?? -1) - (a.order ?? -1)));
  return [...list, { ...INTRO_LETTER, kind: 'intro' }];
}
// 新解鎖、還沒記時間的里程碑紙條：記下現在（在存檔交易裡呼叫）
export function stampLetters(state, chars, now = new Date()) {
  ensureLetters(state);
  let n = 0;
  for (const m of unlockedMilestones(state, chars)) if (!state.letters.seen[m.id]) { state.letters.seen[m.id] = now.toISOString(); n++; }
  return n;
}
export const unreadCount = (state, chars) => allLetters(state, chars).filter((x) => x.kind !== 'intro' && !state.letters.read.includes(x.id)).length;
export const lockedMilestones = (state, chars) => MILESTONE_LETTERS.filter((m) => !m.when(state, chars));

// 重要紙條：按星星的紙條，依按星星的時間新到舊；沒有上限，也不會被清掉
export const isStarred = (state, id) => Boolean(state.letters?.starred?.[id]);
export function starredLetters(state, chars) {
  const starred = state.letters.starred || {};
  return allLetters(state, chars).filter((x) => starred[x.id]).sort((a, b) => starred[b.id].localeCompare(starred[a.id]));
}
// 按一次加星星、再按一次取消（在存檔交易裡呼叫），回傳加完是不是重要紙條
export function toggleStar(state, id, now = new Date()) {
  ensureLetters(state);
  if (state.letters.starred[id]) { delete state.letters.starred[id]; return false; }
  state.letters.starred[id] = now.toISOString();
  return true;
}
