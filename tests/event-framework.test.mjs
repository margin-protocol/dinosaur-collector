import test from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_DEFS, schedule, stageLock, ensureEvents, recordEventRun, tokenDrop, buy, shopList, settleLeftover, eventNow, noteServerTime, stageKey } from '../js/events.js';
import { forecast, startBattle, collectBattle, ensureBattle, SPEED_CAP, enemyFor } from '../js/battle.js';
import { teamSkills } from '../js/skills.js';
import { TEAM_BONDS, teamBond, countBondRuns } from '../js/team-bonds.js';
import { CHARACTERS } from '../js/eggs.js';

const def = EVENT_DEFS.mo;
const START = '2026-12-01T12:00:00+08:00';
const t0 = Date.parse(START);
const h = (n) => t0 + n * 3600e3;
const withStart = (fn) => { const old = def.start; def.start = START; try { return fn(); } finally { def.start = old; } };
const clearAll = (state, ids) => { ensureEvents(state); for (const id of ids) state.events.mo.stages[id] = { stars: 3, best: 1, clears: 1, tries: 1 }; };
const UP = def.phases[0].stages, DOWN = def.phases[1].stages;

test('unscheduled event stays hidden and locked', () => {
  const old = def.start; def.start = null;
  try { assert.equal(schedule(def, Date.now()).state, 'unscheduled');
  assert.match(stageLock({}, def, 'mo-01', Date.now()), /還沒開始/); } finally { def.start = old; }
});

test('schedule: down volume opens 72h after global start, battle 14 days, shop 21 days', () => withStart(() => {
  const s = {}; ensureEvents(s);
  assert.equal(schedule(def, h(-1)).state, 'upcoming');
  assert.equal(stageLock(s, def, 'mo-01', h(1)), null);
  clearAll(s, UP);
  assert.match(stageLock(s, def, 'mo-06', h(71)), /下卷.*還沒開放/);
  assert.equal(stageLock(s, def, 'mo-06', h(72)), null);
  const fresh = {}; ensureEvents(fresh);
  assert.match(stageLock(fresh, def, 'mo-06', h(80)), /要先打完上卷/);
  assert.match(stageLock(s, def, 'mo-07', h(80)), /前一關/);
  assert.equal(schedule(def, h(14 * 24)).state, 'shop');
  assert.match(stageLock(s, def, 'mo-01', h(14 * 24)), /結束/);
  assert.equal(schedule(def, h(21 * 24)).state, 'archived');
}));

test('trusted clock: server offset applies and time never goes backwards', () => {
  const s = {};
  noteServerTime(s, 1_000_000, 900_000);
  assert.equal(eventNow(s, 900_000), 1_000_000);
  assert.equal(eventNow(s, 500_000), 1_000_000); // 手機時間往回撥
});

test('token drop: base, first clear, MO bonus capped at +40%', () => {
  const w = (no) => (no.startsWith('MO-') || no === '117' ? 'mo' : 'origin');
  assert.equal(tokenDrop(def, 'mo-01', { win: true }), 6);
  assert.equal(tokenDrop(def, 'mo-01', { win: true, first: true }), 36);
  assert.equal(tokenDrop(def, 'mo-01', { win: false }), 2);
  assert.equal(tokenDrop(def, 'mo-10', { win: true, nos: ['MO-001', '117', '001'], worldOf: w }), Math.round(17 * 1.3));
  assert.equal(tokenDrop(def, 'mo-10', { win: true, nos: ['MO-001', '117', 'MO-003'], worldOf: w }), Math.round(17 * 1.4));
});

test('keepsakes only after 上卷, pity guarantees a drop, all five gives bonus', () => {
  const s = {}; ensureEvents(s);
  const win = { win: true, stars: 3, score: 1000 };
  recordEventRun(s, 'mo', 'mo-01', win, { rand: () => 0 });
  recordEventRun(s, 'mo', 'mo-01', win, { rand: () => 0 });
  assert.equal(Object.keys(s.events.mo.keepsakes).length, 0);
  clearAll(s, UP);
  let runs = 0;
  while (Object.keys(s.events.mo.keepsakes).length < 5) { recordEventRun(s, 'mo', 'mo-02', win, { rand: () => 0.99 }); runs++; assert.ok(runs < 100); }
  assert.equal(runs, 5 * def.keepsakes.pity);
  assert.ok(s.events.mo.completeAt);
});

test('shop: costs, limits, closed windows, Wen egg only once; leftover converts once', () => withStart(() => {
  const s = { energy: 0, dex: {}, gifts: { eggs: [] } }; ensureEvents(s);
  s.events.mo.tokens = 700;
  assert.match(buy(s, def, 'wen', h(-1)), /沒有開/);
  assert.equal(typeof buy(s, def, 'wen', h(1)), 'object');
  assert.equal(s.gifts.eggs[0].character, 'MO-001');
  assert.match(buy(s, def, 'wen', h(1)), /換完/);
  assert.equal(s.events.mo.tokens, 200);
  assert.equal(shopList(s, def, h(1)).some((x) => x.soon), false);
  assert.equal(typeof buy(s, def, 'energy', h(20 * 24)), 'object'); // 商店延長期
  assert.equal(s.energy, 20);
  assert.equal(settleLeftover(s, def, h(20 * 24)), null);
  assert.deepEqual(settleLeftover(s, def, h(22 * 24)), { tokens: 180, energy: 180 });
  assert.equal(settleLeftover(s, def, h(23 * 24)), null);
  assert.equal(s.energy, 200);
}));

test('ensureEvents keeps unknown events and survives garbage', () => {
  const s = { events: { future: { tokens: 5, stages: { a: { clears: 2 } } }, mo: { tokens: -3, keepsakes: { x: 1 } } } };
  ensureEvents(s);
  assert.equal(s.events.future.tokens, 5);
  assert.equal(s.events.future.stages.a.clears, 2);
  assert.equal(s.events.mo.tokens, 0);
});

test('skills: Wen −10% speed, Lv5 +5% power only with an origin resident', () => {
  const world = (no) => (no.startsWith('MO-') || no === '117' ? 'mo' : 'origin');
  assert.deepEqual(teamSkills(['MO-001', '117'], { level: () => 5, world }).power, 0);
  assert.equal(teamSkills(['MO-001', '001'], { level: () => 5, world }).power, 0.05);
  assert.equal(teamSkills(['MO-001', '001'], { level: () => 4, world }).power, 0);
  assert.equal(teamSkills(['MO-001'], { world }).speed, 0.1);
});

test('pair bond with runs: only the pair needs Lv5, needs N shared runs, best bond wins', () => {
  const pair = { id: 'test-pair', name: '測試', nos: ['001', '002'], power: 0, speed: 0.1, runs: 3 };
  TEAM_BONDS.unshift(pair);
  try {
    const max = { pts: 9999 };
    const s = { dex: { '001': {}, '002': {}, '003': {} }, affection: { '001': max, '002': max, '003': { pts: 0 } } };
    assert.equal(teamBond(s, ['001', '002', '003']), null);
    for (let i = 0; i < 3; i++) countBondRuns(s, ['003', '002', '001']);
    assert.equal(teamBond(s, ['001', '002', '003']).id, 'test-pair');
    assert.equal(teamBond(s, ['001', '002']).id, 'test-pair');
    s.affection['003'] = max; // 三位都滿：通用 +10% 只是後備，取效果最好的具名羈絆
    assert.equal(teamBond(s, ['001', '002', '003']).id, 'test-pair');
  } finally { TEAM_BONDS.shift(); }
});

test('all speed sources share one 25% cap', () => {
  assert.equal(SPEED_CAP, 0.25);
});

test('event battle end to end: progress goes to state.events, not battle.stages; snapshot survives event removal', () => withStart(() => {
  const s = { dex: { '001': { at: 'x' } }, affection: {}, energy: 0, fossils: 0, wishEgg: { stock: 0 }, gifts: { eggs: [] }, clock: { offset: 0, seen: h(1) } };
  ensureBattle(s);
  const key = stageKey('mo', 'mo-01');
  assert.equal(enemyFor(s, key).name, '迎親紙傀');
  const now = new Date(h(1));
  const b = startBattle(s, key, ['001'], { now, rand: () => 0 });
  assert.equal(typeof b, 'object', b);
  assert.ok(b.snapshot);
  const saved = def.stages['mo-01']; delete def.stages['mo-01']; // 模擬改版後資料不見
  try {
    ensureBattle(s);
    const res = collectBattle(s, b.id, new Date(h(3)), () => 0);
    assert.ok(res, 'collect works from snapshot');
  } finally { def.stages['mo-01'] = saved; }
  assert.equal(s.battle.stages[key], undefined);
}));

test('event battle win records clears and tokens', () => withStart(() => {
  const s = { dex: { '001': {}, '002': {}, '003': {} }, affection: {}, energy: 0, fossils: 0, wishEgg: { stock: 0 }, gifts: { eggs: [] }, clock: { offset: 0, seen: h(1) } };
  ensureBattle(s); s.battle.train = { '001': 5, '002': 5, '003': 5 };
  for (const no of ['001', '002', '003']) s.dex[no].dup = 5;
  const key = stageKey('mo', 'mo-01');
  const f = forecast(s, ['001', '002', '003'], key);
  assert.ok(f.chance === 1, `power ${f.total}`);
  const b = startBattle(s, key, ['001', '002', '003'], { now: new Date(h(1)), rand: () => 0 });
  const res = collectBattle(s, b.id, new Date(h(3)), () => 0);
  assert.equal(s.events.mo.stages['mo-01'].clears, 1);
  assert.equal(s.events.mo.tokens, 36);
  assert.ok(res.gains.some((g) => g.includes('墨玉 +36')));
  assert.ok(s.events.mo.story['mo-01:clear']);
}));

test('墨痕蛋: only MO residents (117, MO-001, MO-005, MO-008), not in star pool or other eggs, sold in 墨玉閣', async () => {
  const { EGGS } = await import('../js/eggs.js');
  assert.deepEqual(Object.keys(EGGS.mohen.pool).sort(), ['117', 'MO-001', 'MO-005', 'MO-008']);
  for (const id of Object.keys(EGGS)) if (id !== 'mohen') for (const no of Object.keys(EGGS.mohen.pool)) assert.equal(EGGS[id].pool?.[no], undefined, `${id} ${no}`);
  withStart(() => {
    const s = { dex: {}, gifts: { eggs: [] } }; ensureEvents(s); s.events.mo.tokens = 500;
    for (let i = 0; i < 5; i++) assert.equal(typeof buy(s, def, 'mohen-egg', h(1)), 'object');
    assert.match(buy(s, def, 'mohen-egg', h(1)), /換完/);
    assert.equal(s.gifts.eggs.filter((e) => e.egg === 'mohen').length, 5);
  });
});

test('all ten stages have story before/after; MO-05 and MO-10 have endings', () => {
  for (const id of Object.keys(def.stages)) { assert.ok(def.stages[id].story?.before, id); assert.ok(def.stages[id].story?.after, id); }
  assert.match(def.stages['mo-05'].story.ending, /上卷・完/);
  assert.match(def.stages['mo-10'].story.ending, /江湖再嫁/);
});
