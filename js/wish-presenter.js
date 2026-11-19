import { CHARACTERS } from './eggs.js';
import { wishCopy } from './wishes.js';
export const PRESENTER_KEY = 'siang-collector:wish-character:v1';
export function selectedPresenter(state) {
  const owned = Object.keys(CHARACTERS).filter(no => state.dex[no]);
  try { const id = localStorage.getItem(PRESENTER_KEY); if (owned.includes(id)) return id; } catch {}
  return owned[0] || null;
}
export function presenterCopy(wish, date, stage, id, dex = {}) {
  // 天氣小湘的委託：遇見過她，就由她本人開口
  if (wish.owner && dex[wish.owner]) return { name: wish.name, line: wish.ownerLine, hint: wish.hint, speaker: CHARACTERS[wish.owner].name };
  if (wish.kind && wish.kind !== 'color') {
    const base = wishCopy({ ...wish, id: 'red', color: '' }, date, stage);
    return { name: wish.name, line: wish.line, hint: wish.hint, speaker: id ? CHARACTERS[id].name : base.speaker };
  }
  const copy = wishCopy(wish, date, stage);
  if (!id) return copy;
  copy.speaker = CHARACTERS[id].name;
  if (id === '001') copy.line = wishCopy(wish, date, stage === 'grown' ? 'grown' : 'young').line;
  if (id === '002') copy.line = `今天要找${wish.color}！要最甜、最可愛的那個喔。`;
  if (id === '003') copy.line = `走慢一點，我們一起找${wish.color}，不要淋濕了啦。`;
  if (id === '004') copy.line = `再讓我看一點${wish.color}就好……你不准陪我熬夜喔。`;
  // 其他角色沿用通用文案（wishCopy 的幼年／成長語氣）；天氣小湘的委託見上方
  return copy;
}
