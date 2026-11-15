import { EGG_LAYERS, eggLayerSources, loadWithFallback } from './eggs.js';

// 孵化階段：0 沉睡、1 有動靜、2 出現裂痕、3 快破殼、4 可以破殼
export function stageOf(pct) {
  if (pct >= 100) return 4;
  if (pct >= 90) return 3;
  if (pct >= 60) return 2;
  if (pct >= 30) return 1;
  return 0;
}

const PULSE_SECONDS = [3, 2.2, 1.5, 0.9, 0.9];

export function createEggView(egg) {
  const el = document.createElement('div');
  el.className = 'egg';
  el.setAttribute('role', 'img');

  const layers = {};
  for (const name of EGG_LAYERS) {
    const img = document.createElement('img');
    img.className = `egg__layer egg__layer--${name}`;
    img.alt = '';
    img.decoding = 'async';
    loadWithFallback(img, eggLayerSources(egg.id, name));
    layers[name] = img;
  }

  // 底座不動；蛋殼、發光、裂痕一起呼吸與晃動
  const wobble = document.createElement('div');
  wobble.className = 'egg__wobble';
  const body = document.createElement('div');
  body.className = 'egg__body';
  body.append(layers.shell, layers.glow, layers.cracks);
  wobble.append(body);

  const flare = document.createElement('div');
  flare.className = 'egg__flare';

  el.append(layers.cradle, wobble, flare);

  return {
    el,
    setProgress(pct) {
      const stage = stageOf(pct);
      el.dataset.stage = String(stage);
      el.style.setProperty('--glow', String(0.25 + 0.75 * Math.min(pct, 100) / 100));
      el.style.setProperty('--pulse', `${PULSE_SECONDS[stage]}s`);
      el.setAttribute('aria-label', `${egg.name}，生命訊號 ${Math.round(pct)}%`);
    },
    // 播放破殼動畫，結束後 resolve
    hatch() {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.classList.add('is-hatching');
      return new Promise((resolve) => setTimeout(resolve, reduced ? 0 : 1000));
    },
  };
}
