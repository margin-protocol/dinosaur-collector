// 信物加成（只在活動關卡）、收齊送稱號、稱號只能戴一個
import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_DEFS, keepsakePower, keepsakeTokenBonus, tokenDrop, wearTitle, wornTitle, ensureEvents } from '../js/events.js';
const def = EVENT_DEFS.mo;
const all = Object.fromEntries(def.keepsakes.list.map((k) => [k.id, 'x']));
test('every keepsake has a perk and art', () => { for (const k of def.keepsakes.list) { assert.ok(k.perk, k.id); assert.ok(k.art, k.id); } });
test('power perks only apply to matching team', () => {
  const w = (no) => (String(no).startsWith('MO') || no === '117' ? 'MO' : 'origin');
  assert.equal(keepsakePower(def, {}, ['001'], { worldOf: w }).power, 0);
  assert.equal(keepsakePower(def, all, ['MO-005'], { worldOf: w }).power, 0);
  assert.equal(keepsakePower(def, all, ['001'], { worldOf: w }).power, 0.03);
  assert.equal(keepsakePower(def, all, ['MO-001', '117'], { worldOf: w }).power, 0.1);
  assert.equal(keepsakePower(def, all, ['MO-001', '117', '001'], { worldOf: w, eventFood: true }).power, 0.15);
});
test('red contract adds 5% tokens', () => {
  assert.equal(keepsakeTokenBonus(def, { 'red-contract': 'x' }), 0.05);
  const st = Object.keys(def.stages)[0];
  assert.ok(tokenDrop(def, st, { win: true, owned: { 'red-contract': 'x' } }) >= tokenDrop(def, st, { win: true }));
});
test('title wear is exclusive and validated', () => {
  const s = { events: { mo: { titles: ['mo-pen', 'mo-unwed'] } } }; ensureEvents(s);
  assert.equal(wearTitle(s, 'mo', 'mo-unwed'), '紅妝不嫁'); assert.equal(wornTitle(s).name, '紅妝不嫁');
  assert.equal(wearTitle(s, 'mo', 'mo-pen'), '執筆入江湖'); assert.equal(wornTitle(s).id, 'mo-pen');
  assert.equal(wearTitle(s, 'mo', null), null); assert.equal(wornTitle(s), null);
  const t = { events: { mo: { titles: [] } } }; ensureEvents(t); assert.equal(wearTitle(t, 'mo', 'mo-unwed'), null);
});
import { recordEventRun } from '../js/events.js';
test('last keepsake grants the title', () => {
  const up = def.phases.find((p) => p.id === 'up').stages;
  const s = { events: { mo: { stages: Object.fromEntries(up.map((id) => [id, { clears: 1, stars: 3, best: 1, tries: 1 }])), keepsakes: Object.fromEntries(def.keepsakes.list.slice(1).map((k) => [k.id, 'x'])) } } };
  ensureEvents(s);
  const out = recordEventRun(s, 'mo', up[0], { win: true, stars: 3, score: 100 }, { now: new Date(def.start || '2026-11-26T05:00:00Z'), rand: () => 0, worldOf: () => null, nos: ['001'] });
  assert.equal(out.complete, true); assert.equal(out.title, 'mo-unwed'); assert.match(out.keepsake.story, /婚書/); assert.match(def.keepsakes.completeStory, /趕上了/); assert.ok(s.events.mo.titles.includes('mo-unwed'));
});
