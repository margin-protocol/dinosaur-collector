import test from 'node:test';
import assert from 'node:assert/strict';
import { EGGS, CHARACTERS, activePool, rollFor, JOIN_WHEN_OWNED } from '../js/eggs.js';

// 湘 11/21：加班皮寶、崩潰德寶、非酋／歐皇三部曲拿到之後才進普通蛋＋星光蛋
test('special eight stay out of every pool until owned', () => {
  for (const egg of Object.values(EGGS)) {
    const pool = activePool(egg, new Date(), {}) || {};
    for (const no of JOIN_WHEN_OWNED) assert.equal(pool[no], undefined, `${egg.id} ${no}`);
  }
});
test('once owned they join ordinary and star eggs only, at same-rarity weights', () => {
  const dex = Object.fromEntries(JOIN_WHEN_OWNED.map((no) => [no, { at: '2026-11-21' }]));
  const ord = activePool(EGGS.ordinary, new Date(), dex), star = activePool(EGGS.star, new Date(), dex);
  const want = { ordinary: { SR: 2, SSR: 0.6, UR: 0.3 }, star: { SR: 3, SSR: 1, UR: 1 } };
  for (const no of JOIN_WHEN_OWNED) {
    assert.equal(ord[no], want.ordinary[CHARACTERS[no].rarity]);
    assert.equal(star[no], want.star[CHARACTERS[no].rarity]);
  }
  for (const id of ['wish', 'cipher', 'weather', 'date']) for (const no of JOIN_WHEN_OWNED) assert.equal(activePool(EGGS[id], new Date(), dex)[no], undefined);
  assert.equal(Object.keys(EGGS.ordinary.pool).some((no) => JOIN_WHEN_OWNED.includes(no)), false, 'static pool untouched');
  const only = { '086': { at: 'x' } };
  assert.deepEqual(Object.keys(activePool(EGGS.ordinary, new Date(), only)).filter((no) => JOIN_WHEN_OWNED.includes(no)), ['086']);
});
test('hero squad (062-064) joins after badge redeem', () => {
  for (const no of ['062', '063', '064']) assert.ok(JOIN_WHEN_OWNED.includes(no), no);
  const dex = { '062': { at: 'x' }, '064': { at: 'x' } };
  const ord = activePool(EGGS.ordinary, new Date(), dex), star = activePool(EGGS.star, new Date(), dex);
  assert.equal(ord['062'], 2); assert.equal(ord['064'], 0.6); assert.equal(ord['063'], undefined);
  assert.equal(star['062'], 3); assert.equal(star['064'], 1);
});
test('rollFor can hatch an owned special from an ordinary egg', () => {
  const dex = { '101': { at: 'x' } };
  const orig = Math.random; let hit = false;
  try { for (let i = 0; i < 20000 && !hit; i++) hit = rollFor({ id: 'ordinary' }, [], { dex }) === '101'; } finally { Math.random = orig; }
  assert.ok(hit);
});
