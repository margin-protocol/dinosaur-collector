// 小恐龍：閒聊台詞與隨機小委託
import { WISH_POOL } from './wishes.js';

export const TASK_REWARD = 25;
export const TASKS_PER_DAY = 3;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 依時間、天氣、收藏狀況挑一句閒聊
export function chatterLine(state, chars, { now = new Date(), today, residents = [], last } = {}) {
  const h = now.getHours();
  const lines = [
    '今天也一起加油吧！', '我剛剛數了一下，培養架上的蛋好像動了一下耶。', '你知道嗎？恐龍蛋要好好保溫才會孵得快喔。',
    '我最喜歡飼養員了……這是秘密，不可以說出去。', '小湘們說你是最溫柔的飼養員。', '要不要去拍點喜歡的東西？隨手收藏也有能量喔。',
    '我在練習吼叫……嗷嗚～很可怕吧！', '點點入住的小湘，她們會很開心的。', '有空的時候喝杯水吧，飼養員也要照顧自己。',
    '我昨天夢到自己變成一顆蛋，被你孵出來了。', '你今天看起來特別有精神！', '偷偷告訴你，願望蛋裡比較容易遇到稀有的小湘喔。',
  ];
  if (h >= 5 && h < 11) lines.push('早安！今天的天空是什麼顏色呢？', '早餐吃了嗎？我吃了一片葉子。');
  else if (h >= 11 && h < 14) lines.push('午餐時間到了！吃飽才有力氣孵蛋喔。', '中午了，要不要休息一下？');
  else if (h >= 14 && h < 18) lines.push('下午好想睡……不行，我要幫忙顧蛋！', '下午茶時間～甜點小湘一定很想參加。');
  else if (h >= 18 && h < 23) lines.push('辛苦了一整天，歡迎回來！', '晚上的培養架會微微發光，好漂亮。');
  else lines.push('這麼晚還沒睡嗎？夜貓小湘會很開心的……但還是要早點睡喔。', '噓……小湘們都睡著了。');
  if (state.weather?.date === today && state.weather.kind === 'rain') lines.push('外面在下雨，出門記得帶傘！雨傘小湘說的。', '下雨天的蛋好像特別安靜呢。');
  if (state.weather?.date === today && state.weather.kind === 'clear') lines.push('今天天氣好好，適合出門探索！');
  const owned = Object.keys(state.dex || {}).length;
  if (owned >= 2) lines.push(`我們已經遇見 ${owned} 位小湘了，好厲害！`);
  if (owned && owned < Object.keys(chars).length) lines.push(`圖鑑裡還有 ${Object.keys(chars).length - owned} 位小湘在等你喔。`);
  for (const no of residents) if (chars[no]) lines.push(`${chars[no].name}剛剛跟我說，她很喜歡這個家。`);
  if (state.shelf?.length) lines.push(`暫放架上還有 ${state.shelf.length} 顆蛋在等你回去喔。`);
  const visited = Object.keys(state.travel?.visits || {}).length;
  if (visited) lines.push(`你已經去過 ${visited} 個地方了，下一站要去哪裡？`);
  const options = lines.filter((l) => l !== last);
  return pick(options.length ? options : lines);
}

export function ensureDino(state, today) {
  const old = state.dino || {};
  state.dino = { date: typeof old.date === 'string' ? old.date : today, count: Number.isSafeInteger(old.count) ? old.count : 0, task: old.task && typeof old.task.type === 'string' ? old.task : null };
  if (state.dino.date !== today) { state.dino = { date: today, count: 0, task: null }; }
  return state.dino;
}

export const canOffer = (state, today) => {
  const d = state.dino;
  return d && !d.task && (d.date !== today || d.count < TASKS_PER_DAY);
};

// 產生一個能自動判定的小委託
export function makeTask(state, ctx) {
  const { today, residents = [], todaysWishIds = [], snapsToday = 0, snapCap = 10, firstHatched } = ctx;
  const options = [];
  const colors = WISH_POOL.filter((w) => !todaysWishIds.includes(w.id));
  if (colors.length) { const w = pick(colors); options.push({ type: 'color', target: w.id, text: `幫我找一個${w.color}的東西拍給我看！`, goal: 1 }); }
  if (residents.length) { const no = pick(residents); options.push({ type: 'greet', target: no, text: `去跟${ctx.chars[no].name}打個招呼吧，她好像有話想說。`, goal: 1 }); }
  options.push({ type: 'feed', target: 30, base: state.player?.stats?.fed || 0, text: '幫蛋注入 30 能量，我想看它長大！', goal: 30 });
  if (snapsToday <= snapCap - 2) options.push({ type: 'snap', target: 2, base: snapsToday, date: today, text: '隨手收藏 2 張照片，讓我看看你的世界！', goal: 2 });
  if (firstHatched && state.bonus?.explored !== today) options.push({ type: 'explore', text: '帶我去探索附近好不好？我想知道外面有什麼！', goal: 1 });
  return pick(options);
}

// 目前進度（color、greet 由事件直接完成）
export function taskProgress(state, task, { today, snapsToday = 0 } = {}) {
  if (!task) return 0;
  if (task.type === 'feed') return Math.min(task.goal, (state.player?.stats?.fed || 0) - (task.base || 0));
  if (task.type === 'snap') return Math.min(task.goal, task.date === today ? snapsToday - task.base : 0);
  if (task.type === 'explore') return state.bonus?.explored === today ? 1 : 0;
  return task.done ? 1 : 0;
}

export function completeTask(state) {
  if (!state.dino?.task) return 0;
  state.dino.task = null; state.dino.count += 1; state.energy += TASK_REWARD;
  return TASK_REWARD;
}
