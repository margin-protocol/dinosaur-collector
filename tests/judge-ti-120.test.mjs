// No.120 法官ㄊㄧ（湘 11/27）：蛋池、三隻ㄊㄧ／湘寶彩蛋、隱藏成就《十五年，不接受上訴》
import assert from 'node:assert/strict';
const { CHARACTERS, EGGS } = await import('../js/eggs.js');
const c = CHARACTERS['120'];
assert.equal(c.name, '法官ㄊㄧ'); assert.equal(c.rarity, 'UR'); assert.equal(c.series, 'friends');
assert.equal(EGGS.ordinary.pool['120'], 0.3); assert.equal(EGGS.cipher.pool['120'], 0.75);
const { talksFor } = await import('../js/luck-talk.js');
assert.equal(talksFor('120', ['115', '116', '120']).length, 1);
assert.equal(talksFor('115', ['115', '116', '120']).length, 5);
assert.equal(talksFor('120', ['120', 'MO-011']).length, 1);
assert.equal(talksFor('120', ['120']).length, 0);
const { ACHIEVEMENTS } = await import('../js/achievements.js');
const a = ACHIEVEMENTS.find((x) => x.id === 'judge-ti-15');
assert.ok(a && a.secret && a.story && a.storyArt === 'siang-120-judge-ti');
assert.equal(a.value({ dex: {} }), 0);
assert.equal(a.value({ dex: { '120': {} }, affection: { '120': { pts: 0 } } }), 0);
assert.equal(a.value({ dex: { '120': {} }, affection: { '120': { pts: 1e9 } } }), 1);
for (const s of [JSON.stringify(c), a.story]) assert.ok(!s.includes('熊貓'));
console.log('judge-ti-120 PASS');
