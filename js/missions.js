import { DAILY_XP } from './progression.js';
const node = (tag, cls, text) => { const el = document.createElement(tag); el.className = cls; if (text) el.textContent = text; return el; };
export function createMissions({ book, steps, onShoot, onSelect }) {
  let wishes = [], index = 0, reward = 35, fx = {}, day = '';
  function render() {
    if (!wishes.length) return;
    steps.replaceChildren(...wishes.map((wish, i) => {
      const button = node('button', `wish-step${wish.done ? ' is-done' : ''}`);
      button.type = 'button'; button.disabled = Boolean(fx.scanning);
      button.setAttribute('aria-pressed', String(i === index));
      button.setAttribute('aria-label', `願望 ${i + 1}：${wish.copy.name}${wish.done ? '，已完成' : ''}`);
      button.style.setProperty('--gem', wish.swatch);
      button.append(node('span', 'progress-gem', wish.done ? '✓' : '◆'), node('span', '', `0${i + 1}`));
      button.addEventListener('click', () => { index = i; render(); });
      return button;
    }));
    book.replaceChildren(...wishes.map((wish, i) => {
      const card = node('article', `mission${wish.done ? ' is-done' : ''}${fx.fresh === wish.id ? ' is-fresh' : ''}`);
      card.dataset.wish = wish.id; card.hidden = i !== index;
      card.style.setProperty('--mission-color', wish.swatch);
      const heading = node('h2', 'mission-title', wish.copy.name);
      card.append(node('div', 'mission-number', `WISH 0${i + 1} / 03`), heading, node('p', 'mission-hint', wish.copy.hint), node('p', 'mission-condition', '目標顏色占畫面 25% 以上'));
      const rewards = node('div', 'mission-rewards');
      rewards.innerHTML = `<span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3c1 4 5 6 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9Z"/></svg> +${reward} 能量</span><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6Z"/></svg> +${DAILY_XP} XP</span>`;
      if (!wish.done) card.append(rewards);
      if (wish.done) {
        card.append(node('div', 'mission-complete', '✓ 願望已實現'));
        const nextIndex = wishes.findIndex(w => !w.done);
        if (nextIndex >= 0) {
          const next = node('button', 'btn', '下一個願望 ⟶'); next.type = 'button'; next.disabled = Boolean(fx.scanning);
          next.addEventListener('click', () => { index = nextIndex; render(); }); card.append(next);
        }
      } else {
        const label = node('label', 'mission-shoot', fx.scanning === wish.id ? '辨識中…' : '拍照探索');
        label.innerHTML = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h4l2-3h4l2 3h4v13H4z"/><circle cx="12" cy="13" r="4"/></svg><span>${fx.scanning === wish.id ? '辨識中…' : '拍照探索'}</span><span aria-hidden="true">⟶</span>`;
        const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.className = 'visually-hidden'; input.disabled = Boolean(fx.scanning);
        input.setAttribute('aria-label', `${wish.copy.name}：${wish.copy.hint}`);
        input.addEventListener('change', () => { const file = input.files?.[0]; input.value = ''; if (file) { index = i; onShoot(wish, file); } });
        label.append(input); card.append(label);
      }
      return card;
    }));
    onSelect(wishes[index]);
  }
  return {
    update(nextWishes, rewardValue, effects = {}, context = {}) {
      wishes = nextWishes; reward = rewardValue; fx = effects;
      if (day !== context.date) { day = context.date; index = Math.max(0, wishes.findIndex(w => !w.done)); }
      if (effects.scanning) index = Math.max(0, wishes.findIndex(w => w.id === effects.scanning));
      if (index >= wishes.length) index = 0;
      render();
    },
    openAtFirstUndone() { index = Math.max(0, wishes.findIndex(w => !w.done)); render(); },
  };
}
