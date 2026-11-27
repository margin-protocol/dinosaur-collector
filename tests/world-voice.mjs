// node tests/world-voice.mjs — 異世居民不說小湘的通用台詞（湘 11/27：杜今朝在首頁說小湘的話很怪）
import assert from 'node:assert/strict';
import { CHARACTERS } from '../js/eggs.js';
import { isMoVoice, MO_CHATS, CROSS_CHATS, MO_HOME_REPORTS, MO_NOTE_TEXTS, MO_SERIES_REPORTS } from '../js/world-voice.js';
import { chatPick } from '../js/home-life.js';
import { depart, PLACES, HOME_TASKS } from '../js/errands.js';
import { PLACE_REPORTS, HOME_REPORTS, NOTE_TEXTS } from '../js/errand-copy.js';
import { reaction } from '../js/kitchen.js';
import { planNotes } from '../js/push-timers.js';

const MO = Object.keys(CHARACTERS).filter(isMoVoice);
assert.ok(MO.includes('MO-005') && !MO.includes('117') && !MO.includes('001'), '異世口吻：MO 開頭的居民，不含 117 海棠新娘小湘');
const seq = (...v) => { let i = 0; return () => v[i++ % v.length]; };

// 首頁閒聊：兩位異世 → MO_CHATS；一位異世一位小湘 → CROSS_CHATS，異世居民先開口；此生護卿不參加
let p = chatPick(['MO-005', 'MO-003'], {}, seq(0));
assert.equal(p.kind, 'mo'); assert.ok(p.pool.every((c) => MO_CHATS.includes(c)));
for (const r of [0, 0.99]) {
  p = chatPick(['001', 'MO-005'], {}, seq(r, 0));
  assert.equal(p.kind, 'cross'); assert.equal(p.a, 'MO-005'); assert.equal(p.b, '001'); assert.ok(p.pool.every((c) => CROSS_CHATS.includes(c)));
}
assert.equal(chatPick(['001', '002'], {}, seq(0)).kind, 'origin');
assert.equal(chatPick(['MO-012', '001'], {}), null, '此生護卿＋一位：沒人聊');
assert.equal(chatPick(['117', '001'], {}, seq(0)).kind, 'origin', '海棠新娘小湘照舊是小湘口吻');

// 出門／在家幫忙：異世居民不用小湘的通用回報
const allPlace = new Set(Object.values(PLACE_REPORTS).flat());
const allHome = new Set(Object.values(HOME_REPORTS).flat());
const allNotes = new Set(NOTE_TEXTS);
const fresh = (nos) => ({ dex: Object.fromEntries(nos.map((n) => [n, {}])), errands: {}, letters: { mail: [] }, travel: { eggs: [] } });
let t = 0;
for (const no of MO) {
  for (let k = 0; k < 8; k += 1) for (const place of Object.keys(PLACES)) {
    const s = fresh([no, '001']);
    const e = depart(s, { place, nos: [no] }, new Date(Date.UTC(2026, 10, 27, 0, t++)), Math.random);
    assert.equal(typeof e, 'object', `${no} ${place} 出發失敗：${e}`);
    assert.ok(!allPlace.has(e.loot.line), `${no} ${place} 拿到小湘的通用回報：${e.loot.line}`);
    const two = depart(fresh([no, '001']), { place, nos: [no, '001'] }, new Date(Date.UTC(2026, 10, 28, 0, t++)), Math.random);
    assert.ok(!allPlace.has(two.loot.line), `${no}＋001 ${place} 拿到小湘的通用回報：${two.loot.line}`);
  }
  for (const task of Object.keys(HOME_TASKS)) for (let k = 0; k < 6; k += 1) {
    const s = fresh([no]);
    const e = depart(s, { task, nos: [no] }, new Date(Date.UTC(2026, 10, 29, 0, t++)), Math.random);
    assert.ok(!allHome.has(e.loot.line), `${no} ${task} 拿到小湘的通用回報：${e.loot.line}`);
    assert.ok(Object.values(MO_HOME_REPORTS[no]).includes(e.loot.line), `${no} ${task}：${e.loot.line}`);
    if (task === 'note') { assert.ok(!allNotes.has(e.loot.note)); assert.ok(MO_NOTE_TEXTS[no].includes(e.loot.note)); }
  }
}
for (const s of Object.values(MO_SERIES_REPORTS)) for (const place of Object.keys(PLACES)) assert.ok(s[place]?.length, `系列回報缺 ${place}`);

// 廚房：異世居民每種評價、奇怪料理都有自己的話
const GENERIC = /飼養員|小湘要|日記|畫成愛心/;
const dark = { id: 'x-dark', dark: true, tags: [] };
const home = { id: 'x-home', tags: [] };
for (const no of MO) {
  for (const r of [0, 1, 2, 3]) assert.ok(!GENERIC.test(reaction(no, home, r)), `${no} 第 ${r} 階`);
  for (const r of [0, 1, 2]) assert.ok(!/勇敢|動了一下|活下來/.test(reaction(no, dark, r)), `${no} 奇怪料理 ${r}：${reaction(no, dark, r)}`);
}

// 通知：異世居民帶頭不說「快來誇我～」、不寫「她們」
const until = new Date(Date.now() + 3600e3).toISOString();
const notes = planNotes({ errands: { active: [{ id: 'a1', place: 'park', nos: ['MO-005', 'MO-003'], until }] }, battle: { active: [] } }, { prefs: { on: true, home: true, battle: true, quiet: false } });
assert.equal(notes.length, 1); assert.ok(!/她們|～/.test(notes[0].title + notes[0].body), JSON.stringify(notes[0]));
console.log(`world-voice: ${MO.length} 位異世居民都說自己的話 PASS`);
