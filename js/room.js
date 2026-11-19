// Home display preferences are separate from the unchanged game save.
import { CHARACTERS, characterSources, loadWithFallback } from './eggs.js';

export const ROOM_KEY = 'siang-collector:residents:v1';
export const ROOM_LIMIT = 3;
export function residentsFor(dex) {
  const owned = Object.keys(CHARACTERS).filter(no => dex[no]);
  try {
    const raw = localStorage.getItem(ROOM_KEY);
    if (raw !== null) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved)) return [...new Set(saved)].filter(no => owned.includes(no)).slice(0, ROOM_LIMIT);
    }
  } catch { /* Malformed preferences never alter the game save. */ }
  return owned.slice(0, ROOM_LIMIT);
}
export function saveResidents(ids) {
  try { localStorage.setItem(ROOM_KEY, JSON.stringify(ids)); return true; }
  catch { return false; }
}
export function welcomeResident(no, dex) {
  if (!CHARACTERS[no] || !dex[no]) return;
  const beforeArrival = { ...dex };
  delete beforeArrival[no];
  const current = residentsFor(beforeArrival);
  if (current.length < ROOM_LIMIT) current.push(no);
  // Freeze the previous residents even when an implicit default home was full.
  saveResidents(current);
}

const reduceMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// 靜態立繪的「紙偶」動畫：呼吸、一跳一跳地在地板上走、轉身翻面；不需要額外素材
function createDoll(lane, portrait) {
  const doll = portrait.querySelector('.doll');
  let x = 0.5; let timer = null; let running = false; let facing = 1;
  const place = (ms) => { portrait.style.transitionDuration = `${ms}ms`; portrait.style.left = `${x * 100}%`; };
  function step() {
    if (!running) return;
    if (reduceMotion() || Math.random() < 0.45) { schedule(3500 + Math.random() * 4500); return; }
    const target = 0.3 + Math.random() * 0.4;
    const dist = Math.abs(target - x);
    if (dist < 0.05) { schedule(2500); return; }
    facing = target > x ? 1 : -1;
    doll.style.setProperty('--face', facing);
    const ms = Math.round(dist * 9000);
    portrait.classList.add('is-walking');
    x = target; place(ms);
    timer = setTimeout(() => { portrait.classList.remove('is-walking'); schedule(3000 + Math.random() * 5000); }, ms);
  }
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(step, ms); }
  place(0);
  return {
    start() { if (running) return; running = true; schedule(1500 + Math.random() * 2500); },
    stop() { running = false; clearTimeout(timer); portrait.classList.remove('is-walking'); },
    destroy() { this.stop(); },
  };
}

// 摸摸頭：在小湘身上來回滑動一段距離就算摸到了
function attachPetting(el, onPet) {
  let last = null; let travel = 0; let petted = false;
  // 手勢期間在 window 上追蹤，手指滑過其他小湘也不會中斷
  const move = (e) => {
    if (!last || petted) return;
    travel += Math.hypot(e.clientX - last.x, e.clientY - last.y);
    last = { x: e.clientX, y: e.clientY };
    if (travel > 140) { petted = true; onPet(); }
  };
  const end = () => { last = null; removeEventListener('pointermove', move); removeEventListener('pointerup', end); removeEventListener('pointercancel', end); };
  el.addEventListener('pointerdown', (e) => {
    last = { x: e.clientX, y: e.clientY }; travel = 0; petted = false;
    addEventListener('pointermove', move); addEventListener('pointerup', end); addEventListener('pointercancel', end);
  });
  // 摸頭的手勢不算點擊
  el.addEventListener('click', (e) => { if (petted) { e.stopImmediatePropagation(); e.preventDefault(); petted = false; } }, true);
}

export function createRoom(host, onGreet, onPet = () => {}) {
  let signature = null;
  let actors = [];
  let lanes = [];
  let active = false;
  const applyActivity = () => {
    host.dataset.active = String(active);
    actors.forEach(actor => active ? actor.start() : actor.stop());
  };
  const laneOf = (no) => lanes.find(l => l.no === no);
  function hearts(no, count = 5, glyph = '♥') {
    const l = laneOf(no); if (!l || reduceMotion()) return;
    const anchor = l.portrait.getBoundingClientRect(); const box = l.lane.getBoundingClientRect();
    for (let i = 0; i < count; i += 1) {
      const h = document.createElement('i'); h.className = 'room-heart'; h.textContent = glyph;
      h.style.left = `${anchor.left - box.left + anchor.width * (0.3 + Math.random() * 0.4)}px`;
      h.style.bottom = `${box.bottom - anchor.top - anchor.height * 0.15}px`;
      h.style.setProperty('--dx', `${(Math.random() - 0.5) * 60}px`);
      h.style.animationDelay = `${i * 90}ms`;
      h.addEventListener('animationend', () => h.remove(), { once: true });
      l.lane.append(h);
    }
  }
  function bubble(no, text, ms = 2600) {
    const l = laneOf(no); if (!l) return;
    l.lane.querySelector('.resident-bubble')?.remove();
    const b = document.createElement('span'); b.className = 'resident-bubble'; b.textContent = text;
    const anchor = l.portrait.getBoundingClientRect(); const box = l.lane.getBoundingClientRect();
    b.style.left = `${anchor.left - box.left + anchor.width / 2}px`;
    b.style.bottom = `${box.bottom - anchor.top - anchor.height * 0.08}px`;
    l.lane.append(b);
    setTimeout(() => b.remove(), ms);
  }
  // 打招呼後在小湘旁邊冒出「看圖鑑」小按鈕，幾秒後消失
  function peek(no, onOpen, ms = 4000) {
    const l = laneOf(no); if (!l) return;
    host.querySelector('.resident-dex')?.remove();
    const b = document.createElement('button'); b.type = 'button'; b.className = 'resident-dex'; b.dataset.character = no;
    b.textContent = '看圖鑑 ›'; b.setAttribute('aria-label', `打開${CHARACTERS[no].name}的圖鑑`);
    const anchor = l.portrait.getBoundingClientRect(); const box = host.getBoundingClientRect();
    // 放在小湘腳邊、置中；避開右邊那排選單
    b.style.left = `${Math.max(48, Math.min(box.width * 0.6, anchor.left - box.left + anchor.width / 2))}px`;
    b.style.top = `${anchor.top - box.top + anchor.height * 0.72}px`;
    b.addEventListener('click', (e) => { e.stopPropagation(); b.remove(); onOpen(no); });
    host.append(b);
    clearTimeout(b.timer); setTimeout(() => b.remove(), ms);
  }
  function happy(no) {
    const l = laneOf(no); if (!l) return;
    if (l.doll) { l.portrait.classList.remove('is-happy'); void l.portrait.offsetWidth; l.portrait.classList.add('is-happy'); }
    else actors.forEach(a => a.cheer());
  }
  return {
    update(dex) {
      const ids = residentsFor(dex);
      const next = ids.join(',');
      if (next === signature) return ids;
      actors.forEach(actor => actor.destroy());
      actors = []; lanes = [];
      host.replaceChildren();
      host.dataset.count = ids.length;
      signature = next;
      ids.forEach((no, index) => {
        const character = CHARACTERS[no];
        const lane = document.createElement('div');
        lane.className = `resident-slot resident-slot--${index}`;
        lane.dataset.character = no;
        let portrait; let doll = null;
        {
          portrait = document.createElement('button');
          portrait.type = 'button';
          portrait.className = 'resident-static';
          const inner = document.createElement('span'); inner.className = 'doll';
          const image = document.createElement('img');
          image.alt = character.name;
          image.draggable = false;
          loadWithFallback(image, characterSources(character.image));
          inner.append(image);
          const shadow = document.createElement('span'); shadow.className = 'doll__shadow';
          portrait.append(shadow, inner);
          lane.append(portrait);
          doll = createDoll(lane, portrait);
          actors.push(doll);
          portrait.addEventListener('animationend', (e) => { if (e.animationName === 'doll-happy') portrait.classList.remove('is-happy'); });
        }
        portrait.setAttribute('role', 'button');
        portrait.tabIndex = 0;
        portrait.setAttribute('aria-label', `與${character.name}打招呼（來回滑動可以摸摸頭）`);
        portrait.addEventListener('click', () => { happy(no); hearts(no, 3); onGreet(character); });
        attachPetting(portrait, () => { happy(no); hearts(no, 7); onPet(character); });
        if (portrait.tagName !== 'BUTTON') portrait.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onGreet(character); }
        });
        const label = document.createElement('span');
        label.className = 'resident-name';
        label.textContent = character.name;
        if (doll) portrait.append(label); else lane.append(label);
        host.append(lane);
        lanes.push({ no, lane, portrait, doll });
      });
      applyActivity();
      return ids;
    },
    setActive(value) { if (value !== active) { active = value; applyActivity(); } },
    cheer() { actors.forEach(actor => actor.cheer?.()); },
    residents: () => lanes.map(l => l.no),
    isActive: () => active,
    hearts, bubble, happy, peek,
  };
}
