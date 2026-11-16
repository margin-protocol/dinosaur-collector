// 首頁的活動角色：小湘會在培養架前方的地板上自己走動。
// 輕量狀態機：idle（站著呼吸眨眼）→ walk（走到別處）→ idle → inspect（走到蛋旁邊看看）→ rest（坐下休息）……
// 待機、走路、坐下各有一組 8 格 spritesheet 逐格播放；位移用 CSS transform，走路速度配合步伐。

import { reducedMotion } from './egg-view.js';

// 三組動作，各是 4 欄 × 2 列、共 8 格，每格 512px 的原版 spritesheet。
// 首頁角色可達 310 CSS px，使用 256px 衍生檔會在高 DPR 手機上放大模糊。
// ms 是每一格停留的毫秒數，照美術交接文件的建議值。
// 素材更新時把 ?v= 的數字加一，手機才會抓新圖而不是用快取。
const ANIMS = {
  walk: { sheet: 'assets/characters/siang-001-walk-spritesheet.webp?v=1', ms: [140, 140, 140, 140, 140, 140, 140, 140] },
  idle: { sheet: 'assets/characters/siang-001-idle-spritesheet.webp?v=1', ms: [850, 350, 300, 170, 160, 300, 650, 850] },
  sit: { sheet: 'assets/characters/siang-001-sit-spritesheet.webp?v=1', ms: [800, 900, 850, 850, 750, 350, 900, 900] },
};
let readySheets;
function prepareSheets() {
  return readySheets ||= Promise.all(Object.values(ANIMS).map(({ sheet }) => {
    const image = new Image(); image.src = sheet;
    return image.decode().catch(() => {});
  }));
}
const STATE_ANIM = { idle: 'idle', inspect: 'idle', walk: 'walk', rest: 'sit' };
const SPEED = 0.26; // 每秒走多少「個角色寬」：配合步伐，腳才不會滑
const LANE = [0.36, 0.9]; // 可活動範圍（佔地板寬度的比例）；左邊留給小恐龍
const INSPECT_AT = 0.7; // 看蛋時站的位置：培養架紅寶石的右邊，不擋蛋
const rand = (a, b) => a + Math.random() * (b - a);

export function createSiangActor(lane, options = {}) {
  const bounds = options.bounds || LANE;
  const inspectAt = options.inspectAt ?? INSPECT_AT;
  const el = document.createElement('div');
  el.className = 'actor';
  el.hidden = true;
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', '原味小湘');
  const shadow = document.createElement('span');
  shadow.className = 'actor__shadow';
  const flip = document.createElement('span');
  flip.className = 'actor__flip';
  const sprite = document.createElement('span');
  sprite.className = 'actor__sprite';
  // 每組動作各一層，切換動作時只換顯示哪一層，不會因為重新載圖而閃一下
  const layers = {};
  for (const [name, anim] of Object.entries(ANIMS)) {
    const layer = document.createElement('span');
    layer.className = 'actor__layer';
    layer.style.backgroundImage = `url("${anim.sheet}")`;
    layer.hidden = name !== 'idle';
    layers[name] = layer;
    sprite.append(layer);
  }
  const emote = document.createElement('span');
  emote.className = 'actor__emote';
  flip.append(sprite);
  el.append(shadow, flip, emote);
  lane.append(el);

  let x = options.initialX ?? 0.78; // 腳底中心在地板上的位置（0–1）
  let state = 'idle';
  let anim = 'idle';
  let frame = 0;
  let frameTimer = 0;
  let generation = 0;
  let stateTimer = 0;
  let running = false;
  let afterWalk = 'idle';

  const setFrame = (n) => {
    frame = n;
    layers[anim].style.backgroundPosition = `${(n % 4) * (100 / 3)}% ${Math.floor(n / 4) * 100}%`;
  };

  const stopFrames = () => {
    cancelAnimationFrame(frameTimer);
    frameTimer = 0;
  };

  // 切換到某組動作並從第 0 格開始循環播放；loop=false 時停在第 0 格
  function play(name, loop = true) {
    stopFrames();
    if (name !== anim) {
      const sitting = name === 'sit' || anim === 'sit';
      layers[anim].hidden = true;
      anim = name;
      layers[anim].hidden = false;
      if (sitting) {
        // 站 ↔ 坐目前沒有過渡分鏡，先用很短的擠壓帶過
        sprite.classList.remove('is-swap');
        void sprite.offsetWidth;
        sprite.classList.add('is-swap');
      }
    }
    setFrame(0);
    if (!loop) return;
    const durations = ANIMS[anim].ms;
    const cycle = durations.reduce((sum, duration) => sum + duration, 0);
    const started = performance.now();
    const step = now => {
      let elapsed = (now - started) % cycle;
      let next = 0;
      while (elapsed >= durations[next] && next < durations.length - 1) {
        elapsed -= durations[next++];
      }
      if (next !== frame) setFrame(next);
      frameTimer = requestAnimationFrame(step);
    };
    frameTimer = requestAnimationFrame(step);
  }

  const place = (seconds) => {
    el.style.transitionDuration = `${seconds}s`;
    el.style.transform = `translateX(${x * lane.clientWidth - el.offsetWidth / 2}px)`;
  };

  function enter(next) {
    clearTimeout(stateTimer);
    state = next;
    el.dataset.state = next;
    // Preserve blink/breath timing when idle changes to another idle state.
    if (STATE_ANIM[next] !== anim || !frameTimer) play(STATE_ANIM[next]);

    if (next === 'idle') {
      stateTimer = setTimeout(choose, rand(3500, 7000));
    } else if (next === 'rest') {
      stateTimer = setTimeout(() => enter('idle'), rand(7000, 11000));
    } else if (next === 'inspect') {
      flip.dataset.dir = 'left'; // 面向蛋
      emote.classList.remove('is-on');
      void emote.offsetWidth;
      emote.classList.add('is-on');
      stateTimer = setTimeout(() => enter('idle'), 3600);
    }
  }

  function walkTo(target, then = 'idle') {
    const dist = Math.abs(target - x);
    if (dist < 0.02) {
      enter(then);
      return;
    }
    clearTimeout(stateTimer);
    state = 'walk';
    el.dataset.state = 'walk';
    afterWalk = then;
    flip.dataset.dir = target < x ? 'left' : 'right';
    const cycle = ANIMS.walk.ms.reduce((sum, duration) => sum + duration, 0) / 1000;
    const travel = (dist * lane.clientWidth) / (el.offsetWidth * SPEED);
    // The compact home lanes must still allow a complete step cycle, not a half-step snap.
    const seconds = Math.max(1, Math.ceil(travel / cycle)) * cycle;
    x = target;
    place(seconds);
    play('walk');
    stateTimer = setTimeout(() => enter(afterWalk), seconds * 1000);
  }

  // 站了一陣子之後決定下一步。大多是慢慢走去別處，偶爾看蛋或休息，不頻繁切換
  function choose() {
    const r = Math.random();
    if (r < 0.55) {
      let target = rand(bounds[0], bounds[1]);
      if (Math.abs(target - x) < 0.18) target = x < (bounds[0] + bounds[1]) / 2 ? rand((bounds[0] + bounds[1]) / 2, bounds[1]) : rand(bounds[0], (bounds[0] + bounds[1]) / 2);
      walkTo(target);
    } else if (r < 0.72) {
      walkTo(inspectAt, 'inspect');
    } else if (r < 0.87) {
      enter('rest');
    } else {
      enter('idle');
    }
  }

  function start() {
    if (running || el.hidden) return;
    running = true;
    place(0);
    if (reducedMotion()) {
      el.dataset.state = 'idle';
      play('idle', false);
      return; // 減少動態：站著不動
    }
    const token = ++generation;
    prepareSheets().then(() => {
      if (running && token === generation) enter('idle');
    });
  }

  function stop() {
    running = false;
    generation += 1;
    clearTimeout(stateTimer);
    stopFrames();
    // 停在目前畫面上的位置，回來時從這裡繼續
    const now = new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
    if (lane.clientWidth) x = (now + el.offsetWidth / 2) / lane.clientWidth;
    place(0);
    state = 'idle';
    el.dataset.state = 'idle';
    play('idle', false);
  }

  const onResize = () => {
    if (!el.hidden && state !== 'walk') place(0);
  };
  addEventListener('resize', onResize);

  return {
    el,
    show(visible) {
      if (visible === !el.hidden) return;
      el.hidden = !visible;
      if (!visible) stop();
    },
    start,
    stop,
    destroy() { stop(); removeEventListener('resize', onResize); el.remove(); },
    // 蛋有反應時，小湘開心跳一下（走路或休息中就不打斷）
    cheer() {
      if (el.hidden || state !== 'idle' || reducedMotion()) return;
      el.classList.remove('is-cheer');
      void el.offsetWidth;
      el.classList.add('is-cheer');
    },
  };
}
