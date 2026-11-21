// 研究者等級擴充到 Lv.30（湘 11/21 B 案）：手作章節、新稱號、新指標、Lv.31 起輪換
import test from 'node:test';
globalThis.SIANG_CLASSIC_WISHES = true;
import assert from 'node:assert/strict';
import { hydrateProgression, growthGoals, goalProgress, claimGrowth, rankTitle, playerLevel, describeChapterReward } from '../js/progression.js';
import { RECIPES } from '../js/kitchen.js';
const fresh = () => hydrateProgression({ seenIntro: true, egg: { id: 'origin', warmth: 0, since: '2026-11-16T00:00:00Z' }, dex: {}, energy: 0, fossils: 0, hatched: 0, wishes: null });

test('chapters 13–30 are hand-made with unique names and three goals each', () => {
  const names = new Set();
  for (let lv = 13; lv <= 30; lv++) {
    const c = growthGoals(lv);
    assert.doesNotMatch(c.name, /同行旅程/); assert.equal(c.goals.length, 3); names.add(c.name);
    assert.ok(describeChapterReward(c.reward), `ch${lv} has a reward`);
  }
  assert.equal(names.size, 18);
  assert.equal(growthGoals(30).name, '永遠的飼養員');
  assert.match(growthGoals(31).name, /同行旅程 · 31/);
  assert.notDeepEqual(growthGoals(31).goals.map(g => g.metric), growthGoals(32).goals.map(g => g.metric));
  assert.deepEqual(growthGoals(31).goals.map(g => g.metric), growthGoals(34).goals.map(g => g.metric));
});

test('titles change every four levels after Lv.4', () => {
  assert.deepEqual([1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21, 24, 25, 29, 30, 45].map(rankTitle),
    ['初見研究者', '尋光研究者', '星願研究者', '星願研究者', '拾光研究者', '拾光研究者', '遠行研究者', '遠行研究者', '守護研究者', '守護研究者', '織夢研究者', '織夢研究者', '傳說研究者', '傳說研究者', '永恆研究者', '永恆研究者']);
});

test('new metrics read bond Lv.5, cooking, recipes, battle clears/stars and achievements', () => {
  const s = fresh();
  s.affection = { '001': { pts: 150 }, '002': { pts: 149 } };
  s.kitchen.cooked = 15;
  s.kitchen.known = Object.fromEntries(RECIPES.slice(0, 3).map(r => [[...new Set(r.ings)].sort().join('+'), '2026-11-21']));
  s.battle.stages = { mochi: { stars: 3, clears: 1 }, sock: { stars: 2, clears: 2 }, bento: { stars: 0, clears: 0 } };
  s.achievements.claimed = Array.from({ length: 20 }, (_, i) => `a${i}`);
  const val = (lv, i) => goalProgress(s, growthGoals(lv).goals[i]).current;
  assert.equal(val(14, 0), 1);
  assert.equal(val(15, 0), 15); assert.equal(val(15, 1), 3);
  assert.equal(val(16, 0), 2);
  assert.equal(val(25, 0), 5);
  assert.equal(val(20, 2), 20);
});

test('chapter 30 pays two wish eggs, a weather egg, fossils and energy, then levels up', () => {
  const s = fresh();
  s.player.xp = 29 * 100; assert.equal(playerLevel(s), 30);
  s.affection = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [String(i + 1).padStart(3, '0'), { pts: 200 }]));
  s.dex = Object.fromEntries(Array.from({ length: 90 }, (_, i) => [String(i + 1).padStart(3, '0'), { at: '2026-11-01' }]));
  s.player.stats.days = Array.from({ length: 50 }, (_, i) => `d${i}`);
  const wish = s.wishEgg.stock, weather = s.weather.stock;
  let out; for (const g of growthGoals(30).goals) out = claimGrowth(s, 30, g.id);
  assert.equal(out.chapter.level, 30);
  assert.equal(s.wishEgg.stock - wish, 2); assert.equal(s.weather.stock - weather, 1);
  assert.equal(s.fossils, 60); assert.equal(playerLevel(s), 31);
  assert.match(out.chapter.reward, /兩顆願望蛋/);
});
