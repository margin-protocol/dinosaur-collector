// 首頁的活動角色：小湘會在培養架前方的地板上自己走動。
// 輕量狀態機：idle（站著）→ walk（走到別處）→ idle → inspect（走到蛋旁邊看看）→ rest（閉眼休息）……
// 走路用 8 格 spritesheet 逐格播放（140ms／格），位移用 CSS transform，兩者速度互相配合。

import { reducedMotion } from './egg-view.js';

const SHEET = 'assets/characters/siang-001-walk-sheet-256.webp'; // 4 欄 × 2 列，共 8 格
const FRAME_MS = 140;
const FRAMES = 8;
const STAND_FRAME = 0; // 雙腳併攏的那一格，當作站姿
const REST_FRAME = 6; // 閉眼微笑的那一格，當作休息
const SPEED = 0.26; // 每秒走多少「個角色寬」：配合步伐，腳才不會滑
const LANE = [0.36, 0.9]; // 可活動範圍（佔地板寬度的比例）；左邊留給小恐龍
const INSPECT_AT = 0.7; // 看蛋時站的位置：培養架紅寶石的右邊，不擋蛋
const rand = (a, b) => a + Math.random() * (b - a);

export function createSiangActor(lane) {
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
  sprite.style.backgroundImage = `url("${SHEET}")`;
  const emote = document.createElement('span');
  emote.className = 'actor__emote';
  flip.append(sprite);
  el.append(shadow, flip, emote);
  lane.append(el);

  let x = 0.78; // 腳底中心在地板上的位置（0–1）
  let state = 'idle';
  let frame = STAND_FRAME;
  let frameTimer = 0;
  let stateTimer = 0;
  let running = false;
  let afterWalk = 'idle';

  const setFrame = (n) => {
    frame = n;
    sprite.style.backgroundPosition = `${(n % 4) * (100 / 3)}% ${Math.floor(n / 4) * 100}%`;
  };

  const place = (seconds) => {
    el.style.transitionDuration = `${seconds}s`;
    el.style.transform = `translateX(${x * lane.clientWidth - el.offsetWidth / 2}px)`;
  };

  const stopFrames = () => {
    clearInterval(frameTimer);
    frameTimer = 0;
  };

  function enter(next) {
    clearTimeout(stateTimer);
    stopFrames();
    state = next;
    el.dataset.state = next;

    if (next === 'idle') {
      setFrame(STAND_FRAME);
      stateTimer = setTimeout(choose, rand(3500, 7000));
    } else if (next === 'rest') {
      setFrame(REST_FRAME);
      stateTimer = setTimeout(() => enter('idle'), rand(7000, 11000));
    } else if (next === 'inspect') {
      setFrame(STAND_FRAME);
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
    const seconds = (dist * lane.clientWidth) / (el.offsetWidth * SPEED);
    x = target;
    place(seconds);
    stopFrames();
    frameTimer = setInterval(() => setFrame((frame + 1) % FRAMES), FRAME_MS);
    stateTimer = setTimeout(() => enter(afterWalk), seconds * 1000);
  }

  // 站了一陣子之後決定下一步。大多是慢慢走去別處，偶爾看蛋或休息，不頻繁切換
  function choose() {
    const r = Math.random();
    if (r < 0.55) {
      let target = rand(LANE[0], LANE[1]);
      if (Math.abs(target - x) < 0.18) target = x < (LANE[0] + LANE[1]) / 2 ? rand(0.68, LANE[1]) : rand(LANE[0], 0.52);
      walkTo(target);
    } else if (r < 0.72) {
      walkTo(INSPECT_AT, 'inspect');
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
      setFrame(STAND_FRAME);
      return; // 減少動態：站著不走動
    }
    enter('idle');
  }

  function stop() {
    running = false;
    clearTimeout(stateTimer);
    stopFrames();
    // 停在目前畫面上的位置，回來時從這裡繼續
    const now = new DOMMatrixReadOnly(getComputedStyle(el).transform).m41;
    if (lane.clientWidth) x = (now + el.offsetWidth / 2) / lane.clientWidth;
    place(0);
    setFrame(STAND_FRAME);
    el.dataset.state = 'idle';
  }

  addEventListener('resize', () => {
    if (!el.hidden && state !== 'walk') place(0);
  });

  return {
    el,
    show(visible) {
      if (visible === !el.hidden) return;
      el.hidden = !visible;
      if (!visible) stop();
    },
    start,
    stop,
    // 蛋有反應時，小湘開心跳一下（走路或休息中就不打斷）
    cheer() {
      if (el.hidden || state !== 'idle' || reducedMotion()) return;
      el.classList.remove('is-cheer');
      void el.offsetWidth;
      el.classList.add('is-cheer');
    },
  };
}
