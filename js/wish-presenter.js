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
  if (id === '002') copy.line = `今天要找${wish.color}！要最甜、最可愛的那個喔。`;
  if (id === '003') copy.line = `走慢一點，我們一起找${wish.color}，不要淋濕了啦。`;
  if (id === '004') copy.line = `再讓我看一點${wish.color}就好……你不准陪我熬夜喔。`;
  // 其他角色暫時沿用通用文案（wishCopy 的幼年／成長語氣），之後再個別補
  return copy;
}
