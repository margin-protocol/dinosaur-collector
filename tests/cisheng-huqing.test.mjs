// 此生護卿 MO-012（湘 11/26）：海棠新娘小湘＋聞止水好感都 Lv.5 才出現在研究筆記、才能調配，3 天後送紀念蛋
import assert from 'node:assert/strict';
import { recipeOf, recipeHidden, bondReady, startBrew, finishBrews, DAY_MS } from '../js/lab.js';
import { LEVELS } from '../js/affection.js';
import { CHARACTERS } from '../js/eggs.js';

const r = recipeOf('cisheng-huqing');
assert.ok(r && r.target === 'MO-012' && r.days === 3 && r.bond === 5);
assert.equal(CHARACTERS['MO-012'].rarity, 'UR');
const max = LEVELS[LEVELS.length - 1];
const now = Date.parse('2026-12-01T12:00:00+08:00');

let s = { dex: {}, affection: {} };
assert.equal(recipeHidden(s, r), true, '還沒收集：藏起來');
s.dex = { '117': 1, 'MO-001': 1 };
s.affection = { '117': { pts: max }, 'MO-001': { pts: max - 1 } };
assert.equal(recipeHidden(s, r), true, '聞止水還沒 Lv.5：藏起來');
assert.equal(bondReady(s, r), false);
assert.match(String(startBrew(s, r.id, { now })), /Lv\.5/);
s.affection['MO-001'].pts = max;
assert.equal(recipeHidden(s, r), false, '兩位都 Lv.5：出現');
const res = startBrew(s, r.id, { now });
assert.equal(res.recipe.id, r.id);
assert.deepEqual(finishBrews(s, now + 3 * DAY_MS - 1), []);
finishBrews(s, now + 3 * DAY_MS);
assert.equal(s.gifts.eggs.at(-1).character, 'MO-012');
// 舊配方不受影響
assert.equal(recipeHidden({ dex: {}, affection: {} }, recipeOf('strawberry-cake')), false);
console.log('cisheng-huqing: PASS');
