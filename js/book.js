// 今日願望的魔法書：橫向雙頁，左頁是寶石、右頁是願望內容。
// 翻頁用一張「書葉」做 3D 旋轉：書葉正面是目前這頁、背面是下一頁，轉完再把底下的靜態頁面換掉。
// 翻頁只換顯示，不會重新產生任務，也不會改變完成狀態。

import { reducedMotion } from './egg-view.js';

const FLIP_MS = 650;
const pad2 = (n) => String(n).padStart(2, '0');

const GEM_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true">
  <path class="gemfx__base" d="M20 3 33 13 28 36H12L7 13z"/>
  <path d="M20 3 33 13H7z" fill="#fff" fill-opacity=".38"/>
  <path d="M7 13h26l-5 23H12z" fill="#000" fill-opacity=".12"/>
  <path d="M20 13 28 36H12z" fill="#fff" fill-opacity=".16"/>
  <path d="M20 3 15 13h10z" fill="#fff" fill-opacity=".3"/>
  <path d="M20 3 33 13 28 36H12L7 13z" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1"/>
</svg>`;

export function gemEl(wish, lit, extra = '') {
  const el = document.createElement('span');
  el.className = `gemfx${lit ? ' is-lit' : ''}${extra}`;
  el.style.setProperty('--gem', wish.swatch);
  el.innerHTML = GEM_SVG;
  return el;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

export function createBook({ book, pager, onShoot }) {
  const left = book.querySelector('.page--left');
  const right = book.querySelector('.page--right');
  const leaf = book.querySelector('.leaf');
  const leafFront = leaf.querySelector('.leaf__face--front');
  const leafBack = leaf.querySelector('.leaf__face--back');
  const prevBtn = pager.querySelector('[data-dir="prev"]');
  const nextBtn = pager.querySelector('[data-dir="next"]');
  const pageNo = pager.querySelector('.pager__no');

  let wishes = [];
  let index = 0;
  let flipping = false;
  let reward = 0;
  let fx = {}; // { fresh: 剛完成的願望 id, scanning: 鑑定中的願望 id }

  // 左頁：願望編號＋大寶石
  function fillLeft(node, i) {
    const w = wishes[i];
    node.style.setProperty('--gem', w.swatch);
    const fresh = fx.fresh === w.id;
    const orn = el('div', `gemstand${w.done ? ' is-lit' : ''}`);
    orn.append(gemEl(w, w.done, fresh ? ' is-ignite' : ''));
    node.replaceChildren(el('div', 'page__no', `WISH No.${pad2(i + 1)}`), orn, el('div', 'page__color', w.color));
  }

  // 右頁：名稱、小湘說的話、實際任務、獎勵、拍照或印章
  function fillRight(node, i, interactive) {
    const w = wishes[i];
    const fresh = fx.fresh === w.id;
    const scanning = fx.scanning === w.id;
    const line = el('p', 'page__line', `「${w.copy.line}」`);
    const action = el('div', 'page__action');
    if (w.done) {
      const stamp = el('span', `stamp${fresh ? ' is-fresh' : ''}`);
      stamp.setAttribute('role', 'img');
      stamp.setAttribute('aria-label', '已完成');
      stamp.append(el('span', null, '達成'));
      action.append(stamp);
    } else {
      // 用 <label> 包住檔案輸入：點下去會直接開相機
      const label = el('label', `page__shoot${scanning ? ' is-scanning' : ''}`);
      label.append(el('span', null, scanning ? '鑑定中' : '拍照'));
      if (interactive) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        // 可以拍照或從相簿選（湘決定開放）
        input.className = 'visually-hidden';
        input.disabled = Boolean(fx.scanning);
        input.setAttribute('aria-label', `拍照完成願望：${w.copy.name}（${w.copy.hint}）`);
        input.addEventListener('change', () => {
          const file = input.files && input.files[0];
          input.value = '';
          if (file) onShoot(w, file);
        });
        label.append(input);
      }
      action.append(label);
    }
    node.replaceChildren(
      el('h2', 'page__name', w.copy.name),
      line,
      el('div', 'page__who', `—— ${w.copy.speaker}`),
      el('div', 'page__hint', w.copy.hint),
      el('div', 'page__reward', `能量 +${reward}`),
      action,
    );
  }

  function renderPager() {
    pageNo.textContent = `${pad2(index + 1)}／${pad2(wishes.length)}`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === wishes.length - 1;
  }

  function renderStatic() {
    fillLeft(left, index);
    fillRight(right, index, true);
    renderPager();
  }

  function flip(dir) {
    const target = index + dir;
    if (flipping || fx.scanning || target < 0 || target >= wishes.length) return;
    if (reducedMotion()) {
      index = target;
      renderStatic();
      return;
    }
    flipping = true;
    book.classList.add('is-flipping');
    leaf.dataset.dir = dir > 0 ? 'next' : 'prev';
    if (dir > 0) {
      // 右頁翻向左邊：正面是目前的右頁，背面是下一個願望的左頁；底下先換成下一個願望的右頁
      leafFront.className = 'leaf__face leaf__face--front page page--right';
      leafBack.className = 'leaf__face leaf__face--back page page--left';
      fillRight(leafFront, index, false);
      fillLeft(leafBack, target);
      fillRight(right, target, false);
    } else {
      // 左頁翻回右邊：正面是目前的左頁，背面是上一個願望的右頁；底下先換成上一個願望的左頁
      leafFront.className = 'leaf__face leaf__face--front page page--left';
      leafBack.className = 'leaf__face leaf__face--back page page--right';
      fillLeft(leafFront, index);
      fillRight(leafBack, target, false);
      fillLeft(left, target);
    }
    leaf.hidden = false;
    void leaf.offsetWidth;
    leaf.classList.add('is-turning');
    setTimeout(() => {
      index = target;
      renderStatic();
      leaf.hidden = true;
      leaf.classList.remove('is-turning');
      book.classList.remove('is-flipping');
      flipping = false;
    }, FLIP_MS);
  }

  prevBtn.addEventListener('click', () => flip(-1));
  nextBtn.addEventListener('click', () => flip(1));

  // 左右滑動翻頁
  let startX = 0;
  let startY = 0;
  book.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  book.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.5) flip(dx < 0 ? 1 : -1);
  }, { passive: true });

  return {
    get index() {
      return index;
    },
    // 更新資料並重畫目前這一頁。effects 用來播放「鑑定中」或「剛完成」的演出
    update(nextWishes, rewardValue, effects = {}) {
      wishes = nextWishes;
      reward = rewardValue;
      fx = effects;
      if (index >= wishes.length) index = 0;
      if (!flipping) renderStatic();
    },
    // 翻到第一個還沒完成的願望（進入頁面時用，不播動畫）
    openAtFirstUndone() {
      const i = wishes.findIndex((w) => !w.done);
      index = i < 0 ? 0 : i;
      renderStatic();
    },
    // 第一次進來時的開書動畫
    playOpening() {
      if (reducedMotion()) return;
      book.classList.add('is-closed');
      void book.offsetWidth;
      setTimeout(() => book.classList.add('is-opening'), 450);
      setTimeout(() => book.classList.remove('is-closed', 'is-opening'), 450 + 950);
    },
    pageEls: { left, right },
  };
}
