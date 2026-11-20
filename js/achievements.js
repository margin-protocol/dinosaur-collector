import { MAIN_ISLAND } from './geo.js';
import { dishById, recipesFound, secretsFound } from './kitchen.js';
const darkDish = (id) => dishById(id)?.dark;
// 成就：由進度直接推算是否達成；領取獎勵的紀錄存在 state.achievements.claimed
const dexCount = (s) => Object.keys(s.dex || {}).length;
const rarityOwned = (s, chars, r) => Object.keys(s.dex || {}).some((no) => chars[no]?.rarity === r);
const seriesDone = (s, chars) => {
  const by = {};
  for (const c of Object.values(chars)) (by[c.series] ||= []).push(c.no);
  return Object.values(by).filter((list) => list.every((no) => s.dex?.[no])).length;
};
const t = (s, k) => s.bonus?.total?.[k] || 0;

export const ACHIEVEMENT_GROUPS = ['孵化', '收藏', '願望', '旅行', '陪伴', '廚房', '隱藏'];
export const ACHIEVEMENTS = [
  { id: 'hatch-1', group: '孵化', title: '初次破殼', hint: '孵化 1 顆蛋', goal: 1, value: (s) => s.hatched || 0, reward: 20 },
  { id: 'hatch-10', group: '孵化', title: '熟練的飼養員', hint: '孵化 10 顆蛋', goal: 10, value: (s) => s.hatched || 0, reward: 40 },
  { id: 'hatch-30', group: '孵化', title: '孵化室常客', hint: '孵化 30 顆蛋', goal: 30, value: (s) => s.hatched || 0, reward: 60 },
  { id: 'hatch-100', group: '孵化', title: '傳說中的飼養員', hint: '孵化 100 顆蛋', goal: 100, value: (s) => s.hatched || 0, reward: 100 },
  { id: 'dex-10', group: '收藏', title: '小小收藏家', hint: '收集 10 位小湘', goal: 10, value: dexCount, reward: 30 },
  { id: 'dex-30', group: '收藏', title: '收藏家', hint: '收集 30 位小湘', goal: 30, value: dexCount, reward: 60 },
  { id: 'dex-all', group: '收藏', title: '全圖鑑', hint: '收集所有小湘', goal: (s, chars) => Object.keys(chars).length, value: dexCount, reward: 200 },
  { id: 'series-1', group: '收藏', title: '整套收藏', hint: '集滿任何一個系列', goal: 1, value: seriesDone, reward: 50 },
  { id: 'ssr', group: '收藏', title: '閃閃發光', hint: '遇見一位 SSR 小湘', goal: 1, value: (s, c) => (rarityOwned(s, c, 'SSR') ? 1 : 0), reward: 50 },
  { id: 'ur', group: '收藏', title: '奇蹟', hint: '遇見一位 UR 小湘', goal: 1, value: (s, c) => (rarityOwned(s, c, 'UR') ? 1 : 0), reward: 100 },
  { id: 'wish-10', group: '願望', title: '願望實現者', hint: '完成 10 個每日願望', goal: 10, value: (s) => s.player?.stats?.wishes || 0, reward: 30 },
  { id: 'wish-50', group: '願望', title: '願望守護者', hint: '完成 50 個每日願望', goal: 50, value: (s) => s.player?.stats?.wishes || 0, reward: 60 },
  { id: 'wish-days-7', group: '願望', title: '七天的約定', hint: '在 7 個不同的日子完成全部三個願望（不必連續）', goal: 7, value: (s) => s.wishEgg?.days?.length || 0, reward: 60 },
  { id: 'snap-30', group: '願望', title: '生活觀察家', hint: '隨手收藏 30 張照片', goal: 30, value: (s) => t(s, 'snaps'), reward: 40 },
  { id: 'travel-1', group: '旅行', title: '出發！', hint: '第一次探索', goal: 1, value: (s) => Object.keys(s.travel?.visits || {}).length, reward: 20 },
  { id: 'travel-5', group: '旅行', title: '小旅行', hint: '探索 5 個地方', goal: 5, value: (s) => Object.keys(s.travel?.visits || {}).length, reward: 50 },
  { id: 'travel-19', group: '旅行', title: '環島', hint: '探索本島 19 個縣市', goal: 19, value: (s) => Object.keys(s.travel?.visits || {}).filter((k) => MAIN_ISLAND.has(k)).length, reward: 150 },
  { id: 'rain', group: '旅行', title: '雨中漫步', hint: '在下雨天撿到天氣蛋', goal: 1, value: (s) => (s.weather?.rained && s.weather.granted === s.weather.rained ? 1 : 0), reward: 30 },
  { id: 'island', group: '旅行', title: '出海', hint: '去一趟綠島', goal: 1, value: (s) => (s.travel?.visits?.['綠島'] ? 1 : 0), reward: 50 },
  { id: 'island-hop', group: '旅行', title: '跳島', hint: '澎湖、金門、馬祖都去過', goal: 3, value: (s) => ['澎湖縣', '金門縣', '連江縣'].filter((k) => s.travel?.visits?.[k]).length, reward: 100 },
  { id: 'pet-30', group: '陪伴', title: '摸頭大師', hint: '摸摸頭 30 次', goal: 30, value: (s) => t(s, 'pets'), reward: 30 },
  { id: 'snack-20', group: '陪伴', title: '布丁時間', hint: '餵小湘 20 次布丁', goal: 20, value: (s) => t(s, 'snacks'), reward: 30 },
  { id: 'greet-30', group: '陪伴', title: '打招呼', hint: '跟小湘打招呼 30 次', goal: 30, value: (s) => t(s, 'greets'), reward: 30 },
  { id: 'task-10', group: '陪伴', title: '小恐龍的好朋友', hint: '完成 10 個小恐龍的委託', goal: 10, value: (s) => t(s, 'tasks'), reward: 40 },
  { id: 'cook-dark', group: '廚房', title: '勇氣可嘉', hint: '第一次煮出黑暗料理', goal: 1, value: (s) => Object.keys(s.kitchen?.known || {}).filter((id) => darkDish(id)).length, reward: 20 },
  { id: 'cook-recipes', group: '廚房', title: '小湘的私房菜', hint: '做出全部 8 道特色料理', goal: 8, value: (s) => recipesFound(s), reward: 80 },
  { id: 'cook-secrets', group: '廚房', title: '懂她的胃', hint: '找到 10 位小湘的秘密最愛', goal: 10, value: (s) => secretsFound(s), reward: 80 },
  { id: 'cook-dark-30', group: '廚房', title: '黑暗料理界的傳說', hint: '餵小湘吃 30 次黑暗料理', goal: 30, value: (s) => s.kitchen?.darkFed || 0, reward: 50 },
  { id: 'unlucky-10', group: '收藏', title: '希望尚存', hint: '累計孵到重複的小湘 10 次（普通非酋小湘會來找你）', goal: 10, value: (s) => s.dupTotal || 0, reward: 30 },
  { id: 'unlucky-50', group: '收藏', title: '希望崩塌', hint: '累計孵到重複的小湘 50 次（中級非酋小湘會來找你）', goal: 50, value: (s) => s.dupTotal || 0, reward: 60 },
  { id: 'unlucky-100', group: '收藏', title: '非酋之道', hint: '累計孵到重複的小湘 100 次（究級非酋小湘會來找你）', goal: 100, value: (s) => s.dupTotal || 0, reward: 100 },
  { id: 'lucky-10', group: '收藏', title: '幸運萌芽', hint: '一般的蛋累計孵到新朋友 10 次（普通歐皇小湘會來找你）', goal: 10, value: (s) => s.newTotal || 0, reward: 30 },
  { id: 'lucky-50', group: '收藏', title: '歐氣爆發', hint: '一般的蛋累計孵到新朋友 50 次（中級歐皇小湘會來找你）', goal: 50, value: (s) => s.newTotal || 0, reward: 60 },
  { id: 'lucky-100', group: '收藏', title: '天選之湘', hint: '一般的蛋累計孵到新朋友 100 次（究級歐皇小湘會來找你）', goal: 100, value: (s) => s.newTotal || 0, reward: 100 },
  { id: 'night', group: '隱藏', title: '夜行性', hint: '？？？', reveal: '在深夜孵出一顆蛋', goal: 1, value: (s) => t(s, 'nightHatch'), reward: 30, secret: true },
  { id: 'letter', group: '隱藏', title: '收到一封信', hint: '？？？', reveal: '收到湘寄來的紙條', goal: 1, value: (s) => s.letters?.mail?.length || 0, reward: 30, secret: true },
  { id: 'code', group: '隱藏', title: '解開暗號', hint: '？？？', reveal: '兌換一個暗號', goal: 1, value: (s) => s.gifts?.redeemed?.length || 0, reward: 30, secret: true },
  { id: 'dev-pibao', group: '隱藏', title: '再畫一隻就好！', hint: '？？？', reveal: '迎接加班皮寶', goal: 1, value: (s) => (s.dex?.['086'] ? 1 : 0), reward: 50, secret: true },
  { id: 'dev-debao', group: '隱藏', title: '這個也要做嗎？！', hint: '？？？', reveal: '迎接崩潰德寶', goal: 1, value: (s) => (s.dex?.['087'] ? 1 : 0), reward: 50, secret: true },
  { id: 'dev-idea', group: '隱藏', title: '我又想到一個！', hint: '？？？', reveal: '迎接靈感爆發小湘', goal: 1, value: (s) => (s.dex?.['088'] ? 1 : 0), reward: 80, secret: true },
  { id: 'dev-overtime', group: '隱藏', title: '今天也沒有下班', hint: '？？？', reveal: '看見開發部茶水間的深夜會議', goal: 1, value: (s) => (s.devteam?.eventSeen ? 1 : 0), reward: 50, secret: true },
  { id: 'fossil', group: '隱藏', title: '化石獵人', hint: '？？？', reveal: '收集 30 個化石碎片', goal: 30, value: (s) => s.fossils || 0, reward: 30, secret: true },
];

export function ensureAchievements(state) {
  const old = state.achievements || {};
  state.achievements = { claimed: Array.isArray(old.claimed) ? [...new Set(old.claimed.filter((x) => typeof x === 'string'))] : [] };
  return state.achievements;
}
export function achievementStatus(state, chars) {
  return ACHIEVEMENTS.map((a) => {
    const goal = typeof a.goal === 'function' ? a.goal(state, chars) : a.goal;
    const value = Math.min(goal, a.value(state, chars));
    const done = value >= goal;
    return { ...a, goal, value, done, claimed: state.achievements.claimed.includes(a.id) };
  });
}
export function claimAchievement(state, id, chars) {
  const a = achievementStatus(state, chars).find((x) => x.id === id);
  if (!a || !a.done || a.claimed) return 0;
  state.achievements.claimed.push(id); state.energy += a.reward; return a.reward;
}
