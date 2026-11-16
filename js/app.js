import { setupThemes, THEME_KEY } from './themes.js';
import { createTutorial, startTutorial } from './tutorial.js';
import { EGGS, SHELF_MAX, CHARACTERS, SERIES, DUPLICATE_FOSSILS, rollFor, COUNTY_CHARACTER, characterSources, loadWithFallback, eggLayerSources } from './eggs.js';
import { createIncubator, createEggView, stageOf, restart, reducedMotion } from './egg-view.js';
import { loadState, updateState, resetState, newEgg } from './state.js';
import { WISH_STAMPS_PER_EGG } from './wish-egg.js';
import { unlockedMilestones, allLetters, unreadCount, lockedMilestones } from './letters.js';
import { chatterLine, canOffer, makeTask, taskProgress, completeTask, TASK_REWARD } from './dino.js';
import { activeHolidays, HOLIDAYS, TAIWAN_NO } from './holidays.js';
import { INTROS, MYSTERY_INTROS } from './intros.js';
import { createAmbience, startChats, attachSnackDrag } from './home-life.js';
import { photoHash, similarPhoto } from './photo-hash.js';
import { compressPhoto, thumbnail, DATE_CODE } from './commissions.js';
import { offersFor, pickable, exchange } from './fossils.js';
import { FLAVORS, makeOffer, eggLabel, naughtyRequest, NAUGHTY_BONUS } from './egg-traits.js';
import { ACHIEVEMENT_GROUPS, achievementStatus, claimAchievement } from './achievements.js';
import { RECIPES, tickRecipes } from './recipes.js';
import { ensureBingo, bingoStatus, bingoReady, claimBingo, REWARDS as BINGO_REWARDS } from './bingo.js';
import { PASSIVE, SNAP, DAILY_GIFT, accruePassive, giftReady, claimGift, snapsToday, takeSnap, greet, pet, feedSnack, snacksLeft, PET, SNACK, photoSeen, rememberPhoto } from './energy.js';
import { checkIn } from './travel.js';
import { cloudConfig, saveCloudConfig, createCloud } from './cloud.js';
import { verifySigned, normalizeCode, sha256Hex } from './sign.js';
import { REVIEWER_PUBLIC_JWK } from './reviewer-key.js';
import { applyReward, validReward, describeReward } from './gifts.js';
import { fetchWeather, recordWeather, isNight, rainingToday, RAIN_BOOST, NIGHT_BOOST } from './weather.js';
import { loadCounties, countyAt, spotAt, currentPosition, geoPermission } from './geo.js';
import { createRoom, residentsFor, saveResidents, welcomeResident, ROOM_KEY, ROOM_LIMIT } from './room.js';
import { WISH_REWARD, PASS_RATIO, WISH_POOL, wishesFor, todayKey, analyzePhoto } from './wishes.js';
import { createMissions } from './missions.js';
import { createResearch } from './research.js';
import { DAILY_XP, GROWTH_XP, GROWTH_ENERGY, XP_PER_LEVEL, playerLevel, rankTitle, ensureDaily, completeDaily, growthGoals, goalProgress, claimGrowth, describeChapterReward } from './progression.js';
import * as install from './install.js';
import { PLACES, HOME_TASKS, STORIES, ERRAND_SLOTS, depart, collect, busyNos, awayNos, returned, isBack, hasAffinity, storyFor, fmtLeft } from './errands.js';
import { watchForUpdates, loadChangelog, unseen, markSeen, noteNewPlayer } from './updates.js';
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

const initialSave = await updateState(() => {});
let state = initialSave.state;
if (!state.egg) state.egg = newEgg('ordinary'); // 培育槽不留空：孵完就送來下一顆
let eggView = null;
let displayedEggId = null;
let exploring = false;
let lastChat = '';
let taskBusy = false;
let busy = false;
let toastTimer = 0;
let sayTimer = 0;
let bubbleTimer = 0;
let sayOverride = null; // 小恐龍暫時要說的話（提醒、歡呼），幾秒後回到平常的提示
const VIEWS = ['home', 'incubate', 'wish', 'dex', 'research'];
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
const ambience = createAmbience($('companion-room'));
function homeAmbience() {
  const h = new Date().getHours();
  return { rain: rainingToday(state, todayKey()), night: h >= 19 || h < 6, holiday: activeHolidays()[0]?.id || null };
}
const PET_LINES = ['好舒服～', '再摸一下嘛！', '嘿嘿，好害羞……', '最喜歡被你摸頭了！', '呼嚕呼嚕～'];
const room = createRoom($('resident-lanes'), character => {
  say(character.line, 'happy', 4000);
  room.peek(character.no, no => openDexDetail(no));
  void updateState(current => greet(current, character.no, todayKey())).then(t => {
    state = t.state;
    if (t.result) { renderResources(); restart($('chip-energy'), 'is-bump'); toast(`${character.name}很開心！+${t.result} 能量（每位每天一次）`); }
    const task = state.dino.task;
    if (task?.type === 'greet' && task.target === character.no) void finishTask();
  });
}, character => {
  room.bubble(character.no, PET_LINES[Math.floor(Math.random() * PET_LINES.length)]);
  void updateState(current => pet(current, todayKey())).then(t => {
    state = t.state;
    if (t.result) { renderResources(); restart($('chip-energy'), 'is-bump'); toast(`摸摸頭 +${t.result} 能量（今天還有 ${PET.perDay - state.bonus.pets.count} 次）`); }
  });
});
const research = createResearch({ root: $('research-root'), getState: loadState, onCollect: () => showView('incubate') });

const tutorial = createTutorial({
  getState: () => state,
  save: async mutator => { state = (await updateState(mutator)).state; renderAll(); },
  context: () => ({ needed: EGGS[state.egg.id].warmthNeeded, snapsRemaining: SNAP.perDay - snapsToday(state, todayKey()), giftAvailable: giftReady(state, todayKey()), residents: residentsFor(state.dex).length, view: document.body.dataset.view }),
  navigate: showView, collectGift,
  arrange: () => $('open-residents').click(),
  onDialog: syncRoomActivity, notify: toast,
});

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
  $('incubation-energy').textContent = state.energy;
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

  $('egg-name').textContent = state.egg.county ? `${egg.name} · ${state.egg.county}` : eggLabel(state.egg, egg.name);
  const stage = document.querySelector('.stage');
  stage.classList.toggle('is-shiny', Boolean(state.egg.shiny));
  stage.classList.toggle('is-naughty', Boolean(state.egg.naughty) && !naughtyDone());
  renderEggRequest();
  $('cultivate-label').textContent = ready ? '迎接新夥伴' : '注入能量';
  $('cultivate').disabled = busy;
  $('incubator-status').textContent = ['安靜生長中', '感受到小小的動靜', '生命正在甦醒', '快要見面了', '準備好相遇了'][s];
  $('incubation-message').textContent = ['裡面的小小生命，正做著柔軟的夢。', '好像聽見了你的聲音，輕輕回應了一下。', '細小的裂痕裡，藏著即將到來的相遇。', '再一點點溫暖，就能見到你了。', '牠已經準備好了。一起迎接新夥伴吧。'][s];
  $('incubation-percent').textContent = `${Math.round(pct)}%`;
  const omens = [];
  if (egg.pool) {
    if (rainingToday(state, todayKey()) && egg.pool[RAIN_BOOST.no]) omens.push('今天下雨了……雨傘小湘好像比較容易出現');
    if (isNight() && egg.pool[NIGHT_BOOST.no]) omens.push('深夜了……好像有誰還醒著（夜貓小湘比較容易出現）');
  }
  if (FLAVORS[state.egg.flavor]) omens.push(`${FLAVORS[state.egg.flavor].hint}……${FLAVORS[state.egg.flavor].tip}`);
  if (state.egg.shiny) omens.push('✨ 閃亮的蛋：稀有的小湘更容易出現');
  if (state.egg.warmth < egg.warmthNeeded) omens.push(`培養架自動保溫中：每小時 +${PASSIVE.perHour}（離開最多累積 ${PASSIVE.maxHours} 小時）`);
  const side = state.shelf.slice(0, Math.max(0, (state.cradle?.slots || 1) - 1));
  if (side.length) omens.push(`副架保溫中：${side.map(e => `${e.county ? `${EGGS[e.id].name}·${e.county}` : eggLabel(e, EGGS[e.id].name)} ${Math.round(100 * e.warmth / EGGS[e.id].warmthNeeded)}%`).join('、')}`);
  $('incubation-omen').textContent = omens.join('\n');
  $('incubation-omen').hidden = !omens.length;
  $('vitals').setAttribute('aria-valuenow', String(Math.round(pct)));
  $('incubation-cost').textContent = ready ? '破殼不消耗能量' : state.energy > 0 ? `本次消耗 ${Math.min(TAP_ENERGY, state.energy, egg.warmthNeeded - state.egg.warmth)} 能量` : '能量不足，先完成願望';
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

  const away = awayNos(state);
  const ids = room.update(away.size ? Object.fromEntries(Object.entries(state.dex).filter(([no]) => !away.has(no))) : state.dex);
  ambience(homeAmbience());
  $('snack').hidden = !ids.length;
  $('snack-left').textContent = Math.max(0, snacksLeft(state, todayKey()));
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
  const firstHatched = state.hatched > 0 || Boolean(state.dex['001']);
  if (ready) {
    text = '準備好見面了！一起去培育室吧。';
    mood = 'cheer';
  } else if (state.seenIntro && giftReady(state, todayKey())) {
    text = `我幫你準備了今天的見面禮！點我領 ${DAILY_GIFT} 能量。`;
    mood = 'happy'; mode = 'gift';
  } else if (firstHatched && state.bonus.explored !== todayKey() && !state.energy) {
    text = '這附近好像有小湘的訊號……要不要去探索看看？';
    mode = 'explore';
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
  if (sayOverride) {
    text = sayOverride.text;
    mood = sayOverride.mood;
    if (sayOverride.mode) mode = sayOverride.mode;
  }
  guide.dataset.mode = mode;
  guide.dataset.mood = mood;
  $('bubble-cta').hidden = !['wish', 'gift', 'explore'].includes(mode);
  $('bubble-cta').textContent = mode === 'gift' ? '領取見面禮 ›' : mode === 'explore' ? '探索附近 ›' : '看今日願望 ›';
  $('daily-gift').hidden = !(state.seenIntro && giftReady(state, todayKey()));
  const exploredToday = state.bonus.explored === todayKey();
  $('explore').classList.toggle('is-fresh', firstHatched && !exploredToday);
  $('explore').classList.toggle('is-compact', exploredToday && !exploring);
  $('explore').setAttribute('aria-label', exploredToday ? '再探索一次附近' : '探索附近');
  if (!exploring) $('explore-sub').textContent = exploredToday ? '今天探索過了，換個地方再試試' : '看看這裡有沒有小湘的訊號';
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
  else if (mode === 'gift') void collectGift();
  else if (mode === 'explore') startExplore();
  else if (mode === 'task-offer') void acceptTask();
  else if (mode === 'rest' || mode === 'chat') dinoChat();
}

// 小恐龍暫時換一句話和表情，幾秒後恢復
function say(text, mood, ms = 2200, mode) {
  sayOverride = { text, mood, mode };
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
  $('book-log-text').textContent = done === 3 ? `今天的願望都實現了，謝謝你陪我。願望印記 ${state.wishEgg?.stamps || 0} / ${WISH_STAMPS_PER_EGG}${state.wishEgg?.stock ? ` · 持有願望蛋 ${state.wishEgg.stock} 顆` : ''}` : done ? `已實現 ${done} 個願望，今天獲得 ${done * WISH_REWARD} 能量。` : '';
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
  const finished = (state.player.chapters || []).includes(String(viewedChapter));
  $('chapter-reward').textContent = `${finished ? '✓ 本章完成，已獲得' : '🎁 完成本章：直接升級，再得'}${describeChapterReward(chapter.reward || {})}`;
  $('chapter-reward').classList.toggle('is-done', finished);
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
      const claim = document.createElement('button'); claim.type = 'button'; claim.className = 'growth-claim'; claim.dataset.goal = goal.id; claim.setAttribute('aria-label', `領取 ${goal.title}的 ${GROWTH_XP} XP 與 ${GROWTH_ENERGY} 能量獎勵`);
      const reward = document.createElement('span'); reward.className = 'growth-claim__reward'; reward.textContent = `+${GROWTH_XP} XP`;
      const energy = document.createElement('span'); energy.className = 'growth-claim__energy'; energy.textContent = `+${GROWTH_ENERGY} 能量`; reward.append(energy);
      const action = document.createElement('span'); action.className = 'growth-claim__action'; action.textContent = '領取';
      const arrow = document.createElement('span'); arrow.className = 'growth-claim__arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
      action.append(arrow); claim.append(action, reward); claim.disabled = claimBusy; status.append(claim);
    } else { const label = document.createElement('span'); label.textContent = '進行中'; status.append(label); }
    row.append(no, content, status); return row;
  }));
  const pending = chapter.goals.find(g => !goalProgress(state, g).complete);
  $('growth-action').textContent = pending ? ({ daily: '去實現今日願望 ⟶', incubate: '前往培育 ⟶', errands: '派小湘出門 ⟶', home: '回首頁 ⟶', dex: '看看圖鑑 ⟶' }[pending.destination] || '前往培育 ⟶') : chapter.goals.some(g => !goalProgress(state, g).claimed) ? '領取已完成的願望' : '看看今日願望 ⟶';
}

// 從蛋庫取出的蛋（願望蛋、縣市蛋）
function eggStock(s, id) {
  if (id === 'wish') return s.wishEgg?.stock || 0;
  if (id === 'county') return s.travel?.eggs?.length || 0;
  if (id === 'weather') return s.weather?.stock || 0;
  if (id === 'cipher' || id === 'keepsake' || id === 'date') return s.gifts?.eggs?.filter(e => e.egg === id).length || 0;
  return 0;
}
function returnEgg(s, egg) {
  if (egg.id === 'wish') s.wishEgg.stock += 1;
  if (egg.id === 'county' && egg.county) s.travel.eggs.unshift(egg.county);
  if (egg.id === 'weather') s.weather.stock += 1;
  if (egg.id === 'cipher' || egg.id === 'keepsake' || egg.id === 'date') s.gifts.eggs.unshift({ egg: egg.id, ...(egg.character ? { character: egg.character } : {}), from: 'returned', at: egg.since });
}
function takeEgg(s, egg, county, character) {
  if (egg.id === 'wish') s.wishEgg.stock -= 1;
  if (egg.id === 'county') {
    const i = county ? s.travel.eggs.indexOf(county) : 0;
    egg.county = s.travel.eggs.splice(Math.max(i, 0), 1)[0];
  }
  if (egg.id === 'weather') s.weather.stock -= 1;
  if (egg.id === 'cipher' || egg.id === 'keepsake' || egg.id === 'date') {
    let i = character ? s.gifts.eggs.findIndex(e => e.egg === egg.id && e.character === character) : -1;
    if (i < 0) i = s.gifts.eggs.findIndex(e => e.egg === egg.id);
    const [gift] = s.gifts.eggs.splice(i, 1);
    if (gift?.character) egg.character = gift.character;
    if (gift?.from) egg.from = gift.from;
  }
}

// 目前會影響孵化結果的天氣／時間
function hatchBoosts(s, now = new Date()) {
  const boosts = [];
  if (rainingToday(s, todayKey(now))) boosts.push(RAIN_BOOST);
  if (isNight(now)) boosts.push(NIGHT_BOOST);
  return boosts;
}

// 換掉目前的蛋：有進度的放上暫放架，蛋庫拿出來還沒餵的放回蛋庫，全新的普通蛋直接收起來
function stowCurrent(current) {
  const prev = current.egg;
  if (prev.warmth > 0) current.shelf.push(prev);
  else if (EGGS[prev.id]?.stocked) returnEgg(current, prev);
}
const shelfFull = (current) => current.egg.warmth > 0 && current.shelf.length >= SHELF_MAX;

function canChooseEgg(current, id) {
  if (current.egg.id === id) return true;
  if (shelfFull(current)) return false;
  const firstHatched = current.hatched > 0 || Boolean(current.dex['001']);
  if (id === 'origin') return !firstHatched;
  if (EGGS[id]?.stocked) return firstHatched && eggStock(current, id) > 0;
  return firstHatched;
}

// 選擇蛋：先選六個分類（普通、願望、天氣、縣市、暗號、紀念），再選那一類裡的蛋
const EGG_CATEGORIES = ['ordinary', 'wish', 'weather', 'county', 'cipher', 'keepsake', 'date'];
let eggCategory = null;
const eggArt = (egg, pct = 0) => { const art = document.createElement('div'); art.className = 'egg-choice__art'; art.setAttribute('aria-hidden', 'true'); const v = createEggView(egg); v.setProgress(pct); art.append(v.el); return art; };
const swapLabel = () => shelfFull(state) ? '暫放架滿了，先孵完一顆' : state.egg.warmth > 0 ? '換這顆（目前的蛋會暫放）' : '選擇這顆蛋';

function shelfCard(saved, index) {
  const egg = EGGS[saved.id];
  const card = document.createElement('button'); card.type = 'button'; card.className = 'egg-choice egg-choice--shelf'; card.dataset.shelf = String(index); card.disabled = busy || shelfFull(state);
  const pct = Math.min(100, Math.round(100 * saved.warmth / egg.warmthNeeded));
  const content = document.createElement('div');
  const title = document.createElement('h3'); title.textContent = saved.county ? `${egg.name} · ${saved.county}` : eggLabel(saved, egg.name);
  const detail = document.createElement('p'); detail.textContent = `${index < (state.cradle?.slots || 1) - 1 ? '副架保溫中' : '暫放中'} · 孵化進度 ${pct}%（${saved.warmth} / ${egg.warmthNeeded}）`;
  const label = document.createElement('span'); label.className = 'egg-choice__state'; label.textContent = shelfFull(state) ? '暫放架滿了，先孵完一顆' : '繼續培育這顆';
  content.append(title, detail, label); card.append(eggArt(egg, pct), content); return card;
}
function countyCard(county) {
  const egg = EGGS.county;
  const card = document.createElement('button'); card.type = 'button'; card.className = 'egg-choice'; card.dataset.egg = 'county'; card.dataset.county = county; card.disabled = busy || shelfFull(state);
  const content = document.createElement('div');
  const title = document.createElement('h3'); title.textContent = `${egg.name} · ${county}`;
  const detail = document.createElement('p'); detail.textContent = `固定遇見${CHARACTERS[COUNTY_CHARACTER[county]]?.name || '這裡的小湘'}`;
  const cost = document.createElement('p'); cost.textContent = `孵化需要 ${egg.warmthNeeded} 能量`;
  const label = document.createElement('span'); label.className = 'egg-choice__state'; label.textContent = swapLabel();
  content.append(title, detail, cost, label); card.append(eggArt(egg), content); return card;
}
function keepsakeCard(gift) {
  const egg = EGGS.keepsake;
  const card = document.createElement('button'); card.type = 'button'; card.className = 'egg-choice'; card.dataset.egg = 'keepsake'; card.dataset.character = gift.character; card.disabled = busy || shelfFull(state);
  const content = document.createElement('div');
  const title = document.createElement('h3'); title.textContent = egg.name;
  const detail = document.createElement('p'); detail.textContent = `裡面是${CHARACTERS[gift.character]?.name || '特別的小湘'}`;
  const cost = document.createElement('p'); cost.textContent = `孵化需要 ${egg.warmthNeeded} 能量`;
  const label = document.createElement('span'); label.className = 'egg-choice__state'; label.textContent = swapLabel();
  content.append(title, detail, cost, label); card.append(eggArt(egg), content); return card;
}
// 每一類：正在培育的、暫放中的、還沒拿出來的數量
function categoryInfo(id) {
  const current = state.egg.id === id;
  const shelved = state.shelf.filter(e => e.id === id).length;
  const stock = id === 'ordinary' ? null : eggStock(state, id);
  return { current, shelved, stock };
}

function renderEggChoices() {
  const firstHatched = state.hatched > 0 || Boolean(state.dex['001']);
  const heading = (text) => Object.assign(document.createElement('h3'), { className: 'egg-choices__heading', textContent: text });
  if (!firstHatched) eggCategory = null;
  if (!eggCategory) {
    $('egg-picker-title').textContent = '選擇培育的蛋';
    $('egg-picker-note').textContent = firstHatched ? `先選一個分類。換蛋時，已經注入能量的蛋會放上暫放架（最多 ${SHELF_MAX} 顆），進度不會消失。` : '本源蛋是首次相遇的禮物；完成第一次孵化後，就能培育其他的蛋。';
    const tiles = EGG_CATEGORIES.map(id => {
      const egg = EGGS[id]; const info = categoryInfo(id);
      const tile = document.createElement('button'); tile.type = 'button'; tile.className = 'egg-cat'; tile.dataset.cat = id; tile.disabled = !firstHatched;
      tile.setAttribute('aria-pressed', String(info.current));
      const name = document.createElement('b'); name.textContent = egg.name;
      const sub = document.createElement('small');
      sub.textContent = !firstHatched ? '首次孵化後解鎖' : [info.current && '培育中', info.shelved && `暫放 ${info.shelved}`, info.stock !== null && `持有 ${info.stock}`].filter(Boolean).join(' · ') || (id === 'ordinary' ? '隨時都有' : '還沒有');
      tile.append(eggArt(egg), name, sub);
      if (info.stock || info.shelved) tile.classList.add('has-eggs');
      return tile;
    });
    const grid = document.createElement('div'); grid.className = 'egg-cats'; grid.append(...tiles);
    $('egg-choices').replaceChildren(...(firstHatched ? [] : [eggCard(EGGS.origin)]), grid);
    return;
  }
  const egg = EGGS[eggCategory];
  $('egg-picker-title').textContent = egg.name;
  const back = document.createElement('button'); back.type = 'button'; back.className = 'egg-back'; back.dataset.back = '1'; back.textContent = '‹ 所有分類';
  const shelved = state.shelf.map((saved, index) => [saved, index]).filter(([saved]) => saved.id === eggCategory).map(([saved, index]) => shelfCard(saved, index));
  let fresh;
  if (eggCategory === 'county') fresh = [...(state.egg.id === 'county' ? [eggCard(egg)] : []), ...(state.travel?.eggs || []).map(countyCard)];
  else if (eggCategory === 'keepsake') fresh = [...(state.egg.id === 'keepsake' ? [eggCard(egg)] : []), ...state.gifts.eggs.filter(g => g.egg === 'keepsake').map(keepsakeCard)];
  else fresh = [eggCard(egg)];
  if (!fresh.length) fresh = [eggCard(egg)];
  const detailText = { ordinary: '隨時都能培育的蛋，隨機遇見各種小湘。', wish: '三個願望全部完成的日子各得一枚願望印記，集滿 3 枚換一顆。', weather: '下雨天打開遊戲（已允許定位）時取得，每天最多一顆。', county: '到新的縣市按「探索附近」取得，每個縣市一顆，固定孵出當地的小湘。', cipher: '輸入湘給的暗號、完成她的委託時取得。', keepsake: '節日、小湘生日、走遍臺灣時收到，固定孵出紀念的小湘。', date: '見面時掃描湘的約會 QR Code 取得，會遇見約會小湘或蝰蝰♡。' }[eggCategory];
  $('egg-picker-note').textContent = detailText;
  $('egg-choices').replaceChildren(back, ...(shelved.length ? [heading('暫放中'), ...shelved, heading('可以培育')] : []), ...fresh);
}

function eggCard(egg) {
  const firstHatched = state.hatched > 0 || Boolean(state.dex['001']);
  {
    const current = state.egg.id === egg.id;
    const card = document.createElement('button'); card.type = 'button'; card.className = 'egg-choice'; card.dataset.egg = egg.id; card.setAttribute('aria-pressed', String(current)); card.disabled = busy || !canChooseEgg(state, egg.id);
    const art = document.createElement('div'); art.className = 'egg-choice__art'; art.setAttribute('aria-hidden', 'true');
    const preview = createEggView(egg); preview.setProgress(0); art.append(preview.el);
    const content = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = current && state.egg.county ? `${egg.name} · ${state.egg.county}` : egg.name;
    const detail = document.createElement('p'); detail.textContent = egg.id === 'origin' ? '固定遇見原味小湘' : egg.id === 'keepsake' ? '紀念特別日子的蛋，固定遇見那一天的小湘' : egg.id === 'cipher' ? '湘準備的驚喜，裡面也許是她指定的小湘' : egg.id === 'weather' ? `雨天的蛋，雨傘小湘最常出現（${Object.keys(egg.pool).length} 種）` : egg.byCounty ? `固定遇見打卡縣市的小湘${current && state.egg.county ? `（${state.egg.county}）` : ''}` : `隨機遇見 ${Object.keys(egg.pool).length} 種小湘${egg.id === 'wish' ? '，R 與 SR 機率較高' : '，可能重複'}`;
    const cost = document.createElement('p'); cost.textContent = `孵化需要 ${egg.warmthNeeded} 能量`;
    const stock = eggStock(state, egg.id);
    const label = document.createElement('span'); label.className = 'egg-choice__state'; label.textContent = current ? '✓ 正在培育' : egg.id === 'origin' && firstHatched ? '首次相遇限定 · 已完成' : !firstHatched && egg.id !== 'origin' ? '首次孵化後解鎖' : egg.stocked && !stock ? '尚未持有' : shelfFull(state) ? '暫放架滿了，先孵完一顆' : state.egg.warmth > 0 ? '換這顆（目前的蛋會暫放）' : '選擇這顆蛋';
    content.append(title, detail, cost);
    if (egg.stocked) {
      const own = document.createElement('p'); own.className = 'egg-choice__stock';
      own.textContent = egg.id === 'wish'
        ? `持有 ${stock} 顆 · 願望印記 ${state.wishEgg?.stamps || 0} / ${WISH_STAMPS_PER_EGG}（三個願望全部完成的日子各得一枚）`
        : egg.id === 'weather' ? `持有 ${stock} 顆（下雨天打開遊戲時取得，每天最多一顆）`
        : egg.id === 'cipher' ? `持有 ${stock} 顆（輸入湘給的暗號、完成她的委託時取得）`
        : egg.id === 'date' ? `持有 ${stock} 顆（見面時掃描湘的約會 QR Code 取得）`
        : egg.id === 'keepsake' ? (stock ? `持有 ${stock} 顆：${state.gifts.eggs.filter(e => e.egg === 'keepsake').map(e => CHARACTERS[e.character]?.name).join('、')}` : '節日、小湘生日、走遍臺灣時會收到')
        : stock ? `另外還有 ${stock} 顆，列在下面，可以自己選` : '到新的縣市按「探索」，那裡的小湘就會想出現';
      content.append(own);
    }
    content.append(label); card.append(art, content); return card;
  }
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

const DEX_MODE_KEY = 'siang-collector:dex-mode:v1';
function dexMode() {
  try { return localStorage.getItem(DEX_MODE_KEY) === 'series' ? 'series' : 'all'; } catch { return 'all'; }
}
document.querySelectorAll('[data-dex-mode]').forEach((button) => button.addEventListener('click', () => {
  try { localStorage.setItem(DEX_MODE_KEY, button.dataset.dexMode); } catch {}
  renderDex();
}));

function dexCard(c) {
  const has = Boolean(state.dex[c.no]);
  const li = document.createElement('li');
  li.className = `dex__card card${has ? ' is-owned' : ''}`;
  li.dataset.dexNo = c.no; li.tabIndex = 0; li.setAttribute('role', 'button'); li.setAttribute('aria-label', `查看 No.${c.no} ${has ? c.name : '尚未收集的小湘'}`);
  li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDexDetail(c.no); } });
  const img = document.createElement('img');
  img.className = `dex__img${has ? '' : ' is-locked'}`;
  img.alt = has ? c.name : '尚未收集的小湘';
  loadWithFallback(img, characterSources(c.image));
  const series = SERIES[c.series];
  if (series) {
    const tag = document.createElement('span');
    tag.className = `dex__tag dex__tag--${c.series}`;
    tag.textContent = series.short;
    li.append(tag);
  }
  const no = document.createElement('div');
  no.className = 'dex__no';
  no.textContent = `No.${c.no}`;
  const name = document.createElement('div');
  name.className = 'dex__name';
  name.textContent = has ? c.name : '???';
  li.append(img, no, name);
  return li;
}

function dexList(characters) {
  const ul = document.createElement('ul');
  ul.className = 'dex__grid';
  ul.append(...characters.map(dexCard));
  return ul;
}

function renderDex() {
  const all = Object.values(CHARACTERS);
  const owned = all.filter((c) => state.dex[c.no]);
  $('dex-count').textContent = `已收集 ${owned.length} / ${all.length}`;
  const mode = dexMode();
  document.querySelectorAll('[data-dex-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dexMode === mode)));
  if (mode === 'all') { $('dex-grid').replaceChildren(dexList(all)); return; }
  $('dex-grid').replaceChildren(...Object.entries(SERIES).map(([id, series]) => {
    const members = all.filter((c) => c.series === id);
    if (!members.length) return '';
    const section = document.createElement('section');
    section.className = 'dex__section';
    const title = document.createElement('h2');
    title.className = 'dex__section-title';
    const got = members.filter((c) => state.dex[c.no]).length;
    title.innerHTML = `<span></span><small>${got} / ${members.length}</small>`;
    title.firstChild.textContent = series.name;
    section.append(title, dexList(members));
    return section;
  }));
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
  if (document.getElementById('missions-badge')) renderMissionsBadge();
  if (document.getElementById('bingo-badge')) { renderBingoBadge(); checkRecipes(); }
  if (document.getElementById('achievement-badge')) renderAchievementBadge();
  if (document.getElementById('dex-detail')) grantKeepsakes();
  if (document.getElementById('dino-task')) renderDinoTask();
  if (document.getElementById('letter-badge')) renderLetterBadge();
  if (document.getElementById('errand-badge')) renderErrandBadge();
  if (document.getElementById('snap-count')) renderSnap();
  if (document.getElementById('explore')) $('explore').hidden = !(state.hatched > 0 || Boolean(state.dex['001']));
  renderResources();
  renderHome();
  renderWishes();
  renderDex();
  research.update();
  if ($('residents').open) renderResidents();
  tutorial.render();
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
  $('location-label').textContent = { home: '日常 / HOME', incubate: '培育 / INCUBATION', wish: '願望 / WISHES', dex: '圖鑑 / COLLECTION', research: '研究 / RESEARCH' }[name];
  const nextHash = name === 'home' ? '#home' : `#${name}`;
  if (location.hash !== nextHash) history[options.replace ? 'replaceState' : 'pushState'](null, '', nextHash);
  $('header').hidden = !TITLES[name];
  $('page-title').textContent = TITLES[name] || '';
  document.body.dataset.view = name;
  if (name === 'research') research.update();
  if (name === 'incubate') setTimeout(showEggOffer, 60);
  window.scrollTo(0, 0);
  syncRoomActivity();
  if (name === 'wish') {
    renderWishes();
    wishBook.openAtFirstUndone();
  }
  tutorial.clearTarget();
  tutorial.render();
  if (name === 'incubate' && state.tutorial?.status === 'active' && !state.tutorial.visitedEgg) {
    void updateState(current => { if (current.tutorial?.status === 'active') current.tutorial.visitedEgg = true; }).then(t => { state = t.state; tutorial.render(); });
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
  if (state.eggOffer) { showEggOffer(); return; }
  busy = true;
  $('cultivate').disabled = true;
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

// 相遇的故事：記下這位小湘是從哪顆蛋、在什麼樣的日子孵出來的（只記第一次相遇）
function meetingStory(current) {
  const egg = current.egg;
  const today = todayKey();
  return {
    egg: egg.id,
    ...(egg.county ? { county: egg.county } : {}),
    ...(egg.from && egg.from !== 'returned' ? { from: egg.from } : {}),
    since: egg.since,
    rain: rainingToday(current, today) || undefined,
    night: isNight() || undefined,
    wishes: current.wishes?.date === today ? current.wishes.done.length : 0,
    nth: current.hatched + 1,
  };
}
function storyText(c, entry) {
  const st = entry?.story;
  if (!st) return '';
  const when = new Date(entry.at);
  const date = `${when.getFullYear()} 年 ${when.getMonth() + 1} 月 ${when.getDate()} 日`;
  const days = st.since && !Number.isNaN(Date.parse(st.since)) ? Math.max(0, Math.round((Date.parse(entry.at) - Date.parse(st.since)) / 864e5)) : null;
  const source = st.county ? `在${st.county}探索時收到的縣市蛋`
    : st.from?.startsWith('recipe:') ? '兩位小湘一起入住、偷偷準備的紀念蛋'
    : st.from === 'taiwan' ? '走遍臺灣時收到的紀念蛋'
    : st.from === 'code' ? '湘藏在暗號裡的蛋'
    : st.from && HOLIDAYS.some(h => st.from.startsWith(h.id)) ? `${HOLIDAYS.find(h => st.from.startsWith(h.id)).name}收到的紀念蛋`
    : EGGS[st.egg]?.name || '一顆蛋';
  const mood = [st.night && '深夜裡', st.rain && '下著雨的日子'].filter(Boolean).join('、');
  return `${date}${mood ? `，${mood}` : ''}，她從${source}裡孵出來。${days !== null ? `這顆蛋陪了你 ${days ? `${days} 天` : '不到一天'}，` : ''}是你孵化的第 ${st.nth} 顆蛋${st.wishes ? `；那天你完成了 ${st.wishes} 個願望` : ''}。`;
}

async function hatch(expected) {
  buzz([30, 50, 30, 50, 60]);
  await runAnalysis();
  const transaction = await updateState(current => {
    if (current.egg.id !== expected.id || current.egg.since !== expected.since || current.egg.warmth < EGGS[current.egg.id].warmthNeeded) return null;
    const character = CHARACTERS[rollFor(current.egg, hatchBoosts(current))];
    const duplicate = Boolean(current.dex[character.no]);
    if (duplicate) current.fossils += DUPLICATE_FOSSILS;
    else current.dex[character.no] = { at: new Date().toISOString(), story: meetingStory(current) };
    current.hatched += 1; if (isNight()) current.bonus.total.nightHatch += 1; const resumed = current.shelf.shift(); current.egg = resumed || newEgg('ordinary'); current.eggOffer = resumed ? null : makeOffer();
    return { character, duplicate };
  });
  state = transaction.state; eggView = null; sayOverride = null;
  if (transaction.result && !transaction.result.duplicate) welcomeResident(transaction.result.character.no, state.dex);
  renderAll();
  if (transaction.result) showReveal(transaction.result.character, transaction.result.duplicate);
  else toast('這顆蛋已經完成孵化，進度已更新。');
}

// Skipping only ends the presentation; the shared hatch transaction still runs once.
async function runAnalysis() {
  const box = $('analysis');
  const preview = createEggView(EGGS[state.egg.id]);
  preview.setProgress(100);
  $('hatch-egg').replaceChildren(preview.el);
  $('hatch-title').textContent = '有個小小的聲音……';
  $('hatch-caption').textContent = '你的溫暖，正在被回應。';
  $('analysis-fill').style.width = '0%';
  $('analysis-pct').textContent = '000%';
  box.showModal(); syncRoomActivity();
  try {
    await new Promise(resolve => {
      let frame = 0, finished = false, opened = false;
      const start = performance.now();
      const finish = () => {
        if (finished) return;
        finished = true; cancelAnimationFrame(frame);
        $('hatch-skip').removeEventListener('click', finish);
        box.removeEventListener('cancel', skip);
        resolve();
      };
      const skip = event => { event.preventDefault(); finish(); };
      $('hatch-skip').addEventListener('click', finish);
      box.addEventListener('cancel', skip);
      const tick = now => {
        const p = reducedMotion() ? 1 : Math.min(1, (now - start) / 2800);
        $('analysis-fill').style.width = `${p * 100}%`;
        $('analysis-pct').textContent = `${Math.round(p * 100)}%`;
        if (p >= .55 && !opened) {
          opened = true;
          $('hatch-title').textContent = '終於，要見面了。';
          $('hatch-caption').textContent = '新的故事，從這一刻開始。';
          preview.hatch();
        }
        if (p >= 1) finish(); else frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
  } finally { box.close(); }
}

function showReveal(c, duplicate) {
  loadWithFallback($('reveal-img'), characterSources(c.image));
  $('reveal-img').alt = c.name;
  $('reveal').dataset.duplicate = String(duplicate);
  $('reveal-en').textContent = duplicate ? 'HELLO AGAIN' : 'A NEW COMPANION';
  $('reveal-greeting').textContent = duplicate ? '是你呀，我們又見面了。' : '初次見面，請多指教。';
  $('reveal-no').textContent = `No.${c.no} ｜ ${c.rarity}`;
  $('reveal-name').textContent = c.name;
  $('reveal-line').textContent = c.line;
  $('reveal-bonus').hidden = !duplicate;
  $('reveal-bonus').textContent = `再次相遇的禮物 · 化石碎片 +${DUPLICATE_FOSSILS}`;
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
  const photo = await freshPhoto(file);
  if (photo.duplicate) { renderWishes(); toast('這張照片今天已經用過了喔，換一張新的吧～'); return; }
  const transaction = await updateState(current => { const r = completeDaily(current, photoDate, wish.id); if (r.awarded && photo.hash) rememberPhoto(current, photo.hash, todayKey()); return r; });
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
  const stamp = transaction.result.stamp;
  if (stamp) {
    await sleep(900);
    toast(stamp.egg ? '集滿願望印記！獲得一顆願望蛋，到「選擇蛋」把它拿出來吧。' : `獲得願望印記 ${stamp.stamps} / ${WISH_STAMPS_PER_EGG}，集滿就能換一顆願望蛋。`);
  }
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
    if (transaction.result.awarded) {
      $('growth-feedback').textContent = `心願達成，獲得 ${GROWTH_XP} XP 與 ${GROWTH_ENERGY} 能量。`;
      const ch = transaction.result.chapter;
      if (ch) {
        viewedChapter = null;
        renderGrowth();
        $('growth-feedback').textContent = `第 ${ch.level} 章「${ch.name}」完成！獲得${ch.reward}。現在是 Lv.${playerLevel(state)}，新的一章開始了。`;
        restart(document.querySelector('.player-progress'), 'is-level-up');
        toast(`第 ${ch.level} 章完成！獲得${ch.reward}，升級為 Lv.${playerLevel(state)}`);
        buzz([20, 40, 30, 40, 40]);
      } else { announceLevel(transaction.result); buzz([15, 30, 25]); }
    }
  } finally { claimBusy = false; state = loadState(); renderAll(); $('growth-list').querySelector(`[data-goal-row="${button.dataset.goal}"]`)?.focus({ preventScroll: true }); }
});
$('growth-action').addEventListener('click', () => {
  const goals = growthGoals(viewedChapter).goals;
  const pending = goals.find(g => !goalProgress(state, g).complete);
  if (pending?.destination === 'incubate') showView('incubate');
  else if (pending?.destination === 'errands') openErrands();
  else if (pending?.destination === 'home') showView('home');
  else if (pending?.destination === 'dex') showView('dex');
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
$('open-eggs').addEventListener('click', () => {
  state = loadState(); eggCategory = null; renderEggChoices(); $('egg-picker-feedback').textContent = ''; $('egg-picker').showModal(); syncRoomActivity();
});
$('close-eggs').addEventListener('click', () => $('egg-picker').close());
$('egg-choices').addEventListener('click', async event => {
  const nav = event.target.closest('[data-cat], [data-back]');
  if (nav && !nav.disabled) { eggCategory = nav.dataset.cat || null; renderEggChoices(); $('egg-picker-feedback').textContent = ''; return; }
  const choice = event.target.closest('[data-egg], [data-shelf]');
  if (!choice || choice.disabled || busy) return;
  busy = true;
  try {
    const shelved = state.egg.warmth > 0;
    const { state: latest, result } = await updateState(current => {
      if (choice.dataset.shelf !== undefined) {
        const saved = state.shelf[Number(choice.dataset.shelf)];
        const index = current.shelf.findIndex(e => e.id === saved?.id && e.since === saved?.since);
        if (index < 0 || shelfFull(current)) return false;
        const [next] = current.shelf.splice(index, 1);
        stowCurrent(current); current.egg = next;
        return true;
      }
      const id = choice.dataset.egg;
      const county = choice.dataset.county;
      if (county) {
        if (!current.travel.eggs.includes(county) || shelfFull(current)) return false;
        stowCurrent(current);
        const next = newEgg('county'); takeEgg(current, next, county); current.egg = next;
        return true;
      }
      if (!EGGS[id] || !canChooseEgg(current, id)) return false;
      const character = choice.dataset.character;
      if (current.egg.id !== id || (character && current.egg.character !== character)) {
        if (character && !current.gifts.eggs.some(g => g.egg === id && g.character === character)) return false;
        stowCurrent(current);
        const next = newEgg(id);
        if (EGGS[id].stocked) takeEgg(current, next, null, character);
        current.egg = next;
      }
      return true;
    });
    state = latest;
    if (result) { $('egg-picker').close(); toast(shelved ? '換好了！剛才的蛋放在暫放架，進度都還在。' : '這顆蛋正等著你的照顧。'); }
    else { renderEggChoices(); $('egg-picker-feedback').textContent = '培育進度已更新，請再選一次。'; }
  } finally { busy = false; state = loadState(); renderAll(); }
});
$('cultivate').addEventListener('click', onEggTap);
$('home-wishes').addEventListener('click', () => showView('wish'));
$('incubate-wishes').addEventListener('click', () => showView('wish'));
$('enter-incubator').addEventListener('click', () => showView('incubate'));
$('home-letter').addEventListener('click', openLetterBox);
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
  renderHome(); renderResidents(); tutorial.render();
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
  if (item && !item.disabled && item.dataset.view) showView(item.dataset.view);
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
  if (!document.hidden) void syncFromCloud();
});
// 回到畫面時重新收信、收委託（加到主畫面的 App 切回來不會重新整理）；兩分鐘內不重複
let lastCloudSync = 0;
function syncFromCloud(force = false) {
  if (!force && Date.now() - lastCloudSync < 2 * 60 * 1000) return Promise.resolve();
  lastCloudSync = Date.now();
  return fetchMail().then(() => syncMissions()).then(() => syncPostcardReplies()).catch(() => {});
}
$('fab-letter').addEventListener('click', openLetterBox);
$('intro-ok').addEventListener('click', () => {
  void updateState(current => { current.seenIntro = true; if (!current.tutorial) startTutorial(current); }).then(transaction => { state = transaction.state; $('intro').close(); renderAll(); });
});
$('photo-ok').addEventListener('click', () => $('photo').close());
$('book-home').addEventListener('click', () => {
  showView('incubate');
  say('太棒了！拿到能量了，點蛋餵給它！', 'happy', 2400);
});
$('reveal-arrange').addEventListener('click', () => {
  $('reveal').close();
  showView('home');
  renderResidents(); $('residents-feedback').textContent = '選擇想留在首頁陪伴你的小湘，最多三位。';
  $('residents').showModal(); syncRoomActivity();
});
$('reveal-ok').addEventListener('click', () => {
  $('reveal').close();
  showView($('reveal').dataset.next);
  toast(state.egg.warmth > 0 ? '暫放的蛋回到培養架上了，繼續加油！' : state.eggOffer ? '小恐龍找到三顆新蛋，到培育室挑一顆吧！' : '新的蛋已送達培育室。');
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

/* ---------- 探索：定位所在縣市，讓那裡的小湘出現 ---------- */
const firstHatchedNow = () => state.hatched > 0 || Boolean(state.dex['001']);

function renderExplore() {
  $('explore').hidden = !firstHatchedNow();
}

function showCountyCall({ county, result, error, weather }) {
  const img = $('county-img');
  const no = county && COUNTY_CHARACTER[county];
  const c = no && CHARACTERS[no];
  const owned = Boolean(c && state.dex[no]);
  const waiting = county && (state.travel.eggs.includes(county) || state.egg.county === county);
  img.hidden = !c;
  if (c) { img.className = `county-call__img${owned ? '' : ' is-locked'}`; loadWithFallback(img, characterSources(c.image)); img.alt = owned ? c.name : '還看不清楚的小湘'; }
  $('county-eyebrow').textContent = county ? `LOCAL SIGNAL · ${county}` : 'LOCAL SIGNAL';
  let title; let text; let note = '';
  if (error === 'denied') { title = '小湘感應不到你在哪裡'; text = '需要允許定位，才能知道你在哪個縣市。請到瀏覽器或手機設定，允許這個網站使用位置。'; }
  else if (error) { title = '訊號有點微弱'; text = '這次沒有成功定位，到空曠一點的地方再試一次。'; }
  else if (!county) { title = '這裡還沒有小湘的訊號'; text = '目前只有臺灣本島 19 個縣市的小湘。澎湖、金門、馬祖之後再開放。'; }
  else if (result?.egg) { title = `${c.name}想出現！`; text = c.line; note = `獲得一顆「縣市蛋 · ${county}」，到培育室的「選擇蛋」把它拿出來吧。`; }
  else if (owned) { title = `${c.name}：又見面了！`; text = `「你又來${county}啦，今天也一起走走吧。」`; }
  else if (waiting) { title = `${c.name}還在蛋裡等你`; text = '「快點把我孵出來嘛……我已經準備好了！」'; }
  else { title = `${county}的訊號`; text = '這裡的小湘已經和你打過招呼了。'; }
  $('county-title').textContent = title;
  $('county-text').textContent = text;
  note = [note, weatherNote(weather)].filter(Boolean).join('\n');
  $('county-note').textContent = note;
  $('county-note').hidden = !note;
  $('county-go').hidden = !(result?.egg || weather?.egg);
  $('county-call').showModal(); syncRoomActivity();
}

// 查天氣（失敗就算了，不影響探索）；下雨可能送天氣蛋
async function checkWeather(pos) {
  let kind;
  try { kind = await fetchWeather(pos.lat, pos.lon); } catch { return null; }
  const transaction = await updateState(current => recordWeather(current, kind, todayKey()));
  state = transaction.state; renderAll();
  return transaction.result;
}
const weatherNote = (w) => (w?.egg ? '外面在下雨，雨裡撿到一顆「天氣蛋」！到「選擇蛋」把它拿出來吧。' : '');
function announceWeather(w) { if (w?.egg) toast(weatherNote(w)); }

async function explore({ silent = false } = {}) {
  if (exploring || !firstHatchedNow()) return;
  exploring = true;
  $('explore').disabled = true;
  $('explore-label').textContent = '感應中…'; $('explore-sub').textContent = '正在確認你在哪裡';
  try {
    let pos;
    try { pos = await currentPosition(); }
    catch (err) { if (!silent) showCountyCall({ error: err?.code === 1 ? 'denied' : 'failed' }); return; }
    let counties;
    try { counties = await loadCounties(); } catch { if (!silent) showCountyCall({ error: 'failed' }); return; }
    const county = spotAt(pos.lon, pos.lat) || countyAt(counties, pos.lon, pos.lat);
    state = (await updateState(current => { if (current.bonus.explored !== todayKey()) current.bonus.total.explores += 1; current.bonus.explored = todayKey(); })).state;
    const weather = await checkWeather(pos);
    if (!county) { if (!silent) showCountyCall({ county: null, weather }); else announceWeather(weather); return; }
    const transaction = await updateState(current => checkIn(current, county, todayKey()));
    state = transaction.state; renderAll();
    if (!silent || transaction.result.egg) showCountyCall({ county, result: transaction.result, weather });
    else announceWeather(weather);
  } finally {
    exploring = false; $('explore').disabled = false; $('explore-label').textContent = '探索附近'; renderHome();
  }
}

const EXPLORE_INTRO_KEY = 'siang-collector:explore-intro:v1';
function startExplore() {
  let seen = false; try { seen = Boolean(localStorage.getItem(EXPLORE_INTRO_KEY)); } catch {}
  if (seen) { void explore(); return; }
  $('explore-intro').showModal(); syncRoomActivity();
}
$('explore').addEventListener('click', startExplore);
$('explore-intro-ok').addEventListener('click', () => { try { localStorage.setItem(EXPLORE_INTRO_KEY, '1'); } catch {} $('explore-intro').close(); void explore(); });
$('explore-intro-later').addEventListener('click', () => $('explore-intro').close());
$('explore-intro').addEventListener('close', syncRoomActivity);
$('county-ok').addEventListener('click', () => $('county-call').close());
$('county-go').addEventListener('click', () => { $('county-call').close(); showView('incubate'); });
$('county-call').addEventListener('close', syncRoomActivity);

/* ---------- 隱藏配方 ---------- */
let recipeBusy = false;
function checkRecipes() {
  if (recipeBusy || !state.seenIntro) return;
  const ctx = { residents: residentsFor(state.dex), raining: rainingToday(state, todayKey()), today: todayKey() };
  if (!RECIPES.some(r => !state.recipes[r.id].done && r.members.every(no => ctx.residents.includes(no)) && (!r.rain || ctx.raining) && !state.recipes[r.id].days.includes(ctx.today))) return;
  recipeBusy = true;
  void updateState(current => tickRecipes(current, ctx)).then(t => {
    state = t.state; recipeBusy = false; renderAll();
    const { progressed, completed } = t.result;
    if (completed.length) { toast(`🍰 ${completed.map(r => r.members.map(no => CHARACTERS[no].name).join('和')).join('、')}一起做出了驚喜！收到一顆紀念蛋，到「選擇蛋」看看吧。`); say('好像有什麼新的東西誕生了！', 'cheer', 3500); }
    else if (progressed.length) { const r = progressed[0]; say(`${r.members.map(no => CHARACTERS[no].name).join('和')}好像在偷偷準備什麼……（${state.recipes[r.id].days.length} / ${r.days}）`, 'happy', 4500); }
  });
}

/* ---------- 每週賓果 ---------- */
function renderBingoBadge() {
  const n = bingoReady(state);
  $('bingo-badge').hidden = !n; $('bingo-badge').textContent = n;
}
function openBingo() {
  if (state.bingo.week !== ensureBingo(structuredClone(state)).week) { void updateState(current => { ensureBingo(current); }).then(t => { state = t.state; openBingo(); }); return; }
  const st = bingoStatus(state);
  const lineCells = new Set(st.lines.filter(l => l.done).flatMap(l => l.cells));
  $('bingo-grid').replaceChildren(...st.cells.map((c, i) => {
    const cell = document.createElement('div'); cell.className = `bingo-cell${c.done ? ' is-done' : ''}${lineCells.has(i) ? ' is-line' : ''}`;
    const text = document.createElement('span'); text.textContent = c.text;
    const prog = document.createElement('small'); prog.textContent = c.done ? '✓' : `${c.value} / ${c.goal}`;
    cell.append(text, prog); return cell;
  }));
  const lines = st.lines.filter(l => l.done).length;
  const ready = bingoReady(state);
  const end = new Date(state.bingo.week + 'T00:00:00'); end.setDate(end.getDate() + 6);
  $('bingo-week').textContent = `${state.bingo.week.slice(5).replace('-', '/')} – ${end.getMonth() + 1}/${end.getDate()} · 已連成 ${lines} 條線`;
  $('bingo-claim').hidden = !ready;
  $('bingo-claim').textContent = `領取獎勵（${ready}）`;
  if (!$('bingo-dialog').open) { $('bingo-dialog').showModal(); syncRoomActivity(); }
}
$('open-bingo').addEventListener('click', () => { $('function-center').close(); openBingo(); });
$('close-bingo').addEventListener('click', () => $('bingo-dialog').close());
$('bingo-dialog').addEventListener('close', syncRoomActivity);
$('bingo-claim').addEventListener('click', async () => {
  $('bingo-claim').disabled = true;
  const t = await updateState(current => claimBingo(current));
  state = t.state; renderAll(); $('bingo-claim').disabled = false;
  const got = [t.result.wishEgg && `${t.result.wishEgg} 顆願望蛋`, t.result.energy && `${t.result.energy} 能量`].filter(Boolean).join('、');
  if (got) { restart($('chip-energy'), 'is-bump'); toast(`賓果！獲得 ${got}`); }
  openBingo();
});

/* ---------- 成就 ---------- */
const ACH_NOTIFIED = 'siang-collector:achievements-notified:v1';
function renderAchievementBadge() {
  const list = achievementStatus(state, CHARACTERS);
  const ready = list.filter(a => a.done && !a.claimed).length;
  $('achievement-badge').hidden = !ready; $('achievement-badge').textContent = ready;
  let seen = []; try { seen = JSON.parse(localStorage.getItem(ACH_NOTIFIED) || '[]'); } catch {}
  const fresh = list.filter(a => a.done && !a.claimed && !seen.includes(a.id));
  if (fresh.length && state.seenIntro) {
    try { localStorage.setItem(ACH_NOTIFIED, JSON.stringify([...seen, ...fresh.map(a => a.id)])); } catch {}
    toast(`🏆 達成成就「${fresh[0].title}」！到研究者手記的「成就」領取獎勵。`);
  }
}
function achievementTile(a) {
  const tile = document.createElement('button'); tile.type = 'button';
  const ready = a.done && !a.claimed;
  tile.className = `ach-tile${a.claimed ? ' is-claimed' : ''}${ready ? ' is-ready' : ''}${!a.done ? ' is-locked' : ''}`;
  tile.dataset.ach = a.id;
  const icon = document.createElement('span'); icon.className = 'ach-tile__icon'; icon.textContent = a.claimed ? '🏆' : ready ? '🎁' : a.secret ? '❔' : '🔒';
  const title = document.createElement('b'); title.textContent = a.secret && !a.done ? '？？？' : a.title;
  const bar = document.createElement('span'); bar.className = 'ach__bar'; const fill = document.createElement('i'); fill.style.width = `${Math.round(100 * a.value / a.goal)}%`; bar.append(fill);
  const foot = document.createElement('small'); foot.textContent = ready ? `領取 +${a.reward}` : a.claimed ? '已領取' : a.secret ? '隱藏' : `${a.value}/${a.goal}`;
  tile.append(icon, title, bar, foot);
  return tile;
}
function showAchievementInfo(a) {
  $('achievement-info').hidden = false;
  $('achievement-info').textContent = `${a.secret && !a.done ? '？？？ · 隱藏成就' : `${a.title} · ${a.secret ? a.reveal : a.hint}`}（${a.secret && !a.done ? '?' : `${a.value}/${a.goal}`}，獎勵 +${a.reward} 能量${a.claimed ? '，已領取' : ''}）`;
}
function openAchievements() {
  const list = achievementStatus(state, CHARACTERS);
  const done = list.filter(a => a.done).length;
  const ready = list.filter(a => a.done && !a.claimed);
  $('achievement-summary').textContent = `已達成 ${done} / ${list.length}${ready.length ? ` · ${ready.length} 個待領取` : ''}`;
  const section = (title, items) => {
    const sec = document.createElement('section'); sec.className = 'ach-group';
    const h = document.createElement('h3'); h.textContent = title;
    const grid = document.createElement('div'); grid.className = 'ach-grid'; grid.append(...items.map(achievementTile));
    sec.append(h, grid); return sec;
  };
  const groups = ACHIEVEMENT_GROUPS.map(group => {
    const items = list.filter(a => a.group === group && !(a.done && !a.claimed));
    const all = list.filter(a => a.group === group);
    return items.length ? section(`${group} · ${all.filter(a => a.done).length}/${all.length}`, items) : null;
  }).filter(Boolean);
  $('achievement-list').replaceChildren(...(ready.length ? [section('🎁 待領取', ready)] : []), ...groups);
  if (!$('achievement-dialog').open) { $('achievement-info').hidden = true; $('achievement-dialog').showModal(); syncRoomActivity(); }
}
$('achievement-list').addEventListener('click', async event => {
  const tile = event.target.closest('[data-ach]');
  if (!tile) return;
  const a = achievementStatus(state, CHARACTERS).find(x => x.id === tile.dataset.ach);
  if (!a) return;
  if (!(a.done && !a.claimed)) { showAchievementInfo(a); return; }
  tile.disabled = true;
  const t = await updateState(current => claimAchievement(current, a.id, CHARACTERS));
  state = t.state; renderAll();
  if (t.result) { restart($('chip-energy'), 'is-bump'); toast(`🏆 ${a.title} · +${t.result} 能量`); }
  openAchievements();
});
$('open-achievements').addEventListener('click', () => { $('function-center').close(); openAchievements(); });
$('close-achievements').addEventListener('click', () => $('achievement-dialog').close());
$('achievement-dialog').addEventListener('close', syncRoomActivity);

/* ---------- 紀念蛋：節日、生日、走遍臺灣 ---------- */
let keepsakeBusy = false;
function pendingKeepsakes(current) {
  const got = current.gifts?.keepsakes || [];
  const list = activeHolidays().filter(h => !got.includes(h.key)).map(h => ({ key: h.key, no: h.no, message: h.id === 'birthday' ? '今天是小湘的生日！收到一顆紀念蛋，只有今天才有喔。' : `${h.name}快樂！收到一顆${h.name}的紀念蛋。` }));
  const counties = Object.values(CHARACTERS).filter(c => c.county && c.county !== '綠島');
  if (!got.includes('taiwan') && !current.dex[TAIWAN_NO] && counties.every(c => current.dex[c.no])) list.push({ key: 'taiwan', no: TAIWAN_NO, message: '你走遍了整個臺灣！收到一顆紀念蛋，裡面是台灣小湘。' });
  return list;
}
function grantKeepsakes() {
  if (keepsakeBusy || !state.seenIntro || !pendingKeepsakes(state).length) return;
  keepsakeBusy = true;
  void updateState(current => {
    const list = pendingKeepsakes(current);
    for (const k of list) { current.gifts.eggs.push({ egg: 'keepsake', character: k.no, from: k.key, at: new Date().toISOString() }); current.gifts.keepsakes.push(k.key); }
    return list;
  }).then(t => {
    state = t.state; keepsakeBusy = false; renderAll();
    if (t.result.length) { toast(`${t.result[0].message}到「選擇蛋」把它拿出來吧。`); say('有特別的禮物送到了！', 'cheer', 3000); }
  });
}

/* ---------- 圖鑑：小湘介紹 ---------- */
function howToGet(c) {
  if (c.no === '001') return '從小湘本源蛋孵出';
  if (c.county) return `到${c.county}探索，收到縣市蛋後孵出`;
  if (c.no === TAIWAN_NO) return '集滿 19 位縣市小湘時收到紀念蛋';
  const h = HOLIDAYS.find(x => x.no === c.no);
  if (h) return h.window ? `${h.name}（${h.when}）前後 3 天打開遊戲，收到紀念蛋` : `只在小湘生日（${h.when}）收到紀念蛋`;
  const recipe = RECIPES.find(r => r.target === c.no);
  if (recipe) { const rec = state.recipes[recipe.id]; return `隱藏配方：${state.dex[c.no] || rec.days.length ? recipe.text : '某兩位小湘一起入住首頁，就會發生什麼……'}${rec.done ? '' : rec.days.length ? `（已累積 ${rec.days.length} / ${recipe.days} 天）` : ''}`; }
  if (c.series === 'date') return '約會時掃描 QR Code 取得約會蛋（開發中）';
  const eggs = Object.values(EGGS).filter(e => e.pool?.[c.no]).map(e => e.name);
  return eggs.length ? `${eggs.join('、')}可能孵出` : '特殊方式取得';
}
function openDexDetail(no) {
  const c = CHARACTERS[no];
  const owned = Boolean(state.dex[no]);
  const img = $('dex-detail-img');
  img.className = `dex-detail__img${owned ? '' : ' is-locked'}`; img.alt = owned ? c.name : '尚未收集的小湘';
  loadWithFallback(img, characterSources(c.image));
  $('dex-detail-no').textContent = `No.${c.no} · ${owned ? c.rarity : '?'} · ${SERIES[c.series]?.name || ''}`;
  $('dex-detail-name').textContent = owned ? c.name : '???';
  $('dex-detail-line').textContent = owned ? c.line : '';
  $('dex-detail-line').hidden = !owned;
  $('dex-detail-intro').textContent = owned ? (INTROS[no] || '') : (MYSTERY_INTROS[no] || '遠處好像有誰探了一下頭。再靠近一點，下次也許就能打個招呼。');
  $('dex-detail-how').textContent = `取得方式：${howToGet(c)}`;
  const at = state.dex[no]?.at;
  const story = owned ? storyText(c, state.dex[no]) : '';
  $('dex-detail-story').textContent = story;
  $('dex-detail-story').hidden = !story;
  $('dex-detail-at').textContent = !story && owned && at && !Number.isNaN(Date.parse(at)) ? `相遇日期：${new Date(at).toLocaleDateString('zh-TW')}` : '';
  $('dex-detail').showModal();
}
$('dex-grid').addEventListener('click', event => { const card = event.target.closest('[data-dex-no]'); if (card) openDexDetail(card.dataset.dexNo); });
$('close-dex-detail').addEventListener('click', () => $('dex-detail').close());

/* ---------- 小恐龍：閒聊與小委託 ---------- */
const firstHatchedState = () => state.hatched > 0 || Boolean(state.dex['001']);
const taskCtx = () => ({ today: todayKey(), residents: residentsFor(state.dex), todaysWishIds: todaysWishes().map(w => w.id), snapsToday: snapsToday(state, todayKey()), snapCap: SNAP.perDay, firstHatched: firstHatchedState(), chars: CHARACTERS });

function dinoChat() {
  if (firstHatchedState() && canOffer(state, todayKey()) && Math.random() < 0.4) { offerTask(); return; }
  lastChat = chatterLine(state, CHARACTERS, { today: todayKey(), residents: residentsFor(state.dex), last: lastChat });
  say(lastChat, 'happy', 5000, 'chat');
}
function offerTask() { say('我有一個小委託……可以幫我嗎？點我看看！', 'happy', 8000, 'task-offer'); }

async function acceptTask() {
  if (taskBusy) return;
  taskBusy = true;
  try {
    const ctx = taskCtx();
    const t = await updateState(current => { if (current.dino.task || !canOffer(current, ctx.today)) return null; current.dino.task = makeTask(current, ctx); return current.dino.task; });
    state = t.state; sayOverride = null; renderAll();
    if (t.result) say(`${t.result.text}（完成給你 ${TASK_REWARD} 能量）`, 'happy', 5000, 'chat');
  } finally { taskBusy = false; }
}

async function finishTask() {
  if (taskBusy) return;
  taskBusy = true;
  try {
    const t = await updateState(current => completeTask(current));
    state = t.state; renderAll();
    if (t.result) { restart($('chip-energy'), 'is-bump'); say(`謝謝你！這是我的謝禮 +${t.result} 能量`, 'cheer', 3500); toast(`小恐龍的委託完成 · +${t.result} 能量`); }
  } finally { taskBusy = false; }
}

function renderDinoTask() {
  const task = state.dino?.task;
  $('dino-task').hidden = !task;
  if (!task) return;
  const progress = taskProgress(state, task, { today: todayKey(), snapsToday: snapsToday(state, todayKey()) });
  $('dino-task-text').textContent = task.text;
  $('dino-task-progress').textContent = task.goal > 1 ? `${Math.max(0, progress)} / ${task.goal}` : '';
  $('dino-task-photo').hidden = task.type !== 'color';
  if (task.type !== 'color' && task.type !== 'greet' && progress >= task.goal) void finishTask();
}
$('dino-task-skip').addEventListener('click', async () => {
  const t = await updateState(current => { current.dino.task = null; });
  state = t.state; renderAll(); say('沒關係，下次再拜託你！', 'idle', 2500);
});
$('dino-task-input').addEventListener('change', async () => {
  const file = $('dino-task-input').files?.[0];
  $('dino-task-input').value = '';
  const task = state.dino.task;
  if (!file || task?.type !== 'color') return;
  const wish = WISH_POOL.find(w => w.id === task.target);
  const photo = await freshPhoto(file);
  if (photo.duplicate) { say(DUPLICATE_PHOTO, 'remind', 3500, 'chat'); return; }
  if (photo.hash) state = (await updateState(current => rememberPhoto(current, photo.hash, todayKey()))).state;
  let ratio = 0;
  try { ratio = await analyzePhoto(file, wish, $('photo-thumb')); } catch { toast('這張照片讀不出來，再拍一次試試。'); return; }
  if (ratio >= PASS_RATIO) void finishTask();
  else say(`嗯……${wish.color}只佔了 ${Math.round(ratio * 100)}%，再靠近一點拍拍看！`, 'remind', 4000, 'chat');
});
// 首頁閒置時，小恐龍偶爾自己說話或提出委託
setInterval(() => {
  if (document.hidden || document.body.dataset.view !== 'home' || document.querySelector('dialog[open]') || sayOverride || $('bubble').classList.contains('is-open')) return;
  if (!state.seenIntro) return;
  dinoChat();
}, 25 * 1000);

/* ---------- 紙條收藏 ---------- */
const LETTER_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3zM3 7l9 7 9-7"/></svg>';
const NOTIFIED_KEY = 'siang-collector:letters-notified:v1'; // 已提醒過的里程碑紙條（不放進遊戲存檔）
function renderLetterBadge() {
  const n = unreadCount(state, CHARACTERS);
  $('letter-badge').hidden = !n; $('letter-badge').textContent = n;
  let notified = [];
  try { notified = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]'); } catch {}
  const fresh = unlockedMilestones(state, CHARACTERS).filter(m => !notified.includes(m.id) && !state.letters.read.includes(m.id));
  if (fresh.length) {
    try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...notified, ...fresh.map(m => m.id)])); } catch {}
    toast(`你收到一張新紙條：「${fresh[0].title}」，到首頁的紙條看看吧。`);
  }
}
function openLetterBox() {
  const read = state.letters.read;
  $('letter-list').replaceChildren(...allLetters(state, CHARACTERS).map(letter => {
    const item = document.createElement('button'); item.type = 'button'; item.className = `letter-item${letter.kind === 'mail' ? ' is-mail' : ''}`;
    item.innerHTML = LETTER_ICON;
    const text = document.createElement('span'); text.textContent = letter.title || '湘寄來的紙條';
    const sub = document.createElement('small'); sub.textContent = letter.kind === 'mail' ? `湘寄來的 · ${new Date(letter.at).toLocaleDateString('zh-TW')}` : letter.kind === 'intro' ? '最初的紙條' : `里程碑 · ${letter.hint}`;
    text.append(sub);
    const badge = document.createElement('span'); badge.className = 'letter-new'; badge.textContent = letter.kind !== 'intro' && !read.includes(letter.id) ? '未讀' : '';
    item.append(text, badge);
    item.addEventListener('click', () => readLetter(letter));
    return item;
  }));
  const locked = lockedMilestones(state, CHARACTERS).length;
  $('letter-locked').textContent = locked ? `還有 ${locked} 張紙條等你發現。` : '所有里程碑紙條都收齊了！';
  $('letter-box').showModal(); syncRoomActivity();
}
function readLetter(letter) {
  $('letter-read-title').textContent = letter.kind === 'intro' ? '' : letter.title || '湘寄來的紙條';
  $('letter-read-title').hidden = letter.kind === 'intro';
  $('letter-read-body').textContent = letter.body;
  $('letter-read').showModal();
  if (letter.kind !== 'intro' && !state.letters.read.includes(letter.id)) {
    void updateState(current => { if (!current.letters.read.includes(letter.id)) current.letters.read.push(letter.id); }).then(t => { state = t.state; renderLetterBadge(); });
  }
}
$('close-letter-box').addEventListener('click', () => $('letter-box').close());
$('letter-box').addEventListener('close', syncRoomActivity);
$('letter-read-ok').addEventListener('click', () => { $('letter-read').close(); if ($('letter-box').open) openLetterBox(); });

// 湘從審核室寄來的紙條：letters/<id>.json，驗證印章後存到本機（離線也能看）
async function fetchMail() {
  const config = cloudConfig();
  if (!config || !REVIEWER_PUBLIC_JWK) return 0;
  const cloud = createCloud(config);
  const files = (await cloud.list('letters')).filter(f => f.name.endsWith('.json'));
  const known = new Set(state.letters.mail.map(m => m.id));
  const fresh = [];
  for (const f of files) {
    const id = f.name.slice(0, -5);
    if (known.has(id)) continue;
    const file = await cloud.getJSON(f.path);
    const p = file?.data?.payload;
    if (!file || p?.type !== 'letter' || p.id !== id || typeof p.body !== 'string' || p.body.length > 3000) continue;
    if (!(await verifySigned(REVIEWER_PUBLIC_JWK, file.data))) continue;
    fresh.push({ id, title: typeof p.title === 'string' ? p.title.slice(0, 40) : '', body: p.body, at: p.createdAt || new Date().toISOString() });
  }
  if (!fresh.length) return 0;
  const t = await updateState(current => { const ids = new Set(current.letters.mail.map(m => m.id)); for (const m of fresh) if (!ids.has(m.id)) current.letters.mail.push(m); });
  state = t.state; renderAll();
  toast(fresh.length > 1 ? `湘寄來 ${fresh.length} 張新紙條！` : '湘寄來一張新紙條！到首頁的紙條看看吧。');
  say('有一張新紙條送到了！', 'happy', 3000);
  return fresh.length;
}

/* ---------- 湘的委託、記憶檔案、約會碼 ---------- */
function ready2() { return Boolean(cloudConfig() && REVIEWER_PUBLIC_JWK); }
let missionsSyncing = null;
// 讀取湘的委託與審核結果（驗證印章後才採用）
async function syncMissions() {
  if (!ready2()) return { fresh: 0, results: [] };
  if (missionsSyncing) return missionsSyncing;
  missionsSyncing = (async () => {
    const cloud = createCloud(cloudConfig());
    const files = (await cloud.list('missions')).filter(f => f.name.endsWith('.json'));
    const list = []; let badSeal = 0;
    for (const f of files) {
      const file = await cloud.getJSON(f.path); const p = file?.data?.payload;
      if (!p || p.type !== 'mission' || p.id !== f.name.slice(0, -5) || typeof p.title !== 'string' || !validReward(p.reward, CHARACTERS)) continue;
      if (!(await verifySigned(REVIEWER_PUBLIC_JWK, file.data))) { badSeal += 1; continue; }
      list.push({ id: p.id, title: p.title.slice(0, 60), body: String(p.body || '').slice(0, 600), reward: p.reward, expires: p.expires || null, createdAt: p.createdAt || '' });
    }
    const reviews = (await cloud.list('reviews')).filter(f => f.name.endsWith('.json') && !state.gifts.reviews.includes(f.name));
    const results = [];
    for (const f of reviews) {
      const file = await cloud.getJSON(f.path); const p = file?.data?.payload;
      if (!p || p.type !== 'review' || `${p.mission}__${p.submission}.json` !== f.name) continue;
      if (!(await verifySigned(REVIEWER_PUBLIC_JWK, file.data))) continue;
      results.push({ file: f.name, ...p });
    }
    const t = await updateState(current => {
      const known = new Set(current.missions.list.map(m => m.id));
      const fresh = list.filter(m => !known.has(m.id)).length;
      current.missions.list = [...current.missions.list.filter(m => current.missions.status[m.id] === 'approved' && !list.some(x => x.id === m.id)), ...list];
      const applied = [];
      for (const r of results) {
        if (current.gifts.reviews.includes(r.file)) continue;
        const mission = current.missions.list.find(m => m.id === r.mission);
        const pending = current.missions.pending[r.mission];
        if (!mission || !pending || pending.sid !== r.submission) continue;
        current.gifts.reviews.push(r.file);
        if (r.approved) {
          applyReward(current, mission.reward, 'mission');
          current.missions.status[r.mission] = 'approved';
          current.memories.push({ id: `m-${r.mission}`, kind: 'mission', title: mission.title, note: String(r.note || '').slice(0, 600), at: r.createdAt || new Date().toISOString(), thumb: pending.thumb, photo: `submissions/${r.mission}/${r.submission}.jpg` });
          delete current.missions.pending[r.mission]; delete current.missions.notes[r.mission];
        } else {
          current.missions.status[r.mission] = 'rejected';
          current.missions.notes[r.mission] = String(r.note || '').slice(0, 600);
          delete current.missions.pending[r.mission];
        }
        applied.push({ ...r, mission });
      }
      return { fresh, applied, badSeal };
    });
    state = t.state; renderAll();
    for (const r of t.result.applied) toast(r.approved ? `委託「${r.mission.title}」通過了！獲得${describeReward(r.mission.reward, CHARACTERS, EGGS)}，照片收進記憶檔案。` : `委託「${r.mission.title}」被退回了，看看湘的批註吧。`);
    if (!t.result.applied.length && t.result.fresh) toast(`湘出了 ${t.result.fresh} 個新委託！在研究者手記的「湘的委託」。`);
    return t.result;
  })().finally(() => { missionsSyncing = null; });
  return missionsSyncing;
}
function missionStatus(m) { return state.missions.pending[m.id] ? 'submitted' : state.missions.status[m.id] || 'open'; }
function openMissionCount() { return state.missions.list.filter(m => !['approved', 'submitted'].includes(missionStatus(m)) && !(m.expires && Date.now() > Date.parse(m.expires))).length; }
function renderMissionsBadge() { const n = openMissionCount(); $('missions-badge').hidden = !n; $('missions-badge').textContent = n; }

let missionTarget = null;
function renderMissions() {
  const list = [...state.missions.list].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  $('missions-list').replaceChildren(...list.map(m => {
    const st = missionStatus(m);
    const expired = st !== 'approved' && m.expires && Date.now() > Date.parse(m.expires);
    const el = document.createElement('article'); el.className = `commission${st === 'open' || st === 'rejected' ? ' is-open' : ''}`;
    if (st === 'submitted' && state.missions.pending[m.id]?.thumb) { const img = document.createElement('img'); img.className = 'commission__thumb'; img.src = state.missions.pending[m.id].thumb; img.alt = ''; el.append(img); }
    const h = document.createElement('h3'); h.textContent = m.title;
    const body = document.createElement('p'); body.textContent = m.body;
    const info = document.createElement('small');
    info.textContent = `獎勵：${describeReward(m.reward, CHARACTERS, EGGS)}${m.expires ? ` · 期限 ${new Date(m.expires).toLocaleDateString('zh-TW')}` : ''} · ${expired ? '已過期' : { open: '等你拍', submitted: '等湘審核中', approved: '已完成 ✓', rejected: '被退回，可以再拍一次' }[st]}`;
    el.append(h, body, info);
    if (st === 'rejected' && state.missions.notes[m.id]) { const n = document.createElement('p'); n.className = 'commission__note'; n.textContent = `湘：${state.missions.notes[m.id]}`; el.append(n); }
    if ((st === 'open' || st === 'rejected') && !expired) {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn'; btn.textContent = st === 'rejected' ? '重新拍一張' : '拍照上傳';
      btn.addEventListener('click', () => { missionTarget = m.id; $('mission-input').click(); });
      el.append(btn);
    }
    return el;
  }));
  if (!list.length) $('missions-list').replaceChildren(Object.assign(document.createElement('p'), { className: 'residents-intro', textContent: ready2() ? '湘還沒有出委託，等等看吧～' : '要先到「雲端與備份」連上資料庫，才收得到湘的委託。' }));
}
async function openMissions() {
  renderMissions(); $('missions-status').textContent = '';
  if (!$('missions-dialog').open) { $('missions-dialog').showModal(); syncRoomActivity(); }
  if (!ready2()) return;
  $('missions-status').textContent = '同步中…';
  try { const r = await syncMissions(); $('missions-status').textContent = r.badSeal ? `有 ${r.badSeal} 個委託的印章對不上，遊戲先不收。把遊戲完全關掉再打開試試；還是不行請湘檢查審核室的印章。` : ''; } catch (err) { $('missions-status').textContent = `同步失敗：${err.message}`; }
  renderMissions();
}
$('open-missions').addEventListener('click', () => { $('function-center').close(); void openMissions(); });
$('close-missions').addEventListener('click', () => $('missions-dialog').close());
$('missions-dialog').addEventListener('close', syncRoomActivity);
$('mission-input').addEventListener('change', async () => {
  const file = $('mission-input').files?.[0]; $('mission-input').value = '';
  const id = missionTarget; missionTarget = null;
  if (!file || !id || !ready2()) return;
  $('missions-status').textContent = '上傳中…';
  try {
    const [bytes, thumb] = await Promise.all([compressPhoto(file), thumbnail(file)]);
    const sid = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const cloud = createCloud(cloudConfig());
    await cloud.putBytes(`submissions/${id}/${sid}.jpg`, bytes, 'submit photo');
    await cloud.putJSON(`submissions/${id}/${sid}.json`, { mission: id, sid, at: new Date().toISOString() }, 'submit photo');
    const t = await updateState(current => { current.missions.pending[id] = { sid, thumb, at: new Date().toISOString() }; delete current.missions.status[id]; });
    state = t.state; renderAll(); renderMissions();
    $('missions-status').textContent = '上傳好了！等湘審核，通過會收進記憶檔案。';
  } catch (err) { $('missions-status').textContent = `上傳失敗：${err.message}`; }
});

// 記憶檔案
function openMemories() {
  const list = [...state.memories].sort((a, b) => String(b.at).localeCompare(String(a.at)));
  $('memories-intro').textContent = list.length ? `一共 ${list.length} 份記憶。` : '完成湘的委託、跟湘約會、寄照片給湘，回憶就會收在這裡。';
  $('memories-grid').replaceChildren(...list.map(m => {
    const el = document.createElement('button'); el.type = 'button'; el.className = `memory memory--${m.kind}`;
    const img = document.createElement('img'); img.alt = ''; if (m.thumb) img.src = m.thumb; else if (m.character) loadWithFallback(img, characterSources(CHARACTERS[m.character]?.image || 'siang-014-date'));
    const t = document.createElement('span'); t.textContent = m.title;
    const d = document.createElement('small'); d.textContent = new Date(m.at).toLocaleDateString('zh-TW');
    el.append(img, t, d); el.addEventListener('click', () => void openMemory(m)); return el;
  }));
  if (!$('memories-dialog').open) { $('memories-dialog').showModal(); syncRoomActivity(); }
}
async function openMemory(m) {
  const img = $('memory-view-img');
  img.removeAttribute('src'); if (m.thumb) img.src = m.thumb; else loadWithFallback(img, characterSources(CHARACTERS[m.character]?.image || 'siang-014-date'));
  $('memory-view-date').textContent = `${{ date: '約會紀念', postcard: '寄給湘的照片' }[m.kind] || '委託'} · ${new Date(m.at).toLocaleDateString('zh-TW')}`;
  $('memory-view-title').textContent = m.kind === 'postcard' ? (m.text || '寄給湘的照片') : m.title;
  $('memory-view-note').textContent = m.note || '';
  $('memory-view-note').hidden = !m.note;
  $('memory-view-note').dataset.label = m.kind === 'postcard' ? '湘的回覆' : '首席研究員的批註';
  $('memory-view').showModal();
  if (m.photo && cloudConfig()) {
    try { const bytes = await createCloud(cloudConfig()).getBytes(m.photo); if (bytes) img.src = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' })); } catch {}
  }
}
$('open-memories').addEventListener('click', () => { $('function-center').close(); openMemories(); void syncPostcardReplies().then(n => { if (n && $('memories-dialog').open) openMemories(); }).catch(() => {}); });
$('close-memories').addEventListener('click', () => $('memories-dialog').close());
$('memories-dialog').addEventListener('close', syncRoomActivity);
$('close-memory-view').addEventListener('click', () => $('memory-view').close());

// 約會碼：dates/<CODE>.json，湘蓋章、幾分鐘內有效、只能用一次
async function redeemDate(code) {
  if (!cloudConfig()) return '要先到「雲端與備份」連線，才能使用約會碼。';
  if (!REVIEWER_PUBLIC_JWK) return '審核員的印章還沒設定好。';
  if (state.gifts.dates.includes(code)) return '這個約會碼已經用過了。';
  const cloud = createCloud(cloudConfig());
  const file = await cloud.getJSON(`dates/${code}.json`);
  const p = file?.data?.payload;
  if (!p || p.type !== 'date' || p.code !== code || !(await verifySigned(REVIEWER_PUBLIC_JWK, file.data))) return null;
  if (Date.now() > Date.parse(p.expires)) return '這個約會碼過期了，請湘再產生一個新的。';
  if (await cloud.exists(`used/date-${code}.json`)) return '這個約會碼已經用過了。';
  await cloud.putJSON(`used/date-${code}.json`, { at: new Date().toISOString() }, 'use date code');
  const t = await updateState(current => {
    if (current.gifts.dates.includes(code)) return false;
    current.gifts.dates.push(code);
    current.gifts.eggs.push({ egg: 'date', from: 'date', at: new Date().toISOString() });
    current.memories.push({ id: `d-${code}`, kind: 'date', title: p.title || '今天的約會', note: String(p.note || '').slice(0, 600), at: new Date().toISOString(), character: '014' });
    return true;
  });
  state = t.state; renderAll();
  if (!t.result) return '這個約會碼已經用過了。';
  say('約會快樂！我收到一顆特別的蛋喔♡', 'cheer', 4000);
  return '約會快樂♡ 獲得一顆約會蛋，今天的約會也收進記憶檔案了。到「選擇蛋」把它拿出來吧！';
}
async function handleDateHash(url = location.href) {
  const m = String(url).match(/#.*date=([A-Za-z0-9]{6})/);
  if (!m) return;
  if (/date=/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
  const code = m[1].toUpperCase();
  try { toast((await redeemDate(code)) || '這個約會碼不對喔。'); } catch (err) { toast(`約會碼讀取失敗：${err.message}`); }
}

/* ---------- 寄照片給湘（明信片） ---------- */
// postcards/<id>.jpg、.json：玩家寄出；postcard-replies/<id>.json：湘蓋章的回覆
let postcardFile = null;
$('open-postcard').addEventListener('click', () => {
  $('function-center').close();
  postcardFile = null; $('postcard-preview').hidden = true; $('postcard-pick-text').hidden = false; $('postcard-text').value = '';
  $('postcard-status').textContent = cloudConfig() ? '' : '要先到「雲端與備份」連上資料庫，才能寄照片給湘。';
  $('postcard-dialog').showModal(); syncRoomActivity();
});
$('close-postcard').addEventListener('click', () => $('postcard-dialog').close());
$('postcard-dialog').addEventListener('close', syncRoomActivity);
$('postcard-input').addEventListener('change', () => {
  const file = $('postcard-input').files?.[0]; $('postcard-input').value = '';
  if (!file) return;
  postcardFile = file;
  const url = URL.createObjectURL(file); $('postcard-preview').src = url; $('postcard-preview').hidden = false; $('postcard-pick-text').hidden = true;
});
$('postcard-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!cloudConfig()) { $('postcard-status').textContent = '要先到「雲端與備份」連上資料庫。'; return; }
  if (!postcardFile) { $('postcard-status').textContent = '先選一張照片吧。'; return; }
  $('postcard-send').disabled = true; $('postcard-status').textContent = '寄送中…';
  try {
    const [bytes, thumb] = await Promise.all([compressPhoto(postcardFile), thumbnail(postcardFile)]);
    const id = `${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 6)}`;
    const text = $('postcard-text').value.trim().slice(0, 300);
    const cloud = createCloud(cloudConfig());
    await cloud.putBytes(`postcards/${id}.jpg`, bytes, 'send postcard');
    await cloud.putJSON(`postcards/${id}.json`, { id, text, at: new Date().toISOString() }, 'send postcard');
    const t = await updateState(current => { current.memories.push({ id: `p-${id}`, kind: 'postcard', title: text ? text.split('\n')[0].slice(0, 30) : '寄給湘的照片', text, note: '', at: new Date().toISOString(), thumb, photo: `postcards/${id}.jpg`, postcard: id }); });
    state = t.state; renderAll();
    postcardFile = null; $('postcard-preview').hidden = true; $('postcard-pick-text').hidden = false; $('postcard-text').value = '';
    $('postcard-status').textContent = '寄出了！湘回覆的話會出現在記憶檔案裡。';
    say('照片寄出去了！湘一定會很開心♡', 'happy', 3000);
  } catch (err) { $('postcard-status').textContent = `寄送失敗：${err.message}`; }
  finally { $('postcard-send').disabled = false; }
});
async function syncPostcardReplies() {
  if (!cloudConfig() || !REVIEWER_PUBLIC_JWK) return 0;
  const waiting = state.memories.filter(m => m.kind === 'postcard' && !m.note);
  if (!waiting.length) return 0;
  const cloud = createCloud(cloudConfig());
  const files = new Set((await cloud.list('postcard-replies')).map(f => f.name));
  const replies = [];
  for (const m of waiting) {
    if (!files.has(`${m.postcard}.json`)) continue;
    const file = await cloud.getJSON(`postcard-replies/${m.postcard}.json`); const p = file?.data?.payload;
    if (p?.type !== 'postcard-reply' || p.id !== m.postcard || typeof p.note !== 'string' || !(await verifySigned(REVIEWER_PUBLIC_JWK, file.data))) continue;
    replies.push({ id: m.id, note: p.note.slice(0, 600) });
  }
  if (!replies.length) return 0;
  const t = await updateState(current => { for (const r of replies) { const m = current.memories.find(x => x.id === r.id); if (m && !m.note) m.note = r.note; } });
  state = t.state; renderAll();
  toast(replies.length > 1 ? `湘回覆了 ${replies.length} 張照片！到記憶檔案看看。` : '湘回覆了你寄的照片！到記憶檔案看看。');
  return replies.length;
}

/* ---------- 挑蛋（三選一）、調皮的蛋 ---------- */
function showEggOffer() {
  const offer = state.eggOffer;
  if (!offer || $('egg-offer').open || document.querySelector('dialog[open]')) return;
  $('egg-offer-list').replaceChildren(...offer.map((o, i) => {
    const f = FLAVORS[o.flavor];
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = `offer-egg${o.shiny ? ' is-shiny' : ''}${o.naughty ? ' is-naughty' : ''}`; btn.dataset.offer = String(i);
    const art = document.createElement('div'); art.className = 'egg-choice__art'; const v = createEggView(EGGS.ordinary); v.setProgress(0); art.append(v.el);
    const b = document.createElement('b'); b.textContent = eggLabel(o, f.name);
    const sm = document.createElement('small'); sm.textContent = o.shiny ? '閃閃發光！' : o.naughty ? '一直在晃，好像有話想說' : f.hint;
    btn.append(art, b, sm); return btn;
  }));
  $('egg-offer').showModal(); syncRoomActivity();
}
$('egg-offer').addEventListener('cancel', event => event.preventDefault());
$('egg-offer').addEventListener('close', syncRoomActivity);
$('egg-offer-list').addEventListener('click', async event => {
  const btn = event.target.closest('[data-offer]'); if (!btn) return;
  const t = await updateState(current => {
    const o = current.eggOffer?.[Number(btn.dataset.offer)];
    if (!o) return null;
    if (current.egg.id !== 'ordinary' || current.egg.warmth > 0 || current.egg.flavor) { current.eggOffer = null; return null; }
    Object.assign(current.egg, o, { asks: [] }); current.eggOffer = null;
    current.bonus.passiveAt = new Date().toISOString();
    return o;
  });
  state = t.state; $('egg-offer').close(); renderAll();
  if (t.result) toast(t.result.shiny ? '你選了閃亮的蛋！好像會有好事發生✨' : t.result.naughty ? '這顆蛋好調皮……孵化途中它可能會提出要求喔。' : `${FLAVORS[t.result.flavor].name}放上培養架了。`);
});

function naughtyDone() { const asks = state.egg.asks || []; return asks.includes(1) && asks.includes(2); }
let eggPets = 0;
function currentRequest() { return naughtyRequest(state.egg, EGGS[state.egg.id].warmthNeeded, WISH_POOL); }
function renderEggRequest() {
  const req = currentRequest();
  $('egg-request').hidden = !req;
  if (!req) return;
  $('egg-request-text').textContent = req.type === 'pet' ? `調皮的蛋想被摸摸！點蛋 5 下（${eggPets} / 5）` : `調皮的蛋想看${req.color.color}的東西！拍給它看`;
  $('egg-request-photo').hidden = req.type !== 'color';
}
async function grantRequest(step) {
  const t = await updateState(current => {
    if (!current.egg.naughty || (current.egg.asks || []).includes(step)) return 0;
    current.egg.asks = [...(current.egg.asks || []), step];
    const need = EGGS[current.egg.id].warmthNeeded; const add = Math.min(NAUGHTY_BONUS, need - current.egg.warmth);
    current.egg.warmth += add; return add;
  });
  state = t.state; eggPets = 0; renderAll();
  if (t.result >= 0) { showGain(`+${t.result}`); toast(`調皮的蛋很滿意！溫度 +${t.result}`); }
}
incubator.el.addEventListener('click', () => {
  const req = currentRequest();
  if (req?.type !== 'pet') return;
  eggPets += 1; incubator.press(); renderEggRequest();
  if (eggPets >= 5) void grantRequest(req.step);
});
$('egg-request-input').addEventListener('change', async () => {
  const file = $('egg-request-input').files?.[0]; $('egg-request-input').value = '';
  const req = currentRequest(); if (!file || req?.type !== 'color') return;
  let ratio = 0;
  try { ratio = await analyzePhoto(file, req.color, $('photo-thumb')); } catch { toast('這張照片讀不出來，再試一次。'); return; }
  if (ratio >= PASS_RATIO) void grantRequest(req.step);
  else toast(`蛋晃了晃……${req.color.color}好像不夠多（${Math.round(ratio * 100)}%），再找找看。`);
});

/* ---------- 化石交換所 ---------- */
function openFossils() {
  $('fossil-have').textContent = `你有 ${state.fossils} 個化石碎片。抽到重複的小湘，每次會得到 ${DUPLICATE_FOSSILS} 個。`;
  $('fossil-offers').replaceChildren(...offersFor(state).map(o => {
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'fossil-offer'; btn.dataset.offer = o.id;
    btn.disabled = state.fossils < o.cost || (o.id === 'pick' && !pickable(state, EGGS, CHARACTERS).length);
    const text = document.createElement('div'); const b = document.createElement('b'); b.textContent = o.name; const sm = document.createElement('small'); sm.textContent = o.desc; text.append(b, sm);
    const cost = document.createElement('span'); cost.textContent = `${o.cost} 化石`;
    btn.append(text, cost); return btn;
  }));
  $('fossil-pick').hidden = true;
  if (!$('fossil-dialog').open) { $('fossil-status').textContent = ''; $('fossil-dialog').showModal(); syncRoomActivity(); }
}
async function doExchange(offerId, no) {
  const t = await updateState(current => exchange(current, offerId, { eggs: EGGS, chars: CHARACTERS, no }));
  state = t.state; renderAll();
  if (!t.result) { $('fossil-status').textContent = '化石不夠喔。'; return; }
  restart($('chip-fossil'), 'is-bump');
  $('fossil-status').textContent = offerId === 'slot' ? `蛋架擴充到 ${state.cradle.slots} 格！暫放架最前面的蛋也會一起保溫。` : offerId === 'energy' ? '換到 30 能量了！' : offerId === 'pick' ? `換到一顆暗號蛋，裡面是${CHARACTERS[no].name}！到「選擇蛋」把它拿出來吧。` : `換到${t.result.name}了！到「選擇蛋」把它拿出來吧。`;
  openFossils();
}
$('chip-fossil').addEventListener('click', openFossils);
$('close-fossil').addEventListener('click', () => $('fossil-dialog').close());
$('fossil-dialog').addEventListener('close', syncRoomActivity);
$('fossil-offers').addEventListener('click', event => {
  const btn = event.target.closest('[data-offer]'); if (!btn || btn.disabled) return;
  if (btn.dataset.offer !== 'pick') { void doExchange(btn.dataset.offer); return; }
  $('fossil-pick-list').replaceChildren(...pickable(state, EGGS, CHARACTERS).map(no => {
    const c = CHARACTERS[no]; const b = document.createElement('button'); b.type = 'button'; b.className = 'fossil-pick'; b.dataset.pick = no;
    const img = document.createElement('img'); img.alt = ''; loadWithFallback(img, characterSources(c.image));
    b.append(img, `No.${c.no} · ${c.rarity}`); return b;
  }));
  $('fossil-pick').hidden = false;
  $('fossil-pick').scrollIntoView({ block: 'nearest' });
});
$('fossil-pick-list').addEventListener('click', event => { const b = event.target.closest('[data-pick]'); if (b) void doExchange('pick', b.dataset.pick); });

/* ---------- 額外能量：見面禮、隨手收藏、自動保溫 ---------- */
async function collectGift() {
  const t = await updateState(current => claimGift(current, todayKey()));
  state = t.state; renderAll();
  if (t.result) { restart($('chip-energy'), 'is-bump'); say(`見面禮送到了！+${t.result} 能量`, 'happy', 2600); toast(`每日見面禮 +${t.result} 能量`); }
}
$('daily-gift').addEventListener('click', collectGift);

function renderSnap() {
  const n = snapsToday(state, todayKey());
  $('snap-count').textContent = `今天 ${n} / ${SNAP.perDay}`;
  $('snap-label').classList.toggle('is-done', n >= SNAP.perDay);
  $('snap-label').firstChild.textContent = n >= SNAP.perDay ? '明天再拍' : '拍一張';
}
const SNAP_CHEERS = [
  '第一張收藏！今天也一起發現小美好吧～', '好可愛的東西！你的眼光真好。', '收藏冊越來越熱鬧了！', '這張我好喜歡，可以偷偷存起來嗎？', '已經五張了！今天的世界很漂亮對吧？',
  '你連這個都注意到了，好厲害！', '小湘們排隊在看你拍的照片喔。', '每一張都是今天的小禮物。', '再一張就收集滿了，加油！', '今天的十張都收集好了！謝謝你帶我看見這麼多。',
];
// 拍照共用：今天拍過幾乎一樣的照片就提醒
async function freshPhoto(file) {
  let hash;
  try { hash = await photoHash(file); } catch { return { error: true }; }
  if (photoSeen(state, hash, todayKey(), similarPhoto)) return { duplicate: true, hash };
  return { hash };
}
const DUPLICATE_PHOTO = '這張好像今天拍過了，換一個東西拍拍看吧～';
$('snap-input').addEventListener('change', async () => {
  const file = $('snap-input').files?.[0];
  $('snap-input').value = '';
  if (!file) return;
  const photo = await freshPhoto(file);
  if (photo.error) { toast('這張照片讀不出來，再拍一次試試。'); return; }
  if (photo.duplicate) { toast(DUPLICATE_PHOTO); return; }
  const t = await updateState(current => { const r = takeSnap(current, todayKey()); if (r) rememberPhoto(current, photo.hash, todayKey()); return r; });
  state = t.state; renderAll();
  if (t.result) { restart($('chip-energy'), 'is-bump'); toast(`${SNAP_CHEERS[Math.min(SNAP_CHEERS.length, state.bonus.snaps.count) - 1]} +${t.result} 能量`); }
  else toast('今天的隨手收藏已經滿了，明天再拍吧。');
});

async function tickPassive() {
  const t = await updateState(current => accruePassive(current, EGGS));
  state = t.state;
  if (t.result) { renderAll(); if (document.body.dataset.view === 'incubate') showGain(`+${t.result}`); }
  return t.result;
}

/* ---------- 雲端：備份、還原與暗號 ---------- */
const BACKUP_KEYS = [THEME_KEY, 'siang-collector:v1', ROOM_KEY, PRESENTER_KEY, 'siang-collector:dex-mode:v1'];
const LAST_BACKUP_KEY = 'siang-collector:cloud-backup:v1';
const lastBackup = () => { try { return localStorage.getItem(LAST_BACKUP_KEY); } catch { return null; } };

function renderCloud(message = '') {
  const config = cloudConfig();
  $('cloud-repo').value = config?.repo || $('cloud-repo').value;
  $('cloud-token').value = '';
  $('cloud-token').placeholder = config ? '已儲存（要更換再貼上新的）' : 'github_pat_…';
  $('cloud-save').textContent = config ? '更新連線' : '連線';
  $('cloud-backup').hidden = !config;
  $('cloud-restore-confirm').hidden = true;
  const last = lastBackup();
  $('cloud-last').textContent = last ? `上次備份：${new Date(last).toLocaleString('zh-TW')}（每天打開遊戲時自動備份）` : '還沒有備份過';
  $('cloud-status').textContent = message;
}

async function backupNow() {
  const config = cloudConfig();
  if (!config) throw new Error('還沒連線');
  const cloud = createCloud(config);
  const keys = {};
  for (const k of BACKUP_KEYS) { try { const v = localStorage.getItem(k); if (v !== null) keys[k] = v; } catch {} }
  const data = { app: 'siang-collector', v: 1, at: new Date().toISOString(), keys };
  await cloud.putJSON('backups/latest.json', data, 'backup: latest', { overwrite: true });
  await cloud.putJSON(`backups/${todayKey()}.json`, data, `backup: ${todayKey()}`, { overwrite: true });
  try { localStorage.setItem(LAST_BACKUP_KEY, data.at); } catch {}
  return data.at;
}

async function autoBackup() {
  const last = lastBackup();
  if (!cloudConfig() || (last && todayKey(new Date(last)) === todayKey())) return;
  try { await backupNow(); } catch {}
}

$('open-cloud').addEventListener('click', () => { $('function-center').close(); renderCloud(); $('cloud-dialog').showModal(); syncRoomActivity(); });
$('close-cloud').addEventListener('click', () => $('cloud-dialog').close());
$('cloud-dialog').addEventListener('close', syncRoomActivity);
$('cloud-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const repo = $('cloud-repo').value.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
  const token = $('cloud-token').value.trim() || cloudConfig()?.token || '';
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !token) { $('cloud-status').textContent = '請填資料庫名稱（像 owner/repo）和通行碼。'; return; }
  $('cloud-save').disabled = true; $('cloud-status').textContent = '連線中…';
  try {
    const info = await createCloud({ repo, token }).test();
    saveCloudConfig({ repo, token });
    renderCloud(info.private ? '連線成功！' : '連線成功，但這個資料庫是公開的。照片和備份請改放在私人資料庫。');
    void autoBackup().then(() => renderCloud($('cloud-status').textContent));
  } catch (err) { $('cloud-status').textContent = `連不上：${err.message}`; }
  finally { $('cloud-save').disabled = false; }
});
$('cloud-backup-now').addEventListener('click', async () => {
  $('cloud-backup-now').disabled = true; $('cloud-status').textContent = '備份中…';
  try { await backupNow(); renderCloud('備份完成。'); } catch (err) { $('cloud-status').textContent = `備份失敗：${err.message}`; }
  finally { $('cloud-backup-now').disabled = false; }
});
let pendingRestore = null;
$('cloud-restore').addEventListener('click', async () => {
  $('cloud-status').textContent = '讀取雲端備份…';
  try {
    const file = await createCloud(cloudConfig()).getJSON('backups/latest.json');
    if (!file || file.data.app !== 'siang-collector' || !file.data.keys?.['siang-collector:v1']) { $('cloud-status').textContent = '雲端還沒有備份。'; return; }
    pendingRestore = file.data;
    const saved = JSON.parse(file.data.keys['siang-collector:v1']);
    $('cloud-status').textContent = `找到 ${new Date(file.data.at).toLocaleString('zh-TW')} 的備份：圖鑑 ${Object.keys(saved.dex || {}).length} 位、能量 ${saved.energy || 0}。`;
    $('cloud-restore-confirm').hidden = false;
  } catch (err) { $('cloud-status').textContent = `讀取失敗：${err.message}`; }
});
$('cloud-restore-confirm').addEventListener('click', () => {
  if (!pendingRestore) return;
  for (const [k, v] of Object.entries(pendingRestore.keys)) if (BACKUP_KEYS.includes(k)) localStorage.setItem(k, v);
  location.reload();
});
$('cloud-disconnect').addEventListener('click', () => { saveCloudConfig(null); $('cloud-repo').value = ''; renderCloud('已中斷連線，這支手機不再保存通行碼。'); });

// 暗號：正規化 → 雜湊 → 讀 codes/<雜湊>.json → 驗證湘的簽章 → 檢查期限與是否用過 → 發獎勵
async function redeemCode(text) {
  const maybeDate = String(text || '').trim().toUpperCase();
  if (DATE_CODE.test(maybeDate)) { const r = await redeemDate(maybeDate); if (r) return r; }
  const phrase = normalizeCode(text);
  if (!phrase) return '先輸入暗號喔。';
  const config = cloudConfig();
  if (!config) return '要先到「雲端與備份」連線，才能兌換暗號。';
  if (!REVIEWER_PUBLIC_JWK) return '審核員的印章還沒設定好，請湘先完成審核頁的設定。';
  const hash = await sha256Hex(phrase);
  const cloud = createCloud(config);
  const file = await cloud.getJSON(`codes/${hash}.json`);
  if (!file) return state.gifts.redeemed.includes(hash) ? '這個暗號已經兌換過了。' : '暗號好像不對……再想想看？';
  const signed = file.data;
  const p = signed.payload;
  if (!(await verifySigned(REVIEWER_PUBLIC_JWK, signed)) || p?.type !== 'code' || p.hash !== hash || !validReward(p.reward, CHARACTERS)) return '這個暗號的印章不對，無法兌換。';
  if (p.expires && Date.now() > Date.parse(p.expires)) return '這個暗號已經過期了。';
  const once = p.once !== false;
  // 一次性暗號：全世界只能兌換一次；可重複的暗號：每天可以兌換一次
  const mark = once ? hash : `${hash}:${todayKey()}`;
  if (state.gifts.redeemed.includes(mark)) return once ? '這個暗號已經兌換過了。' : '這個暗號今天已經兌換過了，明天再來吧。';
  if (once && await cloud.exists(`redeemed/${hash}.json`)) return '這個暗號已經被兌換過了。';
  if (once) await cloud.putJSON(`redeemed/${hash}.json`, { at: new Date().toISOString() }, 'redeem code');
  const transaction = await updateState(current => {
    if (current.gifts.redeemed.includes(mark)) return false;
    applyReward(current, p.reward, 'code'); current.gifts.redeemed.push(mark); return true;
  });
  state = transaction.state; renderAll();
  if (!transaction.result) return '這個暗號已經兌換過了。';
  return `兌換成功！獲得${describeReward(p.reward, CHARACTERS, EGGS)}。${p.reward.type === 'energy' ? '' : '\n到培育室的「選擇蛋」把它拿出來吧。'}`;
}
$('open-code').addEventListener('click', () => { $('function-center').close(); $('code-input').value = ''; $('code-status').textContent = ''; $('code-dialog').showModal(); syncRoomActivity(); });
$('close-code').addEventListener('click', () => $('code-dialog').close());
$('code-dialog').addEventListener('close', syncRoomActivity);
$('code-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('code-submit').disabled = true; $('code-status').textContent = '確認中…';
  try { $('code-status').textContent = await redeemCode($('code-input').value); }
  catch (err) { $('code-status').textContent = `兌換失敗：${err.message || '連線問題'}`; }
  finally { $('code-submit').disabled = false; }
});

startChats(room, () => homeAmbience());
attachSnackDrag($('snack'), {
  canDrag: () => snacksLeft(state, todayKey()) > 0 && room.residents().length > 0,
  onTap: () => toast(snacksLeft(state, todayKey()) > 0 ? '按住布丁，拖到小湘身上餵她吃吧！' : '今天的布丁吃完了，明天再來～'),
  onDrop: async (no) => {
    if (!no) { toast('要把布丁放到小湘身上喔。'); return; }
    const t = await updateState(current => feedSnack(current, todayKey()));
    state = t.state; renderAll();
    if (!t.result) { toast('今天的布丁吃完了，明天再來～'); return; }
    room.happy(no); room.hearts(no, 6); room.bubble(no, ['布丁好好吃！謝謝你～', '是我最喜歡的焦糖口味！', '再一口……就一口！'][Math.floor(Math.random() * 3)]);
    restart($('chip-energy'), 'is-bump'); toast(`${CHARACTERS[no].name}吃得好開心！+${t.result} 能量`);
  },
});

setupThemes({ onOpen: syncRoomActivity });
renderAll();
renderExplore();
void autoBackup().catch(() => {}).then(() => syncFromCloud(true));
setInterval(() => { if (!document.hidden) void syncFromCloud(); }, 10 * 60 * 1000);
void handleDateHash();
addEventListener('hashchange', event => { if (/date=/.test(event.newURL)) void handleDateHash(event.newURL); });
void tickPassive().then(added => { if (added) toast(`你不在的時候，培養架幫蛋保溫了 +${added}`); });
setInterval(() => { if (!document.hidden) void tickPassive(); }, 60 * 1000);
// 已經允許過定位的話，打開遊戲時自動感應；只有第一次來到的縣市才會跳出來
void geoPermission().then(p => { if (p === 'granted') setTimeout(() => explore({ silent: true }), 1200); });
showView(VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home', { replace: true });
if (initialSave.state?.player?.chapterNotes?.length) {
  const notes = initialSave.state.player.chapterNotes;
  toast(notes.length > 1 ? `完成了 ${notes.length} 個章節，已補發章節獎勵並升級為 Lv.${playerLevel(state)}！` : `第 ${notes[0].level} 章完成！獲得${notes[0].reward}，升級為 Lv.${playerLevel(state)}`);
}
if (initialSave.growthEnergyAdded > 0) {
  $('growth-feedback').textContent = `先前已完成的成長願望，已補發 ${initialSave.growthEnergyAdded} 能量。`;
  toast(`成長願望獎勵更新，已補發 ${initialSave.growthEnergyAdded} 能量。`);
}
if (!state.seenIntro) { $('intro').showModal(); syncRoomActivity(); }

setInterval(() => { if (!document.hidden && state.wishes.date !== todayKey()) void updateState(() => {}).then(transaction => { state = transaction.state; renderAll(); }); }, 30000);

// ── 放到主畫面（Android 跳安裝卡；其他瀏覽器顯示手動步驟）
const INSTALL_STEPS = {
  ios: ['用 <b>Safari</b> 打開這個網頁', '點下方的<b>分享</b>按鈕（方框加箭頭）', '往下滑，選<b>加入主畫面</b>'],
  android: ['點右上角的 <b>⋮</b> 選單', '選<b>安裝應用程式</b>或<b>加到主畫面</b>', '按<b>安裝</b>，桌面就會出現小湘收集器'],
  other: ['打開瀏覽器選單', '找<b>安裝</b>或<b>加到主畫面</b>', '照著提示完成就好'],
};
function openInstall(auto = false) {
  const prompt = install.canPrompt();
  const steps = $('install-steps');
  steps.hidden = prompt;
  steps.innerHTML = prompt ? '' : INSTALL_STEPS[install.platform()].map(t => `<li>${t}</li>`).join('');
  $('install-go').textContent = prompt ? '放到主畫面' : '知道了';
  $('install-later').hidden = !auto && !prompt;
  if (!$('install-dialog').open) $('install-dialog').showModal();
}
$('open-install').addEventListener('click', () => {
  $('function-center').close();
  if (install.isInstalled()) { toast('小湘收集器已經在主畫面上了！'); return; }
  openInstall();
});
$('install-go').addEventListener('click', async () => {
  if (!install.canPrompt()) { $('install-dialog').close(); return; }
  const outcome = await install.promptInstall();
  $('install-dialog').close();
  if (outcome === 'dismissed') install.snooze();
});
$('install-later').addEventListener('click', () => { install.snooze(); $('install-dialog').close(); });
$('install-dialog').addEventListener('cancel', () => install.snooze());
let installTries = 0;
function maybeOfferInstall() {
  if (!install.canPrompt() || install.isInstalled() || install.snoozed()) return;
  if (!state.seenIntro || document.querySelector('dialog[open]')) { if (installTries++ < 24) setTimeout(maybeOfferInstall, 5000); return; }
  openInstall(true);
}
install.onChange(type => {
  if (type === 'available') setTimeout(maybeOfferInstall, 1500);
  if (type === 'installed') { if ($('install-dialog').open) $('install-dialog').close(); toast('小湘收集器放到主畫面囉！之後點圖示就能打開～'); }
});
if (install.isInstalled()) $('open-install').hidden = true;

// ── 派小湘出門
var errandChoice = null; // { place } 或 { task }
var errandPicked = [];
var announcedBack; // var：renderAll 在檔案尾端宣告之前就會跑
function siangImg(no, cls = '') {
  const img = document.createElement('img'); img.alt = CHARACTERS[no].name; img.draggable = false; if (cls) img.className = cls;
  loadWithFallback(img, characterSources(CHARACTERS[no].image)); return img;
}
function tripCard(entry) {
  const card = document.createElement('div'); card.className = 'trip-card'; card.dataset.place = entry.place || 'home';
  const bg = document.createElement('img'); bg.className = 'trip-card__img'; bg.alt = ''; bg.src = `assets/places/${entry.place}.webp`; bg.onerror = () => bg.remove();
  const who = document.createElement('div'); who.className = 'trip-card__who'; who.append(...entry.nos.map(no => siangImg(no)));
  const tag = document.createElement('span'); tag.className = 'trip-card__tag'; tag.textContent = `${PLACES[entry.place]?.emoji || ''} ${PLACES[entry.place]?.name || ''}`;
  card.append(bg, who, tag);
  if (entry.story) { const st = document.createElement('span'); st.className = 'trip-card__story'; st.textContent = '📖'; card.append(st); }
  return card;
}
function renderErrandBadge() {
  const owned = Object.keys(state.dex || {}).length;
  $('home-errand').hidden = !owned;
  const back = returned(state).length;
  $('errand-badge').hidden = !back; $('errand-badge').textContent = back;
  $('home-errand').classList.toggle('is-back', back > 0);
  for (const e of returned(state)) {
    announcedBack ||= new Set();
    if (announcedBack.has(e.id)) continue; announcedBack.add(e.id);
    const names = e.nos.map(no => CHARACTERS[no].name).join('和');
    toast(e.place ? `${names}從${PLACES[e.place].name}回來了！點「出門」收下她帶的東西。` : `${names}的「${HOME_TASKS[e.task].name}」做好了！`);
  }
}
function renderErrands() {
  const er = state.errands;
  const now = Date.now();
  $('errand-active').replaceChildren(...er.active.map(e => {
    const row = document.createElement('div'); const back = isBack(e, now); row.className = `errand-trip${back ? ' is-back' : ''}`;
    const who = document.createElement('div'); who.className = 'errand-trip__who'; who.append(...e.nos.map(no => siangImg(no)));
    const text = document.createElement('div'); const b = document.createElement('b'); const small = document.createElement('small');
    const names = e.nos.map(no => CHARACTERS[no].name).join('和');
    b.textContent = e.place ? `${names}去${PLACES[e.place].name}` : `${names}在${HOME_TASKS[e.task].name}`;
    small.textContent = back ? '回來了！' : `還要 ${fmtLeft(e, now)}`;
    text.append(b, small); row.append(who, text);
    if (back) { const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn'; btn.textContent = '收下'; btn.addEventListener('click', () => void collectErrand(e.id)); row.append(btn); }
    return row;
  }));
  const full = er.active.length >= ERRAND_SLOTS;
  const placeBtn = (key, info, kind) => {
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'errand-place';
    btn.setAttribute('aria-pressed', String(errandChoice?.[kind] === key)); btn.disabled = full;
    btn.innerHTML = `<span aria-hidden="true">${info.emoji}</span>${info.name}<small>${info.hours} 小時</small>`;
    btn.addEventListener('click', () => { errandChoice = { [kind]: key }; errandPicked = []; $('errand-status').textContent = ''; renderErrands(); $('errand-pick').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    return btn;
  };
  $('errand-places').replaceChildren(...Object.entries(PLACES).map(([k, v]) => placeBtn(k, v, 'place')));
  $('errand-tasks').replaceChildren(...Object.entries(HOME_TASKS).map(([k, v]) => placeBtn(k, v, 'task')));
  $('errand-status').textContent = full && !$('errand-status').textContent ? `同時最多 ${ERRAND_SLOTS} 趟，等她們回來再派吧。` : $('errand-status').textContent;
  // 選小湘
  const pick = $('errand-pick'); pick.hidden = !errandChoice || full;
  if (errandChoice && !full) {
    const place = errandChoice.place; const max = place ? 2 : 1;
    const info = place ? PLACES[place] : HOME_TASKS[errandChoice.task];
    const fav = place ? info.affinity.map(sr => SERIES[sr]?.short).filter(Boolean).join('、') : '';
    const story = storyFor(errandPicked);
    $('errand-pick-hint').textContent = place
      ? `${info.emoji} ${info.name}（${info.hours} 小時）：選 1～2 位。★ 是${fav}系列，特別喜歡這裡，帶回的東西更多。${place === 'faraway' ? '縣市小湘遠行會帶回家鄉明信片，偶爾撿到沒去過的縣市蛋。' : ''}${errandPicked.length === 2 ? (story ? (state.errands.stories[story.id] ? `（這組會發生「${story.title}」）` : '（這組好像會發生什麼事…）') : '' ) : ''}`
      : `${info.emoji} ${info.name}（${info.hours} 小時）：${info.desc}。選一位。`;
    const busy = busyNos(state);
    const owned = Object.keys(CHARACTERS).filter(no => state.dex[no]);
    owned.sort((a, b) => (place ? Number(hasAffinity(place, b)) - Number(hasAffinity(place, a)) : 0));
    $('errand-siangs').replaceChildren(...owned.map(no => {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'errand-siang';
      btn.setAttribute('aria-pressed', String(errandPicked.includes(no)));
      btn.disabled = busy.has(no);
      btn.append(siangImg(no), Object.assign(document.createElement('span'), { textContent: busy.has(no) ? '忙碌中' : CHARACTERS[no].name.replace(/小湘.*/, '') || CHARACTERS[no].name }));
      if (place && hasAffinity(place, no)) btn.append(Object.assign(document.createElement('i'), { className: 'star', textContent: '★' }));
      btn.addEventListener('click', () => {
        if (errandPicked.includes(no)) errandPicked = errandPicked.filter(x => x !== no);
        else errandPicked = max === 1 ? [no] : [...errandPicked, no].slice(-max);
        renderErrands();
      });
      return btn;
    }));
    $('errand-go').disabled = !errandPicked.length;
    $('errand-go').textContent = place ? (errandPicked.length === 2 ? '一起出發' : '出發') : '拜託你了';
  }
  // 相簿與收藏
  const counties = Object.keys(state.errands.cards).length;
  $('errand-collection').textContent = `旅行故事 ${Object.keys(er.stories).length} / ${STORIES.length} · 家鄉明信片 ${counties} / ${Object.keys(COUNTY_CHARACTER).length} · 一共出門 ${er.total} 次`;
  $('errand-album').replaceChildren(...(er.album.length ? er.album.map(entry => {
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'trip-card-btn'; btn.style.cssText = 'border:0;padding:0;background:none;color:inherit';
    btn.append(tripCard(entry)); btn.setAttribute('aria-label', `${entry.nos.map(no => CHARACTERS[no].name).join('和')}去${PLACES[entry.place]?.name}`);
    btn.addEventListener('click', () => showErrandResult({ ...entry, names: entry.nos.map(no => CHARACTERS[no].name).join('和') }, true));
    return btn;
  }) : [Object.assign(document.createElement('p'), { className: 'residents-intro', textContent: '還沒有旅行照片，派小湘出門看看吧！' })]));
}
function openErrands() {
  errandChoice = null; errandPicked = []; $('errand-status').textContent = '';
  renderErrands();
  if (!$('errand-dialog').open) { $('errand-dialog').showModal(); syncRoomActivity(); }
}
function showErrandResult(r, replay = false) {
  $('errand-result-card').replaceChildren(r.place ? tripCard(r) : Object.assign(document.createElement('div'), { className: 'trip-card', style: 'background:linear-gradient(160deg,#6a5a7a,#2a2236)' }));
  if (!r.place) $('errand-result-card').firstChild.append(Object.assign(document.createElement('div'), { className: 'trip-card__who' }));
  if (!r.place) $('errand-result-card').querySelector('.trip-card__who').append(...r.nos.map(no => siangImg(no)));
  $('errand-result-eyebrow').textContent = replay ? new Date(r.at).toLocaleDateString('zh-TW') : 'WELCOME BACK';
  $('errand-result-title').textContent = r.place ? `${r.names}從${PLACES[r.place].name}回來了` : `${r.names}的${HOME_TASKS[r.task].name}完成了`;
  $('errand-result-line').textContent = r.place ? `「${r.line}」${r.boost ? '她好像特別喜歡那裡。' : ''}` : '';
  $('errand-result-story').hidden = !r.story;
  if (r.story) { $('errand-story-title').textContent = `📖 ${r.story.title}${r.storyFirst ? '（新故事！）' : ''}`; $('errand-story-text').textContent = r.story.text; }
  $('errand-result-gains').replaceChildren(...(r.gains || []).map(g => Object.assign(document.createElement('li'), { textContent: g })));
  $('errand-result-ok').textContent = replay ? '關閉' : '收下';
  $('errand-result').showModal();
}
async function collectErrand(id) {
  const t = await updateState(current => collect(current, id, { eggs: EGGS }));
  state = t.state;
  if (!t.result) { renderErrands(); return; }
  renderAll(); renderErrands(); restart($('chip-energy'), 'is-bump');
  showErrandResult(t.result);
  if (t.result.nos.some(no => room.residents().includes(no))) { room.happy(t.result.nos[0]); room.hearts(t.result.nos[0], 5); }
}
$('errand-go').addEventListener('click', async () => {
  if (!errandChoice || !errandPicked.length) return;
  const choice = { ...errandChoice, nos: [...errandPicked] };
  const t = await updateState(current => { const r = depart(current, choice); return typeof r === 'string' ? { error: r } : { errand: r }; });
  state = t.state;
  if (t.result.error) { $('errand-status').textContent = t.result.error; return; }
  const e = t.result.errand; const names = e.nos.map(no => CHARACTERS[no].name).join('和');
  errandChoice = null; errandPicked = [];
  $('errand-status').textContent = e.place ? `${names}出發去${PLACES[e.place].name}了！${fmtLeft(e)}後回來。` : `${names}開始${HOME_TASKS[e.task].name}了，${fmtLeft(e)}後完成。`;
  renderAll(); renderErrands();
});
$('home-errand').addEventListener('click', openErrands);
$('open-errands').addEventListener('click', () => { $('function-center').close(); openErrands(); });
$('close-errands').addEventListener('click', () => $('errand-dialog').close());
$('errand-dialog').addEventListener('close', syncRoomActivity);
$('errand-result-ok').addEventListener('click', () => $('errand-result').close());
setInterval(() => { if (!document.hidden) { renderErrandBadge(); if ($('errand-dialog').open) renderErrands(); } }, 30 * 1000);

// ── 更新通知
const updateWatcher = watchForUpdates(() => { $('update-pill').hidden = false; buzz([10, 30, 10]); });
$('update-pill').addEventListener('click', () => location.reload());
window.__checkUpdates = updateWatcher.check; // 給測試用
const isReturning = () => state.hatched > 0 || Object.keys(state.dex || {}).length > 0;
noteNewPlayer(isReturning());
async function showWhatsNew(tries = 0) {
  if (navigator.webdriver && !window.__testWhatsNew) return; // 自動化測試不跳更新內容
  const list = await loadChangelog();
  const fresh = unseen(list, { returning: isReturning() });
  if (!fresh.length) return;
  if (!state.seenIntro || document.querySelector('dialog[open]')) { if (tries < 30) setTimeout(() => void showWhatsNew(tries + 1), 4000); return; }
  $('whats-new-list').replaceChildren(...fresh.map(entry => {
    const box = document.createElement('section'); box.className = 'whats-new__entry';
    const h = document.createElement('h3'); h.textContent = entry.title ? `${entry.title}` : entry.version;
    const date = document.createElement('small'); date.textContent = entry.date || entry.version;
    const ul = document.createElement('ul'); ul.append(...entry.items.map(t => Object.assign(document.createElement('li'), { textContent: t })));
    box.append(date, h, ul); return box;
  }));
  $('whats-new').showModal();
  $('whats-new-ok').onclick = () => { markSeen(list); $('whats-new').close(); };
  $('whats-new').addEventListener('cancel', () => markSeen(list), { once: true });
}
setTimeout(() => void showWhatsNew(), 1500);
