// node tools/catchphrase.mjs 118 嘿嘿 [呵呵 …] — 數一位居民的口頭禪出現幾次、在哪一格。
// 湘交新角色時常要求某個口頭禪只留幾處（呵呵、哼、嘿嘿），上架前後各跑一次對數字。
import { CHARACTERS, noLabel } from '../js/eggs.js';
import { INTROS, MYSTERY_INTROS } from '../js/intros.js';
import { BOND_STORIES, BOND_LINES } from '../js/bond-copy.js';
import { EXTRA_LINES } from '../js/extra-lines.js';
import { WISH_VOICE_LATE } from '../js/wish-voice-late.js';
import { KITCHEN_LINES } from '../js/kitchen-lines.js';
import { CHARACTER_REPORTS } from '../js/errand-copy.js';
import { RESIDENT_LINES } from '../js/resident-lines.js';
import fs from 'node:fs';

const [no, ...words] = process.argv.slice(2);
if (!no || !words.length || !CHARACTERS[no]) { console.error('用法：node tools/catchphrase.mjs <編號> <口頭禪> [更多口頭禪]'); process.exit(1); }
const slots = [];
const walk = (label, v) => {
  if (v == null) return;
  if (typeof v === 'string') slots.push([label, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => walk(`${label}[${i}]`, x));
  else if (typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(`${label}.${k}`, x);
};
walk('圖鑑代表台詞', CHARACTERS[no].line);
walk('intros INTROS', INTROS[no]);
walk('intros MYSTERY_INTROS', MYSTERY_INTROS[no]);
walk('bond-copy BOND_STORIES', BOND_STORIES[no]);
walk('bond-copy BOND_LINES', BOND_LINES[no]);
walk('extra-lines', EXTRA_LINES[no]);
walk('wish-voice-late', WISH_VOICE_LATE[no]);
walk('kitchen-lines', KITCHEN_LINES[no]);
walk('errand-copy', CHARACTER_REPORTS[no]);
walk('resident-lines', RESIDENT_LINES?.[no]);
console.log(`${noLabel(no)} ${CHARACTERS[no].name}`);
for (const w of words) {
  const hits = slots.map(([l, s]) => [l, s.split(w).length - 1]).filter(([, n]) => n);
  console.log(`「${w}」共 ${hits.reduce((a, [, n]) => a + n, 0)} 次${hits.length ? '：' : ''}`);
  for (const [l, n] of hits) console.log(`  ${l}${n > 1 ? ` ×${n}` : ''}`);
  // 沒接進遊戲的文案（docs/SIANG_118_*.md 這種檔名）也一起數
  for (const f of fs.readdirSync(new URL('../docs/', import.meta.url)).filter((f) => f.endsWith('.md') && f.includes(`_${no}_`))) {
    const n = fs.readFileSync(new URL(`../docs/${f}`, import.meta.url), 'utf8').split(w).length - 1;
    console.log(`  （docs/${f} 裡還有 ${n} 次，說明文字也算在內）`);
  }
}
