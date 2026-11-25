// 請寶寶工作室喝杯茶（湘 11/25）：贊助入口＋三寶端茶道謝＋「茶友」稱號
// - 贊助在綠界「實況主收款」的斗內頁付款，遊戲收不到付款資料，只用君子協定：
//   回到遊戲按「我請過茶了」就給「茶友」稱號。稱號只是裝飾，不給墨玉、不加戰力。
// - TEA_URL 還沒填（湘的綠界還在申請）時整個入口藏起來，只有測試服（?test）看得到。
// - 存檔：state.studio = { teaFriend: ISO 時間, wornTitle?: 'tea-friend' }。稱號戴法跟活動稱號同一套（events.js wornTitle）。

export const TEA_URL = ''; // 綠界斗內網址，湘給了再填

export const STUDIO_TITLES = { 'tea-friend': '茶友' };

// 每次隨機一位出來端茶。小湘那格每次在南投縣小湘（捧茶杯）和貓咪咖啡館小湘（端茶盤）之間隨機（湘 11/25 選）。
export const TEA_CREW = [
  {
    id: 'siang', name: '小湘', no: ['025', '078'],
    lines: [
      '謝謝你的茶！我捧好了，一滴都不會灑出來……欸、欸欸！',
      '這杯好香喔！喝完我要去催德寶寫下一頁了！',
      '這杯我先放著，等熬夜趕活動的時候喝！',
      '嘿嘿，有你在，寶寶工作室今天也不會關門！',
      '喝飽了！下一個異世的門好像打開了一點點……',
      '我要把這杯茶寫進手記裡，第一行就寫「有人請我們喝茶了」！',
    ],
  },
  {
    id: 'pibao', name: '加班皮寶', no: '086',
    lines: [
      '謝謝你的茶！！今晚可以多畫一張立繪了！！',
      '喝完這杯我就……再畫一張！真的最後一張！！',
      '茶好燙！可是我手好冰！剛剛好！！我繼續畫！！',
      '你請的茶我要偷偷畫進下一張圖裡，找找看在哪裡喔！！',
      '欸等一下，我又想到新的小湘了！！一定是這杯茶的關係！！',
    ],
  },
  {
    id: 'debao', name: '崩潰德寶', no: '087',
    lines: [
      '……謝謝。這是今天第一個沒有叫我改東西的訊息。',
      '好，喝完這杯我就去修那個 bug。……哪個？全部。',
      '謝謝你的茶。皮寶，不准再喝我的。',
      '有人請喝茶，代表有人在玩，代表我不能睡。……謝謝你喔，真心的。',
      '茶收到了。湘說的那三隻新角色，我現在有力氣接了……大概。',
    ],
  },
];

// 入口要不要出現：有網址，或是測試服
export const teaEnabled = () => Boolean(TEA_URL) || Boolean(globalThis.__SIANG_TEST__);

export const isTeaFriend = (state) => Boolean(state?.studio?.teaFriend);

// 隨機挑一位＋一句；last 是上一次的 {id, line}，盡量不要連續一模一樣
export function pickThanks(last = null, rand = Math.random) {
  for (let i = 0; i < 6; i += 1) {
    const who = TEA_CREW[Math.floor(rand() * TEA_CREW.length)];
    const line = who.lines[Math.floor(rand() * who.lines.length)];
    const no = Array.isArray(who.no) ? who.no[Math.floor(rand() * who.no.length)] : who.no;
    if (!last || last.line !== line) return { id: who.id, name: who.name, no, line };
  }
  const who = TEA_CREW[0];
  return { id: who.id, name: who.name, no: who.no[0], line: who.lines[0] };
}

// 按「我請過茶了」：第一次給稱號（回傳 true），之後回傳 false
export function claimTeaFriend(state, now = new Date()) {
  if (!state.studio || typeof state.studio !== 'object') state.studio = {};
  if (state.studio.teaFriend) return false;
  state.studio.teaFriend = now.toISOString();
  return true;
}
