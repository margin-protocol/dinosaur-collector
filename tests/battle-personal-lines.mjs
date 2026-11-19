// node --experimental-default-type=module tests/battle-personal-lines.mjs
import assert from 'node:assert/strict';
import { CHARACTERS } from '../js/eggs.js';
import { BATTLE_PERSONAL_LINES } from '../js/battle-personal-lines.js';
import { WEATHER_LINES } from '../js/weather-lines.js';
import { RECIPE_LINES } from '../js/recipe-lines.js';
import { FRIEND_LINES } from '../js/friend-lines.js';
import { NAP_LINES } from '../js/nap-lines.js';
import { DEVTEAM_LINES } from '../js/devteam-lines.js';
import { EXTRA_LINES } from '../js/extra-lines.js';
import { HERO_LINES } from '../js/badge-heroes.js';
import { readFile } from 'node:fs/promises';

const existing = { ...WEATHER_LINES, ...RECIPE_LINES, ...FRIEND_LINES, ...NAP_LINES, ...DEVTEAM_LINES, ...EXTRA_LINES, ...HERO_LINES };
const all = { ...BATTLE_PERSONAL_LINES, ...existing };
const ids = Object.keys(CHARACTERS);
assert.equal(ids.length, 91);
assert.equal(Object.keys(existing).length, 30);
assert.equal(Object.keys(BATTLE_PERSONAL_LINES).length, 61);
assert.deepEqual(Object.keys(BATTLE_PERSONAL_LINES).sort(), ids.filter(no => !existing[no]).sort());
for (const no of ids) {
  assert(all[no], 'No.' + no + ' no personal battle lines');
  for (const key of ['dispatch', 'victory', 'defeat']) {
    assert(typeof all[no][key] === 'string' && all[no][key].trim().length > 0, 'No.' + no + ' missing ' + key);
  }
}
for (const [no, prior] of Object.entries(existing)) assert.equal(all[no], prior, 'Original No.' + no + ' overridden');
const source = await readFile(new URL('../js/battle.js', import.meta.url), 'utf8');
assert(source.includes("import { BATTLE_PERSONAL_LINES } from './battle-personal-lines.js';"));
assert(source.includes('const SPOKEN = { ...BATTLE_PERSONAL_LINES, ...WEATHER_LINES,'));
console.log('61 new roles x 3 lines; original 30 preserved; all 91 roles covered PASS');
