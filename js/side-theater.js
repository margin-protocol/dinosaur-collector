// 系列支線劇場：把 side-story.js 的文字劇情（皮寶 11/27）轉成尾聲劇場的劇本，借 chapter-epilogue.js 的舞台播。
// key：`side:<線>:<關>:before`／`:after`，終章 `side:<線>:finale`（最後一關的 after 會用 sequel 接上終章）。
// 只演出，不讀寫存檔。背景＝該關場景；立繪：敵人用敵人圖、「小湘」用原味小湘、通關限定居民用自己的立繪；其他角色只顯示名字。
import { registerStory } from './chapter-epilogue.js';
import { SIDE_LINES } from './side.js';
import { characterSources, CHARACTERS } from './eggs.js';

// 每條線：敵人名字→關卡（用敵人圖）、有立繪的居民名字→編號
const CAST = {
  island: { foes: { 朱筆: 'isl-1', 絕信: 'isl-2', 斂財: 'isl-3', 千聲: 'isl-4', 一統: 'isl-5' }, residents: { 小湘: '001', 島嶼守望・小湘: '118' } },
  animals: { foes: { 金秤: 'ani-1', 善善: 'ani-2', 滿櫃: 'ani-3', 無林: 'ani-4', 唯用: 'ani-5' }, residents: { 小湘: '001', 虎斑小湘: '044', 守宮小湘: '052', 萬物共生・小湘: '119' } },
};

function buildLine(line) {
  const cast = CAST[line.id] || { foes: {}, residents: { 小湘: '001' } };
  const pre = line.id === 'island' ? 'isl' : line.id;
  const key = (name) => `${pre}_${name}`;
  const actors = {};
  for (const [name, sid] of Object.entries(cast.foes)) actors[key(name)] = { name, src: [`assets/enemies/side/${line.id}/${sid}.webp`] };
  for (const [name, no] of Object.entries(cast.residents)) if (CHARACTERS[no]) actors[key(name)] = { name, src: characterSources(CHARACTERS[no].image) };
  const foeKeys = new Set(Object.keys(cast.foes).map(key));
  const bg = {};
  for (const s of line.stages) bg[`side:${s.id}`] = s.scene || line.scene;
  const parseLine = (text) => {
    const t = text.trim();
    const m = t.match(/^([^（：「]{1,10})：(「.*」)$/);
    if (m) { const k = key(m[1]); if (!actors[k]) actors[k] = { name: m[1], src: [] }; return { who: k, text: m[2] }; }
    return { text: t.replace(/^（(.*)）$/, '$1') };
  };
  // 站位：敵人固定右邊；小湘們在左邊（有立繪的才上台）
  const beatsOf = (text, { bgKey, act }) => {
    const slots = { L: null, R: null };
    return text.split('\n').filter(Boolean).map((l, i) => {
      const b = parseLine(l);
      if (b.who && actors[b.who].src.length) { if (foeKeys.has(b.who)) slots.R = b.who; else slots.L = b.who; }
      const c = Object.entries(slots).filter(([, k]) => k).map(([side, k]) => [k, side]);
      return { ...(i === 0 ? { bg: bgKey, act, newAct: true, cam: [50, 50, 1], tone: '' } : {}), cast: c, ...b };
    });
  };
  const ids = [];
  const finaleId = `side:${line.id}:finale`;
  const last = line.stages[line.stages.length - 1];
  if (line.finale) {
    const beats = beatsOf(line.finale.lines, { bgKey: `side:${last.id}`, act: line.finale.title });
    beats.unshift({ card: `終章・${line.finale.title}`, sub: line.name });
    registerStory(finaleId, {
      chapter: 'side', skin: '', title: line.finale.title, subtitle: `${line.name}・終章`,
      endSmall: `${line.name} · 支線任務完成`, endTitle: line.finaleEnd || line.name,
      endNote: `這段劇情在討伐頁「副本」的${line.name}卡片裡隨時可以重看。`, closeLabel: '收下', beats,
    }, { actors, bg });
    ids.push(finaleId);
  }
  for (const s of line.stages) {
    if (!s.story) continue;
    for (const part of ['before', 'after']) {
      if (!s.story[part]) continue;
      const beats = beatsOf(s.story[part], { bgKey: `side:${s.id}`, act: s.title });
      if (part === 'after' && s.keepsake) beats.push({ card: `獲得信物：${s.keepsake.name}`, sub: s.keepsake.text, img: s.keepsake.art });
      const id = `side:${line.id}:${s.id}:${part}`;
      const toFinale = part === 'after' && s === last && line.finale;
      registerStory(id, {
        chapter: 'side', skin: '', title: s.title, subtitle: `${s.code}・${part === 'before' ? '開打前' : '打完後'}`,
        endSmall: `${line.name} · ${s.code} · ${part === 'before' ? '開打前' : '打完後'}`, endTitle: `《${s.title}》${part === 'before' ? '' : '・完'}`,
        endNote: part === 'before' ? '準備好了就出發吧。這段劇情在關卡頁隨時可以重看。' : '這段劇情在關卡頁隨時可以重看。',
        closeLabel: part === 'before' ? '好，出發' : '收下', beats, ...(toFinale ? { sequel: finaleId } : {}),
      }, { actors, bg });
      ids.push(id);
    }
  }
  return ids;
}

export function buildSideStories() {
  return Object.values(SIDE_LINES).flatMap(buildLine);
}
