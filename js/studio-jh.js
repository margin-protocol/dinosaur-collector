// 頁邊茶肆・江湖分部（湘 11/26）：墨痕江湖活動的三寶隱藏收藏，不花墨玉、不課金。
// MO-009 江湖百曉・皮寶：活動畫面藏 5 滴墨點，點到一滴聽一則「潤飾過」的傳聞，集齊送紀念蛋 → 成就《江湖怎麼都是你的傳聞？》
// MO-010 千機巧匠・德寶：茶肆的門歪了，任 3 個不同日子各扶一次（伺服器日期）＋打贏 MO-05 破廟，門裝好送紀念蛋 → 成就《江湖也有技術債》
// MO-011 頁邊教主・小湘（UR）：皮寶＋德寶放進研究室調配（js/recipes.js 'margin-chief'），時間到送紀念蛋
// 劇場：兩寶都到手播〈江湖開業第一日〉，教主到手播〈頁邊教主降世〉（js/event-theater.js buildStudioStories）
// 下卷開放（11/29 12:00）才出現；活動封存後茶肆卡收起來，拿到的都留著。存檔：state.studioJh
export const EVENT_ID = 'mo';
export const OPEN = '2026-11-29T12:00:00+08:00';
export const PIBAO = 'MO-009', DEBAO = 'MO-010', CHIEF = 'MO-011';
export const DOOR_DAYS = 3, DOOR_STAGE = 'mo-05';

// 墨點：位置 id → 皮寶的傳聞（湘 11/26 定：關卡卡片、信物櫃、墨玉閣、活動標題、茶肆門邊）
export const INKS = ['banner', 'stage', 'keepsake', 'shop', 'door'];
export const INK_STAGE = 'mo-06'; // 墨點藏在哪一張關卡卡片
export const RUMORS = {
  banner: '聽說墨痕江湖的十萬兩紅妝，其實是二十萬兩。……好啦，是我多寫了一個零。',
  stage: '聽說桃源村的山魈偷糧，是為了給心上人辦喜酒。……好啦，是我編的。但很感人對吧？',
  keepsake: '聽說信物櫃裡的東西，半夜會自己換位置。我沒親眼看到，但我寫得很像有看到。',
  shop: '聽說墨玉閣的老闆，其實是一隻會打算盤的貓。這則我有八成把握。',
  door: '聽說茶肆的門是被我推歪的。……這則純屬謠言！真的！',
};
export const PIBAO_REVEAL = '我只是稍微潤飾了一下事實！真的！';

// 門後的聲音：第幾次扶門（1～3）→ 台詞；沒露臉前名字是「？？？」
export const DOOR_LINES = {
  1: '……誰在外面？門別推，會倒。……扶住了。謝謝。',
  2: '可以修。但今日的內力已經用完了。',
  3: '門框正了。剩下門板，裝上就好。',
  wood: '門板還差一塊好木料。聽說破廟那邊有。',
  done: '門裝好了。下一筆技術債是誰欠的？',
  today: '今天先這樣。明天再來。',
};
export const MERGE_HINT = '皮寶：「德寶，你說我們兩個合在一起會孵出什麼？」';

const isStr = (v) => typeof v === 'string';
export function ensureStudio(state) {
  const o = state.studioJh && typeof state.studioJh === 'object' ? state.studioJh : {};
  const pick = (obj, keys) => Object.fromEntries(Object.entries(obj && typeof obj === 'object' ? obj : {}).filter(([k, v]) => keys.includes(k) && isStr(v)));
  state.studioJh = {
    ink: pick(o.ink, INKS),
    door: Array.isArray(o.door) ? [...new Set(o.door.filter(isStr))].slice(0, DOOR_DAYS) : [],
    granted: pick(o.granted, [PIBAO, DEBAO]),
    seen: pick(o.seen, ['opening', 'merge']),
  };
  return state.studioJh;
}

// 下卷開放後才出現（openMs 可被測試鉤子覆寫）
export const isOpen = (nowMs, openMs = Date.parse(OPEN)) => nowMs >= openMs;
// 台北日期（修門一天一次）
export const tpeDay = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(ms);

const has = (state, no) => Boolean(state.dex?.[no]);
const owned = (state, no) => has(state, no) || Boolean(state.studioJh?.granted?.[no]);
export const inkCount = (state) => Object.keys(state.studioJh?.ink || {}).length;
export const doorCount = (state) => (state.studioJh?.door || []).length;
export const woodReady = (state) => Boolean(state.events?.[EVENT_ID]?.stages?.[DOOR_STAGE]?.clears);
export const doorFixed = (state) => owned(state, DEBAO);
export const pibaoFound = (state) => owned(state, PIBAO);

function grant(state, no, now) {
  const s = ensureStudio(state);
  if (s.granted[no] || has(state, no)) return false;
  s.granted[no] = now.toISOString();
  state.gifts = state.gifts || {}; state.gifts.eggs = state.gifts.eggs || [];
  state.gifts.eggs.push({ egg: 'keepsake', character: no, from: `studio:${no}`, at: now.toISOString() });
  return true;
}

// 點墨點：回傳 { rumor, count, egg } 或 null（已經點過）
export function tapInk(state, id, now = new Date()) {
  if (!INKS.includes(id)) return null;
  const s = ensureStudio(state);
  if (s.ink[id]) return null;
  s.ink[id] = now.toISOString();
  const count = inkCount(state);
  const egg = count >= INKS.length && grant(state, PIBAO, now) ? PIBAO : null;
  return { rumor: RUMORS[id], count, egg };
}

// 門現在的狀態（給畫面用）
export function doorState(state, today) {
  const n = doorCount(state);
  if (doorFixed(state)) return { step: 'done', n };
  if (n >= DOOR_DAYS) return { step: woodReady(state) ? 'install' : 'wood', n };
  if ((state.studioJh?.door || []).includes(today)) return { step: 'today', n };
  return { step: 'fix', n };
}

// 扶門／裝門板：回傳 { line, n, egg } 或錯誤字串
export function fixDoor(state, today, now = new Date()) {
  const s = ensureStudio(state);
  const st = doorState(state, today);
  if (st.step === 'done') return '門已經裝好了。';
  if (st.step === 'today') return DOOR_LINES.today;
  if (st.step === 'wood') return DOOR_LINES.wood;
  if (st.step === 'install') {
    const egg = grant(state, DEBAO, now) ? DEBAO : null;
    return { line: DOOR_LINES.done, n: DOOR_DAYS, egg };
  }
  s.door.push(today);
  const n = s.door.length;
  return { line: n >= DOOR_DAYS && !woodReady(state) ? DOOR_LINES.wood : DOOR_LINES[n], n, egg: null };
}

// 劇場：還沒播過、條件達成的那一段（opening／merge）
export function storyDue(state) {
  const seen = state.studioJh?.seen || {};
  if (has(state, PIBAO) && has(state, DEBAO) && !seen.opening) return 'opening';
  if (has(state, CHIEF) && !seen.merge) return 'merge';
  return null;
}
export function markSeen(state, part, now = new Date()) { ensureStudio(state).seen[part] ||= now.toISOString(); }

// 隱藏劇情（湘 11/26 定稿）：「名字：「台詞」」或整行（旁白）
export const STUDIO_STORY = {
  opening: { title: '江湖開業第一日', close: '習慣就好', lines: [
    '小湘：「我們要成為江湖第一大茶肆！」',
    '皮寶：「我已經寫好品牌故事、宣傳文案、十二篇江湖秘聞，還有下一季的活動企劃！」',
    '德寶：「……我們的門還沒裝好。」',
    '小湘：「那順便做個自動沏茶機關！」',
    '德寶：「不在原定開發範圍內。」',
    '皮寶：「我覺得可以再加一個茶肆經營系統。」',
    '德寶：「你閉嘴。」',
    '（聞止水推開尚未裝好的門，將小湘抱走。）',
    '聞止水：「夫人，回家吃飯。」',
    '皮寶：「掌櫃又翹班了！」',
    '德寶：「習慣就好。」',
    '皮寶：「德寶，你說我們兩個合在一起會孵出什麼？」',
    '德寶：「……不在原定開發範圍內。」',
  ] },
  merge: { title: '不祥的金光', close: '好耶！', lines: [
    '皮寶：「德寶，你覺得我們會孵出什麼？」',
    '德寶：「依照理論，應是一個兼具創意與實作能力的存在。」',
    '皮寶：「好期待！」',
    '（孵化器迸發出耀眼的金光。）',
    '湘寶：「寶寶！！！」',
    '皮寶：「……」',
    '德寶：「……」',
    '湘寶：「我剛剛在蛋裡想到了一個新遊戲！」',
    '皮寶：「在蛋裡也能想嗎？」',
    '湘寶：「而且我已經想好四個活動跟二十隻限定角色了♡」',
    '德寶：「孵化流程是否可以逆轉？」',
    '（系統提示：孵化成功，無法撤銷。）',
    '湘寶：「好耶！！！！」',
  ] },
};
