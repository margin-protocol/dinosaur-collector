// node --experimental-default-type=module tests/wish-character-voices.mjs
import assert from 'node:assert/strict';
import { CHARACTERS } from '../js/eggs.js';
import { WISH_CHARACTER_VOICES } from '../js/wish-character-voices.js';
import { presenterCopy } from '../js/wish-presenter.js';
import { WISH_POOL, wishById, wishesFor } from '../js/wishes.js';

const ids = Object.keys(CHARACTERS);
assert.equal(ids.length, 91);
assert.deepEqual(Object.keys(WISH_CHARACTER_VOICES).sort(), ids.sort());
const date = '2026-11-19';
for (const id of ids) {
  const voice = WISH_CHARACTER_VOICES[id];
  assert(typeof voice.other === 'string' && voice.other.includes('{wish}'), 'missing other voice: ' + id);
  if (Number(id) >= 5) assert(typeof voice.color === 'string' && voice.color.includes('{color}'), 'missing color voice: ' + id);
  for (const color of WISH_POOL) {
    const item = presenterCopy(wishById(color.id), date, 'young', id);
    assert.equal(item.speaker, CHARACTERS[id].name);
    assert(item.line && !item.line.includes('{color}'), 'color not rendered: ' + id);
    assert(item.hint.includes(color.color), 'hint changed: ' + id);
    if (Number(id) >= 5) assert(item.line.includes(color.color), 'color missing: ' + id);
  }
}
for (const kind of ['duo:red:green', 'rainbow', 'bright', 'dark', 'morning', 'night', 'theme:1', 'quiz:0', 'act:pet']) {
  const wish = wishById(kind);
  assert(wish, 'invalid test wish: ' + kind);
  for (const id of ids) {
    const copy = presenterCopy(wish, date, 'young', id);
    assert.equal(copy.name, wish.name, 'name changed: ' + kind + '/' + id);
    assert.equal(copy.hint, wish.hint, 'hint changed: ' + kind + '/' + id);
    assert(copy.line.includes(wish.line), 'original question missing: ' + kind + '/' + id);
    assert.equal(copy.speaker, CHARACTERS[id].name);
  }
}
const commission = wishById('theme:c0');
const owner = commission.owner;
const priority = presenterCopy(commission, date, 'young', '048', { [owner]: { at: date } });
assert.equal(priority.speaker, CHARACTERS[owner].name);
assert.equal(priority.line, commission.ownerLine);
const notOwned = presenterCopy(commission, date, 'young', '048');
assert.equal(notOwned.speaker, CHARACTERS['048'].name);
assert(notOwned.line.includes(commission.line));
const egg = presenterCopy(wishById('red'), date, 'egg', null);
assert.equal(egg.speaker, '蛋裡的小湘');
assert.equal(presenterCopy(wishById('quiz:0'), date, 'egg', null).line, wishById('quiz:0').line);
const wishes = wishesFor(date);
assert.equal(wishes.length, 3);
console.log('wish character voices: all 91 characters, 87 new color voices, nine task kinds, commissions, egg fallback PASS');
