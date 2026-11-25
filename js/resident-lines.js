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
