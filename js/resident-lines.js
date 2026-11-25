// 首頁點居民時的待機台詞（頁間居民 2.0）。沒有寫的居民照舊說自己的招呼語（CHARACTERS[no].line）。
// MO-001 聞止水：湘 11/25 交稿，感覺是「看似漫不經心，其實一直注意著小湘」。
// general 一般、long 很久沒互動（超過 LONG_IDLE_MS）、high 好感 Lv.4 以上、max Lv.5 專屬、with 某位居民也在首頁時的隱藏台詞
export const LONG_IDLE_MS = 3 * 60 * 1000;
export const RESIDENT_LINES = {
  'MO-001': {
    general: ['我在。不必一直確認。', '慢慢來，我等你。', '劍已擦過了……還有什麼需要我做的？', '今日無事，倒也難得。'],
    long: ['睡著了？……也好。', '替你守著，安心休息。'],
    high: ['過來些。離我那麼遠做什麼？', '沒事。只是想看看你。', '不必找話說。陪著就好。'],
    max: ['今日不做護衛。做你的妻子。'],
    with: { '117': ['別扯嫁衣，會弄皺……想抱就直說。', '海棠開了。走吧，帶你去看。', '嗯，夫人。我在。'] },
  },
  // MO-005 杜今朝、MO-008 簡牧陽：用湘定稿的台詞（招呼、願望、好感）組成
  'MO-005': {
    general: ['靖安司，杜今朝。有事報案，沒事也可以坐下喝杯茶。', '最近睡得好嗎？眼睛下面有點青。', '卷宗是看不完的。今天就到這兒。', '路過，順道來看看。……好吧，不算順道。'],
    long: ['今天休沐，不談案子。陪你坐一會兒。'],
    high: ['我見過太多來不及的事。所以你這裡，我總想多照看一點。'],
    max: ['辦了半輩子的案，頭一回想替自己記一筆：此處，有人等我回來。'],
  },
  'MO-008': {
    general: ['我叫簡牧陽！有什麼壞掉的，交給我！', '來來來，給你看我新做的小東西！', '今天不拆東西了……好啦，只拆一個小的。', '我把你的門鈴改成會唱歌的了！不喜歡的話……我再改回來。'],
    long: ['你家椅子會晃，我順手修好了！還多加了一個小抽屜。'],
    high: ['我在畫一張圖紙，畫的是你家。哪裡會漏雨、哪扇門會卡，我全都記住了。'],
    max: ['世上的東西我都拆得開。只有待在你身邊這件事，我想讓它一直好好組著。'],
  },
};

// level：好感等級；residents：首頁上的居民編號；idleMs：距離上次互動多久
export function residentLine(no, { level = 1, residents = [], idleMs = 0 } = {}, rand = Math.random) {
  const t = RESIDENT_LINES[no];
  if (!t) return null;
  const pick = (list) => `「${list[Math.floor(rand() * list.length)]}」`;
  for (const [other, lines] of Object.entries(t.with || {})) if (residents.includes(other) && rand() < 0.5) return pick(lines);
  if (idleMs >= LONG_IDLE_MS && t.long?.length) return pick(t.long);
  const pool = [...t.general, ...(level >= 4 ? t.high || [] : []), ...(level >= 5 ? t.max || [] : [])];
  return pick(pool);
}
