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

function layerImg(className, sources) {
  const img = document.createElement('img');
  img.className = className;
  img.alt = '';
  img.decoding = 'async';
  loadWithFallback(img, sources);
  return img;
}

// 首頁固定的培養架。由下往上：後景架 → 蛋 → 前景環 → 破殼閃光
export function createIncubator() {
  const el = document.createElement('div');
  el.className = 'incubator';

  const back = layerImg('incubator__layer', incubatorSources('cradle-back'));
  const slot = document.createElement('div');
  slot.className = 'incubator__slot';
  const front = layerImg('incubator__layer', incubatorSources('cradle-front'));
  const flare = document.createElement('div');
  flare.className = 'incubator__flare';
  el.append(back, slot, front, flare);

  return {
    el,
    setEgg(eggView) {
      slot.replaceChildren(...(eggView ? [eggView.el] : []));
      el.classList.toggle('is-empty', !eggView);
    },
    flare() {
      flare.classList.remove('is-on');
      void flare.offsetWidth; // 重新觸發動畫
      flare.classList.add('is-on');
    },
  };
}

// 可替換的恐龍蛋：只有這組會呼吸、晃動、發光、破殼
export function createEggView(egg) {
  const el = document.createElement('div');
  el.className = 'egg';
  el.setAttribute('role', 'img');

  const layers = {};
  for (const name of EGG_LAYERS) {
    layers[name] = layerImg(`egg__layer egg__layer--${name}`, eggLayerSources(egg.id, name));
  }

  const wobble = document.createElement('div');
  wobble.className = 'egg__wobble';
  const body = document.createElement('div');
  body.className = 'egg__body';
  body.append(layers.shell, layers.glow, layers.cracks);
  wobble.append(body);
  el.append(wobble);

  return {
    el,
    setProgress(pct) {
      const stage = stageOf(pct);
      el.dataset.stage = String(stage);
      el.style.setProperty('--glow', String(0.12 + 0.43 * Math.min(pct, 100) / 100));
      el.style.setProperty('--pulse', `${PULSE_SECONDS[stage]}s`);
      el.setAttribute('aria-label', `${egg.name}，生命訊號 ${Math.round(pct)}%`);
    },
    // 播放破殼動畫，結束後 resolve
    hatch() {
      el.classList.add('is-hatching');
      return new Promise((resolve) => setTimeout(resolve, reducedMotion() ? 0 : 1000));
    },
  };
}
