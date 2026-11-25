// 異世活動劇情劇場：把 MO_STORY（湘定稿的文字劇情）轉成尾聲劇場的劇本，借 chapter-epilogue.js 的舞台播。
// 對話「名字：「台詞」」→ 那位角色講話；整行（）→ 旁白。背景＝該關戰鬥場景，立繪＝居民／敵人圖。
// 站位自動排：最近講話的兩位一左一右；新角色換掉比較久沒講話的那位。沒有立繪的角色（掌櫃、青禾、莊主）只顯示名字。
// 只演出，不讀寫存檔。key：`${eventId}:${stageId}:${part}`，part＝before／after（after 會接上 ending）。
import { registerStory } from './chapter-epilogue.js';
import { MO_STORY } from './event-mo-story.js';
import { STUDIO_STORY } from './studio-jh.js';
import { EVENT_DEFS } from './events.js';
import { characterSources, CHARACTERS } from './eggs.js';

const def = EVENT_DEFS.mo;
const RESIDENTS = { 小湘: '117', 聞止水: 'MO-001', 杜今朝: 'MO-005', 簡牧陽: 'MO-008', 游未遲: 'MO-003', 徐汀云: 'MO-004', 程不言: 'MO-006', 林晏洄: 'MO-007', 皮寶: 'MO-009', 德寶: 'MO-010', 湘寶: 'MO-011' };
const FOES = { 刀客: 'mo-02', 斷刃使: 'mo-05', 牙商: 'mo-07' };
const keyOf = (name) => `mo_${name}`;
// 湘 11/25：小怪出場時放牠的圖。開打前第幾句（從 0 數）登場；登場後固定站右邊，講話的居民輪流站左邊
const FOE_ENTRY = { 'mo-01': 12, 'mo-02': 11, 'mo-03': 15, 'mo-04': 7, 'mo-05': 11, 'mo-06': 11, 'mo-07': 13, 'mo-08': 13, 'mo-09': 12, 'mo-10': 18 };
const foeKey = (sid) => Object.entries(FOES).find(([, st]) => st === sid)?.[0] ? keyOf(Object.entries(FOES).find(([, st]) => st === sid)[0]) : `mo_foe_${sid}`;

const actors = {};
for (const [name, no] of Object.entries(RESIDENTS)) actors[keyOf(name)] = { name, src: characterSources(CHARACTERS[no].image) };
for (const [name, stage] of Object.entries(FOES)) actors[keyOf(name)] = { name, src: [`assets/enemies/${def.stages[stage].art}.webp`] };
for (const name of ['掌櫃', '青禾', '莊主']) actors[keyOf(name)] = { name, src: [] };
for (const [sid, st] of Object.entries(def.stages)) if (!Object.values(FOES).includes(sid)) actors[`mo_foe_${sid}`] = { name: st.name, src: [`assets/enemies/${st.art}.webp`] };
const bg = Object.fromEntries(Object.entries(def.stages).map(([id, s]) => [`mo:${id}`, s.scene]));

// 一行文字 → beat
export function parseLine(line) {
  const t = line.trim();
  const m = t.match(/^([^（：「]{1,8})：(「.*」)$/);
  if (m) return { who: keyOf(m[1]), text: m[2] };
  return { text: t.replace(/^（(.*)）$/, '$1') };
}

// 自動站位：兩個位置 L／R
function stage(lines, { bgKey, act, skin, foe = null }) {
  const slots = { L: null, R: null }; const lastSpoke = {}; let n = 0;
  return lines.map((line, i) => {
    const b = parseLine(line);
    if (/^尾聲・/.test(b.text)) return { card: b.text.replace(/^尾聲・/, ''), sub: '尾聲' };
    let entry = null;
    if (foe && i === foe.at) { // 小怪登場：佔右邊、跳出來、畫面晃一下
      if (slots.R && slots.R !== foe.key) slots.L = lastSpoke[slots.R] > (lastSpoke[slots.L] || 0) ? slots.R : slots.L;
      slots.R = foe.key; entry = { fx: { [foe.key]: 'peek' }, shake: true };
    }
    const foeOn = foe && i >= foe.at;
    if (foeOn && b.who && b.who !== foe.key && actors[b.who]?.src.length) slots.L = b.who;
    else if (b.who && actors[b.who]?.src.length && !Object.values(slots).includes(b.who)) {
      const side = !slots.L ? 'L' : !slots.R ? 'R' : (lastSpoke[slots.L] || 0) <= (lastSpoke[slots.R] || 0) ? 'L' : 'R';
      slots[side] = b.who;
    }
    if (b.who) lastSpoke[b.who] = ++n;
    const cast = Object.entries(slots).filter(([, k]) => k).map(([side, k]) => [k, side]);
    return { ...(i === 0 ? { bg: bgKey, act, newAct: true, cam: [50, 50, 1], tone: '' } : {}), cast, ...b, ...(entry || {}), ...(skin === 'c' ? { cast: [] } : {}) };
  });
}

export function buildStories(skin = '') {
  const ids = [];
  for (const [sid, parts] of Object.entries(MO_STORY)) {
    const s = def.stages[sid]; if (!s) continue;
    for (const part of ['before', 'after']) {
      if (!parts[part]) continue;
      const lines = parts[part].split('\n').filter(Boolean);
      const beats = stage(lines, { bgKey: `mo:${sid}`, act: s.title, skin, foe: part === 'before' && FOE_ENTRY[sid] !== undefined ? { at: FOE_ENTRY[sid], key: foeKey(sid) } : null });
      if (part === 'after' && parts.ending) {
        const end = parts.ending.split('\n').filter(Boolean);
        const isTail = /^（尾聲・/.test(end[0]);
        beats.push(...(isTail ? [] : [{ card: sid === 'mo-05' ? '上卷・完' : '下卷・完', sub: '' }]), ...stage(end, { bgKey: `mo:${sid}`, act: sid === 'mo-05' ? '上卷結尾' : '江湖再嫁', skin }));
      }
      const id = `mo:${sid}:${part}`;
      registerStory(id, {
        chapter: 'mo', music: 'mo', skin, title: s.title, subtitle: `${s.label}・${part === 'before' ? '開打前' : '打完後'}`,
        endSmall: `${def.code} · ${s.label} · ${part === 'before' ? '開打前' : '打完後'}`, endTitle: `《${s.title}》${part === 'before' ? '' : '・完'}`,
        endNote: part === 'before' ? '準備好了就出發吧。這段劇情在關卡頁隨時可以重看。' : '這段劇情在關卡頁隨時可以重看。',
        closeLabel: part === 'before' ? '好，出發' : '收下', beats,
      }, { actors, bg });
      ids.push(id);
    }
  }
  // 頁邊江湖三寶（湘 11/26）：兩寶都到手播〈江湖開業第一日〉、湘寶孵出後播〈不祥的金光〉；在茶肆卡隨時重看
  for (const [part, st] of Object.entries(STUDIO_STORY)) {
    const beats = stage(st.lines, { bgKey: 'mo:mo-02', act: st.title, skin });
    beats.forEach((b, i) => { if (/金光/.test(st.lines[i]) && !b.who) Object.assign(b, { shake: true, tone: 'sunset' }); });
    const id = `studio:${part}`;
    registerStory(id, {
      chapter: 'mo', music: 'mo', skin, title: st.title, subtitle: '頁邊江湖・隱藏劇情',
      endSmall: '頁邊江湖 · 隱藏劇情', endTitle: `《${st.title}》・完`, endNote: '這段劇情在討伐頁的頁邊茶肆隨時可以重看。', closeLabel: st.close, beats,
    }, { actors, bg });
    ids.push(id);
  }
  return ids;
}
