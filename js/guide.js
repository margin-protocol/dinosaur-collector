// 玩家指引（11/18 玩家回饋：功能太多，需要指引）
// 1. 每個功能第一次打開時，小恐龍用一兩句話解說（只出現一次，玩法指南可以重看）
// 2. 新玩家的功能逐步出現：有了小湘才出現出門、轉盤、討伐、檔案館；已經在玩的人直接全部解鎖
// 存在 state.guide = { seen: [功能 id], unlocked: [功能 id] }
export const FEATURES = {
  wish: { name: '每日願望', icon: '✦', tip: '每天三個願望：一個拍顏色、一個陪小湘或回答小恐龍、一個主題拍照。三個都完成會蓋印章。' },
  incubate: { name: '培育', icon: '🥚', tip: '用能量幫蛋保溫，溫度滿了就能破殼。「選擇蛋」可以換別的蛋來孵。' },
  dex: { name: '圖鑑', icon: '📖', tip: '遇過的小湘都在這裡。點她可以看介紹和好感度，滿級的卡會發光。' },
  bond: { name: '好感度', icon: '♥', tip: '在首頁點小湘、摸摸頭、餵布丁，或帶她出門，好感就會上升。升級會解鎖新台詞和小故事，討伐也會變強。' },
  errand: { name: '出門', icon: '🚶', tip: '選一個地方派小湘去跑腿，回來會帶能量、化石，偶爾有蛋。★ 是喜歡那裡的小湘；兩位一起去可能會發生小故事。', unlock: (s) => count(s.dex) >= 1, unlockText: '有了第一位小湘' },
  wheel: { name: '小恐龍轉盤', icon: '🎡', tip: '每天 3 次，押一點能量轉轉看，最高 5 倍。也可能槓龜，量力而為！', unlock: (s) => count(s.dex) >= 2, unlockText: '遇見 2 位小湘' },
  battle: { name: '討伐', icon: '⚔️', tip: '派 1～3 位小湘打怪，回來看戰報。好感度越高越強；帶敵人怕的系列（✦）打得更快、分數更高。打贏的徽章可以拿去特訓。', unlock: (s) => count(s.dex) >= 3, unlockText: '遇見 3 位小湘' },
  archive: { name: '故事檔案館', icon: '📚', tip: '看過的 Boss 故事、線索、小湘和旅行的故事都收在這裡。館長咕咕嘴很壞，但其實都有在看。', unlock: (s) => (s.battle?.total || 0) > 0 || Object.keys(s.errands?.stories || {}).length > 0 || Object.values(s.affection || {}).some((a) => (a?.pts || 0) >= 30), unlockText: '第一次討伐、發現旅行故事，或任一位小湘好感 Lv.3' },
  fossils: { name: '化石交換所', icon: '🦴', tip: '重複孵到的小湘、出門和討伐都會給化石。可以換能量、願望蛋、暗號蛋，或擴充蛋架。' },
};
const count = (o) => Object.keys(o || {}).length;
export const GATED = Object.keys(FEATURES).filter((id) => FEATURES[id].unlock);

// 自動化測試預設全部解鎖、不跳說明（指引自己的測試會打開 __testGuide）
const automated = () => typeof navigator !== 'undefined' && navigator.webdriver && !globalThis.__testGuide;

export function ensureGuide(state) {
  const old = state.guide;
  if (!old || typeof old !== 'object') {
    // 第一次有這個欄位：已經在玩的人（孵過 2 顆以上或有 2 位以上小湘）直接全部解鎖
    const established = (state.hatched || 0) >= 2 || count(state.dex) >= 2;
    state.guide = { seen: [], unlocked: established ? [...GATED] : [] };
  } else {
    state.guide = { seen: Array.isArray(old.seen) ? old.seen.filter((x) => FEATURES[x]) : [], unlocked: Array.isArray(old.unlocked) ? old.unlocked.filter((x) => FEATURES[x]) : [] };
  }
  return state.guide;
}

export const isUnlocked = (state, id) => !FEATURES[id]?.unlock || automated() || Boolean(state.guide?.unlocked?.includes(id));

// 檢查有沒有新解鎖的功能，有就記下來並回傳（給「新功能」提示用）
export function unlockNew(state) {
  const g = ensureGuide(state);
  const fresh = GATED.filter((id) => !g.unlocked.includes(id) && FEATURES[id].unlock(state));
  g.unlocked.push(...fresh);
  return fresh;
}

export const tipWanted = (state, id) => !automated() && Boolean(FEATURES[id]) && !state.guide?.seen?.includes(id);
export function markSeen(state, id) { const g = ensureGuide(state); if (!g.seen.includes(id)) g.seen.push(id); }
