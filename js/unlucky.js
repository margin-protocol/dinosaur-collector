// 非酋三部曲＋歐皇三部曲（皮寶企劃，湘 11/20）：非酋看終身累計孵到重複的次數到 10／50／100，自動把普通／中級／究級非酋小湘加入收藏。
// 計數從舊存檔的重複星數補算（湘選 A：星數有上限，只會少算不會多算）。加入收藏後也會出現在普通蛋、星光蛋裡（湘 11/21）。
import { CHARACTERS, EGGS } from './eggs.js';

export const UNLUCKY = ['101', '102', '103'];
export const LUCKY = ['104', '105', '106']; // 歐皇三部曲：一般蛋孵到新面孔 10／30／50 次（舊存檔用圖鑑裡一般蛋孵得到的小湘數量當起點）
export const SCENES = {
  '101': '第十次重複孵化完成。普通非酋小湘抱著蛋，慢慢走出來，拍拍你的肩膀：「你也一直抽到重複的喔？沒關係啦！我們一定會越來越幸運的！」',
  '102': '第五十次重複孵化完成。培養皿旁傳來哭聲，中級非酋小湘抱著一大疊重複卡片：「我明明都已經那麼努力了……為什麼還是重複的啦啊啊啊啊！！！！」',
  '104': "第十次孵到新朋友！普通歐皇小湘抱著一顆閃亮的蛋跑過來：「欸欸欸！！你已經遇見十個新朋友了耶！嘿嘿！好厲害！以後也要一起認識更多小湘喔！」",
  '105': "第三十次孵到新朋友！培養皿閃出耀眼的光芒，中級歐皇小湘披著小披風登場：「哼哼哼……第三十個新朋友！！這就是歐皇的力量！！！！……欸？！披風勾到椅子了！哇啊啊啊啊等一下！！！」",
  '106': "第五十次孵到新朋友。培養皿緩緩亮起柔和的金光，究級歐皇小湘安靜地走出來：「……呵呵。已經認識五十位新朋友了呀。以後也請多多指教喔。……對了，你有抽到過重複的嗎？……嗯？為什麼你的表情突然變得這麼複雜呀？」",
  '103': '第一百次重複孵化完成。究級非酋小湘端著茶緩緩走出：「……呵呵。辛苦了，你也走到這一步了呀。……不過，如果下一顆真的出了新的，還是記得叫我喔。」',
};

export function ensureDupCount(state) {
  if (!Number.isSafeInteger(state.dupTotal) || state.dupTotal < 0) {
    state.dupTotal = Object.values(state.dex || {}).reduce((n, e) => n + (Number.isSafeInteger(e?.dup) && e.dup > 0 ? e.dup : 0), 0);
  }
  if (!Number.isSafeInteger(state.newTotal) || state.newTotal < 0) {
    // 歐皇的起點：圖鑑裡「一般蛋孵得到」的小湘有幾位（舊存檔沒有來源紀錄，用這個估；縣市、節日、配方、活動等固定取得的都不算）
    const random = new Set(['ordinary', 'wish', 'weather', 'cipher', 'date', 'star'].flatMap((id) => Object.keys(EGGS[id]?.pool || {})));
    state.newTotal = Object.keys(state.dex || {}).filter((no) => random.has(no)).length;
  }
  return state.dupTotal;
}

// 已經達標、還沒加入收藏的非酋小湘（照順序）
export const unluckyDue = (state) => [
  ...UNLUCKY.filter((no) => (state.dupTotal || 0) >= CHARACTERS[no].dupNeed),
  ...LUCKY.filter((no) => (state.newTotal || 0) >= CHARACTERS[no].newNeed),
].filter((no) => !state.dex?.[no]);

export function grantUnlucky(state, now = new Date()) {
  const no = unluckyDue(state)[0];
  if (!no) return null;
  state.dex[no] = { at: now.toISOString(), from: LUCKY.includes(no) ? 'lucky' : 'unlucky' };
  return no;
}
