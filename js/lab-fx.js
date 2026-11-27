// 研究室調配完成演出（湘 11/27 選 C 書頁拼合、間距 2、要融入配方詩句）：
// 兩位各站在半頁書上，頁首寫著詩的前兩句（一人一句），從左右滑進來、中間留一條縫；
// 縫裡透出光、書頁像門一樣打開、紙片飛散，紀念蛋升起，詩的後半句浮出來。secret 配方（頁邊江湖、此生護卿）換金色。
// playLabFx({ members:[{name,image},{name,image}], title, poem, secret, fast }) → Promise
// 點任何地方或「跳過」立刻結束；fast＝快轉（減少動態效果時用）

const DUR = 4.5;
const EGG = 'assets/eggs/keepsake';

const bits = (n, cls, fn) => Array.from({ length: n }, (_, i) => `<i class="${cls}" style="${fn(i)}"></i>`).join('');

// 配方詩都是「一位……，一位……。後半」：前兩句分給兩位，後半在蛋出現後浮出來；拆不開就整首放後半
export function splitPoem(poem = '') {
  const m = /^([^，。？！]+)，([^。？！]+[。？！])(.+)$/.exec(String(poem).trim());
  return m ? { left: m[1], right: m[2].replace(/。$/, ''), rest: m[3].trim() } : { left: '', right: '', rest: String(poem).trim() };
}

function build({ members, title, poem, secret }) {
  const root = document.createElement('div');
  root.className = 'lfx lfx--c';
  root.dataset.secret = secret ? '1' : '0';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', `研究室調配完成：${title}`);
  const sparks = bits(10, 'lfx__spark', i => `left:${10 + (i * 41) % 80}%;top:${18 + (i * 29) % 50}%;--s:${10 + (i % 3) * 5}px;--w:${(.12 + (i % 5) * .14).toFixed(2)}s`);
  const scraps = bits(14, 'lfx__scrap', i => `left:${46 + (i % 3) * 3}%;--x:${((i * 47) % 260) - 130}px;--y:${-120 - (i * 31) % 200}px;--r:${(i * 67) % 360}deg;--w:${(1.85 + (i % 5) * .05).toFixed(2)}s`);
  const page = side => `<div class="lfx__page is-${side}"><div class="lfx__page-face"><p class="lfx__line"></p><img alt=""><span class="lfx__pname"></span></div></div>`;
  root.innerHTML = `<div class="lfx__stage"><div class="lfx__rays"></div><div class="lfx__book">${page('l')}${page('r')}</div><i class="lfx__seam"></i>${scraps}`
    + `<div class="lfx__glow"></div><div class="lfx__egg"><img class="lfx__egg-glow" alt=""><img class="lfx__egg-shell" alt=""><div class="lfx__sparks">${sparks}</div></div>`
    + `<p class="lfx__verse"></p><div class="lfx__caption"><span class="lfx__tag"></span><div class="lfx__title"></div><div class="lfx__sub">收到一顆紀念蛋，到「選擇蛋」孵化吧</div></div><div class="lfx__flash"></div></div>`
    + `<button class="lfx__skip" type="button">跳過</button>`;
  const lines = splitPoem(poem);
  root.querySelectorAll('.lfx__page').forEach((p, i) => {
    const who = members[i] || members[0];
    p.querySelector('img').src = who.image;
    p.querySelector('.lfx__pname').textContent = who.name;
    p.querySelector('.lfx__line').textContent = i ? lines.right : lines.left;
  });
  root.querySelector('.lfx__verse').textContent = lines.rest;
  root.querySelector('.lfx__egg-glow').src = `${EGG}/glow.webp`;
  root.querySelector('.lfx__egg-shell').src = `${EGG}/shell.webp`;
  root.querySelector('.lfx__tag').textContent = secret ? '✦ 隱藏配方 ✦' : '🧪 調配完成';
  root.querySelector('.lfx__title').textContent = `《${title}》`;
  return root;
}

export function playLabFx({ members, title, poem = '', secret = false, fast = false } = {}) {
  const root = build({ members, title, poem, secret });
  const t = fast ? .5 : 1;
  root.style.setProperty('--t', String(t));
  root.style.setProperty('--dur', `${DUR}s`);
  document.body.append(root);
  return new Promise(resolve => {
    let done = false;
    const end = () => { if (done) return; done = true; clearTimeout(timer); root.remove(); document.removeEventListener('keydown', key); resolve(); };
    const key = e => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); end(); } };
    const timer = setTimeout(end, (DUR + .32) * t * 1000);
    root.addEventListener('click', end);
    document.addEventListener('keydown', key);
  });
}
