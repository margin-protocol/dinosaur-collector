// 回家／討伐提醒的排程（湘 11/25）：只排還沒回來的、10 分鐘內合成一則、晚上 23–8 點留到早上 8 點、可分開關掉回家／討伐。
// 用台北時間跑：TZ=Asia/Taipei（package 外直接 node 也會在這裡設定）
process.env.TZ = 'Asia/Taipei';
import assert from 'node:assert/strict';
globalThis.localStorage = { getItem: () => null, setItem() {} };
const m = await import('../js/push-timers.js');
const now = new Date('2026-11-27T15:00:00+08:00').getTime();
const iso = (t) => new Date(t).toISOString(); const H = 3600e3;
const st = {
  errands: { active: [
    { id: 'e0', place: 'conv', nos: ['007'], until: iso(now - 60e3) }, // 已經回來了
    { id: 'e1', place: 'market', nos: ['002'], until: iso(now + H) },
    { id: 'e2', place: 'park', nos: ['004', '005'], until: iso(now + H + 5 * 60e3) },
    { id: 'e3', task: 'note', nos: ['003'], until: iso(now + 3 * H) },
    { id: 'e4', place: 'faraway', nos: ['008'], until: iso(now + 9 * H) },
  ] },
  battle: { active: [
    { id: 'b1', enemy: 'mochi', nos: ['001'], until: iso(now + 30 * 60e3), report: { win: false } },
    { id: 'b2', enemy: 'sock', nos: ['006'], until: iso(now + 9.1 * H) },
  ] },
};
const hm = (t) => new Date(t).toTimeString().slice(0, 5);
const notes = m.planNotes(st, { now, prefs: { ...m.DEFAULT_PREFS } });
assert.deepEqual(notes.map((n) => hm(n.at)), ['15:30', '16:05', '18:00', '08:00']);
assert.match(notes[0].title, /^第一隊打完了/); assert.doesNotMatch(notes[0].body, /輸|贏/, '不先爆雷');
assert.equal(notes[1].title, '大家都回來了 ♡'); assert.match(notes[1].body, /3 位回家了/);
assert.match(notes[2].title, /雨傘小湘忙完了/);
assert.equal(notes[3].title, '早安 ☀️'); assert.match(notes[3].body, /第二隊也打完了/);
assert.equal(new Set(notes.map((n) => n.tag)).size, notes.length, '每則 tag 不同，不會互相蓋掉');
notes.forEach((n) => { assert.match(n.tag, /^[\w-]{1,32}$/); assert.ok(n.title.length <= 40 && n.body.length <= 140); });
// 晚上安靜關掉：半夜照原本時間推（00:00、00:06 合成一則）
const loud = m.planNotes(st, { now, prefs: { ...m.DEFAULT_PREFS, quiet: false } });
assert.deepEqual(loud.map((n) => hm(n.at)), ['15:30', '16:05', '18:00', '00:06']);
// 只開回家
assert.ok(m.planNotes(st, { now, prefs: { ...m.DEFAULT_PREFS, battle: false } }).every((n) => !/隊/.test(n.title + n.body)));
assert.equal(m.planNotes(st, { now, prefs: { ...m.DEFAULT_PREFS, home: false, battle: false } }).length, 0);
// 安靜時段跨午夜：00:30 回來 → 同一天 08:00；23:30 → 隔天 08:00
assert.equal(hm(m.quietShift(new Date('2026-11-28T00:30:00+08:00').getTime()).at), '08:00');
assert.equal(new Date(m.quietShift(new Date('2026-11-27T23:30:00+08:00').getTime()).at).getDate(), 28);
assert.equal(m.quietShift(new Date('2026-11-27T22:59:00+08:00').getTime()).quiet, false);
// 空存檔、最多 8 則
assert.deepEqual(m.planNotes({}, { now }), []);
const many = { errands: { active: Array.from({ length: 12 }, (_, i) => ({ id: `x${i}`, place: 'conv', nos: ['002'], until: iso(now + (i + 1) * H / 2) })) } };
assert.ok(m.planNotes(many, { now, prefs: { ...m.DEFAULT_PREFS, quiet: false } }).length <= 8);
console.log('push-timers-plan: upcoming only, merge 10min, quiet 23-8, per-kind toggles, unique tags, cap 8 PASS');
