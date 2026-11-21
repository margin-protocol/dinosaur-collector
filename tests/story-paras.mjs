// 書評／台詞分行：括號、引號後的標點不能自己掉到下一行（11/21）
import fs from 'node:fs';
import assert from 'node:assert/strict';
const src = fs.readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const storyParas = new Function(src.slice(src.indexOf('function storyParas'), src.indexOf('// 把多句的字')) + ';return storyParas;')();
const cases = [
  ['（上次最高 1710，這次 7540。……我有記下來。）', ['（上次最高 1710，這次 7540。……我有記下來。）']],
  ['（第 3 次挑戰才贏。……我可沒有在數。）', ['（第 3 次挑戰才贏。……我可沒有在數。）']],
  ['「新紀錄？哼，我就知道你上次沒有認真。」', ['「新紀錄？哼，我就知道你上次沒有認真。」']],
  ['嘶——（尾巴炸開）……這是給貓吃的嗎？！', ['嘶——（尾巴炸開）……這是給貓吃的嗎？！']],
  ['第一行寫著『今天絕對不睡午覺！』。可是每次翻到最後。', ['第一行寫著『今天絕對不睡午覺！』。', '可是每次翻到最後。']],
  ['回來時多了一句「打麻將？」，她已經在穿外套了。', ['回來時多了一句「打麻將？」，她已經在穿外套了。']],
  ['……哎呀？輸了呢。……原來如此。', ['……哎呀？', '輸了呢。', '……原來如此。']],
];
for (const [text, want] of cases) assert.deepEqual(storyParas(text, 0), want, text);
// 掃過所有文案：沒有一行是以收尾標點開頭
for (const f of fs.readdirSync(new URL('../js/', import.meta.url)).filter(f => /(copy|lines|intros|reviews|voice|eggs|battle)/.test(f))) {
  const t = fs.readFileSync(new URL(`../js/${f}`, import.meta.url), 'utf8');
  for (const m of t.matchAll(/'([^'\n]*[。！？][^'\n]*)'|"([^"\n]*[。！？][^"\n]*)"/g)) {
    const s = (m[1] ?? m[2]).replace(/\$\{[^}]*\}/g, '1');
    for (const p of storyParas(s, 0)) assert.ok(!/^[」』）)。！？，、]/.test(p), `${f}: ${s}`);
  }
}
console.log('story-paras ok');
