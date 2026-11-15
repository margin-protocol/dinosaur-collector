import { EGGS, CHARACTERS, DUPLICATE_FOSSILS, rollHatch, characterSources, loadWithFallback } from './eggs.js';
import { createIncubator, createEggView, stageOf, restart } from './egg-view.js';
import { loadState, saveState, resetState, newEgg } from './state.js';
import { WISH_REWARD, PASS_RATIO, wishesFor, todayKey, analyzePhoto } from './wishes.js';

const $ = (id) => document.getElementById(id);
const TAP_ENERGY = 10; // 每點一下蛋，注入多少能量
const BPM = [48, 64, 82, 104, 120]; // 各階段的心跳，跟蛋的脈動同步
const TITLES = { wish: '今日願望', dex: '圖鑑' };
const pad = (n, len = 2) => String(Math.round(n)).padStart(len, '0');
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? 0 : ms));

// Android 震動回饋；不支援的裝置會安靜略過
function buzz(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function daysSince(iso) {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

let state = loadState();
if (!state.egg) state.egg = newEgg('ordinary'); // 培育槽不留空：孵完就送來下一顆
let eggView = null;
let busy = false;
let toastTimer = 0;

const incubator = createIncubator();
$('stage-egg').replaceWith(incubator.el);

// 蛋本身就是按鈕：點它注入能量，滿了就破殼
const eggButton = document.createElement('button');
eggButton.type = 'button';
eggButton.className = 'egg-hit';
incubator.el.append(eggButton);

/* ---------- 願望 ---------- */

function todaysWishes() {
  const date = todayKey();
  if (!state.wishes || state.wishes.date !== date) {
    state.wishes = { date, done: [] };
    saveState(state);
  }
  return wishesFor(date).map((w) => ({ ...w, done: state.wishes.done.includes(w.id) }));
}

// 孵出原味小湘之前，願望來自蛋裡的聲音；之後由小湘提出
const speaker = () => (state.dex['001'] ? '原味小湘' : '蛋裡的聲音');

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
  if (!eggView) {
    eggView = createEggView(egg);
    incubator.setEgg(eggView);
  }
  const pct = percent();
  const s = stageOf(pct);
  const ready = s === 4;
  eggView.setProgress(pct);

  $('egg-name').textContent = egg.name;
  $('egg-code').textContent = `${egg.code} · STAGE ${s}/4 · D+${pad(daysSince(state.egg.since))}`;
  $('vitals-value').textContent = pad(state.egg.warmth, 3);
  $('vitals-max').textContent = `/${egg.warmthNeeded}`;
  $('vitals-fill').style.width = `${pct}%`;
  $('ecg-bpm').textContent = BPM[s];
  $('vitals').style.setProperty('--ecg-dur', `${(2 * 60) / BPM[s]}s`);

  const wishes = todaysWishes();
  const open = wishes.filter((w) => !w.done);
  for (const id of ['wish-dot', 'nav-wish-dot']) {
    $(id).hidden = open.length === 0;
    $(id).textContent = open.length;
  }

  // 對話泡泡與提示：告訴玩家現在可以做什麼
  const hint = $('hint');
  hint.dataset.mode = ready ? 'hatch' : state.energy > 0 ? 'tap' : 'wish';
  if (ready) {
    $('bubble-text').textContent = '蛋要出來了！快點它！';
    hint.textContent = '點蛋破殼';
  } else if (state.energy > 0) {
    $('bubble-text').textContent = '有能量了！點蛋餵給它。';
    hint.textContent = '點蛋注入能量';
  } else if (open.length) {
    $('bubble-text').textContent = `${state.dex['001'] ? '小湘' : '蛋'}說：${open[0].line}`;
    hint.textContent = '';
  } else {
    $('bubble-text').textContent = '今天的願望都完成了，明天見！';
    hint.textContent = '';
  }
  eggButton.setAttribute('aria-label', ready ? `讓${egg.name}破殼` : `幫${egg.name}注入能量，目前生命訊號 ${Math.round(pct)}%`);
  incubator.el.classList.toggle('is-ready', ready);
  incubator.el.classList.toggle('can-tap', ready || state.energy > 0);
}

function renderWishes() {
  const wishes = todaysWishes();
  const left = wishes.filter((w) => !w.done).length;
  $('wish-lead').textContent = left
    ? `${speaker()}有 ${left} 個願望。拍下它想看的顏色，每個願望可以換 ${WISH_REWARD} 點能量。`
    : '今天的願望都完成了。明天會有新的願望。';
  $('wish-list').replaceChildren(
    ...wishes.map((w) => {
      const li = document.createElement('li');
      li.className = `wish panel${w.done ? ' is-done' : ''}`;
      const sw = document.createElement('span');
      sw.className = 'wish__swatch';
      sw.style.background = w.swatch;
      const body = document.createElement('div');
      body.className = 'wish__body';
      const line = document.createElement('div');
      line.className = 'wish__line';
      line.textContent = `「${w.line}」`;
      const meta = document.createElement('div');
      meta.className = 'wish__meta';
      meta.textContent = `拍到${w.color} · 能量 +${WISH_REWARD}`;
      body.append(line, meta);
      li.append(sw, body);

      if (w.done) {
        const ok = document.createElement('span');
        ok.className = 'wish__done';
        ok.textContent = '已完成';
        li.append(ok);
      } else {
        // 用 <label> 包住檔案輸入：點下去會直接開相機
        const label = document.createElement('label');
        label.className = 'wish__shoot';
        label.textContent = '拍照';
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.className = 'visually-hidden';
        input.setAttribute('aria-label', `拍照完成願望：${w.color}`);
        input.addEventListener('change', () => {
          const file = input.files && input.files[0];
          input.value = '';
          if (file) onPhoto(w, file);
        });
        label.append(input);
        li.append(label);
      }
      return li;
    }),
  );
}

function renderDex() {
  const all = Object.values(CHARACTERS);
  const owned = all.filter((c) => state.dex[c.no]);
  $('dex-count').textContent = `已收集 ${owned.length} / ${all.length}`;
  $('dex-grid').replaceChildren(
    ...all.map((c) => {
      const has = Boolean(state.dex[c.no]);
      const li = document.createElement('li');
      li.className = `dex__card${has ? ' is-owned' : ''}`;
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

function renderAll() {
  renderResources();
  renderHome();
  renderWishes();
  renderDex();
}

function showView(name) {
  for (const view of document.querySelectorAll('.view')) view.hidden = view.dataset.view !== name;
  for (const item of document.querySelectorAll('.nav__item')) {
    if (item.dataset.view === name) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  }
  $('header').hidden = name === 'home';
  $('page-title').textContent = TITLES[name] || '';
  document.body.dataset.view = name;
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

// 點蛋：把能量注入蛋裡；生命訊號滿了就破殼
async function onEggTap() {
  if (busy) return;
  const egg = EGGS[state.egg.id];

  if (percent() >= 100) {
    await hatch(egg);
    return;
  }
  if (state.energy <= 0) {
    restart($('bubble'), 'is-nudge');
    restart($('fab-wish'), 'is-nudge');
    buzz(8);
    return;
  }

  const before = stageOf(percent());
  const amount = Math.min(TAP_ENERGY, state.energy, egg.warmthNeeded - state.egg.warmth);
  state.energy -= amount;
  state.egg.warmth += amount;
  saveState(state);
  renderResources();
  renderHome();
  incubator.pulse();
  showGain(`+${amount}`);
  restart($('chip-energy'), 'is-bump');
  buzz(stageOf(percent()) > before ? [18, 40, 28] : 12);
}

async function hatch(egg) {
  busy = true;
  buzz([30, 50, 30, 50, 60]);
  await runAnalysis();
  incubator.flare();
  await eggView.hatch();

  const character = CHARACTERS[rollHatch(egg)];
  const duplicate = Boolean(state.dex[character.no]);
  if (duplicate) state.fossils += DUPLICATE_FOSSILS;
  else state.dex[character.no] = { at: new Date().toISOString() };
  state.hatched += 1;
  state.egg = newEgg('ordinary');
  saveState(state);

  eggView = null;
  busy = false;
  renderAll();
  showReveal(character, duplicate);
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
  $('reveal-ok').textContent = duplicate ? '收下化石' : '收進圖鑑';
  $('reveal').dataset.next = duplicate ? 'home' : 'dex';
  $('reveal').showModal();
  buzz([40, 60, 80]);
}

// 拍照完成願望：分析顏色，達標就給能量
async function onPhoto(wish, file) {
  let ratio;
  try {
    ratio = await analyzePhoto(file, wish, $('photo-thumb'));
  } catch {
    toast('這張照片讀不出來，再拍一次試試。');
    return;
  }
  const pct = Math.round(ratio * 100);
  const need = Math.round(PASS_RATIO * 100);
  const pass = ratio >= PASS_RATIO;
  $('photo-fill').style.width = `${Math.min(100, pct)}%`;
  $('photo-fill').style.background = wish.swatch;
  $('photo').dataset.pass = String(pass);

  if (pass) {
    state.wishes.done.push(wish.id);
    state.energy += WISH_REWARD;
    saveState(state);
    renderAll();
    $('photo-title').textContent = '願望達成';
    $('photo-text').textContent = `${wish.color}佔了畫面的 ${pct}%。能量 +${WISH_REWARD}`;
    $('photo-ok').textContent = '去幫蛋保溫';
    buzz([20, 40, 60]);
  } else {
    $('photo-title').textContent = '顏色不夠多';
    $('photo-text').textContent = `${wish.color}只佔畫面的 ${pct}%，需要 ${need}%。靠近一點，讓它填滿畫面再拍一次。`;
    $('photo-ok').textContent = '再試一次';
    buzz(8);
  }
  $('photo').showModal();
}

/* ---------- 事件 ---------- */

eggButton.addEventListener('click', onEggTap);
$('nav').addEventListener('click', (e) => {
  const item = e.target.closest('.nav__item');
  if (item && !item.disabled) showView(item.dataset.view);
});
$('fab-wish').addEventListener('click', () => showView('wish'));
$('bubble').addEventListener('click', () => showView('wish'));
$('hint').addEventListener('click', () => {
  if ($('hint').dataset.mode === 'wish') showView('wish');
  else onEggTap();
});
$('fab-letter').addEventListener('click', () => $('intro').showModal());
$('intro-ok').addEventListener('click', () => {
  state.seenIntro = true;
  saveState(state);
  $('intro').close();
});
$('photo-ok').addEventListener('click', () => {
  $('photo').close();
  if ($('photo').dataset.pass === 'true') {
    showView('home');
    restart($('chip-energy'), 'is-bump');
  }
});
$('reveal-ok').addEventListener('click', () => {
  $('reveal').close();
  showView($('reveal').dataset.next);
  toast('新的蛋送到培育槽了。');
});
$('reset-btn').addEventListener('click', () => {
  state = resetState();
  eggView = null;
  renderAll();
  showView('home');
  $('intro').showModal();
});

renderAll();
showView('home');
if (!state.seenIntro) $('intro').showModal();
