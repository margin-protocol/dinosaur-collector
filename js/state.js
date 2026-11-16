import { hydrateProgression, reconcileGrowthEnergy } from './progression.js';
// 遊戲進度存在手機本機（Phase 2 會加上備份到私人 repo）
const KEY = 'siang-collector:v1';
let volatileState = null;

export const newEgg = (id) => ({ id, warmth: 0, since: new Date().toISOString() });

const fresh = () => ({
  seenIntro: false,
  egg: newEgg('origin'), // 目前培育中的蛋
  dex: {}, // { '001': { at: ISO 時間 } }
  energy: 0, // 保溫能量：完成願望取得，點蛋時注入
  fossils: 0, // 化石碎片：孵到重複的小湘時取得
  hatched: 0, // 累計孵化數
  wishes: null, // { date: 'YYYY-MM-DD', done: ['red', ...] }
});

export function loadState() {
  if (volatileState) return hydrateProgression(JSON.parse(volatileState));
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return hydrateProgression({ ...fresh(), ...JSON.parse(raw) });
  } catch {
    // 讀不到就當作新遊戲
  }
  return hydrateProgression(fresh());
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    volatileState = null;
  } catch {
    volatileState = JSON.stringify(state);
    // Storage unavailable: retain this session without resetting progress.
  }
}

export function resetState() {
  volatileState = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 同上
  }
  return hydrateProgression(fresh());
}

// All game-resource writes share a lock and read the latest save inside it.
export async function updateState(mutator) {
  const commit = () => {
    const state = loadState();
    const growthEnergyAdded = reconcileGrowthEnergy(state);
    const result = mutator(state);
    saveState(state);
    return { state, result, growthEnergyAdded };
  };
  return globalThis.navigator?.locks ? navigator.locks.request('siang-game-save', commit) : commit();
}
