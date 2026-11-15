// 遊戲進度存在手機本機（Phase 2 會加上備份到私人 repo）
const KEY = 'siang-collector:v1';

const fresh = () => ({
  seenIntro: false,
  egg: { id: 'origin', warmth: 0 }, // 目前培育中的蛋；null 代表培育槽是空的
  dex: {}, // { '001': { at: ISO 時間 } }
});

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch {
    // 讀不到就當作新遊戲
  }
  return fresh();
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 存不了（例如無痕模式）時遊戲照常進行，只是不會保留進度
  }
}

export function resetState() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 同上
  }
  return fresh();
}
