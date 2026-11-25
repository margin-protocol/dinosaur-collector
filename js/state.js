import { hydrateProgression, reconcileGrowthEnergy } from './progression.js';
import { IS_TEST, testSeed } from './test-server.js';
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
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
    if (raw) return hydrateProgression({ ...fresh(), ...JSON.parse(raw) });
    // 測試服（?test）第一次打開：送一份全滿存檔（存在 siang-test: 底下，跟正式存檔分開）
    if (IS_TEST) { const seeded = hydrateProgression(testSeed(fresh())); saveState(seeded); return seeded; }
  } catch {
    // 讀不到就當作新遊戲，但先把原本那份另存起來（11/19）：不然下一次存檔會把它蓋掉，進度就救不回來了
    try { if (raw && !localStorage.getItem(`${KEY}:unreadable`)) localStorage.setItem(`${KEY}:unreadable`, raw); } catch {}
  }
  return hydrateProgression(fresh());
}

const notify = (type) => { try { globalThis.dispatchEvent?.(new Event(type)); } catch {} };
// 存檔之後要通知的地方（例如回家／討伐提醒重排）；出錯不影響存檔
const saveHooks = [];
export const onSave = (fn) => { saveHooks.push(fn); };
export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    if (volatileState) notify('siang-save-ok'); // 之前存不進去、現在又可以了
    volatileState = null;
    for (const fn of saveHooks) { try { fn(state); } catch {} }
  } catch {
    volatileState = JSON.stringify(state);
    // 存不進去（通常是手機空間滿了）：這次先留在記憶體裡不重置進度，但要讓畫面提醒玩家（11/25）
    notify('siang-save-failed');
  }
}

export function resetState() {
  volatileState = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 同上
  }
  return IS_TEST ? loadState() : hydrateProgression(fresh());
}

// All game-resource writes share a lock and read the latest save inside it.
const SAVE_LOCK_HOLD_MS = 30;
export async function updateState(mutator) {
  const commit = () => {
    const state = loadState();
    const growthEnergyAdded = reconcileGrowthEnergy(state);
    const result = mutator(state);
    saveState(state);
    return { state, result, growthEnergyAdded };
  };
  if (!globalThis.navigator?.locks) return commit();
  // 存完先把結果交回去，但鎖再多握一下（11/21）：localStorage 同步到別的分頁要幾毫秒，
  // 太快放鎖的話，另一個分頁拿到鎖時會讀到舊存檔，同一個獎勵可能被領兩次。
  return new Promise((resolve, reject) => {
    navigator.locks.request('siang-game-save', () => {
      let out; try { out = commit(); } catch (e) { reject(e); return; }
      resolve(out);
      return new Promise(r => setTimeout(r, SAVE_LOCK_HOLD_MS));
    }).catch(reject);
  });
}
