// 頁邊江湖三寶（湘 11/26）：墨點集齊送皮寶、修門 3 天＋破廟送德寶、研究室配方出湘寶、劇場順序
import assert from 'node:assert/strict';
import * as S from '../js/studio-jh.js';
import { RECIPES } from '../js/recipes.js';
import { CHARACTERS, EGGS } from '../js/eggs.js';
import { ACHIEVEMENTS } from '../js/achievements.js';

const fresh = () => ({ dex: {}, gifts: { eggs: [] }, events: { mo: { stages: {} } } });
// 墨點
let s = fresh();
for (const [i, id] of S.INKS.entries()) {
  const r = S.tapInk(s, id, new Date('2026-11-29T05:00:00Z'));
  assert.equal(r.count, i + 1); assert.equal(r.rumor, S.RUMORS[id]);
  assert.equal(r.egg, i === S.INKS.length - 1 ? 'MO-009' : null);
}
assert.equal(S.tapInk(s, 'banner'), null, '同一滴點兩次不算');
assert.equal(s.gifts.eggs.filter((e) => e.character === 'MO-009').length, 1);
assert.equal(s.gifts.eggs[0].from, 'studio:MO-009');
// 修門：一天一次，3 天後沒打過破廟要等木料
s = fresh();
assert.equal(S.doorState(s, '2026-11-29').step, 'fix');
assert.equal(S.fixDoor(s, '2026-11-29').n, 1);
assert.equal(S.fixDoor(s, '2026-11-29'), S.DOOR_LINES.today, '同一天第二次');
S.fixDoor(s, '2026-11-30'); const r3 = S.fixDoor(s, '2026-12-02');
assert.equal(r3.n, 3); assert.equal(r3.line, S.DOOR_LINES.wood);
assert.equal(S.doorState(s, '2026-12-03').step, 'wood');
assert.equal(S.fixDoor(s, '2026-12-03'), S.DOOR_LINES.wood);
s.events.mo.stages['mo-05'] = { clears: 1 };
assert.equal(S.doorState(s, '2026-12-03').step, 'install');
const done = S.fixDoor(s, '2026-12-03'); assert.equal(done.egg, 'MO-010');
assert.equal(S.doorState(s, '2026-12-04').step, 'done');
assert.equal(S.doorCount(s), 3);
// 舊存檔亂資料清乾淨
s = { studioJh: { ink: { banner: 'x', nope: 'x', stage: 3 }, door: ['a', 'a', 'b', 'c', 'd'], granted: { 'MO-011': 'x' }, seen: { opening: 'x', bad: 1 } } };
S.ensureStudio(s);
assert.deepEqual(s.studioJh, { ink: { banner: 'x' }, door: ['a', 'b', 'c'], granted: {}, seen: { opening: 'x' } });
// 劇場：兩寶都到手 → 開業第一日；湘寶 → 不祥的金光（開業先播）
s = fresh(); s.dex = { 'MO-009': {}, 'MO-010': {}, 'MO-011': {} };
assert.equal(S.storyDue(s), 'opening'); S.markSeen(s, 'opening');
assert.equal(S.storyDue(s), 'merge'); S.markSeen(s, 'merge');
assert.equal(S.storyDue(s), null);
// 配方、角色、蛋池、成就
const rc = RECIPES.find((r) => r.id === 'margin-chief');
assert.deepEqual([rc.target, ...rc.members, rc.days, rc.secret], ['MO-011', 'MO-009', 'MO-010', 2, true]);
assert.equal(CHARACTERS['MO-011'].rarity, 'UR');
for (const egg of Object.values(EGGS)) for (const no of ['MO-009', 'MO-010', 'MO-011']) assert.ok(!egg.pool?.[no], `${no} 不在 ${egg.id} 蛋池`);
for (const id of ['jh-pibao', 'jh-debao', 'jh-chief', 'jh-branch']) assert.ok(ACHIEVEMENTS.find((a) => a.id === id)?.secret, id);
// 開放時間：下卷 11/29 12:00（台北）
assert.equal(S.isOpen(Date.parse('2026-11-29T03:59:59Z')), false); assert.equal(S.isOpen(Date.parse('2026-11-29T04:00:00Z')), true);
assert.equal(S.tpeDay(Date.parse('2026-11-29T16:30:00Z')), '2026-11-30');
console.log('studio-jh: PASS');
