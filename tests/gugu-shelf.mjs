// node --test tests/gugu-shelf.mjs — 書靈咕咕：書架層數＋《咕咕禁書》（湘 11/28 A＋B，先只在測試服）
import test from 'node:test';
import assert from 'node:assert/strict';
import * as B from '../js/battle.js';
import * as G from '../js/gugu.js';
const TEAM = ['015', '061', '088'];
const base = () => { const s = { dex: Object.fromEntries(TEAM.map((n) => [n, { at: 'x', dup: 5 }])), affection: Object.fromEntries(TEAM.map((n) => [n, { pts: 99999 }])), energy: 0, fossils: 0, battle: { stages: { 'caramel-king': { stars: 3, best: 9, last: 9, clears: 1, tries: 1 } }, train: Object.fromEntries(TEAM.map((n) => [n, 5])) }, wishEgg: { stock: 0 } }; B.ensureBattle(s); return s; };
let t0 = new Date('2026-11-28T14:00:00+08:00').getTime();
const fight = (s, rand = () => 0) => { const now = new Date(t0 += 6 * 3600e3); const r = B.startBattle(s, 'gugu', TEAM, { now, rand }); assert.equal(typeof r, 'object', r); return B.collectBattle(s, r.id, new Date(now.getTime() + 3 * 3600e3), rand); };

test('正式服：咕咕照舊、存檔不多欄位', () => {
  globalThis.__SIANG_TEST__ = false;
  const s = base(); assert.equal(B.enemyFor(s, 'gugu').power, 48); assert.equal(B.enemyFor(s, 'gugu').floor, undefined);
  const out = fight(s); assert.equal(out.gugu, undefined); assert.equal('gugu' in s.battle, false); assert.equal(s.battle.pages.length, 0);
});

test('書架：每贏一層、戰力變高、每 5 層里程碑、最高 30 層', () => {
  globalThis.__SIANG_TEST__ = true;
  const s = base();
  assert.equal(B.enemyFor(s, 'gugu').floor, 1); assert.equal(B.enemyFor(s, 'gugu').power, 48);
  for (let i = 1; i <= 4; i++) fight(s);
  assert.equal(G.shelfCleared(s), 4); assert.equal(B.enemyFor(s, 'gugu').power, 48 + 12 * 4);
  const f0 = s.fossils; const out = fight(s);
  assert.equal(out.gugu.floor, 5); assert.deepEqual(out.gugu.milestone, { floor: 5, fossils: 10, badges: 2 });
  assert.ok(out.gains.some((g) => /第 5 層里程碑/.test(g))); assert.ok(s.fossils >= f0 + 10);
  // 輸了不會往上爬
  assert.equal(G.recordGugu(s, { win: false, floor: 6 }), null); assert.equal(G.shelfCleared(s), 5);
  s.battle.gugu.floor = 30; assert.equal(B.enemyFor(s, 'gugu').floor, 30); fight(s); assert.equal(G.shelfCleared(s), 30, '爬到頂就停在 30');
  assert.equal(G.floorBadges(25), 3);
});

test('禁書：30% 掉一頁、第 5 場保底、收齊有稱號和隱藏成就', async () => {
  globalThis.__SIANG_TEST__ = true; // 成就清單是載入時決定的（跟支線一樣），所以這裡才載入
  const { ACHIEVEMENTS } = await import('../js/achievements.js'); const { ownedTitles } = await import('../js/titles.js');
  const s = base();
  // rand 0.5：贏，但不會掉（> 30%）→ 第 5 場保底
  for (let i = 1; i <= 4; i++) assert.equal(fight(s, () => 0.5).gugu.page, undefined);
  const fifth = fight(s, () => 0.5); assert.ok(fifth.gugu.page); assert.equal(s.battle.gugu.dry, 0);
  assert.match(fifth.story, /還給本咕/);
  let last; while (s.battle.pages.length < G.GUGU_PAGES.length) last = fight(s);
  assert.equal(new Set(s.battle.pages).size, 8); assert.equal(last.gugu.complete, true); assert.match(last.story, /咕咕的共犯/);
  assert.equal(fight(s).gugu.page, undefined, '收齊後不再掉');
  const ach = ACHIEVEMENTS.find((a) => a.id === 'gugu-page-all'); assert.equal(ach.value(s), ach.goal);
  assert.ok(ownedTitles(s).find((t) => t.key === 'special:gugu-accomplice').owned);
  // 存檔整理後還在
  B.ensureBattle(s); assert.equal(s.battle.pages.length, 8); assert.equal(s.battle.gugu.floor, G.shelfCleared(s));
});
