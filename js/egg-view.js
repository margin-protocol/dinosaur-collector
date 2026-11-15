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
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// 播放一次性的 CSS 動畫，播完就移除，免得切換分頁時重播
export function restart(el, cls = 'is-on') {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
  // 只聽這個元素自己的動畫結束；子元素的動畫結束事件會往上冒泡，不能被它們提早關掉
  const done = (e) => {
    if (e.target !== el) return;
    el.classList.remove(cls);
    el.removeEventListener('animationend', done);
  };
  el.addEventListener('animationend', done);
}

function layerImg(className, sources) {
  const img = document.createElement('img');
  img.className = className;
  img.alt = '';
  img.decoding = 'async';
  img.draggable = false;
  loadWithFallback(img, sources);
  return img;
}

function div(className) {
  const el = document.createElement('div');
  el.className = className;
  return el;
}

// 首頁固定的培養架。由下往上：呼吸光 → 後景架 → 蛋 → 前景環 → 特效
export function createIncubator() {
  const el = div('incubator');
  const halo = div('incubator__halo');
  const back = layerImg('incubator__layer incubator__layer--cradle', incubatorSources('cradle-back'));
  const slot = div('incubator__slot');
  const front = layerImg('incubator__layer incubator__layer--cradle', incubatorSources('cradle-front'));
  const ring = div('incubator__ring');
  const flare = div('incubator__flare');
  el.append(halo, back, slot, front, ring, flare);

  return {
    el,
    setEgg(eggView) {
      slot.replaceChildren(...(eggView ? [eggView.el] : []));
    },
    setProgress(ratio) {
      el.style.setProperty('--p', String(ratio));
    },
    // 手指點下去的瞬間：蛋被壓一下再彈回來
    press() {
      restart(slot, 'is-press');
    },
    // 能量抵達：蛋亮一下，噴出幾顆光點
    feed() {
      restart(slot, 'is-fed');
      if (reducedMotion()) return;
      const size = el.clientWidth;
      for (let i = 0; i < 8; i += 1) {
        const s = document.createElement('i');
        s.className = 'spark';
        const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.6;
        const dist = size * (0.16 + Math.random() * 0.1);
        s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
        s.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
        s.addEventListener('animationend', () => s.remove(), { once: true });
        el.append(s);
      }
    },
    // 進入新的孵化階段：光環擴散
    stageUp() {
      restart(ring);
    },
    flare() {
      restart(flare);
    },
  };
}

// 可替換的恐龍蛋：只有這組會呼吸、晃動、發光、破殼
export function createEggView(egg) {
  const el = div('egg');
  const layers = {};
  for (const name of EGG_LAYERS) {
    layers[name] = layerImg(`egg__layer egg__layer--${name}`, eggLayerSources(egg.art || egg.id, name));
  }
  const wobble = div('egg__wobble');
  const body = div('egg__body');
  body.append(layers.shell, layers.glow, layers.cracks);
  if (egg.tint) body.style.filter = egg.tint;
  wobble.append(body);
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
