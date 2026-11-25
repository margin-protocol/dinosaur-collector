// 測試服的全滿存檔（湘 11/25）。只有網址帶 ?test（js/test-boot.js 設好 __SIANG_TEST__）才會用到。
// 全部小湘和異世居民都在圖鑑裡：好感 Lv.5、5 星、特訓 5 級；主線關卡都打完了；活動進度從零開始，墨玉先給 1,000。
import { CHARACTERS } from './eggs.js';
import { LEVELS, BOND_SCALE } from './affection.js';
import { ENEMIES, MAX_STARS, MAX_TRAIN } from './battle.js';

export const IS_TEST = Boolean(globalThis.__SIANG_TEST__);
export const TEST_EVENT_HOURS_IN = 73; // 測試服：活動當作已經開跑 73 小時（下卷 72 小時後開放）

export function testSeed(base, now = new Date()) {
  const at = now.toISOString();
  const nos = Object.keys(CHARACTERS);
  const maxPts = LEVELS[LEVELS.length - 1];
  const stages = Object.fromEntries(Object.keys(ENEMIES).map((id) => [id, { stars: 3, best: 1500, last: 1500, clears: 1, tries: 1, firstAt: at }]));
  return {
    ...base,
    seenIntro: true,
    tutorial: { version: 1, status: 'complete', visitedEgg: true },
    dex: Object.fromEntries(nos.map((no) => [no, { at, dup: MAX_STARS }])),
    hatched: nos.length,
    energy: 9999,
    fossils: 9999,
    bondScale: BOND_SCALE,
    affection: Object.fromEntries(nos.map((no) => [no, { pts: maxPts, day: '', today: 0, home: '' }])),
    battle: { stages, badges: 999, train: Object.fromEntries(nos.map((no) => [no, MAX_TRAIN])), rest: {}, story: {}, active: [] },
    events: { mo: { tokens: 1000, earned: 1000 } },
    player: { version: 1, xp: 29 * 100, claimed: [], energyClaimed: [], stats: {} },
    testServer: at,
  };
}
