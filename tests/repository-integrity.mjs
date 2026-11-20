// node tests/repository-integrity.mjs — catalog-driven art/copy/handoff checks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTERS, EGGS, EGG_LAYERS } from '../js/eggs.js';
import { ENEMIES } from '../js/battle.js';
import { PLACES, HOME_TASKS } from '../js/errands.js';
import { RECIPES, ensureRecipes } from '../js/recipes.js';
import { TEAM_BONDS } from '../js/team-bonds.js';
import { BOND_ART } from '../js/bond-art.js';
import { INTROS, MYSTERY_INTROS } from '../js/intros.js';
import { BOND_LINES, BOND_STORIES } from '../js/bond-copy.js';
import { TASTES } from '../js/taste-profiles.js';
import { SIANG_ANIMS } from '../js/siang-hd.js';
import { WISH_CHARACTER_VOICES } from '../js/wish-character-voices.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const exists = relative => fs.existsSync(path.join(root, relative));
const image = stem => ['webp', 'png'].some(ext => exists(`${stem}.${ext}`));
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const ids = Object.keys(CHARACTERS).sort();
assert(ids.length > 0);
for (const [label, data] of Object.entries({ INTROS, MYSTERY_INTROS, BOND_LINES, BOND_STORIES, TASTES, WISH_CHARACTER_VOICES })) {
  assert.deepEqual(Object.keys(data).sort(), ids, `${label}: catalog coverage`);
}
for (const c of Object.values(CHARACTERS)) assert(image(`assets/characters/${c.image}`), `character art: ${c.no}`);
for (const animation of Object.values(SIANG_ANIMS)) for (const frame of animation.frames) assert(exists(frame.src.split('?')[0]), `HD animation frame: ${frame.src}`);
for (const [id, egg] of Object.entries(EGGS)) {
  for (const layer of EGG_LAYERS) assert(image(`assets/eggs/${id}/${layer}`), `egg art: ${id}/${layer}`);
  for (const [no, weight] of Object.entries(egg.pool || {})) assert(CHARACTERS[no] && weight > 0, `egg pool: ${id}/${no}`);
}
for (const part of ['cradle-back', 'cradle-ring-back', 'cradle-front']) assert(image(`assets/incubator/${part}`), `incubator: ${part}`);
for (const enemy of Object.values(ENEMIES)) assert(image(`assets/enemies/${enemy.art}`), `enemy art: ${enemy.name}`);
for (const id of Object.keys(PLACES)) assert(image(`assets/places/${id}`), `place: ${id}`);
for (const id of Object.keys(HOME_TASKS)) assert(image(`assets/places/home-${id}`), `home task: ${id}`);
for (const file of ['assets/scene/home-bg.webp', 'assets/scene/ch3-toy-planet-battle.webp', 'assets/mascot/dinosaur-idle.webp', ...[180,192,512].map(size => `assets/icons/siang-icon-v2-${size}.png`)]) assert(exists(file), file);
const balance = read('docs/review/team-bonds/balance.json');
assert.deepEqual(balance.map(row => row.id).sort(), TEAM_BONDS.map(bond => bond.id).sort(), 'balance snapshot team coverage');
for (const row of balance) assert.deepEqual(row.stages.map(stage => stage.id).sort(), Object.keys(ENEMIES).sort(), 'balance snapshot stage coverage');
const members = new Set();
for (const bond of TEAM_BONDS) {
  assert.equal(bond.nos.length, 3, `bond size: ${bond.id}`);
  for (const no of bond.nos) { assert(CHARACTERS[no] && !members.has(no), `unique bond member: ${no}`); members.add(no); }
  // Explicit outstanding commission, documented in REPOSITORY_AUDIT.md. Runtime uses portraits.
  assert(BOND_ART[bond.id] && image(`assets/bonds/${bond.id}`), `bond illustration: ${bond.id}`);
}
const targets = new Set();
for (const recipe of RECIPES) {
  assert(CHARACTERS[recipe.target] && !targets.has(recipe.target), `recipe target: ${recipe.id}`); targets.add(recipe.target);
  assert(recipe.members.length === 2 && recipe.members[0] !== recipe.members[1] && recipe.members.every(no => CHARACTERS[no]), `recipe partners: ${recipe.id}`);
  assert(recipe.days > 0 && recipe.note, `recipe days/note: ${recipe.id}`);
  assert(!Object.values(EGGS).some(e => e.pool?.[recipe.target]), `recipe must not enter random pool: ${recipe.id}`);
}
const saved = { recipes: { 'strawberry-cake': { days: ['2026-01-01', '2026-01-02'], done: true } } };
ensureRecipes(saved); ensureRecipes(saved);
assert.deepEqual(saved.recipes['strawberry-cake'], { days: ['2026-01-01', '2026-01-02'], done: true }, 'legacy completion/history retained');
const profiles = read('data/SIANG_KITCHEN_TASTE_PROFILES.json').profiles;
assert.deepEqual(profiles.map(p => p.no).sort(), ids, 'kitchen handoff coverage');
for (const p of profiles) assert.deepEqual({ like: p.like, dislike: p.dislike, secret: [...p.secret_combo].sort() }, { ...TASTES[p.no], secret: [...TASTES[p.no].secret].sort() }, `kitchen handoff drift: ${p.no}`);
for (const file of fs.readdirSync(path.join(root, 'data/enemies'))) {
  const data = read(`data/enemies/${file}`);
  assert(exists(data.image), `enemy handoff image: ${file}`);
  const enemy = Object.values(ENEMIES).find(e => `assets/enemies/${e.art}.webp` === data.image);
  assert(enemy, `enemy handoff mapping: ${file}`);
  for (const field of ['power', 'minutes']) if (data[field] !== undefined) assert.equal(data[field], enemy[field], `${file}: ${field}`);
}
console.log(`repository integrity: ${ids.length} characters, ${Object.keys(EGGS).length} layered eggs, ${Object.keys(ENEMIES).length} enemies, ${RECIPES.length} recipes, ${TEAM_BONDS.length} bonds; art/copy/handoffs/legacy saves PASS`);
