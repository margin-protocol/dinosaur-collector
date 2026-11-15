import { EGG_LAYERS, eggLayerSources, incubatorSources, loadWithFallback } from './eggs.js';

// 孵化階段：0 沉睡、1 有動靜、2 出現裂痕、3 快破殼、4 可以破殼
export function stageOf(pct) {
  if (pct >= 100) return 4;
  if (pct >= 90) return 3;
  if (pct >= 60) return 2;
  if (pct >= 30) return 1;
  return 0;
}

const PULSE_SECONDS = [3, 2.2, 1.5, 0.9, 0.9];
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// 播放一次性的 CSS 動畫，播完就移除，免得切換分頁時重播
export function restart(el, cls = 'is-on') {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}

function layerImg(className, sources) {
  const img = document.createElement('img');
  img.className = className;
  img.alt = '';
  img.decoding = 'async';
  loadWithFallback(img, sources);
  return img;
}

// 掃描儀 HUD（座標與素材相同的 1254 畫布，中心對準蛋）
const HUD_SVG = `
<svg class="hud" viewBox="0 0 1254 1254" aria-hidden="true">
  <defs>
    <linearGradient id="hudScan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9fe3d9" stop-opacity="0"/>
      <stop offset=".85" stop-color="#9fe3d9" stop-opacity=".35"/>
      <stop offset="1" stop-color="#e9fffb" stop-opacity=".9"/>
    </linearGradient>
    <clipPath id="hudEggBox"><rect x="380" y="200" width="532" height="680" rx="40"/></clipPath>
  </defs>
  <g class="hud__ring">
    <circle cx="646" cy="540" r="415" fill="none" stroke="#9fe3d9" stroke-opacity=".28" stroke-width="2" stroke-dasharray="2 14"/>
    <path d="M646 125 A415 415 0 0 1 1005 332" fill="none" stroke="#9fe3d9" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/>
    <path d="M287 748 A415 415 0 0 1 240 600" fill="none" stroke="#9fe3d9" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g class="hud__ring hud__ring--rev">
    <circle cx="646" cy="540" r="440" fill="none" stroke="#d2a391" stroke-opacity=".3" stroke-width="1.5" stroke-dasharray="60 10 4 10"/>
  </g>
  <g fill="none" stroke="#9fe3d9" stroke-opacity=".8" stroke-width="3" stroke-linecap="round">
    <path d="M380 250 V200 H430"/><path d="M862 200 H912 V250"/>
    <path d="M912 830 V880 H862"/><path d="M430 880 H380 V830"/>
  </g>
  <g fill="#9fe3d9" fill-opacity=".8">
    <rect x="640" y="186" width="12" height="3"/><rect x="640" y="891" width="12" height="3"/>
    <rect x="366" y="537" width="3" height="12"/><rect x="923" y="537" width="3" height="12"/>
  </g>
  <g clip-path="url(#hudEggBox)">
    <rect class="hud__scan" x="380" y="100" width="532" height="110" fill="url(#hudScan)"/>
  </g>
</svg>`;

// 首頁固定的培養架。由下往上：後景架 → 蛋 → 前景環 → HUD → 破殼閃光
export function createIncubator() {
  const el = document.createElement('div');
  el.className = 'incubator';

  const back = layerImg('incubator__layer', incubatorSources('cradle-back'));
  const slot = document.createElement('div');
  slot.className = 'incubator__slot';
  const front = layerImg('incubator__layer', incubatorSources('cradle-front'));
  const flare = document.createElement('div');
  flare.className = 'incubator__flare';
  const ripple = document.createElement('div');
  ripple.className = 'incubator__ripple';
  el.append(back, slot, front, ripple, flare);
  el.insertAdjacentHTML('beforeend', HUD_SVG);
  el.insertBefore(el.lastElementChild, ripple);

  return {
    el,
    setEgg(eggView) {
      slot.replaceChildren(...(eggView ? [eggView.el] : []));
      el.classList.toggle('is-empty', !eggView);
    },
    flare() {
      restart(flare);
    },
    // 按下保溫時：一圈光波傳進蛋裡
    pulse() {
      restart(ripple);
      restart(slot, 'is-fed');
    },
  };
}

// 可替換的恐龍蛋：只有這組會呼吸、晃動、發光、破殼
export function createEggView(egg) {
  const el = document.createElement('div');
  el.className = 'egg';

  const layers = {};
  for (const name of EGG_LAYERS) {
    layers[name] = layerImg(`egg__layer egg__layer--${name}`, eggLayerSources(egg.art || egg.id, name));
  }

  const wobble = document.createElement('div');
  wobble.className = 'egg__wobble';
  const body = document.createElement('div');
  body.className = 'egg__body';
  body.append(layers.shell, layers.glow, layers.cracks);
  wobble.append(body);
  if (egg.tint) body.style.filter = egg.tint;
  el.append(wobble);

  return {
    el,
    setProgress(pct) {
      const stage = stageOf(pct);
      el.dataset.stage = String(stage);
      el.style.setProperty('--glow', String(0.12 + 0.43 * Math.min(pct, 100) / 100));
      el.style.setProperty('--pulse', `${PULSE_SECONDS[stage]}s`);
    },
    // 播放破殼動畫，結束後 resolve
    hatch() {
      el.classList.add('is-hatching');
      return new Promise((resolve) => setTimeout(resolve, reducedMotion() ? 0 : 1000));
    },
  };
}
