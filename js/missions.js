// 任務呈現層；每日內容、辨色與獎勵仍由原有遊戲模組決定。
export function gemEl(wish, lit, extra = '') {
  const el = document.createElement('span');
  el.className = `progress-gem${lit ? ' is-lit' : ''}${extra}`;
  el.style.setProperty('--gem', wish.swatch);
  el.textContent = '◆';
  return el;
}
const node = (tag, cls, text) => {
  const el = document.createElement(tag);
  el.className = cls;
  if (text) el.textContent = text;
  return el;
};
export function createMissions({ book, onShoot }) {
  return {
    update(wishes, reward, fx = {}) {
      book.replaceChildren(...wishes.map((wish, i) => {
        const card = node('article', `mission${wish.done ? ' is-done' : ''}${fx.fresh === wish.id ? ' is-fresh' : ''}`);
        card.dataset.wish = wish.id;
        card.style.setProperty('--mission-color', wish.swatch);
        const head = node('div', 'mission-head');
        head.append(node('span', 'mission-color'), node('span', 'mission-number', `WISH / 0${i + 1}`), node('span', 'mission-reward', wish.done ? '✓ 已獲得 +35' : `+${reward} 能量`));
        const title = node('h2', 'mission-title', wish.copy.name);
        const quote = node('p', 'mission-quote', `「${wish.copy.line}」`);
        const speaker = node('span', 'mission-speaker', `— ${wish.copy.speaker}`);
        const action = node('div', 'mission-action');
        action.append(node('p', 'mission-hint', wish.copy.hint));
        if (wish.done) action.append(node('span', 'mission-complete', '✓ 願望達成'));
        else {
          const label = node('label', 'mission-shoot', fx.scanning === wish.id ? '辨識中…' : '◎ 拍照探索');
          const input = document.createElement('input');
          input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
          input.className = 'visually-hidden'; input.disabled = Boolean(fx.scanning);
          input.setAttribute('aria-label', `${wish.copy.name}：${wish.copy.hint}`);
          input.addEventListener('change', () => { const file = input.files?.[0]; input.value = ''; if (file) onShoot(wish, file); });
          label.append(input); action.append(label);
        }
        card.append(head, title, quote, speaker, action);
        return card;
      }));
    },
    openAtFirstUndone() {},
    playOpening() {},
  };
}
