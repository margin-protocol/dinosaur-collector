import test from 'node:test';
import assert from 'node:assert/strict';
import { startTutorial, tutorialStep } from '../js/tutorial.js';
const fresh = () => ({ seenIntro: true, energy: 0, egg: { warmth: 0 }, dex: {}, hatched: 0, bonus: { total: { gifts: 0 } }, player: { stats: { wishes: 0 } } });
const ctx = { needed: 100, giftAvailable: true, residents: 0, view: 'home' };
test('legacy saves remain silent; starting, pausing and resuming never mutate game progress', () => {
  const s = fresh(), before = structuredClone(s);
  assert.equal(tutorialStep(s, ctx), null);
  startTutorial(s);
  assert.equal(tutorialStep(s, ctx).id, 'egg');
  s.tutorial.status = 'paused'; assert.equal(tutorialStep(s, ctx), null);
  s.tutorial.visitedEgg = true; startTutorial(s); assert(s.tutorial.visitedEgg);
  const { tutorial, ...game } = s; assert.deepEqual(game, before);
});
test('real progress skips gifts and wishes; energy exhaustion returns to wishes; a ready egg always permits hatching', () => {
  const s = fresh(); startTutorial(s); s.tutorial.visitedEgg = true;
  assert.equal(tutorialStep(s, ctx).id, 'gift');
  s.bonus.total.gifts = 1; s.energy = 30;
  assert.equal(tutorialStep(s, ctx).id, 'wish');
  s.player.stats.wishes = 1; s.energy = 65;
  assert.equal(tutorialStep(s, ctx).id, 'feed');
  s.egg.warmth = 65; s.energy = 0;
  assert.equal(tutorialStep(s, ctx).id, 'wish');
  s.egg.warmth = 100;
  assert.equal(tutorialStep(s, ctx).id, 'feed');
  assert.match(tutorialStep(s, ctx).title, /準備好了/);
  // Even a passive hatch threshold with zero completed wishes or gifts must not trap a player.
  s.player.stats.wishes = 0; s.bonus.total.gifts = 0; s.tutorial.visitedEgg = false;
  assert.equal(tutorialStep(s, ctx).id, 'feed');
});
test('hatched saves guide toward home and arrangements without awarding or revealing another character', () => {
  const s = fresh(); s.hatched = 1; s.dex['001'] = { at: '2026-11-16' }; startTutorial(s);
  const before = structuredClone(s);
  assert.equal(tutorialStep(s, { ...ctx, view: 'incubate' }).action, '一起回家');
  assert.equal(tutorialStep(s, ctx).action, '安排小湘入住');
  assert.equal(tutorialStep(s, { ...ctx, residents: 1 }).action, '開始我們的日常');
  assert.deepEqual(s, before);
});

test('exhausted daily wishes offer snaps, then passive warmth instead of an unavailable photo task', () => {
  const s = fresh(); startTutorial(s); s.tutorial.visitedEgg = true;
  s.bonus.total.gifts = 1; s.player.stats.wishes = 3; s.wishes = { done: ['a', 'b', 'c'] };
  assert.equal(tutorialStep(s, ctx).target, '#snap-label');
  assert.equal(tutorialStep(s, { ...ctx, snapsRemaining: 0 }).id, 'rest');
  s.egg.warmth = 100;
  assert.equal(tutorialStep(s, { ...ctx, snapsRemaining: 0 }).id, 'feed');
});
