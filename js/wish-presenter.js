import { CHARACTERS } from './eggs.js';
import { wishCopy } from './wishes.js';
export const PRESENTER_KEY = 'siang-collector:wish-character:v1';
export function selectedPresenter(state) {
  const owned = Object.keys(CHARACTERS).filter(no => state.dex[no]);
  try { const id = localStorage.getItem(PRESENTER_KEY); if (owned.includes(id)) return id; } catch {}
  return owned[0] || null;
}
export function presenterCopy(wish, date, stage, id) {
  const copy = wishCopy(wish, date, stage);
  if (!id) return copy;
  copy.speaker = CHARACTERS[id].name;
  if (id === '001') copy.line = wishCopy(wish, date, stage === 'grown' ? 'grown' : 'young').line;
  if (id === '002') copy.line = `今天想收集一點${wish.color}，陪我一起找嘛。`;
  if (id === '003') copy.line = `把${wish.color}收進今天的小旅行，慢慢找也沒關係。`;
  if (id === '004') copy.line = `再給我看一點${wish.color}……看完就休息。`;
  return copy;
}
