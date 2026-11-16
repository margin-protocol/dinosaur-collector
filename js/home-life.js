// 首頁的生活感：跟著真實天氣、時間、節日變化的場景，以及入住小湘之間的對話
const reduceMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const PARTICLES = {
  rain: { glyph: '', count: 26, cls: 'amb-rain' },
  snow: { glyph: '❄', count: 16, cls: 'amb-snow' },
  hearts: { glyph: '♥', count: 12, cls: 'amb-heart' },
  bats: { glyph: '🦇', count: 6, cls: 'amb-bat' },
  confetti: { glyph: '✦', count: 18, cls: 'amb-confetti' },
  stars: { glyph: '✦', count: 14, cls: 'amb-star' },
};
const HOLIDAY_FX = { valentine: 'hearts', 'white-day': 'hearts', qixi: 'hearts', christmas: 'snow', halloween: 'bats', birthday: 'confetti' };

// 場景：nightly 星空、雨、節日粒子。只在狀態改變時重畫
export function createAmbience(room) {
  const layer = document.createElement('div');
  layer.className = 'ambience'; layer.setAttribute('aria-hidden', 'true');
  room.prepend(layer);
  let signature = '';
  return function set({ rain = false, night = false, holiday = null } = {}) {
    const kinds = [night && 'stars', rain && 'rain', holiday && HOLIDAY_FX[holiday]].filter(Boolean);
    const sig = kinds.join(',');
    room.classList.toggle('is-night', night);
    room.classList.toggle('is-rain', rain);
    room.dataset.holiday = holiday || '';
    if (sig === signature) return;
    signature = sig;
    layer.replaceChildren();
    if (reduceMotion()) return;
    for (const kind of kinds) {
      const p = PARTICLES[kind];
      for (let i = 0; i < p.count; i += 1) {
        const el = document.createElement('i');
        el.className = `amb ${p.cls}`; el.textContent = p.glyph;
        el.style.left = `${Math.random() * 100}%`;
        el.style.top = kind === 'stars' ? `${Math.random() * 45}%` : '';
        el.style.animationDelay = `${-Math.random() * 8}s`;
        el.style.animationDuration = `${kind === 'rain' ? 0.6 + Math.random() * 0.5 : kind === 'stars' ? 2 + Math.random() * 3 : 6 + Math.random() * 6}s`;
        el.style.fontSize = `${8 + Math.random() * 10}px`;
        layer.append(el);
      }
    }
  };
}

const CHATS = [
  ['今天天氣好好喔！', '對呀，一起去曬太陽吧～'],
  ['你有看到飼養員嗎？', '剛剛還在這裡呢，一定很快就回來了！'],
  ['我餓了……', '我這裡有點心，分你一半！'],
  ['飼養員今天好像很累。', '那我們乖一點，讓他好好休息。'],
  ['這個家越來越熱鬧了耶。', '因為飼養員很努力呀！'],
  ['要不要一起拍照？', '好啊！說起司～'],
  ['噓……小恐龍睡著了。', '牠打呼好大聲喔。'],
  ['你最喜歡飼養員哪一點？', '全部！這還用問嗎？'],
  ['培養架上的蛋好像動了一下！', '是新的家人要來了嗎？'],
  ['我們來比賽誰先被摸頭！', '那我要站在最前面～'],
  ['晚上要一起睡嗎？', '好呀，可是你不准搶被子喔。'],
  ['剛剛飼養員對我笑了！', '他也有對我笑！……好吧，你比較多。'],
];
const RAIN_CHATS = [['外面在下雨耶。', '雨傘小湘一定很開心。'], ['下雨天好適合窩在家裡。', '那我們一起窩著吧～']];
const NIGHT_CHATS = [['好睏喔……', '再撐一下，等飼養員說晚安。'], ['星星出來了！', '幫我許一個願好不好？']];

export function startChats(room, getContext, { every = 18000 } = {}) {
  let last = -1;
  return setInterval(() => {
    const ctx = getContext();
    if (!ctx || !room.isActive() || document.hidden || document.querySelector('dialog[open]')) return;
    const ids = room.residents();
    if (ids.length < 2) return;
    const a = ids[Math.floor(Math.random() * ids.length)];
    const b = ids.filter((n) => n !== a)[Math.floor(Math.random() * (ids.length - 1))];
    const pool = [...CHATS, ...(ctx.rain ? RAIN_CHATS : []), ...(ctx.night ? NIGHT_CHATS : [])];
    let i = Math.floor(Math.random() * pool.length); if (i === last) i = (i + 1) % pool.length; last = i;
    room.bubble(a, pool[i][0], 2600);
    setTimeout(() => room.bubble(b, pool[i][1], 2800), 1800);
  }, every);
}

// 點心：從托盤拖到小湘身上
export function attachSnackDrag(button, { canDrag, onDrop, onTap }) {
  let ghost = null; let start = null; let dragging = false;
  const move = (e) => {
    if (!start) return;
    if (!dragging && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) {
      if (!canDrag()) { start = null; return; }
      dragging = true;
      ghost = document.createElement('div'); ghost.className = 'snack-ghost'; ghost.textContent = button.dataset.snack || '🍮';
      document.body.append(ghost);
    }
    if (ghost) { ghost.style.left = `${e.clientX}px`; ghost.style.top = `${e.clientY}px`; }
  };
  const end = (e) => {
    if (!start) return;
    const wasDrag = dragging;
    start = null; dragging = false;
    ghost?.remove(); ghost = null;
    if (!wasDrag) { onTap(); return; }
    const target = document.elementsFromPoint(e.clientX, e.clientY).map((el) => el.closest?.('.resident-slot')).find(Boolean);
    onDrop(target?.dataset.character || null);
  };
  button.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY }; button.setPointerCapture?.(e.pointerId); e.preventDefault(); });
  button.addEventListener('pointermove', move);
  button.addEventListener('pointerup', end);
  button.addEventListener('pointercancel', () => { start = null; dragging = false; ghost?.remove(); ghost = null; });
}
