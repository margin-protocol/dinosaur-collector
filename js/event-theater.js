// 異世活動劇情劇場：把 MO_STORY（湘定稿的文字劇情）轉成尾聲劇場的劇本，借 chapter-epilogue.js 的舞台播。
// 對話「名字：「台詞」」→ 那位角色講話；整行（）→ 旁白。背景＝該關戰鬥場景，立繪＝居民／敵人圖。
// 站位自動排：最近講話的兩位一左一右；新角色換掉比較久沒講話的那位。沒有立繪的角色（掌櫃、青禾、莊主）只顯示名字。
// 只演出，不讀寫存檔。key：`${eventId}:${stageId}:${part}`，part＝before／after（after 會接上 ending）。
import { registerStory } from './chapter-epilogue.js';
import { MO_STORY } from './event-mo-story.js';
import { EVENT_DEFS } from './events.js';
import { characterSources, CHARACTERS } from './eggs.js';

const def = EVENT_DEFS.mo;
const RESIDENTS = { 小湘: '117', 聞止水: 'MO-001', 杜今朝: 'MO-005', 簡牧陽: 'MO-008', 游未遲: 'MO-003', 徐汀云: 'MO-004', 程不言: 'MO-006', 林晏洄: 'MO-007' };
const FOES = { 刀客: 'mo-02', 斷刃使: 'mo-05', 牙商: 'mo-07' };
const keyOf = (name) => `mo_${name}`;

const actors = {};
for (const [name, no] of Object.entries(RESIDENTS)) actors[keyOf(name)] = { name, src: characterSources(CHARACTERS[no].image) };
for (const [name, stage] of Object.entries(FOES)) actors[keyOf(name)] = { name, src: [`assets/enemies/${def.stages[stage].art}.webp`] };
for (const name of ['掌櫃', '青禾', '莊主']) actors[keyOf(name)] = { name, src: [] };
const bg = Object.fromEntries(Object.entries(def.stages).map(([id, s]) => [`mo:${id}`, s.scene]));

// 一行文字 → beat
export function parseLine(line) {
  const t = line.trim();
  const m = t.match(/^([^（：「]{1,8})：(「.*」)$/);
  if (m) return { who: keyOf(m[1]), text: m[2] };
  return { text: t.replace(/^（(.*)）$/, '$1') };
}

// 自動站位：兩個位置 L／R
function stage(lines, { bgKey, act, skin }) {
  const slots = { L: null, R: null }; const lastSpoke = {}; let n = 0;
  return lines.map((line, i) => {
    const b = parseLine(line);
    if (/^尾聲・/.test(b.text)) return { card: b.text.replace(/^尾聲・/, ''), sub: '尾聲' };
    if (b.who && actors[b.who]?.src.length && !Object.values(slots).includes(b.who)) {
      const side = !slots.L ? 'L' : !slots.R ? 'R' : (lastSpoke[slots.L] || 0) <= (lastSpoke[slots.R] || 0) ? 'L' : 'R';
      slots[side] = b.who;
    }
    if (b.who) lastSpoke[b.who] = ++n;
    const cast = Object.entries(slots).filter(([, k]) => k).map(([side, k]) => [k, side]);
    return { ...(i === 0 ? { bg: bgKey, act, newAct: true, cam: [50, 50, 1], tone: '' } : {}), cast, ...b, ...(skin === 'c' ? { cast: [] } : {}) };
  });
}

export function buildStories(skin = '') {
  const ids = [];
  for (const [sid, parts] of Object.entries(MO_STORY)) {
    const s = def.stages[sid]; if (!s) continue;
    for (const part of ['before', 'after']) {
      if (!parts[part]) continue;
      const lines = parts[part].split('\n').filter(Boolean);
      const beats = stage(lines, { bgKey: `mo:${sid}`, act: s.title, skin });
      if (part === 'after' && parts.ending) {
        const end = parts.ending.split('\n').filter(Boolean);
        const isTail = /^（尾聲・/.test(end[0]);
        beats.push(...(isTail ? [] : [{ card: sid === 'mo-05' ? '上卷・完' : '下卷・完', sub: '' }]), ...stage(end, { bgKey: `mo:${sid}`, act: sid === 'mo-05' ? '上卷結尾' : '江湖再嫁', skin }));
      }
      const id = `mo:${sid}:${part}`;
      registerStory(id, {
        chapter: 'mo', skin, title: s.title, subtitle: `${s.label}・${part === 'before' ? '開打前' : '打完後'}`,
        endSmall: `${def.code} · ${s.label} · ${part === 'before' ? '開打前' : '打完後'}`, endTitle: `《${s.title}》${part === 'before' ? '' : '・完'}`,
        endNote: part === 'before' ? '準備好了就出發吧。這段劇情在關卡頁隨時可以重看。' : '這段劇情在關卡頁隨時可以重看。',
        closeLabel: part === 'before' ? '好，出發' : '收下', beats,
      }, { actors, bg });
      ids.push(id);
    }
  }
  return ids;
}
