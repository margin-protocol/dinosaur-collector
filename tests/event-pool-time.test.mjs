// 墨痕蛋下卷居民（poolFrom 11/29 12:00）照傳進來的校正時間決定，不看手機時間（湘 11/25）
import test from 'node:test';
import assert from 'node:assert/strict';
import { EGGS, rollFor } from '../js/eggs.js';
const DOWN = ['MO-003', 'MO-004', 'MO-006', 'MO-007'];
test('下卷開放前不會孵到下卷居民，開放後會', () => {
  const egg = { id: 'mohen' }; const dex = {};
  const before = new Date('2026-11-29T11:59:00+08:00'), after = new Date('2026-11-29T12:00:00+08:00');
  const got = new Set(); for (let i = 0; i < 400; i++) got.add(rollFor(egg, [], { dex, now: before }));
  assert.deepEqual(DOWN.filter((n) => got.has(n)), []);
  const got2 = new Set(); for (let i = 0; i < 400; i++) got2.add(rollFor(egg, [], { dex, now: after }));
  assert.ok(DOWN.some((n) => got2.has(n)));
  assert.ok(EGGS.mohen.pool['MO-003']);
});
