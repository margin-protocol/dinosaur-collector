import { CHARACTERS, characterSources, loadWithFallback } from './eggs.js';
import { RECIPES } from './recipes.js';
import { labStatus, fmtLeft } from './lab.js';
const asset = path => new URL(path, new URL('../', import.meta.url)).href;
const ownedFor = state => Object.values(CHARACTERS).filter(c => state.dex?.[c.no]);

// The real game provides onStudy (persistent notes). The independent demo remains read-only.
export function createResearch({ root, getState, onCollect = () => {}, onStudy = null, onBrew = null, onCancelBrew = null }) {
  root.innerHTML = `
    <div class="research-eyebrow"><span>RESEARCH / 01</span><span class="research-preview-tag">${onStudy ? "研究筆記" : "介面預覽"}</span></div>
    <h1 class="research-heading">孵化研究室</h1>
    <p class="research-intro">兩位夥伴，一顆蛋。一點新的可能。</p>
    <section class="research-locked" hidden><span class="research-lock-mark" aria-hidden="true">＋</span><h2>先讓家裡熱鬧一點。</h2><p class="research-unlock-copy"></p><button type="button" class="research-primary" data-collect>前往培育 <span aria-hidden="true">⟶</span></button></section>
    <section class="research-lab" hidden aria-live="polite"></section>
    <div class="research-workspace">
      <div class="research-stage" role="group" aria-label="選擇兩位研究搭檔">
        <button type="button" class="research-slot" data-slot="0"><span class="research-slot-art"></span><span class="research-slot-name"></span><span class="research-slot-action"></span></button>
        <div class="research-specimen" aria-hidden="true"><img src="${asset('assets/eggs/ordinary/shell.webp')}" alt=""></div>
        <button type="button" class="research-slot" data-slot="1"><span class="research-slot-art"></span><span class="research-slot-name"></span><span class="research-slot-action"></span></button>
      </div>
      <p class="research-pair-status" role="status"></p>
      <div class="research-note-tabs" role="group" aria-label="選擇研究筆記">${RECIPES.map((r, i) => `<button type="button" data-note="${i}" aria-pressed="${i === 0}">NOTE ${String(i + 1).padStart(2, '0')} · ${r.note.title}</button>`).join('')}</div>
      <section class="research-notebook" aria-labelledby="research-note-title"><div class="research-note-meta"><span data-note-no>NOTE 01</span><span class="research-note-state">等待靈感</span></div><h2 id="research-note-title">甜甜的相遇</h2><p class="research-poem">一位喜歡紅色，一位總把點心留給你。<br>兩份小小的偏愛，會不會有新的味道？</p><ul class="research-clues"><li data-clue="002">尋找喜歡甜甜紅色的夥伴</li><li data-clue="005">尋找熟悉點心香氣的夥伴</li></ul></section>
      <button type="button" class="research-primary" data-preview disabled>先選好兩位搭檔</button>
      <p class="research-disclaimer">${onStudy ? "研究不消耗能量或蛋。找到配方後，把兩位小湘放進研究室調配，時間到就會送來紀念蛋。" : "這是獨立示範，不消耗能量或蛋，也不發放角色。"}</p>
      <section class="research-history" ${onStudy ? "" : "hidden"}><h2>研究紀錄 <span class="research-history-count"></span></h2><p class="research-history-intro">每一組搭檔都能留下線索；同一組重新研究不會重複新增紀錄。</p><ol class="research-history-list"></ol></section>
    </div>
    <dialog class="sheet residents-dialog research-picker" aria-labelledby="research-picker-title"><div class="drawer-heading"><div><small>CHOOSE A RESEARCH PARTNER</small><h2 id="research-picker-title">邀請一位夥伴</h2></div><button type="button" class="close-button" data-close-picker aria-label="關閉搭檔選擇">×</button></div><p class="research-picker-copy">只列出你已收集的小湘，同一位只能選一次。</p><div class="research-partner-list"></div><button class="research-text-button" type="button" data-clear>清除此位置</button></dialog>
    <dialog class="sheet research-result" aria-labelledby="research-result-title"><span class="research-preview-tag">${onStudy ? "研究記錄" : "研究結果預覽"}</span><img class="research-result-image" alt=""><p class="research-result-eyebrow"></p><h2 id="research-result-title"></h2><p class="research-result-copy"></p><p class="research-result-safe">${onStudy ? "研究筆記已保存。找到配方的話，把兩位放進研究室調配，時間到才會送來紀念蛋。" : "這是示範結果，收藏與遊戲進度不會改變。"}</p><button type="button" class="research-primary research-brew" data-brew hidden></button><p class="research-brew-status" role="status"></p><button type="button" class="research-primary" data-close-result>回到研究筆記</button></dialog>`;
  const find = selector => root.querySelector(selector);
  const picker = find('.research-picker'), result = find('.research-result');
  let slots = [null, null], editing = 0, noteIndex = 0, studying = false;
  function portrait(image, character) {
    image.alt = character.name;
    loadWithFallback(image, characterSources(character.image).map(asset));
  }
  // 研究室：正在調配的那一組（一次一組）
  function renderLab() {
    const panel = find('.research-lab'); if (!onBrew) { panel.hidden = true; return; }
    const st = labStatus(getState());
    panel.hidden = !st; if (!st) { panel.replaceChildren(); return; }
    const names = st.members.map(no => CHARACTERS[no]?.name || '小湘').join(' × ');
    panel.innerHTML = `<div class="research-lab__art"></div><div class="research-lab__body"><small>IN THE LAB · 調配中</small><h2></h2><p class="research-lab__who"></p><div class="research-lab__bar"><span></span></div><p class="research-lab__left"></p><button type="button" class="research-lab__cancel" data-cancel-brew>中止調配</button></div>`;
    const art = panel.querySelector('.research-lab__art');
    for (const no of st.members) { const img = new Image(); portrait(img, CHARACTERS[no]); art.append(img); }
    panel.querySelector('h2').textContent = `《${st.recipe.note.title}》`;
    panel.querySelector('.research-lab__who').textContent = names;
    const total = st.recipe.days * 864e5, pct = Math.min(100, Math.round(100 * (total - st.left) / total));
    panel.querySelector('.research-lab__bar span').style.width = `${pct}%`;
    panel.querySelector('.research-lab__left').textContent = st.ready ? '調配完成！紀念蛋馬上送到～' : `第 ${st.day} / ${st.recipe.days} 天 · 還要 ${fmtLeft(st.left)}`;
  }
  // 研究結果／研究紀錄裡的「放進研究室」按鈕
  function setBrew(recipe, discovered) {
    const btn = find('[data-brew]'); find('.research-brew-status').textContent = '';
    if (!onBrew || !recipe || discovered) { btn.hidden = true; return; }
    const st = labStatus(getState());
    btn.hidden = false; btn.dataset.brew = recipe.id;
    if (st?.recipe.id === recipe.id) { btn.disabled = true; btn.textContent = `調配中 · 還要 ${fmtLeft(st.left)}`; }
    else if (st) { btn.disabled = true; btn.textContent = '研究室正在調配別組'; }
    else { btn.disabled = false; btn.textContent = `🧪 放進研究室調配 ${recipe.days} 天`; }
  }
  function update() {
    renderLab();
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
    const note = RECIPES[noteIndex];
    const matched = note.members.every(id => slots.includes(id));
    find('[data-note-no]').textContent = 'NOTE ' + String(noteIndex + 1).padStart(2, '0');
    find('#research-note-title').textContent = note.note.title;
    find('.research-poem').textContent = note.note.poem;
    root.querySelectorAll('[data-note]').forEach(button => { button.setAttribute('aria-pressed', String(Number(button.dataset.note) === noteIndex)); const r = RECIPES[Number(button.dataset.note)]; button.hidden = Boolean(r?.secret && !r.members.every(no => getState().dex?.[no])); }); // secret 配方：兩位都到手才出現
    find('.research-pair-status').textContent = slots.every(Boolean) ? '搭檔就位，可以開始研究了。' : '點選兩側，邀請小湘一起研究。';
    find('.research-note-state').textContent = matched ? '線索相合' : slots.some(Boolean) ? '收集線索中' : '等待靈感';
    root.querySelectorAll('[data-clue]').forEach((clue, i) => {
      const who = note.members[i], found = slots.includes(who);
      const unknown = note.note.clues, discovered = note.note.found;
      clue.classList.toggle('is-found', found);
      clue.textContent = (found ? '✓ ' : '○ ') + (found ? discovered[i] : unknown[i]);
    });
    find('[data-preview]').disabled = locked || studying || !slots.every(Boolean);
    find('[data-preview]').textContent = studying ? '記錄研究中……' : slots.every(Boolean) ? (onStudy ? '開始組合研究 ⟶' : '查看研究結果預覽 ⟶') : '先選好兩位搭檔';
    if (onStudy) renderHistory();
    if (picker.open) renderPicker();
  }
  function renderHistory() {
    const all = getState().research?.trials || [];
    const entries = Array.isArray(all) ? all : [];
    find('.research-history-count').textContent = entries.length + ' 組';
    const list = find('.research-history-list');
    list.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement('li');
      empty.textContent = '還沒有研究紀錄。挑兩位小湘，試試看第一個組合！';
      list.append(empty); return;
    }
    for (const trial of entries.slice(-12).reverse()) {
      if (!Array.isArray(trial?.members) || trial.members.length !== 2) continue;
      const pair = trial.members.map(no => CHARACTERS[no]?.name || '未知小湘').join(' × ');
      const line = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = pair;
      const detail = document.createElement('small');
      const recipe = RECIPES.find(r => r.id === trial.recipe);
      const done = recipe && (getState().recipes?.[recipe.id]?.done || getState().dex?.[recipe.target]);
      detail.textContent = (done ? '配方已完成' : trial.recipe ? '發現關鍵配方線索' : trial.kind === 'near' ? '似乎有一點關聯' : '暫無明確線索') + (trial.at ? ' · ' + String(trial.at).slice(0, 10) : '') + ' ›';
      // 整列可以點：再看一次這組搭檔找到的線索（11/19 湘）
      const open = document.createElement('button'); open.type = 'button'; open.className = 'research-history-open';
      open.dataset.trial = String(entries.indexOf(trial)); open.setAttribute('aria-label', `查看 ${pair} 的研究紀錄`);
      open.append(title, detail); line.append(open); list.append(line);
    }
  }
  // 研究紀錄詳情：用研究結果的視窗再顯示一次（關鍵線索會附上配方筆記和目前進度）
  function showTrial(trial) {
    const saved = getState();
    const recipe = RECIPES.find(r => r.id === trial.recipe);
    const discovered = recipe && (saved.recipes?.[recipe.id]?.done || saved.dex?.[recipe.target]);
    const pair = trial.members.map(no => CHARACTERS[no]?.name || '未知小湘').join(' × ');
    result.dataset.match = String(Boolean(recipe));
    const image = find('.research-result-image');
    if (discovered && CHARACTERS[recipe.target]) portrait(image, CHARACTERS[recipe.target]);
    else { image.src = asset('assets/eggs/ordinary/shell.webp'); image.alt = '尚未孵化的研究樣本'; }
    find('.research-result-eyebrow').textContent = `RESEARCH NOTES · ${pair}`;
    find('#research-result-title').textContent = discovered ? CHARACTERS[recipe.target].name : recipe ? '關鍵線索' : trial.kind === 'near' ? '有點接近了' : '研究紀錄';
    if (recipe) {
      find('.research-result-copy').textContent = `《${recipe.note.title}》${recipe.note.poem} ` + (discovered
        ? '這個配方已完成，成功收藏了研究成果！'
        : `${recipe.note.found.join('')}把${pair}放進研究室調配 ${recipe.days} 天，就能取得紀念蛋。`);
    } else {
      find('.research-result-copy').textContent = trial.kind === 'near'
        ? '當時覺得其中一位夥伴和某份配方有關……換一位搭檔試試看吧。'
        : '這組搭檔暫時沒有指向已知配方。';
    }
    setBrew(recipe, discovered);
    if (!result.open) result.showModal();
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
  const click = async event => {
    const button = event.target.closest('button'); if (!button || button.disabled) return;
    if (button.matches('[data-collect]')) onCollect();
    if (button.matches('[data-brew]') && onBrew) {
      button.disabled = true;
      const err = await onBrew(button.dataset.brew);
      if (err) { find('.research-brew-status').textContent = err; button.disabled = false; return; }
      result.close(); update(); find('.research-lab')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return;
    }
    if (button.matches('[data-cancel-brew]') && onCancelBrew) {
      if (button.dataset.confirm !== '1') { button.dataset.confirm = '1'; button.textContent = '確定要中止嗎？已經調配的天數不會保留（再按一次）'; return; }
      await onCancelBrew(); update(); return;
    }
    if (button.matches('[data-trial]')) { const trial = (getState().research?.trials || [])[Number(button.dataset.trial)]; if (trial?.members?.length === 2) showTrial(trial); return; }
    if (button.matches('[data-note]')) { const i = Number(button.dataset.note); noteIndex = RECIPES[i] ? i : 0; update(); }
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
      if (onStudy) {
        const pair = [...slots];
        studying = true; update();
        try {
          const transaction = await onStudy(pair);
          const outcome = transaction?.result;
          if (!outcome?.ok) throw new Error(outcome?.reason || '無法儲存研究紀錄。');
          const saved = transaction.state || getState();
          const recipe = RECIPES.find(r => r.id === outcome.record?.recipe);
          const discovered = recipe && (saved.recipes?.[recipe.id]?.done || saved.dex?.[recipe.target]);
          result.dataset.match = String(Boolean(recipe));
          const image = find('.research-result-image');
          if (discovered && CHARACTERS[recipe.target]) portrait(image, CHARACTERS[recipe.target]);
          else { image.src = asset('assets/eggs/ordinary/shell.webp'); image.alt = '尚未孵化的研究樣本'; }
          find('.research-result-eyebrow').textContent = outcome.repeat ? 'EXISTING NOTES' : recipe ? 'A POSSIBLE RECIPE' : 'RESEARCH LOGGED';
          find('#research-result-title').textContent = discovered ? CHARACTERS[recipe.target].name : recipe ? '找到關鍵線索！' : outcome.record.kind === 'near' ? '有點接近了！' : '留下新的研究紀錄';
          if (recipe) {
            find('.research-result-copy').textContent = (discovered ? '這個配方已完成，成功收藏了研究成果！' :
              `這兩位搭檔的組合確實有特別的可能。把她們放進研究室調配 ${recipe.days} 天，就能取得紀念蛋。調配期間她們會待在研究室，不在首頁，也不能出門或討伐。`) +
              (outcome.repeat ? ' 這組配方已經記錄過，不會再新增一筆。' : '');
          } else {
            find('.research-result-copy').textContent = outcome.record.kind === 'near'
              ? '似乎有一位夥伴和某份配方有關……先把觀察寫下來，再試著換一位搭檔。'
              : '這組搭檔暫時沒有指向已知配方，但你的嘗試已收進研究筆記。';
            if (outcome.repeat) find('.research-result-copy').textContent += ' 這組搭檔已經研究過了。';
          }
          setBrew(recipe, discovered);
          if (!result.open) result.showModal();
        } catch (error) {
          studying = false; update();
          find('.research-pair-status').textContent = error.message || '研究未儲存，請稍後再試。';
          return;
        } finally { studying = false; update(); }
        return;
      }
      const demoRecipe = RECIPES[noteIndex];
      const matched = demoRecipe.members.every(id => slots.includes(id));
      result.dataset.match = String(matched);
      const image = find('.research-result-image');
      if (matched) portrait(image, CHARACTERS[demoRecipe.target]);
      else { image.src = asset('assets/eggs/ordinary/shell.webp'); image.alt = '尚未發現新配方的蛋'; }
      find('.research-result-eyebrow').textContent = matched ? 'A POSSIBLE RECIPE' : 'A LITTLE MORE INSPIRATION';
      find('#research-result-title').textContent = matched ? CHARACTERS[demoRecipe.target].name : '還差一點靈感';
      setBrew(null);
      find('.research-result-copy').textContent = matched ? `${demoRecipe.note.found.join('')}這組搭檔似乎找到了新的可能。` : '這組搭檔暫時沒有對上這則線索，換位夥伴再一起看看。';
      result.showModal();
    }
    if (button.matches('[data-close-result]')) { result.close(); if (!root.contains(document.activeElement)) find('[data-preview]').focus({preventScroll:true}); }
  };
  root.addEventListener('click', click);
  update();
  return { update, destroy() { picker.close(); result.close(); root.removeEventListener('click', click); root.replaceChildren(); } };
}
