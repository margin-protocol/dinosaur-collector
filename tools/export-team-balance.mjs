// node tools/export-team-balance.mjs — refresh the review snapshot from live rules.
import fs from 'node:fs';
import { CHARACTERS } from '../js/eggs.js';
import { LEVELS } from '../js/affection.js';
import { TEAM_BONDS, effectText } from '../js/team-bonds.js';
import { ENEMIES, ensureBattle, forecast } from '../js/battle.js';
const ids = TEAM_BONDS.flatMap(bond => bond.nos);
const state = { dex: Object.fromEntries(ids.map(no => [no, {}])), affection: Object.fromEntries(ids.map(no => [no, { pts: LEVELS.at(-1) }])), battle: {} };
ensureBattle(state);
const rows = TEAM_BONDS.map(bond => ({ ...bond, effect: effectText(bond), names: bond.nos.map(no => CHARACTERS[no].name), stages: Object.keys(ENEMIES).map(id => {
  const f = forecast(state, bond.nos, id);
  return { id, power: f.total, minutes: f.minutes, chance: f.chance, stars: f.stars, ratio: f.ratio };
}) }));
fs.writeFileSync(new URL('../docs/review/team-bonds/balance.json', import.meta.url), JSON.stringify(rows, null, 2) + '\n');
console.log(`Exported ${rows.length} teams × ${Object.keys(ENEMIES).length} stages; LV5=${LEVELS.at(-1)}, no stars/training/food.`);
