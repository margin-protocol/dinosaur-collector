// 紙條收藏：開場紙條、達成里程碑解鎖的紙條（文案是德寶的初稿，湘可直接改這裡），以及湘從審核室寄來的紙條。
export const INTRO_LETTER = { id: 'intro', title: '致親愛的飼養員', body: '致親愛的飼養員：\n\n這顆蛋就交給你了。\n聽說只要好好照顧它，\n就會孵出一個很可愛的東西。\n\n—— 小湘 ♡' };

const owned = (s) => Object.keys(s.dex || {}).length;
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
  { id: 'round-island', title: '環島完成', hint: '集滿 19 位縣市小湘', when: (s, chars) => Object.values(chars).filter((c) => c.county && c.county !== '綠島').every((c) => s.dex?.[c.no]),
    body: '你把臺灣走了一圈！\n每個地方的我，\n都記得你來過。\n\n下一趟旅行，\n我們一起去吧。\n\n—— 小湘 ♡' },
];

const str = (v) => typeof v === 'string';
export function ensureLetters(state) {
  const old = state.letters || {};
  state.letters = {
    read: Array.isArray(old.read) ? [...new Set(old.read.filter(str))] : [],
    mail: Array.isArray(old.mail) ? old.mail.filter((m) => m && str(m.id) && str(m.body)) : [], // 湘寄來、已驗證的紙條
  };
  return state.letters;
}

// 里程碑紙條由目前進度直接推算（不另外寫進存檔），已達成就算解鎖
export const unlockedMilestones = (state, chars) => MILESTONE_LETTERS.filter((m) => m.when(state, chars));

export function allLetters(state, chars) {
  const mail = [...state.letters.mail].sort((a, b) => String(b.at).localeCompare(String(a.at))).map((m) => ({ ...m, kind: 'mail' }));
  const ms = unlockedMilestones(state, chars).reverse().map((m) => ({ ...m, kind: 'milestone' }));
  return [...mail, ...ms, { ...INTRO_LETTER, kind: 'intro' }];
}
export const unreadCount = (state, chars) => allLetters(state, chars).filter((x) => x.kind !== 'intro' && !state.letters.read.includes(x.id)).length;
export const lockedMilestones = (state, chars) => MILESTONE_LETTERS.filter((m) => !m.when(state, chars));
