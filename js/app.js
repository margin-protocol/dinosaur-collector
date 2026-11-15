import { EGGS, CHARACTERS, DUPLICATE_FOSSILS, rollHatch, characterSources, loadWithFallback } from './eggs.js';
import { createIncubator, createEggView, stageOf, restart, reducedMotion } from './egg-view.js';
import { loadState, saveState, resetState, newEgg } from './state.js';
import { createSiangActor } from './actors.js';
import { WISH_REWARD, PASS_RATIO, wishesFor, todayKey, analyzePhoto } from './wishes.js';

const $ = (id) => document.getElementById(id);
const TAP_ENERGY = 10; // 每點一下蛋，注入多少能量
const BPM = [48, 64, 82, 104, 120]; // 各階段的心跳，跟蛋的脈動同步
const TITLES = { wish: '今日願望', dex: '圖鑑' };
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

let state = loadState();
if (!state.egg) state.egg = newEgg('ordinary'); // 培育槽不留空：孵完就送來下一顆
let eggView = null;
let busy = false;
let toastTimer = 0;
let sayTimer = 0;
let bubbleTimer = 0;
let sayOverride = null; // 小恐龍暫時要說的話（提醒、歡呼），幾秒後回到平常的提示
const VIEWS = ['home', 'wish', 'dex'];
const STAGE_NAMES = ['', '蛋有動靜了', '蛋殼裂開了', '就快出來了', '可以破殼了'];

const incubator = createIncubator();
$('stage-egg').replaceWith(incubator.el);

// 蛋本身就是按鈕：點它注入能量，滿了就破殼
const eggButton = document.createElement('button');
eggButton.type = 'button';
eggButton.className = 'egg-hit';
incubator.el.append(eggButton);

// 小湘：孵出來以後才出現，在地板上自己走動
const siang = createSiangActor($('floor'));

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
  incubator.setProgress(pct / 100);
  incubator.el.classList.toggle('is-ready', ready);

  $('egg-name').textContent = egg.name;
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
  for (const id of ['wish-dot', 'nav-wish-dot']) {
    $(id).hidden = open.length === 0;
    $(id).textContent = open.length;
  }

  // 小湘孵出來以後才出現（孵出前不劇透）
  siang.show(Boolean(state.dex['001']));
  if (document.body.dataset.view === 'home') siang.start();

  // 小恐龍：告訴玩家現在可以做什麼
  let text;
  let mood = 'idle';
  let mode = 'tap';
  if (ready) {
    text = '蛋要出來了！快點它！';
    mood = 'cheer';
  } else if (state.energy > 0) {
    text = '有能量了！點蛋餵給它。';
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
  else if (mode === 'tap') onEggTap();
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

function renderWishes() {
  const wishes = todaysWishes();
  const left = wishes.filter((w) => !w.done).length;
  $('wish-lead').textContent = left
    ? `${speaker()}有 ${left} 個願望。拍下它想看的顏色，每個願望可以換 ${WISH_REWARD} 點能量。`
    : '今天的願望都完成了。明天會有新的願望。';
  $('wish-list').replaceChildren(
    ...wishes.map((w) => {
      const li = document.createElement('li');
      li.className = `wish card${w.done ? ' is-done' : ''}`;
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
  $('nav').style.setProperty('--i', String(VIEWS.indexOf(name)));
  $('header').hidden = name === 'home';
  $('page-title').textContent = TITLES[name] || '';
  document.body.dataset.view = name;
  if (name !== 'home') window.scrollTo(0, 0);
  // 角色只在首頁活動；離開首頁就停下來，省電
  if (name === 'home') siang.start();
  else siang.stop();
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
  const egg = EGGS[state.egg.id];
  incubator.press();

  if (percent() >= 100) {
    await hatch(egg);
    return;
  }
  if (state.energy <= 0) {
    const open = todaysWishes().filter((w) => !w.done);
    say(open.length ? '能量用完了。先去完成願望，再回來餵它吧！' : '能量用完了，明天再來餵它吧。', 'remind', 2600);
    if (open.length) restart($('fab-wish'), 'is-nudge');
    buzz(8);
    return;
  }

  // 規則不變：能量與生命訊號立刻結算並存檔；畫面等能量球飛到蛋上再更新
  const before = stageOf(percent());
  const amount = Math.min(TAP_ENERGY, state.energy, egg.warmthNeeded - state.egg.warmth);
  state.energy -= amount;
  state.egg.warmth += amount;
  saveState(state);
  const after = stageOf(percent());
  renderResources();
  restart($('chip-energy'), 'is-bump');
  buzz(12);

  await flyOrb();
  renderHome();
  incubator.feed();
  showGain(`+${amount}`);
  siang.cheer();
  restart($('guide'), 'is-hop');
  if (after > before) celebrateStage(after);
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
  sayOverride = null;
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
// 點小恐龍：對話框收著就先打開；已經打開就照牠說的去做
$('guide').addEventListener('click', () => {
  if ($('bubble').classList.contains('is-open')) guideAction();
  else openBubble();
});
$('bubble').addEventListener('click', guideAction);
// 切到別的 App 或關螢幕時暫停角色
document.addEventListener('visibilitychange', () => {
  if (document.hidden) siang.stop();
  else if (document.body.dataset.view === 'home') siang.start();
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
    say('太棒了！拿到能量了，點蛋餵給它！', 'happy', 2400);
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
  sayOverride = null;
  renderAll();
  showView('home');
  $('intro').showModal();
});

renderAll();
showView('home');
if (!state.seenIntro) $('intro').showModal();
