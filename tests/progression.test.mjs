import test from 'node:test';
import assert from 'node:assert/strict';
import { hydrateProgression, completeDaily, playerLevel, growthGoals, goalProgress, claimGrowth, ensureDaily, reconcileGrowthEnergy } from '../js/progression.js';
import { todayKey, wishesFor } from '../js/wishes.js';
const fresh = () => hydrateProgression({ seenIntro: true, egg: { id: 'origin', warmth: 0, since: '2026-11-16T00:00:00Z' }, dex: {}, energy: 0, fossils: 0, hatched: 0, wishes: null });
test('migration preserves legacy resources, collection and paid daily wishes without granting XP twice', () => {
  const id = wishesFor(todayKey())[0].id;
  const legacy = { seenIntro: true, egg: { id: 'ordinary', warmth: 80, since: '2026-11-01' }, energy: 71, fossils: 6, hatched: 3, dex: { '001': { at: '2026-11-01' } }, wishes: { date: todayKey(), done: [id], stage: 'young' } };
  const migrated = hydrateProgression(structuredClone(legacy));
  for (const key of Object.keys(legacy)) assert.deepEqual(migrated[key], legacy[key]);
  assert.equal(migrated.player.xp, 0);
  assert.equal(completeDaily(migrated, todayKey(), id).awarded, false);
  assert.equal(migrated.energy, 71);
  assert.deepEqual(hydrateProgression(structuredClone(migrated)), migrated);
});
test('each daily wish awards energy, XP and counters once; invalid ids and old dates award nothing', () => {
  const state = fresh();
  const date = todayKey();
  for (const wish of wishesFor(date)) {
    assert(completeDaily(state, date, wish.id).awarded);
    assert(!completeDaily(state, date, wish.id).awarded);
  }
  assert.equal(state.energy, 105); assert.equal(state.player.xp, 30);
  assert.equal(state.player.stats.wishes, 3); assert.equal(state.player.stats.colors.length, 3); assert.equal(state.player.stats.days.length, 1);
  const before = structuredClone(state);
  assert(!completeDaily(state, '2000-01-01', 'red').awarded);
  assert(!completeDaily(state, date, 'invented').awarded);
  assert.deepEqual(state, before);
});
test('growth rewards require completion and unlock, cannot repeat, and grant XP and energy together', () => {
  const state = fresh(); const goal = growthGoals(1).goals[0];
  assert(!claimGrowth(state, 1, goal.id).awarded);
  assert(!claimGrowth(state, 2, growthGoals(2).goals[0].id).awarded);
  completeDaily(state, todayKey(), wishesFor(todayKey())[0].id);
  assert(claimGrowth(state, 1, goal.id).awarded);
  assert(!claimGrowth(state, 1, goal.id).awarded);
  assert.equal(state.energy, 55); assert.equal(state.player.xp, 30);
  assert.deepEqual(state.player.energyClaimed, [goal.id]);
});
test('level-up and daily rollover retain unclaimed older chapters and permanent counters', () => {
  const state = fresh(); state.player.xp = 95; state.player.stats.wishes = 5;
  const goal = growthGoals(1).goals[0];
  assert(claimGrowth(state, 1, goal.id).awarded); assert.equal(playerLevel(state), 2);
  const fed = growthGoals(1).goals[1]; state.player.stats.fed = 10;
  const before = structuredClone(state.player);
  ensureDaily(state, '2026-12-31'); assert.deepEqual(state.player, before);
  assert(goalProgress(state, fed).complete);
  assert(claimGrowth(state, 1, fed.id).awarded);
  assert.equal(state.player.xp, 135);
});
test('each level has three unique lifetime goal ids, including later levels', () => {
  const ids = new Set();
  for (let level = 1; level <= 30; level++) {
    const goals = growthGoals(level).goals; assert.equal(goals.length, 3);
    for (const g of goals) { assert(!ids.has(g.id)); ids.add(g.id); assert(g.target > 0); }
  }
});

test('old growth claims receive energy once without replaying XP or changing incubation', () => {
  const state = fresh(); state.energy = 7; state.player.xp = 60;
  state.player.claimed = ['growth:1:1', 'growth:1:2', 'not-a-goal'];
  delete state.player.energyClaimed;
  const oldEgg = structuredClone(state.egg);
  const migrated = hydrateProgression(state);
  assert.equal(migrated.energy, 7, 'reading never pays rewards');
  assert.equal(reconcileGrowthEnergy(migrated), 40);
  assert.equal(migrated.energy, 47); assert.equal(migrated.player.xp, 60);
  assert.deepEqual(migrated.egg, oldEgg);
  assert.equal(reconcileGrowthEnergy(hydrateProgression(structuredClone(migrated))), 0);
  assert(!claimGrowth(migrated, 1, 'growth:1:1').awarded);
  assert.equal(migrated.energy, 47);
});
