// 收到台灣小湘時的專屬演出（湘 11/28）：取代一般 UR 的櫻花綻放。
// variant 'a' 島嶼匯聚：十九位縣市小湘在島上依序亮起，聚成一顆光，台灣小湘出現。
// variant 'b' 旅行箱：旅行箱彈開，十九張車票繞成一圈，台灣小湘從箱子裡站起來。
// variant 'c' 梅花（湘 11/28 要）：十九位縣市小湘的光繞成一圈收進花苞，梅花綻開、花瓣散落，台灣小湘出現。
// 點任何地方或「跳過」立刻結束。playTaiwanFx({ variant, fast }) → Promise
import { CHARACTERS, characterSources } from './eggs.js';

const X = (lon) => (lon - 119.9) * 92, Y = (lat) => (25.4 - lat) * 100; // 本島框：約 200×360
const SPOT = {
  '016': [121.55, 25.07], '017': [121.78, 24.95], '018': [121.72, 25.14], '019': [121.22, 24.93], '020': [120.92, 24.82], '021': [121.16, 24.68],
  '022': [120.92, 24.5], '023': [120.85, 24.22], '024': [120.47, 23.98], '025': [120.98, 23.86], '026': [120.33, 23.72], '027': [120.42, 23.47],
  '028': [120.64, 23.4], '029': [120.3, 23.12], '030': [120.55, 22.87], '031': [120.62, 22.48], '032': [121.68, 24.62], '033': [121.42, 23.83], '034': [121.08, 22.85],
};
const NOS = Object.keys(SPOT);
const src = (no) => new URL(characterSources(CHARACTERS[no].image)[0], location.href).href;
const short = (no) => CHARACTERS[no].county.replace(/[縣市]$/, '').replace('臺', '台');

async function islandSvg() {
  try {
    const d = await (await fetch('assets/geo/counties.json')).json();
    return `<svg class="twx__map" viewBox="0 0 200 360" aria-hidden="true">${d.counties.map((c) => `<path d="${c.rings.map((r) => `M${r.map(([a, b]) => `${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join('L')}Z`).join('')}"/>`).join('')}</svg>`;
  } catch { return ''; }
}

export async function playTaiwanFx({ variant = 'a', fast = false } = {}) {
  const root = document.createElement('div');
  root.className = `twx twx--${variant}`; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'UR 出貨：台灣小湘');
  root.style.setProperty('--t', fast ? '.5' : '1');
  const hero = `<div class="twx__hero"><img alt="" src="${src('061')}"></div><div class="twx__cap"><span class="twx__tag">UR</span><b>台灣小湘</b><small>我把一座島藏在心裡</small></div>`;
  if (variant === 'a') {
    root.innerHTML = `<div class="twx__stage"><div class="twx__island">${await islandSvg()}${NOS.map((no, i) => `<i style="left:${X(SPOT[no][0]) / 2}%;top:${Y(SPOT[no][1]) / 3.6}%;--i:${i};--dx:${((100 - X(SPOT[no][0])) * 1.05).toFixed(1)}px;--dy:${((180 - Y(SPOT[no][1])) * 1.05).toFixed(1)}px;--img:url('${src(no)}')"></i>`).join('')}</div><div class="twx__orb"></div><div class="twx__flash"></div>${hero}</div><button class="twx__skip" type="button">跳過</button>`;
  } else if (variant === 'c') {
    const petals = [0, 72, 144, 216, 288].map((r, i) => `<i class="twx__pt" style="--r:${r}deg;--i:${i}"></i>`).join('');
    const stamens = Array.from({ length: 14 }, (_, i) => `<i style="--r:${i * (360 / 14)}deg;--l:${i % 2 ? 15 : 20}px"></i>`).join('');
    const fall = Array.from({ length: 28 }, (_, i) => `<i class="twx__fall" style="left:${(i * 37) % 100}%;--x:${((i * 53) % 90) - 45}px;--d:${(2.55 + (i % 7) * .09).toFixed(2)}s;--sz:${8 + (i % 4) * 3}px;--sp:${(2.4 + (i % 5) * .35).toFixed(2)}s"></i>`).join('');
    root.innerHTML = `<div class="twx__stage"><div class="twx__orbit">${NOS.map((no, i) => `<i style="--a:${(i / NOS.length) * 360}deg;--i:${i};--img:url('${src(no)}')"></i>`).join('')}</div><div class="twx__plum"><div class="twx__bloom">${petals}<div class="twx__stamen">${stamens}</div></div></div><div class="twx__flash"></div>${fall}${hero}</div><button class="twx__skip" type="button">跳過</button>`;
  } else {
    root.innerHTML = `<div class="twx__stage"><div class="twx__ring">${NOS.map((no, i) => `<span style="--a:${(i / NOS.length) * 360}deg;--i:${i}"><em style="--img:url('${src(no)}')"></em>${short(no)}</span>`).join('')}</div><div class="twx__case"><div class="twx__lid"></div><div class="twx__body"></div></div><div class="twx__flash"></div>${hero}</div><button class="twx__skip" type="button">跳過</button>`;
  }
  document.body.append(root);
  const total = parseFloat(getComputedStyle(root).getPropertyValue('--dur')) || 4.2;
  const t = fast ? .5 : 1;
  return new Promise((resolve) => {
    let done = false;
    const end = () => { if (done) return; done = true; clearTimeout(timer); root.remove(); document.removeEventListener('keydown', key); resolve(); };
    const key = (e) => { if (['Escape', 'Enter', ' '].includes(e.key)) { e.preventDefault(); end(); } };
    const timer = setTimeout(end, (total + .4) * t * 1000);
    root.addEventListener('click', end); document.addEventListener('keydown', key);
  });
}
