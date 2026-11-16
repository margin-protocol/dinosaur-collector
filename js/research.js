import { CHARACTERS, characterSources, loadWithFallback } from './eggs.js';
const asset = path => new URL(path, new URL('../', import.meta.url)).href;
const ownedFor = state => Object.values(CHARACTERS).filter(c => state.dex?.[c.no]);

// This prototype reads collections only. It has no save, reward or resource mutation API.
export function createResearch({ root, getState, onCollect = () => {} }) {
  root.innerHTML = `
    <div class="research-eyebrow"><span>RESEARCH / 01</span><span class="research-preview-tag">介面預覽</span></div>
    <h1 class="research-heading">孵化研究室</h1>
    <p class="research-intro">兩位夥伴，一顆蛋。一點新的可能。</p>
    <section class="research-locked" hidden><span class="research-lock-mark" aria-hidden="true">＋</span><h2>先讓家裡熱鬧一點。</h2><p class="research-unlock-copy"></p><button type="button" class="research-primary" data-collect>前往培育 <span aria-hidden="true">⟶</span></button></section>
    <div class="research-workspace">
      <div class="research-stage" role="group" aria-label="選擇兩位研究搭檔">
        <button type="button" class="research-slot" data-slot="0"><span class="research-slot-art"></span><span class="research-slot-name"></span><span class="research-slot-action"></span></button>
        <div class="research-specimen" aria-hidden="true"><img src="${asset('assets/eggs/ordinary/shell.webp')}" alt=""></div>
        <button type="button" class="research-slot" data-slot="1"><span class="research-slot-art"></span><span class="research-slot-name"></span><span class="research-slot-action"></span></button>
      </div>
      <p class="research-pair-status" role="status"></p>
      <section class="research-notebook" aria-labelledby="research-note-title"><div class="research-note-meta"><span>NOTE 01</span><span class="research-note-state">等待靈感</span></div><h2 id="research-note-title">甜甜的相遇</h2><p class="research-poem">一位喜歡紅色，一位總把點心留給你。<br>兩份小小的偏愛，會不會有新的味道？</p><ul class="research-clues"><li data-clue="002">尋找喜歡甜甜紅色的夥伴</li><li data-clue="005">尋找熟悉點心香氣的夥伴</li></ul></section>
      <button type="button" class="research-primary" data-preview disabled>先選好兩位搭檔</button>
      <p class="research-disclaimer">本次只預覽研究過程，不消耗能量或蛋，也不發放角色。</p>
    </div>
    <dialog class="sheet residents-dialog research-picker" aria-labelledby="research-picker-title"><div class="drawer-heading"><div><small>CHOOSE A RESEARCH PARTNER</small><h2 id="research-picker-title">邀請一位夥伴</h2></div><button type="button" class="close-button" data-close-picker aria-label="關閉搭檔選擇">×</button></div><p class="research-picker-copy">只列出你已收集的小湘，同一位只能選一次。</p><div class="research-partner-list"></div><button class="research-text-button" type="button" data-clear>清除此位置</button></dialog>
    <dialog class="sheet research-result" aria-labelledby="research-result-title"><span class="research-preview-tag">研究結果預覽</span><img class="research-result-image" alt=""><p class="research-result-eyebrow"></p><h2 id="research-result-title"></h2><p class="research-result-copy"></p><p class="research-result-safe">這是示範結果，收藏與遊戲進度不會改變。</p><button type="button" class="research-primary" data-close-result>回到研究筆記</button></dialog>`;
  const find = selector => root.querySelector(selector);
  const picker = find('.research-picker'), result = find('.research-result');
  let slots = [null, null], editing = 0;
  function portrait(image, character) {
    image.alt = character.name;
    loadWithFallback(image, characterSources(character.image).map(asset));
  }
  function update() {
    const owned = ownedFor(getState()), ids = owned.map(c => c.no);
    slots = slots.map(id => ids.includes(id) ? id : null);
    const locked = owned.length < 3;
    find('.research-locked').hidden = !locked;
    find('.research-workspace').hidden = locked;
    find('.research-unlock-copy').textContent = `已收集 ${owned.length} / 3 種小湘，再迎接 ${Math.max(0, 3 - owned.length)} 位新夥伴，就能一起研究。`;
    if (locked) { picker.close(); result.close(); }
    root.querySelectorAll('[data-slot]').forEach((button, index) => {
      const character = CHARACTERS[slots[index]], host = button.querySelector('.research-slot-art');
      host.replaceChildren();
      if (character) { const image = new Image(); portrait(image, character); host.append(image); }
      else { const plus = document.createElement('span'); plus.className = 'research-slot-plus'; plus.textContent = '＋'; host.append(plus); }
      button.querySelector('.research-slot-name').textContent = character?.name || `搭檔 ${index + 1}`;
      button.querySelector('.research-slot-action').textContent = character ? '更換夥伴 ⌄' : '選擇小湘 ↗';
      button.setAttribute('aria-label', character ? `更換搭檔 ${index + 1}：${character.name}` : `選擇研究搭檔 ${index + 1}`);
    });
    const matched = ['002','005'].every(id => slots.includes(id));
    find('.research-pair-status').textContent = slots.every(Boolean) ? '搭檔就位，來看看她們的靈感。' : '點選兩側，邀請小湘一起照顧這顆蛋。';
    find('.research-note-state').textContent = matched ? '線索相合' : slots.some(Boolean) ? '收集線索中' : '等待靈感';
    root.querySelectorAll('[data-clue]').forEach(clue => {
      const found = slots.includes(clue.dataset.clue);
      clue.classList.toggle('is-found', found);
      clue.textContent = (found ? '✓ ' : '○ ') + (clue.dataset.clue === '002' ? found ? '有人找到了甜甜的紅色。' : '尋找喜歡甜甜紅色的夥伴' : found ? '另一位，熟悉點心的香氣。' : '尋找熟悉點心香氣的夥伴');
    });
    find('[data-preview]').disabled = locked || !slots.every(Boolean);
    find('[data-preview]').textContent = slots.every(Boolean) ? '查看研究結果預覽 ⟶' : '先選好兩位搭檔';
    if (picker.open) renderPicker();
  }
  function renderPicker() {
    find('#research-picker-title').textContent = `邀請搭檔 ${editing + 1}`;
    find('.research-partner-list').replaceChildren(...ownedFor(getState()).map(character => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'research-partner'; button.dataset.partner = character.no;
      button.disabled = slots[1 - editing] === character.no;
      button.setAttribute('aria-pressed', String(slots[editing] === character.no));
      const image = new Image(); portrait(image, character);
      const name = document.createElement('span'); name.textContent = character.name;
      const note = document.createElement('small'); note.textContent = button.disabled ? '已在另一側' : slots[editing] === character.no ? '✓ 已選擇' : '邀請她';
      button.append(image, name, note); return button;
    }));
    find('[data-clear]').disabled = !slots[editing];
  }
  function closePicker() { picker.close(); find(`[data-slot="${editing}"]`).focus({preventScroll:true}); }
  const click = event => {
    const button = event.target.closest('button'); if (!button || button.disabled) return;
    if (button.matches('[data-collect]')) onCollect();
    if (button.matches('[data-slot]')) { if (ownedFor(getState()).length < 3) { update(); return; } editing = Number(button.dataset.slot); renderPicker(); picker.showModal(); }
    if (button.matches('[data-close-picker]')) closePicker();
    if (button.matches('[data-clear]')) { slots[editing] = null; closePicker(); update(); }
    if (button.matches('[data-partner]')) {
      const owned = ownedFor(getState());
      if (owned.length < 3 || !owned.some(c => c.no === button.dataset.partner) || slots[1-editing] === button.dataset.partner) { update(); renderPicker(); return; }
      slots[editing] = button.dataset.partner; closePicker(); update();
    }
    if (button.matches('[data-preview]')) {
      update(); if (find('[data-preview]').disabled) return;
      const matched = ['002','005'].every(id => slots.includes(id));
      result.dataset.match = String(matched);
      const image = find('.research-result-image');
      if (matched) portrait(image, CHARACTERS['011']);
      else { image.src = asset('assets/eggs/ordinary/shell.webp'); image.alt = '尚未發現新配方的蛋'; }
      find('.research-result-eyebrow').textContent = matched ? 'A SWEET POSSIBILITY' : 'A LITTLE MORE INSPIRATION';
      find('#research-result-title').textContent = matched ? '草莓蛋糕小湘' : '還差一點靈感';
      find('.research-result-copy').textContent = matched ? '草莓的甜，遇上點心的香。這組搭檔，似乎找到了新的可能。' : '這組搭檔暫時沒有對上這則線索，換位夥伴再一起看看。';
      result.showModal();
    }
    if (button.matches('[data-close-result]')) { result.close(); find('[data-preview]').focus({preventScroll:true}); }
  };
  root.addEventListener('click', click);
  update();
  return { update, destroy() { picker.close(); result.close(); root.removeEventListener('click', click); root.replaceChildren(); } };
}
