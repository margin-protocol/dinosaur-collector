import { CHARACTERS } from './eggs.js';
import { wishCopy } from './wishes.js';
import { WISH_CHARACTER_VOICES } from './wish-character-voices.js';

export const PRESENTER_KEY = 'siang-collector:wish-character:v1';
export function selectedPresenter(state) {
  const owned = Object.keys(CHARACTERS).filter(no => state.dex?.[no]);
  try { const id = localStorage.getItem(PRESENTER_KEY); if (owned.includes(id)) return id; } catch {}
  return owned[0] || null;
}

// 角色口氣只包裝既有題目，不更動原本的名稱、hint 或判定。
// 專屬天氣委託若已遇見委託角色，仍由委託本人優先發言。
export function presenterCopy(wish, date, stage, id, dex = {}) {
  if (wish.owner && dex[wish.owner] && CHARACTERS[wish.owner]) {
    return { name: wish.name, line: wish.ownerLine, hint: wish.hint, speaker: CHARACTERS[wish.owner].name };
  }
  const special = Boolean(wish.kind && wish.kind !== 'color');
  const copy = special
    ? { name: wish.name, line: wish.line, hint: wish.hint, speaker: wishCopy({ ...wish, id: 'red', color: '' }, date, stage).speaker }
    : wishCopy(wish, date, stage);
  if (!id || !CHARACTERS[id]) return copy;

  copy.speaker = CHARACTERS[id].name;
  const voice = WISH_CHARACTER_VOICES[id];
  if (!voice) return copy;

  if (special) {
    // 包含雙色、彩虹、明暗、早晚、主題、互動、選擇題：永遠保留原題目文字。
    copy.line = voice.other.replace('{wish}', wish.line);
  } else if (id === '001') {
    // No.001 原味的幼年／成長語氣原樣保留。
    copy.line = wishCopy(wish, date, stage === 'grown' ? 'grown' : 'young').line;
  } else if (id === '002') {
    copy.line = `今天要找${wish.color}！要最甜、最可愛的那個喔。`;
  } else if (id === '003') {
    copy.line = `走慢一點，我們一起找${wish.color}，不要淋濕了啦。`;
  } else if (id === '004') {
    copy.line = `再讓我看一點${wish.color}就好……你不准陪我熬夜喔。`;
  } else if (voice.color) {
    copy.line = voice.color.replace('{color}', wish.color);
  }
  return copy;
}
