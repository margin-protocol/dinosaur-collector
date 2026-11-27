// node --test tests/night-battle.mjs — 連戰到天亮：8 小時、5 折、一天一次、回來休息 2 小時（湘 11/28 選 A）
import test from 'node:test';
import assert from 'node:assert/strict';
process.env.TZ = 'Asia/Taipei'; // 夜戰券照本地時間中午換日
import * as B from '../js/battle.js';
import { EVENT_DEFS } from '../js/events.js';
const base = () => { const s = { dex: Object.fromEntries(['001', '002', '003', '004', '005', '006'].map((n) => [n, { at: 'x' }])), energy: 0, fossils: 0, battle: { stages: {}, train: {} }, wishEgg: { stock: 0 } }; B.ensureBattle(s); return s; };
const now = new Date('2026-11-28T14:00:00+08:00');
test('needs a previous clear; wild cannot', () => {
  const s = base();
  assert.equal(B.nightStatus(s, 'mochi', now).ok, false);
  assert.match(B.startBattle(s, 'mochi', ['001'], { now, night: true }), /先打贏/);
  const w = s.battle.wild?.list?.[0]; if (w) assert.equal(B.nightStatus(s, w.key, now).ok, false);
  assert.equal('nightDay' in s.battle, false, '沒用過不寫進存檔');
});
test('8 hours, half loot, once a day, 2h rest', () => {
  const s = base(); s.battle.stages.mochi = { stars: 1, best: 1, last: 1, clears: 1, tries: 1 };
  const one = B.startBattle(structuredClone(s), 'mochi', ['001', '002', '003'], { now, rand: () => 0 });
  const r = B.startBattle(s, 'mochi', ['001', '002', '003'], { now, night: true, rand: () => 0 });
  assert.equal(typeof r, 'object'); assert.equal(r.night, true);
  assert.equal(Date.parse(r.until) - now.getTime(), 8 * 3600e3);
  const runs = r.report.night.runs; assert.equal(runs, B.nightRuns(B.forecast(s, ['001', '002', '003'], 'mochi').minutes)); assert.ok(runs > 1);
  assert.equal(r.report.loot.energy, Math.round(one.report.loot.energy * runs * 0.5));
  assert.equal(r.report.loot.badges, Math.round(one.report.loot.badges * runs * 0.5));
  assert.equal(s.battle.nightDay, '2026-11-28');
  { const t = base(); t.battle.nightDay = B.nightDayKey(new Date('2026-11-28T23:00:00+08:00')); assert.equal(B.nightTickets(t, new Date('2026-11-29T00:30:00+08:00')), 0, '跨過半夜不會多一張'); }
  s.battle.stages.sock = { stars: 1, best: 1, last: 1, clears: 1, tries: 1 };
  assert.match(B.nightStatus(s, 'sock', now).reason, /夜戰券用完/);
  const back = new Date(now.getTime() + 8 * 3600e3 + 1);
  const out = B.collectBattle(s, r.id, back);
  assert.ok(out.gains[0].startsWith('🌙 連戰'));
  assert.equal(Date.parse(s.battle.rest['001']) - back.getTime(), 120 * 60e3);
  assert.equal(B.nightStatus(s, 'mochi', new Date('2026-11-29T09:00:00+08:00')).ok, false, '隔天早上還沒補');
  assert.equal(B.nightStatus(s, 'mochi', new Date('2026-11-29T12:00:00+08:00')).ok, true, '中午 12 點補 1 張');
});
test('event stage tokens are summed then halved; daily win stays full', () => {
  const def = EVENT_DEFS.mo; const stageId = Object.keys(def.stages)[0]; const key = `event:mo:${stageId}`;
  const s = base(); s.events = { mo: { stages: { [stageId]: { clears: 1, stars: 1, best: 1, tries: 1 } } } }; B.ensureBattle(s);
  const at = new Date(def.start ? Date.parse(def.start) + 3600e3 : now);
  const st = B.nightStatus(s, key, at); assert.ok(st.ok, st.reason);
  const r = B.startBattle(s, key, ['001', '002', '003'], { now: at, night: true, rand: () => 0 });
  assert.equal(typeof r, 'object', String(r));
  const out = B.collectBattle(s, r.id, new Date(at.getTime() + 8 * 3600e3 + 1), () => 0.99);
  const runs = r.report.night.runs; const drop = def.stages[stageId].drop;
  assert.equal(out.event.tokens, Math.round(drop * runs * 0.5));
  assert.equal(out.event.daily, def.dailyWin);
});
