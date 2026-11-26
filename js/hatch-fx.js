// 一般蛋 SSR／UR 出貨演出（湘 11/26 選 B 櫻花綻放）：顏色跟著主題，UR 更華麗（金光、光芒、金花瓣）。
// playHatchFx({ name, image, rarity, fast }) → Promise；點任何地方或「跳過」立刻結束，fast＝重複出貨快轉

const DUR = [2.7, 3.1]; // SSR, UR

function petals(n, ur, start) {
  return Array.from({ length: n }, (_, i) => {
    const gold = ur && i % 3 === 0 ? ' is-gold' : '';
    return `<i class="hfx__petal${gold}" style="left:${(i * 37) % 100}%;--x:${((i * 53) % 140) - 50}px;--d:${(1.8 + (i % 5) * .25).toFixed(2)}s;--w:${(start + (i % 7) * .09).toFixed(2)}s"></i>`;
  }).join('');
}
function sparks(n) {
  return Array.from({ length: n }, (_, i) => `<i class="hfx__spark" style="left:${8 + (i * 41) % 84}%;top:${10 + (i * 29) % 62}%;--s:${10 + (i % 3) * 6}px;--w:${(1.6 + (i % 5) * .2).toFixed(2)}s">✦</i>`).join('');
}

function build({ name, image, rarity }) {
  const ur = rarity === 'UR';
  const root = document.createElement('div');
  root.className = 'hfx hfx--b';
  root.dataset.rarity = rarity;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', `${rarity} 出貨：${name}`);
  const ring = (cls, n, off, w0) => Array.from({ length: n }, (_, i) => `<i class="hfx__p${cls}" style="--r:${(off + i * 360 / n).toFixed(1)}deg;--w:${(w0 + i * .06).toFixed(2)}s"></i>`).join('');
  const prop = `<div class="hfx__flower">${ur ? ring(' is-back', 5, 36, .2) : ''}${ring('', 5, 0, .35)}<i class="hfx__core"></i></div>`;
  const reveal = ur ? 1.65 : 1.45;
  root.innerHTML = `<div class="hfx__stage"><div class="hfx__rays"></div>${prop}<div class="hfx__glow"></div>`
    + `<div class="hfx__hero"><img alt=""></div>${petals(ur ? 34 : 18, ur, reveal - .2)}${ur ? sparks(12) : ''}`
    + `<div class="hfx__caption"><span class="hfx__tag"></span><div class="hfx__name"></div></div></div><button class="hfx__skip" type="button">跳過</button>`;
  root.querySelector('.hfx__hero img').src = image;
  root.querySelector('.hfx__tag').textContent = ur ? '✦ UR ✦' : '✿ SSR';
  root.querySelector('.hfx__name').textContent = name;
  return root;
}

export function playHatchFx({ name, image, rarity = 'SSR', fast = false } = {}) {
  const root = build({ name, image, rarity });
  const t = fast ? .5 : 1;
  root.style.setProperty('--t', String(t));
  document.body.append(root);
  const total = DUR[rarity === 'UR' ? 1 : 0];
  return new Promise(resolve => {
    let done = false;
    const end = () => { if (done) return; done = true; clearTimeout(timer); root.remove(); document.removeEventListener('keydown', key); resolve(); };
    const key = e => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); end(); } };
    const timer = setTimeout(end, (total + .32) * t * 1000);
    root.addEventListener('click', end);
    document.addEventListener('keydown', key);
  });
}
