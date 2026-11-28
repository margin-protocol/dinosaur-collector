// 台灣小湘《我把一座島藏在心裡》故事動畫（湘 11/28 要）：地圖旅程版。
// 故事本文直接用 INTROS['061']（每行一句）；這裡只決定每一句的畫面：鏡頭跟著旅程在島上移動、
// 走過的縣市亮起來、那位縣市小湘的頭像跳出來並留在地圖上；最後十九道光聚成紀念蛋，台灣小湘出現。
// 只演出，不讀寫存檔。playTaiwanStory({ text }) → Promise（關閉時 resolve）。
import { CHARACTERS, characterSources } from './eggs.js';

const X = (lon) => (lon - 118.2) * 92;
const Y = (lat) => (26.3 - lat) * 100;
// 鏡頭（世界座標框）
const CAMS = {
  island: [150, 85, 365, 455], north: [222, 80, 362, 222], central: [160, 130, 305, 285],
  south: [148, 240, 275, 445], east: [218, 130, 365, 390], wide: [0, 0, 365, 455], center: [150, 85, 365, 455],
};
// 頭像位置（縣市中心附近，擠在一起的稍微挪開）
const SPOT = {
  '016': [121.55, 25.07], '017': [121.78, 24.95], '018': [121.72, 25.14], '019': [121.22, 24.93],
  '020': [120.92, 24.82], '021': [121.16, 24.68], '022': [120.92, 24.5], '023': [120.85, 24.22],
  '024': [120.47, 23.98], '025': [120.98, 23.86], '026': [120.33, 23.72], '027': [120.42, 23.47],
  '028': [120.64, 23.4], '029': [120.3, 23.12], '030': [120.55, 22.87], '031': [120.62, 22.48],
  '032': [121.68, 24.62], '033': [121.42, 23.83], '034': [121.08, 22.85],
};
const OFFSHORE = [['澎湖', 119.58, 23.57], ['金門', 118.35, 24.45], ['馬祖', 119.95, 26.15]];
const ALL = Object.keys(SPOT);

// 每一句的畫面：用句子開頭比對。沒寫的設定沿用上一句；light 會累加（走過的縣市一直亮著）。
const CUES = [
  ['她有一只永遠裝不滿的旅行箱', { scene: 'case', items: 0 }],
  ['裡面沒有昂貴的珠寶', { items: 1 }],
  ['一張車票、一枚貝殼', { items: 5 }],
  ['那是她走過整座島的證明', { items: 5 }],
  ['最初，她並不知道', { scene: 'map', cam: 'wide' }],
  ['島嶼不大', { cam: 'island' }],
  ['每個名字背後', { twinkle: true }],
  ['於是她決定去看看', { twinkle: false }],
  ['她從北方出發', { cam: 'north', pop: ['018', '016', '017'] }],
  ['桃園的飛機', { cam: 'central', pop: ['019', '020', '021', '022'] }],
  ['她在台中的午後', { pop: ['023', '024', '025'] }],
  ['有些地方很熱鬧', { pop: [] }],
  ['旅程繼續向南', { cam: 'south' }],
  ['雲林的田野', { pop: ['026', '027', '028', '029'] }],
  ['到了高雄', { pop: ['030'] }],
  ['屏東小湘帶她去看', { pop: ['031'], sea: true }],
  ['於是她又踏上旅途', { pop: [] }],
  ['她沿著東方的海岸', { cam: 'east', pop: ['034', '033', '032'], sea: false }],
  ['她也搭過船', { cam: 'wide', pop: [], boats: true }],
  ['海洋也是道路', { routes: true }],
  ['當然，旅行並不總是順利', { cam: 'island', boats: false, routes: false, rain: true }],
  ['每當這種時候', { rain: false, pop: ['017', '025', '029', '033'] }],
  ['但每當她準備離開', { pop: ALL, wave: true }],
  ['她便認真地點頭', { pop: [], wave: false }],
  ['直到有一天', { scene: 'map', cam: 'island', glow: true }],
  ['它們慢慢聚攏', { scene: 'gather' }],
  ['而當蛋殼裂開時', { scene: 'hatch' }],
  ['她看了看四周', { scene: 'home' }],
  ['後來，她仍然喜歡旅行', { scene: 'journal' }],
  ['偶爾，也會有人問她', { scene: 'her' }],
  ['最後，她轉過頭', { scene: 'hand' }],
  ['她曾經以為', { scene: 'island-heart' }],
  ['她把一座島藏在心裡', { scene: 'title' }],
];

export function storyBeats(text) {
  const lines = String(text || '').split('\n').map((s) => s.trim()).filter(Boolean);
  let cur = { scene: 'case', cam: 'wide', pop: [], items: 0 }; const lit = new Set();
  return lines.map((line) => {
    const cue = CUES.find(([k]) => line.startsWith(k));
    if (cue) cur = { ...cur, ...cue[1] };
    if (cue && !('pop' in cue[1]) && ['scene', 'cam'].some((k) => k in cue[1]) && cue[1].scene !== 'map') cur.pop = [];
    for (const no of cur.pop) lit.add(no);
    if (cur.glow) ALL.forEach((no) => lit.add(no));
    return { ...cur, line, lit: [...lit], quote: /^「.*」$/.test(line) };
  });
}

const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const img = (no) => new URL(characterSources(CHARACTERS[no].image)[0], location.href).href;

async function mapPaths() {
  try {
    const d = await (await fetch('assets/geo/counties.json')).json();
    return d.counties.map((c) => ({ name: c.name, d: c.rings.map((r) => `M${r.map(([lo, la]) => `${X(lo).toFixed(1)},${Y(la).toFixed(1)}`).join('L')}Z`).join('') }));
  } catch { return []; }
}

export async function playTaiwanStory({ text, auto = false } = {}) {
  const beats = storyBeats(text);
  const counties = Object.fromEntries(ALL.map((no) => [CHARACTERS[no].county, no]));
  const paths = await mapPaths();
  const root = el('div', 'tws');
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', '台灣小湘的故事');
  root.innerHTML = `<div class="tws__view"><div class="tws__world">
      <svg class="tws__map" viewBox="0 0 365 455" aria-hidden="true">
        <g class="tws__routes">${OFFSHORE.map(([, lo, la]) => `<path d="M${X(lo)},${Y(la)} Q${(X(lo) + 200) / 2},${(Y(la) + 240) / 2 - 30} 200,240"/>`).join('')}</g>
        ${paths.map((p) => `<path class="tws__county" data-no="${counties[p.name] || ''}" d="${p.d}"/>`).join('')}
        ${OFFSHORE.map(([n, lo, la]) => `<g class="tws__isle"><circle cx="${X(lo)}" cy="${Y(la)}" r="4"/><text x="${X(lo)}" y="${Y(la) + 13}">${n}</text></g>`).join('')}
      </svg>
      <div class="tws__pins">${ALL.map((no) => `<i class="tws__pin" data-no="${no}" style="left:${X(SPOT[no][0])}px;top:${Y(SPOT[no][1])}px;--img:url('${img(no)}')"><b>${CHARACTERS[no].county.replace(/[縣市]$/, '')}</b></i>`).join('')}</div>
    </div></div>
    <div class="tws__rain" aria-hidden="true">${'<i></i>'.repeat(26)}</div>
    <div class="tws__scene" aria-hidden="true">
      <div class="tws__case"><div class="tws__box"><i></i></div>${['🎫', '🐚', '🍃', '💌', '🪨'].map((e, i) => `<span style="--i:${i}">${e}</span>`).join('')}</div>
      <div class="tws__gather">${ALL.map((no, i) => `<i style="--a:${(i / ALL.length) * 360}deg;--img:url('${img(no)}')"></i>`).join('')}<div class="tws__egg"></div></div>
      <div class="tws__her"><img src="${img('061')}" alt=""></div>
      <div class="tws__home">${['001', '016', '031', '033', '023', '029'].map((no, i) => `<i style="--i:${i};--img:url('${img(no)}')"></i>`).join('')}</div>
      <div class="tws__journal"><div class="tws__page"><b>旅行日誌</b><span>${ALL.map((no) => `<em>${CHARACTERS[no].county.replace(/[縣市]$/, '')}</em>`).join('')}</span></div><div class="tws__page is-blank"><small>（留給明天）</small></div></div>
      <div class="tws__title"><small>UR　台灣小湘</small><b>我把一座島<br>藏在心裡</b></div>
    </div>
    <div class="tws__bar"><button type="button" data-a="auto" aria-pressed="false">自動</button><button type="button" data-a="skip">跳過</button></div>
    <div class="tws__box-text" role="status" aria-live="polite"><p></p><span class="tws__count"></span><span class="tws__hint">點一下 ▼</span></div>
    <div class="tws__end" hidden><div><small>UR・台灣小湘</small><h2>《我把一座島藏在心裡》・完</h2><p>這段故事收在圖鑑裡，隨時可以重看。</p><div class="tws__end-row"><button type="button" data-a="again">再看一次</button><button type="button" data-a="close">收下</button></div></div></div>`;
  document.body.append(root);
  const q = (s) => root.querySelector(s); const view = q('.tws__view'), world = q('.tws__world'), p = q('.tws__box-text p');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0, typing = null, timer = null; let autoOn = auto;
  function camTo(name) {
    const [x0, y0, x1, y1] = CAMS[name] || CAMS.island; const W = view.clientWidth, H = view.clientHeight;
    const s = Math.min(W / (x1 - x0), H / (y1 - y0));
    const tx = W / 2 - ((x0 + x1) / 2) * s, ty = H / 2 - ((y0 + y1) / 2) * s;
    world.style.transform = `translate(${tx}px,${ty}px) scale(${s})`; world.style.setProperty('--s', s);
  }
  function render() {
    clearInterval(typing); clearTimeout(timer);
    const b = beats[i];
    root.dataset.scene = b.scene; root.dataset.items = b.items || 0;
    root.classList.toggle('is-twinkle', !!b.twinkle); root.classList.toggle('is-rain', !!b.rain);
    root.classList.toggle('is-boats', !!b.boats); root.classList.toggle('is-routes', !!b.routes);
    root.classList.toggle('is-sea', !!b.sea); root.classList.toggle('is-wave', !!b.wave); root.classList.toggle('is-glow', !!b.glow);
    camTo(b.cam);
    const lit = new Set(b.lit), pop = new Set(b.pop);
    root.querySelectorAll('.tws__county').forEach((n) => n.classList.toggle('is-lit', lit.has(n.dataset.no)));
    root.querySelectorAll('.tws__pin').forEach((n) => { n.classList.toggle('is-lit', lit.has(n.dataset.no)); n.classList.toggle('is-pop', pop.has(n.dataset.no)); });
    q('.tws__box-text').classList.toggle('is-quote', b.quote);
    q('.tws__count').textContent = `${i + 1} / ${beats.length}`;
    const full = b.line;
    if (reduced) { p.textContent = full; return hold(full); }
    let n = 0; p.textContent = '';
    typing = setInterval(() => { n += 1; p.textContent = full.slice(0, n); if (n >= full.length) { clearInterval(typing); typing = null; hold(full); } }, 45);
  }
  function hold(full) { if (autoOn) timer = setTimeout(next, 1400 + full.length * 60); }
  function next() {
    if (!q('.tws__end').hidden) return;
    if (typing) { clearInterval(typing); typing = null; p.textContent = beats[i].line; return hold(beats[i].line); }
    if (i + 1 >= beats.length) return showEnd();
    i += 1; render();
  }
  function showEnd() { clearInterval(typing); clearTimeout(timer); root.dataset.scene = 'title'; q('.tws__end').hidden = false; }
  return new Promise((resolve) => {
    const close = () => { clearInterval(typing); clearTimeout(timer); root.remove(); removeEventListener('resize', onResize); resolve(); };
    const onResize = () => camTo(beats[i].cam); addEventListener('resize', onResize);
    root.addEventListener('click', (e) => {
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'auto') { autoOn = !autoOn; e.target.setAttribute('aria-pressed', String(autoOn)); if (autoOn && !typing) hold(beats[i].line); else clearTimeout(timer); return; }
      if (a === 'skip') return showEnd();
      if (a === 'again') { q('.tws__end').hidden = true; i = 0; return render(); }
      if (a === 'close') return close();
      if (e.target.closest('button,.tws__end')) return;
      next();
    });
    q('[data-a="auto"]').setAttribute('aria-pressed', String(autoOn));
    world.style.transition = 'none'; camTo('wide'); void world.offsetWidth; world.style.transition = '';
    render();
  });
}
