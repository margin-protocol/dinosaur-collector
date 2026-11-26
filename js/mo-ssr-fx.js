// 墨痕蛋 SSR／UR 出貨演出（湘 11/26 選 B 劍光一閃）。點任何地方或「跳過」立刻結束；fast＝重複出貨時用快轉版。
// playMoSsrFx({ name, image, rarity, fast }) → Promise（演出結束或跳過時 resolve）

function build({ name, image, rarity, world = '墨痕江湖' }) {
  const root = document.createElement('div');
  root.className = 'mo-fx mo-fx--b';
  root.dataset.rarity = rarity;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', `${rarity} 出貨：${name}`);
  const glints = Array.from({ length: 14 }, (_, i) => `<i class="mo-fx__glint" style="left:${12 + (i * 37) % 76}%;top:${40 + (i * 23) % 40}%;animation-delay:calc(${(1.05 + (i % 5) * .12).toFixed(2)}s * var(--t))"></i>`).join('');
  root.innerHTML = `<div class="mo-fx__stage"><div class="mo-fx__reveal"><div class="mo-fx__mist"></div></div><div class="mo-fx__hero"><img alt=""></div>${glints}<div class="mo-fx__brush">一劍 · 驚鴻</div><div class="mo-fx__caption"><div class="mo-fx__world"></div><div class="mo-fx__name"></div></div><div class="mo-fx__seal"></div><div class="mo-fx__half mo-fx__half--top"></div><div class="mo-fx__half mo-fx__half--bot"></div><div class="mo-fx__slash"></div><div class="mo-fx__flash"></div></div><button class="mo-fx__skip" type="button">跳過</button>`;
  root.querySelector('.mo-fx__hero img').src = image;
  root.querySelector('.mo-fx__world').textContent = world;
  root.querySelector('.mo-fx__name').textContent = name;
  root.querySelector('.mo-fx__seal').textContent = rarity;
  return root;
}

export function playMoSsrFx({ name, image, rarity = 'SSR', fast = false, world } = {}) {
  const root = build({ name, image, rarity, world });
  const t = fast ? .5 : 1;
  root.style.setProperty('--t', String(t));
  document.body.append(root);
  const total = parseFloat(getComputedStyle(root).getPropertyValue('--dur')) || 2.7;
  return new Promise(resolve => {
    let done = false;
    const end = () => { if (done) return; done = true; clearTimeout(timer); root.remove(); document.removeEventListener('keydown', key); resolve(); };
    const key = e => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); end(); } };
    const timer = setTimeout(end, (total + .32) * t * 1000);
    root.addEventListener('click', end);
    document.addEventListener('keydown', key);
  });
}
