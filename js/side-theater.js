// 系列支線劇場：把 side-story.js 的文字劇情（皮寶 11/27）轉成尾聲劇場的劇本，借 chapter-epilogue.js 的舞台播。
// key：`side:<線>:<關>:before`／`:after`，終章 `side:<線>:finale`（最後一關的 after 會用 sequel 接上終章）。
// 只演出，不讀寫存檔。背景＝該關場景；立繪：將軍用將軍圖、「小湘」用原味小湘、島嶼守望・小湘用 No.118；其他島民只顯示名字。
import { registerStory } from './chapter-epilogue.js';
import { SIDE_LINES } from './side.js';
import { characterSources, CHARACTERS } from './eggs.js';

const line = SIDE_LINES.island;
const key = (name) => `isl_${name}`;
const actors = {};
const FOES = { 朱筆: 'isl-1', 絕信: 'isl-2', 斂財: 'isl-3', 千聲: 'isl-4', 一統: 'isl-5' };
for (const [name, sid] of Object.entries(FOES)) actors[key(name)] = { name, src: [`assets/enemies/side/island/${sid}.webp`] };
actors[key('小湘')] = { name: '小湘', src: characterSources(CHARACTERS['001'].image) };
if (CHARACTERS['118']) actors[key('島嶼守望・小湘')] = { name: '島嶼守望・小湘', src: characterSources(CHARACTERS['118'].image) };
const bg = {};
for (const s of line.stages) bg[`side:${s.id}`] = s.scene || line.scene;

export function parseLine(text) {
  const t = text.trim();
  const m = t.match(/^([^（：「]{1,10})：(「.*」)$/);
  if (m) { const k = key(m[1]); if (!actors[k]) actors[k] = { name: m[1], src: [] }; return { who: k, text: m[2] }; }
  return { text: t.replace(/^（(.*)）$/, '$1') };
}
// 站位：將軍固定右邊；小湘們在左邊（有立繪的才上台）
function beatsOf(text, { bgKey, act }) {
  const slots = { L: null, R: null };
  return text.split('\n').filter(Boolean).map((l, i) => {
    const b = parseLine(l);
    if (b.who && actors[b.who].src.length) { if (Object.values(FOES).length && Object.keys(FOES).some((n) => key(n) === b.who)) slots.R = b.who; else slots.L = b.who; }
    const cast = Object.entries(slots).filter(([, k]) => k).map(([side, k]) => [k, side]);
    return { ...(i === 0 ? { bg: bgKey, act, newAct: true, cam: [50, 50, 1], tone: '' } : {}), cast, ...b };
  });
}

export function buildSideStories() {
  const ids = [];
  const finaleId = `side:${line.id}:finale`;
  const last = line.stages[line.stages.length - 1];
  if (line.finale) {
    const beats = beatsOf(line.finale.lines, { bgKey: `side:${last.id}`, act: line.finale.title });
    beats.unshift({ card: `終章・${line.finale.title}`, sub: line.name });
    registerStory(finaleId, {
      chapter: 'side', skin: '', title: line.finale.title, subtitle: `${line.name}・終章`,
      endSmall: `${line.name} · 支線任務完成`, endTitle: '本島正常營業，恕不接受強制裝訂。',
      endNote: '這段劇情在討伐頁「副本」的島嶼不歸檔卡片裡隨時可以重看。', closeLabel: '收下', beats,
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
