import { EGGS, CHARACTERS, DUPLICATE_FOSSILS, rollHatch, characterSources, loadWithFallback, eggLayerSources } from './eggs.js';
import { createIncubator, createEggView, stageOf, restart, reducedMotion } from './egg-view.js';
import { loadState, updateState, resetState, newEgg } from './state.js';
import { createRoom, residentsFor, saveResidents, welcomeResident, ROOM_KEY, ROOM_LIMIT } from './room.js';
import { WISH_REWARD, PASS_RATIO, wishesFor, todayKey, analyzePhoto } from './wishes.js';
import { createMissions } from './missions.js';
import { DAILY_XP, GROWTH_XP, XP_PER_LEVEL, playerLevel, rankTitle, ensureDaily, completeDaily, growthGoals, goalProgress, claimGrowth } from './progression.js';
import { PRESENTER_KEY, selectedPresenter, presenterCopy } from './wish-presenter.js';

const $ = (id) => document.getElementById(id);
const TAP_ENERGY = 10; // 每點一下蛋，注入多少能量
const BPM = [48, 64, 82, 104, 120]; // 各階段的心跳，跟蛋的脈動同步
const TITLES = { dex: '圖鑑' }; // 願望頁有自己的書名頁首
const pad = (n, len = 2) => String(Math.round(n)).padStart(len, '0');
const sleep = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? 0 : ms));

// Android 震動回饋；不支援的裝置會安靜略過
function buzz(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function daysSince(iso) {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

let state = (await updateState(() => {})).state;
if (!state.egg) state.egg = newEgg('ordinary'); // 培育槽不留空：孵完就送來下一顆
let eggView = null;
let displayedEggId = null;
let busy = false;
let toastTimer = 0;
let sayTimer = 0;
let bubbleTimer = 0;
let sayOverride = null; // 小恐龍暫時要說的話（提醒、歡呼），幾秒後回到平常的提示
const VIEWS = ['home', 'incubate', 'wish', 'dex'];
const STAGE_NAMES = ['', '蛋有動靜了', '蛋殼裂開了', '就快出來了', '可以破殼了'];

const incubator = createIncubator();
$('stage-egg').replaceWith(incubator.el);

// 蛋本身就是按鈕：點它注入能量，滿了就破殼
const eggButton = document.createElement('button');
eggButton.type = 'button';
eggButton.className = 'egg-hit';
incubator.el.append(eggButton);

const wishBook = createMissions({ book: $('book'), steps: $('book-gems'), onShoot: (wish, file) => onPhoto(wish, file), onSelect: renderWishCompanion });
let viewedChapter = null;
let wishTab = 'daily';
let claimBusy = false;
let photoBusy = false;
let activePhotoId = null;

// 小湘：孵出來以後才出現，在地板上自己走動
const room = createRoom($('resident-lanes'), character => say(character.line, 'happy', 4000));

function syncRoomActivity() {
  room.setActive(document.body.dataset.view === 'home' && !document.hidden && !document.querySelector('dialog[open]'));
}

/* ---------- 願望 ---------- */

function todaysWishes() {
  ensureDaily(state);
  const id = selectedPresenter(state);
  return wishesFor(state.wishes.date).map(w => ({ ...w, date: state.wishes.date, done: state.wishes.done.includes(w.id), copy: presenterCopy(w, state.wishes.date, state.wishes.stage, id) }));
}

/* ---------- 畫面 ---------- */

function percent() {
  return Math.min(100, (state.egg.warmth / EGGS[state.egg.id].warmthNeeded) * 100);
}

function renderResources() {
  $('energy-value').textContent = state.energy;
  $('fossil-value').textContent = state.fossils;
}

function renderHome() {
  const egg = EGGS[state.egg.id];
  if (!eggView || displayedEggId !== egg.id) {
    eggView = createEggView(egg);
    displayedEggId = egg.id;
    incubator.setEgg(eggView);
  }
  const pct = percent();
  const s = stageOf(pct);
  const ready = s === 4;
  eggView.setProgress(pct);
  incubator.setProgress(pct / 100);
  incubator.el.classList.toggle('is-ready', ready);

  $('egg-name').textContent = egg.name;
  $('cultivate').textContent = ready ? '破殼' : '培養';
  $('egg-day').textContent = `DAY ${daysSince(state.egg.since) + 1}`;
  [...$('pips').children].forEach((pip, i) => pip.classList.toggle('is-on', i < s));
  $('pips').setAttribute('aria-label', `孵化階段 ${s}，共 4 階段`);
  $('vitals-value').textContent = pad(state.egg.warmth, 3);
  $('vitals-max').textContent = `/${egg.warmthNeeded}`;
  $('vitals-fill').style.width = `${pct}%`;
  $('ecg-bpm').textContent = BPM[s];
  $('vitals').style.setProperty('--ecg-dur', `${(2 * 60) / BPM[s]}s`);

  const wishes = todaysWishes();
  const open = wishes.filter((w) => !w.done);
  $('home-progress').textContent = `${wishes.length - open.length} / ${wishes.length}`;
  $('incubate-wish-progress').textContent = $('home-progress').textContent;
  $('incubation-status').textContent = ready ? '可以破殼了 · 迎接新夥伴' : `孵化進度 ${Math.round(pct)}%`;
  $('enter-incubator').classList.toggle('is-ready', ready);
  for (const id of ['wish-dot', 'nav-wish-dot']) {
    $(id).hidden = open.length === 0;
    $(id).textContent = open.length;
  }

  const ids = room.update(state.dex);
  const owned = Object.keys(CHARACTERS).filter(no => state.dex[no]);
  $('resident-count').textContent = `${ids.length} / ${ROOM_LIMIT}`;
  $('home-subtitle').textContent = !owned.length ? '一起等待，初次相遇。' : ids.length > 1 ? '今天也很熱鬧呢。' : '今日也請多多指教。';
  $('room-empty').hidden = ids.length > 0;
  $('room-empty').firstChild.textContent = owned.length ? '今天想邀請誰，一起在這裡生活？' : '第一位小湘，正等著與你相遇。';
  $('room-empty').lastElementChild.textContent = owned.length ? '從入住安排選擇已收集的小湘。' : '完成願望，前往培育迎接她。';
  syncRoomActivity();

  // 小恐龍：告訴玩家現在可以做什麼
  let text;
  let mood = 'idle';
  let mode = 'tap';
  if (ready) {
    text = '準備好見面了！一起去培育室吧。';
    mood = 'cheer';
  } else if (state.energy > 0) {
    text = '有能量了，一起去培育新夥伴吧。';
  } else if (open.length) {
    text = `${state.dex['001'] ? '小湘' : '蛋'}想看${open[0].color}的東西。`;
    mode = 'wish';
  } else {
    text = '今天的願望都完成了，明天見！';
    mode = 'rest';
  }
  const guide = $('guide');
  guide.dataset.mode = mode;
  if (sayOverride) {
    text = sayOverride.text;
    mood = sayOverride.mood;
  }
  guide.dataset.mood = mood;
  $('bubble-cta').hidden = mode !== 'wish';
  if ($('bubble-text').textContent !== text) {
    $('bubble-text').textContent = text;
    openBubble();
  }
  // 對話框收起時，如果玩家還有事可以做，小恐龍頭上顯示驚嘆號
  $('guide-alert').hidden = $('bubble').classList.contains('is-open') || mode === 'rest';
  eggButton.setAttribute('aria-label', ready ? `讓${egg.name}破殼` : `幫${egg.name}注入能量，目前生命訊號 ${Math.round(pct)}%`);
}

// 對話框有事才出現：打開後依字數停留幾秒，自動收起
function openBubble() {
  const bubble = $('bubble');
  bubble.classList.add('is-open');
  $('guide-alert').hidden = true;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    bubble.classList.remove('is-open');
    $('guide-alert').hidden = $('guide').dataset.mode === 'rest';
  }, 3200 + $('bubble-text').textContent.length * 120);
}

function guideAction() {
  const mode = $('guide').dataset.mode;
  if (mode === 'wish') showView('wish');
  else if (mode === 'tap') showView('incubate');
}

// 小恐龍暫時換一句話和表情，幾秒後恢復
function say(text, mood, ms = 2200) {
  sayOverride = { text, mood };
  clearTimeout(sayTimer);
  sayTimer = setTimeout(() => {
    sayOverride = null;
    renderHome();
  }, ms);
  renderHome();
}

function renderPlayer() {
  const level = playerLevel(state);
  const xp = state.player.xp % XP_PER_LEVEL;
  $('player-rank').textContent = `Lv.${level} ${rankTitle(level)}`;
  $('player-xp').textContent = `${xp} / ${XP_PER_LEVEL} XP`;
  $('xp-fill').style.width = `${xp / XP_PER_LEVEL * 100}%`;
  $('xp-track').setAttribute('aria-valuenow', xp);
}

function renderWishCompanion(wish) {
  const id = selectedPresenter(state);
  const image = $('wish-portrait');
  if (image.dataset.presenter !== (id || 'egg')) {
    image.dataset.presenter = id || 'egg';
    image.classList.toggle('is-egg', !id);
    image.alt = id ? CHARACTERS[id].name : '蛋裡的小湘';
    loadWithFallback(image, id ? characterSources(CHARACTERS[id].image) : eggLayerSources('origin', 'shell'));
  }
  $('wish-line').textContent = `「${wish.copy.line}」`;
  $('wish-speaker').textContent = `— ${wish.copy.speaker}`;
  $('open-presenter').textContent = id ? '切換小湘 ⌄' : '等待初次相遇 ⌄';
}

function renderWishes(effects = {}) {
  const wishes = todaysWishes();
  const done = wishes.filter(w => w.done).length;
  const now = new Date();
  $('book-day').textContent = `${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
  $('book-progress').textContent = `今日 ${done} / 3`;
  const feedback = photoBusy ? { scanning: activePhotoId, ...effects } : effects;
  wishBook.update(wishes, WISH_REWARD, feedback, { date: state.wishes.date });
  $('book-log-text').textContent = done === 3 ? '今天的願望都實現了，謝謝你陪我。' : done ? `已實現 ${done} 個願望，今天獲得 ${done * WISH_REWARD} 能量。` : '';
  renderPlayer();
  renderGrowth();
}

function renderGrowth() {
  const level = playerLevel(state);
  if (viewedChapter === null || viewedChapter > level) viewedChapter = level;
  const select = $('chapter-select');
  if (select.options.length !== level) {
    select.replaceChildren(...Array.from({ length: level }, (_, i) => new Option(`Lv.${i + 1}`, i + 1)));
  }
  select.value = viewedChapter;
  const chapter = growthGoals(viewedChapter);
  $('chapter-number').textContent = `CHAPTER ${pad(viewedChapter)}`;
  $('chapter-title').textContent = chapter.name;
  $('growth-list').replaceChildren(...chapter.goals.map((goal, i) => {
    const progress = goalProgress(state, goal);
    const row = document.createElement('article'); row.className = 'growth-goal'; row.tabIndex = -1; row.dataset.goalRow = goal.id;
    const no = document.createElement('span'); no.className = 'growth-goal__no'; no.textContent = pad(i + 1);
    const content = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = goal.title;
    const hint = document.createElement('p'); hint.textContent = goal.hint;
    content.append(title, hint);
    const status = document.createElement('div'); status.className = 'growth-goal__state';
    const count = document.createElement('p'); count.className = 'growth-goal__progress'; count.textContent = `${progress.current} / ${goal.target}`; content.append(count);
    if (progress.claimed) { const label = document.createElement('span'); label.textContent = '✓ 已領取'; status.append(label); }
    else if (progress.complete) {
      const claim = document.createElement('button'); claim.type = 'button'; claim.className = 'growth-claim'; claim.dataset.goal = goal.id; claim.setAttribute('aria-label', `領取 ${goal.title}的 ${GROWTH_XP} XP 獎勵`);
      const reward = document.createElement('span'); reward.className = 'growth-claim__reward'; reward.textContent = `+${GROWTH_XP} XP`;
      const action = document.createElement('span'); action.className = 'growth-claim__action'; action.textContent = '領取';
      const arrow = document.createElement('span'); arrow.className = 'growth-claim__arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
      action.append(arrow); claim.append(action, reward); claim.disabled = claimBusy; status.append(claim);
    } else { const label = document.createElement('span'); label.textContent = '進行中'; status.append(label); }
    row.append(no, content, status); return row;
  }));
  const pending = chapter.goals.find(g => !goalProgress(state, g).complete);
  $('growth-action').textContent = pending ? pending.destination === 'daily' ? '去實現今日願望 ⟶' : '前往培育 ⟶' : chapter.goals.some(g => !goalProgress(state, g).claimed) ? '領取已完成的願望' : '看看今日願望 ⟶';
}

function showWishTab(name, focus = false) {
  wishTab = name;
  for (const tab of ['daily', 'growth']) {
    $(`tab-${tab}`).setAttribute('aria-selected', String(name === tab));
    $(`tab-${tab}`).tabIndex = name === tab ? 0 : -1;
    $(`panel-${tab}`).hidden = name !== tab;
  }
  if (focus) $(`tab-${name}`).focus();
}

function renderPresenters() {
  const selected = selectedPresenter(state);
  const owned = Object.values(CHARACTERS).filter(c => state.dex[c.no]);
  $('presenter-list').replaceChildren(...owned.map(character => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'resident-choice presenter-choice'; button.dataset.presenter = character.no; button.setAttribute('aria-pressed', String(selected === character.no));
    const image = document.createElement('img'); image.alt = ''; loadWithFallback(image, characterSources(character.image));
    const name = document.createElement('span'); name.textContent = character.name;
    const status = document.createElement('span'); status.className = 'resident-choice__action'; status.textContent = selected === character.no ? '✓ 陪伴中' : '選擇她';
    button.append(image, name, status); return button;
  }));
  if (!owned.length) {
    const text = document.createElement('p'); text.className = 'residents-intro'; text.textContent = '先前往培育，迎接第一位小湘。孵化後就能選擇陪伴你的角色。';
    const action = document.createElement('button'); action.type = 'button'; action.className = 'btn'; action.textContent = '前往培育'; action.addEventListener('click', () => showView('incubate')); $('presenter-list').append(text, action);
  }
}

function announceLevel(result) {
  if (result?.levelBefore && playerLevel(state) > result.levelBefore) {
    restart(document.querySelector('.player-progress'), 'is-level-up');
    $('growth-feedback').textContent = `升級為 Lv.${playerLevel(state)}！新的成長願望已解鎖，先前的願望仍可在歷程完成。`;
    toast(`升級為 Lv.${playerLevel(state)}！新的成長願望已解鎖。`);
  }
}

function renderDex() {
  const all = Object.values(CHARACTERS);
  const owned = all.filter((c) => state.dex[c.no]);
  $('dex-count').textContent = `已收集 ${owned.length} / ${all.length}`;
  $('dex-grid').replaceChildren(
    ...all.map((c) => {
      const has = Boolean(state.dex[c.no]);
      const li = document.createElement('li');
      li.className = `dex__card card${has ? ' is-owned' : ''}`;
      const img = document.createElement('img');
      img.className = `dex__img${has ? '' : ' is-locked'}`;
      img.alt = has ? c.name : '尚未收集的小湘';
      loadWithFallback(img, characterSources(c.image));
      const no = document.createElement('div');
      no.className = 'dex__no';
      no.textContent = `No.${c.no}`;
      const name = document.createElement('div');
      name.className = 'dex__name';
      name.textContent = has ? c.name : '???';
      li.append(img, no, name);
      return li;
    }),
  );
}

function renderResidents() {
  const selected = residentsFor(state.dex);
  const owned = Object.values(CHARACTERS).filter(character => state.dex[character.no]);
  $('residents-summary').textContent = `已收集 ${owned.length} 位 · 已入住 ${selected.length} / ${ROOM_LIMIT}`;
  $('residents-list').replaceChildren(...owned.map(character => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'resident-choice';
    button.dataset.no = character.no;
    button.setAttribute('aria-pressed', String(selected.includes(character.no)));
    const image = document.createElement('img');
    image.alt = '';
    loadWithFallback(image, characterSources(character.image));
    const name = document.createElement('span');
    name.textContent = character.name;
    const action = document.createElement('span');
    action.className = 'resident-choice__action';
    action.textContent = selected.includes(character.no) ? '✓ 入住中' : '安排入住';
    button.append(image, name, action);
    return button;
  }));
  if (!owned.length) {
    const text = document.createElement('p');
    text.textContent = '第一位小湘還在等待孵化，先去培育室迎接她吧。';
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'btn'; button.textContent = '前往培育';
    button.addEventListener('click', () => showView('incubate'));
    $('residents-list').append(text, button);
  }
}

function renderAll() {
  renderResources();
  renderHome();
  renderWishes();
  renderDex();
  if ($('residents').open) renderResidents();
}

function showView(name, options = {}) {
  if (!VIEWS.includes(name)) name = 'home';
  for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
  for (const view of document.querySelectorAll('.view')) view.hidden = view.dataset.view !== name;
  for (const item of document.querySelectorAll('.nav__item')) {
    if (item.dataset.view === name) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  }
  if ($('function-center').open) $('function-center').close();
  $('back-home').hidden = name === 'home';
  $('location-label').textContent = { home: '日常 / HOME', incubate: '培育 / INCUBATION', wish: '願望 / WISHES', dex: '圖鑑 / COLLECTION' }[name];
  const nextHash = name === 'home' ? '#home' : `#${name}`;
  if (location.hash !== nextHash) history[options.replace ? 'replaceState' : 'pushState'](null, '', nextHash);
  $('header').hidden = !TITLES[name];
  $('page-title').textContent = TITLES[name] || '';
  document.body.dataset.view = name;
  window.scrollTo(0, 0);
  syncRoomActivity();
  if (name === 'wish') {
    renderWishes();
    wishBook.openAtFirstUndone();
  }
}

function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
}

function showGain(text) {
  const el = $('float-gain');
  el.textContent = text;
  restart(el);
}

/* ---------- 玩法 ---------- */

// 能量球從資源列飛到蛋上；抵達時 resolve
function flyOrb() {
  const from = $('chip-energy').getBoundingClientRect();
  const to = eggButton.getBoundingClientRect();
  const orb = document.createElement('div');
  orb.className = 'orb';
  if (reducedMotion() || !orb.animate) return Promise.resolve();
  document.body.append(orb);
  const x0 = from.left + 16;
  const y0 = from.top + from.height / 2;
  const x1 = to.left + to.width / 2;
  const y1 = to.top + to.height / 2;
  const anim = orb.animate(
    [
      { transform: `translate(${x0}px, ${y0}px) scale(0.6)`, opacity: 0.6 },
      { transform: `translate(${x0 + (x1 - x0) * 0.35}px, ${y0 + (y1 - y0) * 0.15 - 20}px) scale(1.2)`, opacity: 1, offset: 0.4 },
      { transform: `translate(${x1}px, ${y1}px) scale(0.7)`, opacity: 1 },
    ],
    { duration: 380, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' },
  );
  return anim.finished.catch(() => {}).then(() => orb.remove());
}

function celebrateStage(stage) {
  $('banner-en').textContent = `STAGE ${stage} / 4`;
  $('banner-zh').textContent = STAGE_NAMES[stage];
  restart($('banner'));
  incubator.stageUp();
  say(`${STAGE_NAMES[stage]}！`, stage === 4 ? 'cheer' : 'happy', 2000);
  buzz([18, 40, 28]);
}

// 點蛋：把能量注入蛋裡；生命訊號滿了就破殼
async function onEggTap() {
  if (busy) return;
  busy = true;
  incubator.press();
  try {
    const transaction = await updateState(current => {
      const egg = EGGS[current.egg.id];
      if (current.egg.warmth >= egg.warmthNeeded) return { type: 'hatch', egg: { ...current.egg } };
      if (current.energy <= 0) return { type: 'empty' };
      const before = stageOf(100 * current.egg.warmth / egg.warmthNeeded);
      const amount = Math.min(TAP_ENERGY, current.energy, egg.warmthNeeded - current.egg.warmth);
      current.energy -= amount; current.egg.warmth += amount; current.player.stats.fed += amount;
      return { type: 'feed', amount, before, after: stageOf(100 * current.egg.warmth / egg.warmthNeeded) };
    });
    state = transaction.state;
    const result = transaction.result;
    if (result.type === 'hatch') { await hatch(result.egg); return; }
    if (result.type === 'empty') {
      const message = todaysWishes().some(w => !w.done) ? '能量不足，完成今日願望就能繼續培育。' : '能量用完了，明天再來完成願望吧。';
      say(message, 'remind', 2600); toast(message); return;
    }
    renderResources(); buzz(12); restart($('chip-energy'), 'is-bump');
    await flyOrb(); renderHome(); renderWishes(); incubator.feed(); showGain(`+${result.amount}`);
    if (result.after > result.before) celebrateStage(result.after);
  } finally { busy = false; state = loadState(); renderAll(); }
}

async function hatch(expected) {
  buzz([30, 50, 30, 50, 60]);
  await runAnalysis(); incubator.flare(); await eggView.hatch();
  const transaction = await updateState(current => {
    if (current.egg.id !== expected.id || current.egg.since !== expected.since || current.egg.warmth < EGGS[current.egg.id].warmthNeeded) return null;
    const character = CHARACTERS[rollHatch(EGGS[current.egg.id])];
    const duplicate = Boolean(current.dex[character.no]);
    if (duplicate) current.fossils += DUPLICATE_FOSSILS;
    else current.dex[character.no] = { at: new Date().toISOString() };
    current.hatched += 1; current.egg = newEgg('ordinary');
    return { character, duplicate };
  });
  state = transaction.state; eggView = null; sayOverride = null;
  if (transaction.result && !transaction.result.duplicate) welcomeResident(transaction.result.character.no, state.dex);
  renderAll();
  if (transaction.result) showReveal(transaction.result.character, transaction.result.duplicate);
  else toast('這顆蛋已經完成孵化，進度已更新。');
}

// 破殼前的過場：畫面變暗、掃描、分析進度跑到 100%
async function runAnalysis() {
  const box = $('analysis');
  box.hidden = false;
  const total = reducedMotion() ? 0 : 2600;
  const start = performance.now();
  await new Promise((resolve) => {
    const tick = (now) => {
      const p = total ? Math.min(1, (now - start) / total) : 1;
      $('analysis-fill').style.width = `${p * 100}%`;
      $('analysis-pct').textContent = `${pad(p * 100, 3)}%`;
      if (p < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
  await sleep(250);
  box.hidden = true;
}

function showReveal(c, duplicate) {
  loadWithFallback($('reveal-img'), characterSources(c.image));
  $('reveal-img').alt = c.name;
  $('reveal-en').textContent = duplicate ? 'DUPLICATE SPECIMEN' : 'NEW SPECIMEN REGISTERED';
  $('reveal-no').textContent = `No.${c.no} ｜ ${c.rarity}`;
  $('reveal-name').textContent = c.name;
  $('reveal-line').textContent = c.line;
  $('reveal-bonus').hidden = !duplicate;
  $('reveal-bonus').textContent = `已經有這隻小湘了，轉換成化石碎片 ×${DUPLICATE_FOSSILS}`;
  $('reveal-ok').textContent = duplicate ? '收下化石' : '一起回家';
  $('reveal').dataset.next = 'home';
  $('reveal').showModal();
  syncRoomActivity();
  buzz([40, 60, 80]);
}

// 能量球從委託卡飛到資源列的能量膠囊；抵達時 resolve
function flyOrbToChip(fromEl) {
  const from = fromEl.getBoundingClientRect();
  const to = $('chip-energy').getBoundingClientRect();
  const orb = document.createElement('div');
  orb.className = 'orb';
  if (reducedMotion() || !orb.animate) return Promise.resolve();
  document.body.append(orb);
  const x0 = from.left + from.width / 2;
  const y0 = from.top + from.height / 2;
  const x1 = to.left + 16;
  const y1 = to.top + to.height / 2;
  const anim = orb.animate(
    [
      { transform: `translate(${x0}px, ${y0}px) scale(0.6)`, opacity: 0.7 },
      { transform: `translate(${x0 + (x1 - x0) * 0.5 + 30}px, ${y0 + (y1 - y0) * 0.45}px) scale(1.3)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${x1}px, ${y1}px) scale(0.7)`, opacity: 1 },
    ],
    { duration: 620, easing: 'cubic-bezier(0.4, 0, 0.4, 1)' },
  );
  return anim.finished.catch(() => {}).then(() => orb.remove());
}

// 書頁上散開的幾顆星光
function pageSparks(anchor) {
  if (reducedMotion() || !anchor) return;
  const host = $('book');
  const a = anchor.getBoundingClientRect();
  const h = host.getBoundingClientRect();
  for (let i = 0; i < 7; i += 1) {
    const sp = document.createElement('i');
    sp.className = 'spark';
    const angle = (i / 7) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 34 + Math.random() * 26;
    sp.style.left = `${a.left - h.left + a.width / 2}px`;
    sp.style.top = `${a.top - h.top + a.height / 2}px`;
    sp.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    sp.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    sp.addEventListener('animationend', () => sp.remove(), { once: true });
    host.append(sp);
  }
}

// 拍照完成願望。判定規則、獎勵與存檔都由原本的邏輯處理，這裡只負責演出：
// 0ms 書頁發光 → 250ms 寶石點亮 → 650ms 印章落下、書頁一震 → 950ms 星光與「能量 +35」→ 1400ms 光點飛向能量計
async function onPhoto(wish, file) {
  if (photoBusy) return;
  const photoDate = wish.date;
  if (photoDate !== todayKey()) {
    state = (await updateState(() => {})).state; renderAll(); toast('新的一天開始了，請重新選擇願望。'); return;
  }
  if (todaysWishes().some(w => w.id === wish.id && w.done)) return;
  photoBusy = true;
  activePhotoId = wish.id;
  try {
    await processPhoto(wish, file, photoDate);
  } finally { photoBusy = false; activePhotoId = null; state = loadState(); renderAll(); }
}

async function processPhoto(wish, file, photoDate) {
  renderWishes({ scanning: wish.id });
  let ratio;
  try {
    [ratio] = await Promise.all([analyzePhoto(file, wish, $('photo-thumb')), sleep(700)]);
  } catch {
    renderWishes();
    toast('這張照片讀不出來，再拍一次試試。');
    return;
  }
  const pct = Math.round(ratio * 100);
  const need = Math.round(PASS_RATIO * 100);

  if (ratio < PASS_RATIO) {
    renderWishes();
    $('photo-fill').style.width = `${Math.min(100, pct)}%`;
    $('photo-fill').style.background = wish.swatch;
    $('photo-title').textContent = '顏色不夠多';
    $('photo-text').textContent = `${wish.color}只佔畫面的 ${pct}%，需要 ${need}%。靠近一點，讓它填滿畫面再拍一次。`;
    $('photo-ok').textContent = '再試一次';
    $('photo').showModal();
    buzz(8);
    return;
  }

  // 先結算並存檔（只會執行這一次），之後才是動畫；動畫中途關掉也不會重複領獎
  if (photoDate !== todayKey()) { state = (await updateState(() => {})).state; renderAll(); toast('新的一天開始了，請重新選擇願望。'); return; }
  const transaction = await updateState(current => completeDaily(current, photoDate, wish.id));
  state = transaction.state;
  if (!transaction.result.awarded) { renderAll(); return; }
  renderHome();
  renderWishes({ fresh: wish.id });
  restart($('book'), 'is-fresh');
  buzz([20, 40, 60]);

  await sleep(950);
  const gem = $('book-gems').querySelector('[aria-pressed="true"] .progress-gem');
  pageSparks(gem);
  toast(`願望達成 · +${WISH_REWARD} 能量 · +${DAILY_XP} XP`);
  announceLevel(transaction.result);
  await sleep(450);
  if (gem) await flyOrbToChip(gem);
  renderResources();
  restart($('chip-energy'), 'is-bump');
  if (state.wishes.done.length >= todaysWishes().length) buzz([30, 60, 30, 60, 90]);
}

/* ---------- 願望操作 ---------- */
$('tab-daily').addEventListener('click', () => showWishTab('daily'));
$('tab-growth').addEventListener('click', () => showWishTab('growth'));
for (const tab of ['daily', 'growth']) $(`tab-${tab}`).addEventListener('keydown', event => {
  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault(); showWishTab(event.key === 'Home' ? 'daily' : event.key === 'End' ? 'growth' : tab === 'daily' ? 'growth' : 'daily', true);
  }
});
$('chapter-select').addEventListener('change', () => { viewedChapter = Number($('chapter-select').value); renderGrowth(); });
$('growth-list').addEventListener('click', async event => {
  const button = event.target.closest('[data-goal]');
  if (!button || claimBusy) return;
  claimBusy = true; button.disabled = true;
  const chapter = viewedChapter;
  try {
    const transaction = await updateState(current => claimGrowth(current, chapter, button.dataset.goal));
    state = transaction.state; renderAll();
    if (transaction.result.awarded) { $('growth-feedback').textContent = `心願達成，獲得 ${GROWTH_XP} XP。`; announceLevel(transaction.result); buzz([15, 30, 25]); }
  } finally { claimBusy = false; state = loadState(); renderAll(); $('growth-list').querySelector(`[data-goal-row="${button.dataset.goal}"]`)?.focus({ preventScroll: true }); }
});
$('growth-action').addEventListener('click', () => {
  const goals = growthGoals(viewedChapter).goals;
  const pending = goals.find(g => !goalProgress(state, g).complete);
  if (pending?.destination === 'incubate') showView('incubate');
  else if (!pending && goals.some(g => !goalProgress(state, g).claimed)) $('growth-list').querySelector('button')?.focus();
  else showWishTab('daily', true);
});
$('open-presenter').addEventListener('click', () => { renderPresenters(); $('presenter-feedback').textContent = ''; $('presenter').showModal(); syncRoomActivity(); });
$('close-presenter').addEventListener('click', () => $('presenter').close());
$('presenter-list').addEventListener('click', event => {
  const button = event.target.closest('[data-presenter]');
  if (!button) return;
  state = loadState();
  const id = button.dataset.presenter;
  if (!CHARACTERS[id] || !state.dex[id]) return;
  try { localStorage.setItem(PRESENTER_KEY, id); }
  catch { $('presenter-feedback').textContent = '這次選擇無法儲存，請再試一次。'; return; }
  renderWishes(); $('presenter').close();
});

/* ---------- 事件 ---------- */

eggButton.addEventListener('click', onEggTap);
$('cultivate').addEventListener('click', onEggTap);
$('home-wishes').addEventListener('click', () => showView('wish'));
$('incubate-wishes').addEventListener('click', () => showView('wish'));
$('enter-incubator').addEventListener('click', () => showView('incubate'));
$('home-letter').addEventListener('click', () => { $('intro').showModal(); syncRoomActivity(); });
$('open-residents').addEventListener('click', () => { renderResidents(); $('residents-feedback').textContent = ''; $('residents').showModal(); syncRoomActivity(); });
$('close-residents').addEventListener('click', () => $('residents').close());
$('residents-done').addEventListener('click', () => $('residents').close());
$('residents-list').addEventListener('click', event => {
  const button = event.target.closest('button[data-no]');
  if (!button) return;
  const no = button.dataset.no;
  const latest = loadState();
  if (!CHARACTERS[no] || !latest.dex[no]) return;
  state = latest;
  let ids = residentsFor(state.dex);
  if (ids.includes(no)) ids = ids.filter(id => id !== no);
  else if (ids.length < ROOM_LIMIT) ids.push(no);
  else { $('residents-feedback').textContent = '首頁最多入住三位，先讓一位休息，再邀請她吧。'; return; }
  if (!saveResidents(ids)) { $('residents-feedback').textContent = '這次安排無法儲存，請再試一次。'; return; }
  $('residents-feedback').textContent = '';
  renderHome(); renderResidents();
  $('residents-list').querySelector(`[data-no="${no}"]`)?.focus({ preventScroll: true });
});
for (const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('close', syncRoomActivity);
$('back-home').addEventListener('click', () => showView('home'));
$('open-center').addEventListener('click', () => { $('function-center').showModal(); syncRoomActivity(); });
$('close-center').addEventListener('click', () => $('function-center').close());
$('function-center').addEventListener('click', (event) => { if (event.target === $('function-center')) { const r = event.target.getBoundingClientRect(); if (event.clientY < r.top || event.clientX < r.left || event.clientX > r.right) event.target.close(); } });
addEventListener('popstate', () => { const view = location.hash.slice(1); showView(VIEWS.includes(view) ? view : 'home', { replace: true }); });
addEventListener('storage', (event) => { if ([PRESENTER_KEY, ROOM_KEY, 'siang-collector:v1'].includes(event.key) && !busy && !photoBusy) { state = loadState(); eggView = null; renderAll(); } });
$('nav').addEventListener('click', (e) => {
  const item = e.target.closest('.nav__item');
  if (item && !item.disabled) showView(item.dataset.view);
});
$('fab-wish').addEventListener('click', () => showView('wish'));
// 點小恐龍：對話框收著就先打開；已經打開就照牠說的去做
$('guide').addEventListener('click', () => {
  if ($('bubble').classList.contains('is-open')) guideAction();
  else openBubble();
});
$('bubble').addEventListener('click', guideAction);
// 切到別的 App 或關螢幕時暫停角色
document.addEventListener('visibilitychange', () => {
  syncRoomActivity();
});
$('fab-letter').addEventListener('click', () => { $('intro').showModal(); syncRoomActivity(); });
$('intro-ok').addEventListener('click', () => {
  void updateState(current => { current.seenIntro = true; }).then(transaction => { state = transaction.state; $('intro').close(); });
});
$('photo-ok').addEventListener('click', () => $('photo').close());
$('book-home').addEventListener('click', () => {
  showView('incubate');
  say('太棒了！拿到能量了，點蛋餵給它！', 'happy', 2400);
});
$('reveal-ok').addEventListener('click', () => {
  $('reveal').close();
  showView($('reveal').dataset.next);
  toast('新的蛋已送達培育室。');
});
$('reset-btn').addEventListener('click', () => {
  state = resetState();
  try { localStorage.removeItem(ROOM_KEY); localStorage.removeItem(PRESENTER_KEY); } catch {}
  eggView = null;
  sayOverride = null;
  renderAll();
  showView('home');
  $('intro').showModal();
});

renderAll();
showView(VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home', { replace: true });
if (!state.seenIntro) { $('intro').showModal(); syncRoomActivity(); }

setInterval(() => { if (!document.hidden && state.wishes.date !== todayKey()) void updateState(() => {}).then(transaction => { state = transaction.state; renderAll(); }); }, 30000);
