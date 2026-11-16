// 每週賓果：每週一換一張 3×3 小任務，用這週累計的數字自動判定；連成一線可以領獎
const t = (s, k) => s.bonus?.total?.[k] || 0;
// 每一格都用「累計數字」計算，週初記下起點，進度 = 現在 - 起點
export const BINGO_POOL = [
  { id: 'hatch', text: '孵化 2 顆蛋', goal: 2, metric: (s) => s.hatched || 0 },
  { id: 'wish', text: '完成 6 個願望', goal: 6, metric: (s) => s.player?.stats?.wishes || 0 },
  { id: 'fulldays', text: '2 天完成三個願望', goal: 2, metric: (s) => s.wishEgg?.days?.length || 0 },
  { id: 'snap', text: '隨手收藏 8 張', goal: 8, metric: (s) => t(s, 'snaps') },
  { id: 'pet', text: '摸摸頭 10 次', goal: 10, metric: (s) => t(s, 'pets') },
  { id: 'snack', text: '餵布丁 5 次', goal: 5, metric: (s) => t(s, 'snacks') },
  { id: 'greet', text: '打招呼 8 次', goal: 8, metric: (s) => t(s, 'greets') },
  { id: 'task', text: '完成 3 個小恐龍委託', goal: 3, metric: (s) => t(s, 'tasks') },
  { id: 'explore', text: '探索 2 天', goal: 2, metric: (s) => t(s, 'explores') },
  { id: 'fed', text: '注入 300 能量', goal: 300, metric: (s) => s.player?.stats?.fed || 0 },
  { id: 'gift', text: '領 4 次見面禮', goal: 4, metric: (s) => t(s, 'gifts') },
  { id: 'dex', text: '遇見 1 位新的小湘', goal: 1, metric: (s) => Object.keys(s.dex || {}).length },
];
export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
export const REWARDS = { firstLine: '一顆願望蛋', line: 40, full: 150 };

export function weekKey(d = new Date()) {
  const day = (d.getDay() + 6) % 7; // 週一 = 0
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}
function seeded(seed) { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; }

export function ensureBingo(state, now = new Date()) {
  const week = weekKey(now);
  const old = state.bingo;
  if (old?.week === week && Array.isArray(old.cells) && old.cells.length === 9) {
    state.bingo = { ...old, claimed: Array.isArray(old.claimed) ? old.claimed.filter((x) => typeof x === 'string') : [] };
    return state.bingo;
  }
  const rand = seeded(week);
  const ids = BINGO_POOL.map((c) => c.id).sort(() => rand() - 0.5).slice(0, 9);
  state.bingo = { week, cells: ids.map((id) => ({ id, base: BINGO_POOL.find((c) => c.id === id).metric(state) })), claimed: [] };
  return state.bingo;
}

export function bingoStatus(state) {
  const cells = state.bingo.cells.map((cell) => {
    const def = BINGO_POOL.find((c) => c.id === cell.id);
    const value = Math.max(0, Math.min(def.goal, def.metric(state) - cell.base));
    return { ...def, value, done: value >= def.goal };
  });
  const lines = LINES.map((l, i) => ({ id: `line-${i}`, cells: l, done: l.every((k) => cells[k].done) }));
  const full = cells.every((c) => c.done);
  return { cells, lines, full };
}
export function bingoReady(state) {
  const st = bingoStatus(state);
  return st.lines.filter((l) => l.done && !state.bingo.claimed.includes(l.id)).length + (st.full && !state.bingo.claimed.includes('full') ? 1 : 0);
}
// 領取所有已完成、還沒領的獎勵
export function claimBingo(state) {
  const st = bingoStatus(state);
  const got = { wishEgg: 0, energy: 0 };
  for (const l of st.lines) {
    if (!l.done || state.bingo.claimed.includes(l.id)) continue;
    const firstLine = !state.bingo.claimed.some((c) => c.startsWith('line-'));
    state.bingo.claimed.push(l.id);
    if (firstLine) { state.wishEgg.stock += 1; got.wishEgg += 1; } else { state.energy += REWARDS.line; got.energy += REWARDS.line; }
  }
  if (st.full && !state.bingo.claimed.includes('full')) { state.bingo.claimed.push('full'); state.energy += REWARDS.full; got.energy += REWARDS.full; }
  return got;
}
