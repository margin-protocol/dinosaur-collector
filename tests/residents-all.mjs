// node tests/residents-all.mjs — 上架全員檢查（湘 11/25 選 A）：每位居民（小湘＋異世）該填的格子都要有，少一格就報錯並列出是哪一位、哪一格。
// 圖鑑卡片、蛋池機率這類「要湘決定」的東西不在這裡檢查；立繪腳位和手機排版在 tests/resident-check.cjs。
// 舊角色（2026-11-25 以前上線）有些台詞放在別的檔案（battle-lines-*.js、wish-voice-early.js…），列在 LEGACY 裡跳過那一格；新角色一律要填滿。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CHARACTERS, SERIES, EGGS, noLabel, worldOf } from '../js/eggs.js';
import { INTROS, MYSTERY_INTROS } from '../js/intros.js';
import { BOND_STORIES, BOND_LINES } from '../js/bond-copy.js';
import { EXTRA_LINES } from '../js/extra-lines.js';
import { WISH_VOICE_LATE } from '../js/wish-voice-late.js';
import { TASTES } from '../js/taste-profiles.js';
import { KITCHEN_LINES } from '../js/kitchen-lines.js';
import { CHARACTER_REPORTS } from '../js/errand-copy.js';
import { ING } from '../js/kitchen.js';
import { PLACES } from '../js/errands.js';
import { isMoVoice, MO_PET_LINES, MO_POKE_LINES, MO_SNACK_LINES, MO_HOME_REPORTS, MO_NOTE_TEXTS } from '../js/world-voice.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i).padStart(3, '0'));
// 舊角色的出戰／勝利台詞在 battle-lines-*.js，願望語氣在 wish-voice-early.js／wish-voice-collection.js
const LEGACY = {
  extra: new Set([...range(1, 88), '092', '093', '094', '097']),
  wish: new Set([...range(1, 61), '092', '093', '094']),
  kitchen12: new Set(range(1, 99)), // 101 以後才有第 1、2 階（普通、好吃）
  // 以前允許隱藏最愛跟別人一樣；從 2026-11-25 起新角色要獨一無二（117 開始的做法）
  secretDup: new Set(['023', '025', '026', '042', '044', '045', '046', '050', '053', '057', '059', '062', '064', '065', '066', '067', '069', '071', '074', '075', '077', '083', '085', '091', '092', '103', '108', 'MO-001']),
};
const RARITIES = ['N', 'R', 'SR', 'SSR', 'UR'];
const PLACE_KEYS = new Set(Object.keys(PLACES));
const TAGS = new Set(Object.values(ING).map((i) => i.tag));
const filled = (s) => typeof s === 'string' && s.trim().length > 0;
const profiles = JSON.parse(fs.readFileSync(`${root}data/SIANG_KITCHEN_TASTE_PROFILES.json`, 'utf8')).profiles;

const problems = [];
const secrets = new Map();
for (const [no, c] of Object.entries(CHARACTERS)) {
  const miss = [];
  const need = (ok, slot) => { if (!ok) miss.push(slot); };
  // 基本資料
  need(no !== '100', '編號 100 要留給特殊小湘');
  need(c.no === no, 'no 跟 key 不一樣');
  need(filled(c.name), '名字');
  need(RARITIES.includes(c.rarity), `稀有度（${c.rarity}）`);
  need(SERIES[c.series], `系列（${c.series} 不在 SERIES 裡）`);
  need(filled(c.line), '圖鑑代表台詞');
  need(/^\d{3}$/.test(no) || /^[A-Z]{2}-\d{3}$/.test(no), '編號格式（001 或 MO-001）');
  if (c.label) need(/^[A-Z]{2}-\d{3}$/.test(c.label), `顯示編號格式（${c.label}）`);
  if (worldOf(c) !== 'origin' && /^\d+$/.test(no)) need(c.label, '異世角色用數字 key 時要有 label（例如 MO-002）');
  need(fs.existsSync(`${root}assets/characters/${c.image}.webp`), `立繪 assets/characters/${c.image}.webp`);
  // 圖鑑
  need(filled(INTROS[no]), '圖鑑故事 intros.js INTROS');
  need(filled(MYSTERY_INTROS[no]), '神秘線索 intros.js MYSTERY_INTROS');
  // 好感
  need(filled(BOND_STORIES[no]), '好感 Lv.3 故事 bond-copy.js BOND_STORIES');
  for (const lv of [2, 4, 5]) need(filled(BOND_LINES[no]?.[lv]), `好感 Lv.${lv} bond-copy.js BOND_LINES`);
  // 初見／出戰／勝利／戰敗
  if (!LEGACY.extra.has(no)) for (const k of ['hatch', 'dispatch', 'victory', 'defeat']) need(filled(EXTRA_LINES[no]?.[k]), `extra-lines.js ${k}`);
  // 每日願望語氣
  if (!LEGACY.wish.has(no)) {
    need(WISH_VOICE_LATE[no]?.color?.includes('{color}'), 'wish-voice-late.js color（要有 {color}）');
    need(WISH_VOICE_LATE[no]?.other?.includes('{wish}'), 'wish-voice-late.js other（要有 {wish}）');
  }
  // 廚房
  for (const lv of LEGACY.kitchen12.has(no) ? [0, 3] : [0, 1, 2, 3]) need(filled(KITCHEN_LINES[no]?.[lv]), `kitchen-lines.js 第 ${lv} 階`);
  const t = TASTES[no];
  need(t && TAGS.has(t.like), `taste-profiles.js like（${t?.like}）要是食材口味`);
  need(t && TAGS.has(t.dislike) && t.dislike !== t.like, `taste-profiles.js dislike（${t?.dislike}）`);
  need(t && Array.isArray(t.secret) && t.secret.length >= 2 && t.secret.length <= 3 && t.secret.every((i) => ING[i] && (!ING[i].event || ING[i].event === worldOf(c))), '隱藏最愛要 2～3 種食材（活動食材只限同一個世界的居民）');
  if (t?.secret) {
    const key = [...t.secret].sort().join('+');
    if (secrets.has(key) && !LEGACY.secretDup.has(no)) miss.push(`隱藏最愛跟 ${noLabel(secrets.get(key))} 撞了（${key}）`);
    if (!secrets.has(key)) secrets.set(key, no);
  }
  const p = profiles.find((x) => x.no === no);
  need(p && p.name === c.name, 'data/SIANG_KITCHEN_TASTE_PROFILES.json 名字');
  // 出門回報
  // 出門回報：每個地點一組，至少 2 個地點（117 以後的習慣是 5 個：conv park market mountain faraway）
  const reports = Object.entries(CHARACTER_REPORTS[no] || {});
  need(reports.length >= (LEGACY.kitchen12.has(no) ? 1 : 2), 'errand-copy.js CHARACTER_REPORTS 至少 2 個地點');
  for (const [k, v] of reports) {
    need(PLACE_KEYS.has(k), `errand-copy.js CHARACTER_REPORTS 地點 ${k} 不存在`);
    need(Array.isArray(v) && v.length && v.every(filled), `errand-copy.js CHARACTER_REPORTS ${k} 是空的`);
  }
  // 異世居民：首頁摸頭／戳太多／餵布丁、在家幫忙、紙條、奇怪料理都要有自己的話，不然會說小湘的通用句（湘 11/27）
  if (isMoVoice(no)) {
    need(Array.isArray(MO_PET_LINES[no]) && MO_PET_LINES[no].length && MO_PET_LINES[no].every(filled), 'world-voice.js MO_PET_LINES 摸頭');
    need(filled(MO_POKE_LINES[no]), 'world-voice.js MO_POKE_LINES 戳太多');
    need(filled(MO_SNACK_LINES[no]), 'world-voice.js MO_SNACK_LINES 餵布丁');
    for (const k of ['help', 'guard', 'note', 'dino']) need(filled(MO_HOME_REPORTS[no]?.[k]), `world-voice.js MO_HOME_REPORTS ${k}`);
    need(Array.isArray(MO_NOTE_TEXTS[no]) && MO_NOTE_TEXTS[no].length && MO_NOTE_TEXTS[no].every(filled), 'world-voice.js MO_NOTE_TEXTS 紙條');
    need(filled(KITCHEN_LINES[no]?.dark), 'kitchen-lines.js dark 奇怪料理');
  }
  // 文案不能留皮寶稿子的 Markdown 粗體
  const copy = JSON.stringify([c.line, INTROS[no], MYSTERY_INTROS[no], BOND_STORIES[no], BOND_LINES[no], EXTRA_LINES[no], WISH_VOICE_LATE[no], KITCHEN_LINES[no], CHARACTER_REPORTS[no]]);
  need(!copy.includes('**'), '文案裡還有 **粗體**');
  if (miss.length) problems.push(`${noLabel(no)} ${c.name || ''}：${miss.join('、')}`);
}
// 蛋池裡的機率要是正數，而且不能放到不存在的角色
for (const [id, egg] of Object.entries(EGGS)) for (const [no, w] of Object.entries(egg.pool || {})) if (!CHARACTERS[no] || !(w > 0)) problems.push(`蛋池 ${id}：${no} 機率 ${w}`);

assert.deepEqual(problems, [], `\n上架檢查沒過：\n${problems.join('\n')}\n`);
console.log(`residents-all: ${Object.keys(CHARACTERS).length} 位居民的格子都填好了 PASS`);
