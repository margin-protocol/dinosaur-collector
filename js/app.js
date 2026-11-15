import { EGGS, CHARACTERS, characterSources, loadWithFallback } from './eggs.js';
import { createIncubator, createEggView, stageOf, restart } from './egg-view.js';
import { loadState, saveState, resetState } from './state.js';

const $ = (id) => document.getElementById(id);
const TAP_WARMTH = 10; // 教學階段：每次保溫增加的能量。之後改由任務給予。
const BPM = [48, 64, 82, 104, 120]; // 各階段的心跳，跟蛋的脈動同步
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

const MESSAGES = [
  '蛋很安靜，像在沉睡。',
  '裡面有東西在動……',
  '蛋殼裂開了，有光透出來。',
  '快出來了！再一點點！',
  '生命訊號達標，可以破殼了。',
];

let state = loadState();
let eggView = null;
const incubator = createIncubator();
$('stage-egg').replaceWith(incubator.el);
let busy = false;

function percent() {
  const egg = EGGS[state.egg.id];
  return Math.min(100, (state.egg.warmth / egg.warmthNeeded) * 100);
}

function renderHome() {
  const hasEgg = Boolean(state.egg);
  $('vitals').hidden = !hasEgg;
  $('warm-btn').hidden = !hasEgg;
  $('readouts').hidden = !hasEgg;
  $('egg-name').textContent = hasEgg ? EGGS[state.egg.id].name : '';
  $('egg-code').textContent = hasEgg ? `SPECIMEN · ${EGGS[state.egg.id].code}` : '';

  if (!hasEgg) {
    eggView = null;
    incubator.setEgg(null);
    return;
  }
  if (!eggView) {
    eggView = createEggView(EGGS[state.egg.id]);
    incubator.setEgg(eggView);
  }
  const pct = percent();
  const s = stageOf(pct);
  eggView.setProgress(pct);
  $('vitals-value').textContent = pad(pct, 3);
  $('ro-stage').textContent = `${pad(Math.min(s, 4))} · 04`;
  $('ro-day').textContent = `D+${pad(daysSince(state.egg.since))}`;
  $('ecg-bpm').textContent = BPM[s];
  $('vitals').style.setProperty('--ecg-dur', `${(2 * 60) / BPM[s]}s`);
  $('vitals').dataset.stage = String(s);
  $('vitals-fill').style.width = `${pct}%`;
  $('vitals-msg').textContent = MESSAGES[s];
  $('warm-label').textContent = s === 4 ? '破殼' : '幫蛋保溫';
}

function renderDex() {
  const all = Object.values(CHARACTERS);
  const owned = all.filter((c) => state.dex[c.no]);
  $('dex-count').textContent = `已收集 ${owned.length} / ${all.length}`;
  $('dex-grid').replaceChildren(
    ...all.map((c) => {
      const has = Boolean(state.dex[c.no]);
      const li = document.createElement('li');
      li.className = 'dex__card';
      const img = document.createElement('img');
      img.className = `dex__img${has ? '' : ' is-locked'}`;
      img.alt = has ? c.name : '尚未收集的小湘';
      loadWithFallback(img, characterSources(c.image));
      const no = document.createElement('div');
      no.className = 'dex__no';
      no.textContent = `No.${c.no}`;
      if (has) li.classList.add('is-owned');
      const name = document.createElement('div');
      name.className = 'dex__name';
      name.textContent = has ? c.name : '???';
      li.append(img, no, name);
      return li;
    }),
  );
}

async function onWarm() {
  if (busy || !state.egg) return;
  const egg = EGGS[state.egg.id];

  if (percent() < 100) {
    const before = stageOf(percent());
    state.egg.warmth = Math.min(egg.warmthNeeded, state.egg.warmth + TAP_WARMTH);
    if (!state.egg.since) state.egg.since = new Date().toISOString();
    saveState(state);
    renderHome();
    incubator.pulse();
    showGain(TAP_WARMTH);
    buzz(stageOf(percent()) > before ? [18, 40, 28] : 12);
    return;
  }

  busy = true;
  buzz([30, 50, 30, 50, 60]);
  await runAnalysis();
  incubator.flare();
  await eggView.hatch();
  const character = CHARACTERS[egg.hatches];
  state.egg = null;
  if (character) state.dex[character.no] = { at: new Date().toISOString() };
  saveState(state);
  busy = false;
  renderHome();
  renderDex();
  if (character) showReveal(character);
}

function showGain(n) {
  const el = $('float-gain');
  el.textContent = `+${n}`;
  restart(el);
}

// 破殼前的過場：畫面變暗、掃描、分析進度跑到 100%
async function runAnalysis() {
  const box = $('analysis');
  box.hidden = false;
  const total = reducedMotion() ? 0 : 1600;
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

function showReveal(c) {
  loadWithFallback($('reveal-img'), characterSources(c.image));
  $('reveal-img').alt = c.name;
  $('reveal-no').textContent = `No.${c.no} ｜ ${c.rarity}`;
  $('reveal-name').textContent = c.name;
  $('reveal-line').textContent = c.line;
  $('reveal').showModal();
  buzz([40, 60, 80]);
}

function showView(name) {
  for (const view of document.querySelectorAll('.view')) view.hidden = view.dataset.view !== name;
  for (const item of document.querySelectorAll('.nav__item')) {
    if (item.dataset.view === name) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  }
  $('page-title').textContent = name === 'dex' ? '圖鑑' : '培育槽 01';
  document.body.dataset.view = name;
}

$('warm-btn').addEventListener('click', onWarm);
$('nav').addEventListener('click', (e) => {
  const item = e.target.closest('.nav__item');
  if (item && !item.disabled) showView(item.dataset.view);
});
$('intro-ok').addEventListener('click', () => {
  state.seenIntro = true;
  saveState(state);
  $('intro').close();
});
$('reveal-ok').addEventListener('click', () => {
  $('reveal').close();
  showView('dex');
});
$('reset-btn').addEventListener('click', () => {
  state = resetState();
  eggView = null;
  renderHome();
  renderDex();
  showView('home');
  $('intro').showModal();
});

renderHome();
renderDex();
showView('home');
if (!state.seenIntro) $('intro').showModal();
