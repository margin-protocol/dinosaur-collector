// 書靈咕咕加動力（湘 11/28 選 A＋B）
// B 書架層數：每贏一次往上爬一層，戰力和獎勵跟著變高；每 5 層第一次爬上去有里程碑獎勵
// A 禁書書頁：贏咕咕有機會掉「禁書一頁」（咕咕偷記的居民八卦），收在檔案館的特殊書頁
// 上線前只有測試服（?test）看得到：GUGU_LIVE 改成 true 才對所有玩家開放
import { GUGU_PAGES, GUGU_BOOK } from './gugu-pages.js';

export const GUGU_LIVE = false;
export const guguOn = () => GUGU_LIVE || Boolean(globalThis.__SIANG_TEST__);
export { GUGU_PAGES, GUGU_BOOK };

export const SHELF = { base: 48, step: 12, max: 30, every: 5 };
export const PAGE_DROP = { chance: 0.3, pity: 5 }; // 30%；連續 4 場沒掉，第 5 場一定掉

// 現在要挑戰的層數（爬過的最高層 +1，最高 30 層，爬到頂就一直打第 30 層）
export const shelfCleared = (state) => Math.min(SHELF.max, state.battle?.gugu?.floor | 0);
export const shelfFloor = (state) => Math.min(SHELF.max, shelfCleared(state) + 1);
export const floorPower = (n) => SHELF.base + SHELF.step * (Math.max(1, n) - 1);
export const floorBadges = (n) => 1 + Math.floor((Math.max(1, n) - 1) / 10); // 1～10 層 1 個、11～20 層 2 個、21～30 層 3 個
export const floorMilestone = (n) => (n > 0 && n % SHELF.every === 0 ? { floor: n, fossils: n * 2, badges: 2 } : null);
export const nextMilestone = (state) => { const c = shelfCleared(state); const n = Math.ceil((c + 1) / SHELF.every) * SHELF.every; return n <= SHELF.max ? floorMilestone(n) : null; };
export const milestoneText = (m) => `+${m.fossils} 化石、徽章 +${m.badges}`;

export const pagesOwned = (state) => (state.battle?.pages || []).filter((id) => GUGU_PAGES.some((p) => p.id === id));
export const pageById = (id) => GUGU_PAGES.find((p) => p.id === id) || null;

// 收下咕咕的戰報時呼叫：爬層、里程碑、禁書書頁。只在打贏時有東西
export function recordGugu(state, r, rand = Math.random) {
  const b = state.battle;
  const g = (b.gugu = { floor: b.gugu?.floor | 0, dry: b.gugu?.dry | 0 });
  if (!r.win) return null;
  const out = {};
  if (r.floor && r.floor === g.floor + 1 && g.floor < SHELF.max) {
    g.floor = r.floor; out.floor = r.floor;
    const m = floorMilestone(r.floor);
    if (m) { state.fossils = (state.fossils || 0) + m.fossils; b.badges += m.badges; out.milestone = m; }
  }
  const owned = new Set(b.pages || []);
  const left = GUGU_PAGES.filter((p) => !owned.has(p.id));
  if (left.length) {
    g.dry += 1;
    if (rand() < PAGE_DROP.chance || g.dry >= PAGE_DROP.pity) {
      const page = left[Math.floor(rand() * left.length) % left.length];
      b.pages = [...(b.pages || []), page.id]; g.dry = 0;
      out.page = page; out.pages = b.pages.length; out.complete = left.length === 1;
    }
  }
  return out;
}
