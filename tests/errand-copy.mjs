// node --experimental-default-type=module tests/errand-copy.mjs
import assert from 'node:assert/strict';
import { PLACE_REPORTS, SERIES_REPORTS, CHARACTER_REPORTS, HOME_REPORTS, NOTE_TEXTS, PAIR_STORY_VARIANTS } from '../js/errand-copy.js';
import { CHARACTERS } from '../js/eggs.js';
import { depart, collect, ensureErrands, STORIES } from '../js/errands.js';

assert.equal(Object.keys(PLACE_REPORTS).length, 6);
for (const [place, lines] of Object.entries(PLACE_REPORTS)) assert(lines.length >= 10, place);
for (const [place, lines] of Object.entries(HOME_REPORTS)) assert(lines.length >= 10, place);
assert(NOTE_TEXTS.length > 12);
assert.equal(STORIES.length, 8);
for (const s of STORIES) assert.equal(PAIR_STORY_VARIANTS[s.id].length, 2, s.id);
for (const [id] of Object.entries(CHARACTER_REPORTS)) assert(CHARACTERS[id], id);
for (const [id] of Object.entries(SERIES_REPORTS)) assert(id === 'daily' || Object.values(CHARACTERS).some(c => c.series === id), id);

const at = new Date('2026-11-19T01:00:00.000Z');
const state = {
  dex: {'001': {at: at.toISOString()}, '005': {at: at.toISOString()}, '048': {at: at.toISOString()},'064':{at:at.toISOString()}},
  energy: 100, fossils: 0, bonus:{snacks:{count:0}},wishEgg:{stock:0},
  egg:{id:'ordinary',warmth:0}, letters:{mail:[]},dino:{}, travel:{eggs:[]}
};
ensureErrands(state);
function once(choice, index) {
  const start = new Date(at.getTime() + index * 3600e3);
  const e = depart(state, choice, start, () => 0);
  assert.equal(typeof e, 'object', JSON.stringify(e));
  const r = collect(state, e.id, {now:new Date(start.getTime() + 24 * 3600e3), eggs:{ordinary:{warmthNeeded:100}}});
  assert(r);
  return r;
}
const lines = [];
for (let i = 0; i < 7; i++) lines.push(once({place:'conv',nos:['001']},i).line);
assert.equal(new Set(lines.slice(0, 5)).size, 5, 'no immediate duplicate solo reports');
assert(lines.every(Boolean));
const stories = [];
for (let i = 10; i < 13; i++) {
  const r = once({place:'park',nos:['001','005']},i);
  assert.equal(r.story?.id,'origin');
  stories.push(r.story.text);
}
assert.equal(new Set(stories).size,3,'all 3 variants show before repeating');
assert.equal(Object.keys(state.errands.stories).length, 1,'story id kept as first discovery');
const h1=once({task:'guard',nos:['001']},14);assert(h1.line);assert(h1.gains.some(x=>x.includes('溫度')));
const h2=once({task:'note',nos:['005']},15);assert(h2.line);assert.equal(state.letters.mail.length,1);
const h3=once({task:'dino',nos:['001']},16);assert(h3.line);assert.equal(state.dino.double,true);
assert(!state.errands.album.some(x=>x.task),'home tasks remain outside album');
const legacy=depart(state,{place:'beach',nos:['001','005']},new Date(at.getTime()+20*3600e3),()=>0);
delete legacy.loot.storyVariant;
const old=collect(state,legacy.id,{now:new Date(at.getTime()+48*3600e3),eggs:{ordinary:{warmthNeeded:100}}});
assert(old.story && old.story.id === 'origin','legacy active errand variant fallback');
const legacySave={errands:{active:[],total:1,stories:{origin:at.toISOString()}}};
ensureErrands(legacySave);
assert.deepEqual(legacySave.errands.recentLines,{});
assert.deepEqual(legacySave.errands.recentStories,{});
console.log('errand-copy: 6 places, 8×3 stories, solo no-repeat, home narratives, legacy saves PASS');
