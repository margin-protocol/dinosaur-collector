import { featureIcon } from './ui-icons.js';
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
import { HERO_SHOP } from './badge-heroes.js';
import { createAmbience, startChats, attachSnackDrag } from './home-life.js';
import { photoHash, similarPhoto } from './photo-hash.js';
import { compressPhoto, thumbnail, DATE_CODE } from './commissions.js';
import { offersFor, pickable, exchange, pickCost, cheapestPick, PICK_COSTS } from './fossils.js';
import { FLAVORS, makeOffer, eggLabel, naughtyRequest, NAUGHTY_BONUS } from './egg-traits.js';
import { ACHIEVEMENT_GROUPS, achievementStatus, claimAchievement } from './achievements.js';
import { RECIPES, tickRecipes, recipeDue, nightKey } from './recipes.js';
import { ensureBingo, bingoStatus, bingoReady, claimBingo, REWARDS as BINGO_REWARDS } from './bingo.js';
import { PASSIVE, SNAP, DAILY_GIFT, accruePassive, giftReady, claimGift, snapsToday, takeSnap, greet, pet, feedSnack, snacksLeft, PET, SNACK, photoSeen, rememberPhoto } from './energy.js';
import { checkIn } from './travel.js';
import { cloudConfig, saveCloudConfig, createCloud } from './cloud.js';
import { verifySigned, normalizeCode, sha256Hex } from './sign.js';
import { REVIEWER_PUBLIC_JWK } from './reviewer-key.js';
import { applyReward, validReward, describeReward } from './gifts.js';
import { WEATHER_LINES } from './weather-lines.js';
import { RECIPE_LINES } from './recipe-lines.js';
import { FRIEND_LINES } from './friend-lines.js';
import { NAP_LINES } from './nap-lines.js';
import { createPhotoBooth } from './photo-booth.js';
import { DEVTEAM_LINES, DUCK_DROP_LINE, DEVTEAM_EVENT } from './devteam-lines.js';
import * as devteam from './devteam.js';
import { EXTRA_LINES } from './extra-lines.js';
import { fetchWeather, recordWeather, isNight, rainingToday, weatherBoosts, KIND_NAMES, RAIN_BOOST, NIGHT_BOOST } from './weather.js';
import { loadCounties, countyAt, spotAt, currentPosition, geoPermission } from './geo.js';
import { createRoom, residentsFor, saveResidents, welcomeResident, ROOM_KEY, ROOM_LIMIT } from './room.js';
import { WISH_REWARD, PASS_RATIO, WISH_POOL, todayKey, analyzePhoto, photoStats, judge, actProgress, quizReply, isPhotoWish, inWindow } from './wishes.js';
import { createMissions } from './missions.js';
import { createResearch } from './research.js';
import { studyPair } from './research-notes.js';
import { DAILY_XP, GROWTH_XP, GROWTH_ENERGY, XP_PER_LEVEL, playerLevel, rankTitle, ensureDaily, completeDaily, growthGoals, goalProgress, claimGrowth, describeChapterReward, todaysWishList } from './progression.js';
import * as install from './install.js';
import { PLACES, HOME_TASKS, STORIES, ERRAND_SLOTS, depart, collect, busyNos, awayNos, returned, isBack, hasAffinity, storyFor, fmtLeft } from './errands.js';
import { watchForUpdates, loadChangelog, unseen, markSeen, noteNewPlayer } from './updates.js';
import { SEGMENTS, STAKES, WHEEL_SPINS, spin as spinWheel, spinsLeft } from './wheel.js';
import { gain as gainBond, homeTick, bondInfo, bondText, LEVELS, MAX_LEVEL, UNLOCK_LABEL, DAILY_CAP, GAIN as BOND_GAIN, describeLevelReward } from './affection.js';
const GAIN_ERRAND = BOND_GAIN.errand;
import * as battle from './battle.js';
import { battleArchive, bondArchive, travelArchive } from './archive.js';
import { REVIEW_LABEL } from './gugu-reviews.js';
import * as guide from './guide.js';
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

// 開遊戲的第一次存檔：順便結算「住在首頁的小湘每天 ♡+2」，不另外多存一次
const initialSave = await updateState(current => ({ homeBond: homeTick(current, residentsFor(current.dex), todayKey()) }));
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

const wishBook = createMissions({ book: $('book'), steps: $('book-gems'), onShoot: (wish, file) => onPhoto(wish, file), onClaim: (wish, choice) => onClaimWish(wish, choice), onSelect: renderWishCompanion });
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
// 狂戳小湘：3 秒內戳到第 5 下就會抗議，抗議期間的戳戳不算數（愛要緩慢給予）
const POKE_WINDOW = 3000, POKE_LIMIT = 5, POKE_COOLDOWN = 2500;
const pokes = new Map();
function tooManyPokes(no, now = Date.now()) {
  const p = pokes.get(no) || { times: [], until: 0 };
  if (now < p.until) { pokes.set(no, p); return 'cooldown'; }
  p.times = p.times.filter(t => now - t < POKE_WINDOW); p.times.push(now);
  if (p.times.length >= POKE_LIMIT) { p.times = []; p.until = now + POKE_COOLDOWN; pokes.set(no, p); return 'angry'; }
  pokes.set(no, p); return '';
}
// 開發團隊三寶有自己的戳戳台詞：連續戳（每下間隔 1.5 秒內）第 1／3／5／10 下各說一句
const streaks = new Map();
function pokeStreak(no, now = Date.now()) {
  const s = streaks.get(no) || { n: 0, at: 0 };
  s.n = now - s.at < 1500 ? s.n + 1 : 1; s.at = now; streaks.set(no, s); return s.n;
}
const room = createRoom($('resident-lanes'), character => {
  const streak = pokeStreak(character.no);
  const dev = DEVTEAM_LINES[character.no];
  const poke = tooManyPokes(character.no);
  if (dev) {
    // 崩潰德寶連戳到第 5 下：小鴨掉下來（湘定稿台詞），第 5 句一般台詞改到第 7 下
    const line = character.no === '087' && streak === 5 ? DUCK_DROP_LINE : character.no === '087' && streak === 7 ? dev.poke[5] : (character.no === '087' && streak === 5) ? null : dev.poke[streak];
    if (character.no === '087' && streak === 5) { room.duck(character.no); buzz([30, 40, 30]); }
    if (line) room.bubble(character.no, line, 3200);
    if (poke) { room.squish(character.no); return; }
    if (line && streak > 1) return; // 連戳時只說戳戳台詞
  } else if (poke) {
    room.squish(character.no);
    if (poke === 'angry') { room.bubble(character.no, '不要戳啦！！！小湘要扁掉了૮₍˃⤙˂₎ა\n愛要緩慢給予！', 3200); buzz([30, 40, 30]); }
    return;
  }
  say(character.line, 'happy', 4000);
  room.peek(character.no, no => openDexDetail(no));
  // 點一下 = 打招呼，也算摸摸頭一次（很多人是用點的，不是用滑的）
  void updateState(current => ({ greet: greet(current, character.no, todayKey()), pet: pet(current, todayKey()), bond: gainBond(current, character.no, 'tap', todayKey()) })).then(t => {
    state = t.state;
    const { greet: g, pet: pt, bond } = t.result;
    const heart = bond.added ? ` · ♡+${bond.added}` : '';
    if (g) { renderResources(); restart($('chip-energy'), 'is-bump'); toast(`${character.name}很開心！+${g + pt} 能量${heart}`); }
    else if (pt) { renderResources(); restart($('chip-energy'), 'is-bump'); toast(`摸摸頭 +${pt} 能量${heart}`); }
    else if (bond.added) toast(`${character.name} ♡+${bond.added}（好感度 ${bondInfo(state, character.no, todayKey()).pts}）`);
    else bondCapNotice(character.no);
    if (bond.up.length) queueBondUps([{ no: character.no, up: bond.up }]);
    const task = state.dino.task;
    if (task?.type === 'greet' && task.target === character.no) void finishTask();
  });
}, character => {
  room.bubble(character.no, PET_LINES[Math.floor(Math.random() * PET_LINES.length)]);
  void updateState(current => ({ energy: pet(current, todayKey()), bond: gainBond(current, character.no, 'pet', todayKey()) })).then(t => {
    state = t.state;
    const { energy, bond } = t.result; const heart = bond.added ? ` · ♡+${bond.added}` : '';
    if (energy) { renderResources(); restart($('chip-energy'), 'is-bump'); toast(`摸摸頭 +${energy} 能量${heart}`); }
    else if (bond.added) toast(`${character.name} ♡+${bond.added}（好感度 ${bondInfo(state, character.no, todayKey()).pts}）`);
    else bondCapNotice(character.no);
    if (bond.up.length) queueBondUps([{ no: character.no, up: bond.up }]);
  });
});
const research = createResearch({
  root: $('research-root'), getState: loadState,
  onCollect: () => showView('incubate'),
  onStudy: async ([a, b]) => {
    const transaction = await updateState(current => studyPair(current, a, b));
    state = transaction.state;
    renderAll();
    return { state: transaction.state, result: transaction.result };
  },
});

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
  return todaysWishList(state).map(w => ({ ...w, date: state.wishes.date, done: state.wishes.done.includes(w.id), progress: actProgress(w, state), copy: presenterCopy(w, state.wishes.date, state.wishes.stage, id, state.dex) }));
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
  const pourAll = Math.max(0, Math.min(state.energy, egg.warmthNeeded - state.egg.warmth));
  $('feed-all').hidden = ready || Boolean(state.eggOffer);
  $('feed-all').disabled = busy || pourAll <= 0;
  $('feed-all-amount').textContent = pourAll > 0 ? `（${pourAll} 能量）` : '（沒有能量了）';
  $('incubator-status').textContent = ['安靜生長中', '感受到小小的動靜', '生命正在甦醒', '快要見面了', '準備好相遇了'][s];
  $('incubation-message').textContent = ['裡面的小小生命，正做著柔軟的夢。', '好像聽見了你的聲音，輕輕回應了一下。', '細小的裂痕裡，藏著即將到來的相遇。', '再一點點溫暖，就能見到你了。', '牠已經準備好了。一起迎接新夥伴吧。'][s];
  $('incubation-percent').textContent = `${Math.round(pct)}%`;
  const omens = [];
  if (egg.pool) {
    if (rainingToday(state, todayKey()) && egg.pool[RAIN_BOOST.no]) omens.push('今天下雨了……雨傘小湘好像比較容易出現');
    if (isNight() && egg.pool[NIGHT_BOOST.no]) omens.push('深夜了……好像有誰還醒著（夜貓小湘比較容易出現）');
    if (egg.id === 'weather') for (const b of weatherBoosts(state, todayKey())) if (egg.pool[b.no]) omens.push(`${b.hint}${CHARACTERS[b.no].name}比較容易出現`);
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

  const away = new Set([...awayNos(state), ...(state.battle?.active || []).filter(a => !battle.isBack(a)).flatMap(a => a.nos)]);
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
  } else if (state.energy >= 10 && !open.length) {
    text = '有能量了，有空再去培育室餵餵蛋吧。';
    mode = 'energy'; // 安靜的提示：不掛驚嘆號
  } else if (open.length) {
    // 先提現在做得到的願望；顏色願望用「想看○○的東西」，委託、主題、陪伴、小問題等新願望直接說它自己的台詞
    const hour = new Date().getHours(), who = state.dex['001'] ? '小湘' : '蛋';
    const w = open.find(x => !x.window || inWindow(x.window, hour));
    text = !w ? (open[0].kind === 'night' ? '剩下的願望要等晚上 7 點以後喔，晚點再來找我！' : '剩下的是早上的願望，今天的時間過了……明天早點來找我！')
      : w.color ? `${who}想看${w.color}的東西。` : w.line || `${who}還有一個願望，去「今日願望」看看！`;
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
    // 同一句話 10 分鐘內不再自己跳出來（小恐龍插話結束、畫面重畫時不會一直重播）
    const shown = bubbleShownAt.get(text) || 0;
    if (sayOverride || Date.now() - shown > 10 * 60 * 1000) { bubbleShownAt.set(text, Date.now()); openBubble(); }
  }
  // 對話框收起時，如果玩家有該處理的事，小恐龍頭上顯示驚嘆號；點過的同一件事不再顯示
  $('guide-alert').hidden = !alertWanted(mode, text);
  eggButton.setAttribute('aria-label', ready ? `讓${egg.name}破殼` : `幫${egg.name}注入能量，目前生命訊號 ${Math.round(pct)}%`);
}

// 對話框有事才出現：打開後依字數停留幾秒，自動收起
const bubbleShownAt = new Map();
let alertDismissed = '';
const ALERT_MODES = ['tap', 'gift', 'explore', 'wish', 'task-offer'];
function alertWanted(mode = $('guide').dataset.mode, text = $('bubble-text').textContent) {
  if ($('bubble').classList.contains('is-open') || sayOverride) return false;
  if (!ALERT_MODES.includes(mode)) return false;
  if (mode === 'tap' && !$('enter-incubator').classList.contains('is-ready')) return false;
  return alertDismissed !== `${mode}|${text}`;
}
function openBubble() {
  const bubble = $('bubble');
  bubble.classList.add('is-open');
  $('guide-alert').hidden = true;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    bubble.classList.remove('is-open');
    $('guide-alert').hidden = !alertWanted();
  }, 3200 + $('bubble-text').textContent.length * 120);
}

function guideAction() {
  const mode = $('guide').dataset.mode;
  alertDismissed = `${mode}|${$('bubble-text').textContent}`;
  $('guide-alert').hidden = true;
  if (mode === 'wish') showView('wish');
  else if (mode === 'tap' || mode === 'energy') showView('incubate');
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
  if (s.egg?.id === 'weather') boosts.push(...weatherBoosts(s, todayKey(now), now));
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
  const detailText = { ordinary: '隨時都能培育的蛋，隨機遇見各種小湘。', wish: '三個願望全部完成的日子各得一枚願望印記，集滿 3 枚換一顆。', weather: '每天第一次感應到天氣時取得（需允許定位），每天最多一顆、最多存 2 顆。孵化時，當天的天氣會讓對應的天氣小湘更容易出現：晴天、陰天、下雨、打雷、起霧、大風、下雪、冰雹；雨後放晴有彩虹、黃昏有夕陽；感應過 4 種天氣後，天氣觀測師也會來。', county: '每天第一次按「探索附近」都會收到一顆蛋，大多是當地的縣市蛋（固定孵出當地的小湘），偶爾是願望蛋或天氣蛋。第一次到新縣市一定是縣市蛋。', cipher: '輸入湘給的暗號、完成她的委託時取得。', keepsake: '節日、小湘生日、走遍臺灣時收到，固定孵出紀念的小湘。', date: '見面時掃描湘的約會 QR Code 取得，會遇見約會小湘或蝰蝰♡。' }[eggCategory];
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
    const detail = document.createElement('p'); detail.textContent = egg.id === 'origin' ? '固定遇見原味小湘' : egg.id === 'keepsake' ? '紀念特別日子的蛋，固定遇見那一天的小湘' : egg.id === 'cipher' ? '湘準備的驚喜，裡面也許是她指定的小湘' : egg.id === 'weather' ? `天氣的蛋，今天的天氣決定誰比較容易出現（${Object.keys(egg.pool).length} 種）` : egg.byCounty ? `固定遇見打卡縣市的小湘${current && state.egg.county ? `（${state.egg.county}）` : ''}` : `隨機遇見 ${Object.keys(egg.pool).length} 種小湘${egg.id === 'wish' ? '，R 與 SR 機率較高' : '，可能重複'}`;
    const cost = document.createElement('p'); cost.textContent = `孵化需要 ${egg.warmthNeeded} 能量`;
    const stock = eggStock(state, egg.id);
    const label = document.createElement('span'); label.className = 'egg-choice__state'; label.textContent = current ? '✓ 正在培育' : egg.id === 'origin' && firstHatched ? '首次相遇限定 · 已完成' : !firstHatched && egg.id !== 'origin' ? '首次孵化後解鎖' : egg.stocked && !stock ? '尚未持有' : shelfFull(state) ? '暫放架滿了，先孵完一顆' : state.egg.warmth > 0 ? '換這顆（目前的蛋會暫放）' : '選擇這顆蛋';
    content.append(title, detail, cost);
    if (egg.stocked) {
      const own = document.createElement('p'); own.className = 'egg-choice__stock';
      own.textContent = egg.id === 'wish'
        ? `持有 ${stock} 顆 · 願望印記 ${state.wishEgg?.stamps || 0} / ${WISH_STAMPS_PER_EGG}（三個願望全部完成的日子各得一枚）`
        : egg.id === 'weather' ? `持有 ${stock} 顆（每天第一次感應到天氣時取得）`
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
  if (has) {
    const b = bondInfo(state, c.no, todayKey());
    if (b.level > 1) { const tag = document.createElement('span'); tag.className = 'dex__bond'; tag.textContent = `♥ ${b.level}`; li.append(tag); }
    li.classList.toggle('is-shiny', b.max);
  }
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
  if (document.getElementById('bingo-badge')) { renderBingoBadge(); checkRecipes(); checkDevteam(); }
  if (document.getElementById('achievement-badge')) renderAchievementBadge();
  if (document.getElementById('dex-detail')) grantKeepsakes();
  if (document.getElementById('dino-task')) renderDinoTask();
  if (document.getElementById('letter-badge')) renderLetterBadge();
  if (document.getElementById('errand-badge')) renderErrandBadge();
  if (document.getElementById('wheel-badge')) renderWheelBadge();
  if (document.getElementById('today-pill')) { applyGates(); renderToday(); }
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
  if (['wish', 'incubate', 'dex'].includes(name)) setTimeout(() => showTip(name, document.querySelector(`.view[data-view="${name}"]`)), 50);
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

// 一鍵餵養：把需要的能量一次注入（最多注到可以破殼為止）
async function onFeedAll() {
  if (busy || state.eggOffer) return;
  busy = true;
  $('cultivate').disabled = true; $('feed-all').disabled = true;
  try {
    const transaction = await updateState(current => {
      const egg = EGGS[current.egg.id];
      const amount = Math.max(0, Math.min(current.energy, egg.warmthNeeded - current.egg.warmth));
      if (!amount) return { type: current.energy <= 0 ? 'empty' : 'full' };
      const before = stageOf(100 * current.egg.warmth / egg.warmthNeeded);
      current.energy -= amount; current.egg.warmth += amount; current.player.stats.fed += amount;
      return { type: 'feed', amount, before, after: stageOf(100 * current.egg.warmth / egg.warmthNeeded), ready: current.egg.warmth >= egg.warmthNeeded };
    });
    state = transaction.state;
    const result = transaction.result;
    if (result.type !== 'feed') { if (result.type === 'empty') toast('能量不足，完成今日願望就能繼續培育。'); return; }
    renderResources(); buzz([12, 30, 12]); restart($('chip-energy'), 'is-bump');
    incubator.press(); await flyOrb(); renderHome(); renderWishes(); incubator.feed(); showGain(`+${result.amount}`);
    if (result.after > result.before) celebrateStage(result.after);
    if (result.ready) toast('蛋已經準備好了！按「迎接新夥伴」破殼吧');
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
  if (st.from === 'badge') return `${date}，你用 ${st.cost} 枚討伐徽章，把她迎進了隊伍。`;
  const days = st.since && !Number.isNaN(Date.parse(st.since)) ? Math.max(0, Math.round((Date.parse(entry.at) - Date.parse(st.since)) / 864e5)) : null;
  const source = st.county ? `在${st.county}探索時收到的縣市蛋`
    : st.from?.startsWith('recipe:') ? '兩位小湘一起入住、偷偷準備的紀念蛋'
    : st.from?.startsWith('devteam:') ? '開發團隊悄悄送來的紀念蛋'
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
    let bondUp = [];
    if (duplicate) { current.fossils += DUPLICATE_FOSSILS; current.dex[character.no].dup = Math.min(battle.MAX_STARS, (current.dex[character.no].dup || 0) + 1); bondUp = gainBond(current, character.no, 'duplicate', todayKey()).up; }
    else current.dex[character.no] = { at: new Date().toISOString(), story: meetingStory(current) };
    current.hatched += 1; if (isNight()) current.bonus.total.nightHatch += 1; const resumed = current.shelf.shift(); current.egg = resumed || newEgg('ordinary'); current.eggOffer = resumed ? null : makeOffer();
    return { character, duplicate, bondUp };
  });
  state = transaction.state; eggView = null; sayOverride = null;
  if (transaction.result && !transaction.result.duplicate) welcomeResident(transaction.result.character.no, state.dex);
  if (transaction.result?.bondUp?.length) queueBondUps([{ no: transaction.result.character.no, up: transaction.result.bondUp }]);
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
  const hatchLine = WEATHER_LINES[c.no]?.hatch || RECIPE_LINES[c.no]?.hatch || FRIEND_LINES[c.no]?.hatch || NAP_LINES[c.no]?.hatch || DEVTEAM_LINES[c.no]?.hatch || EXTRA_LINES[c.no]?.hatch;
  $('reveal-line').textContent = hatchLine ? `「${hatchLine}」` : c.line;
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
  let verdict;
  try {
    const [stats] = await Promise.all([photoStats(file, $('photo-thumb')), sleep(700)]);
    verdict = judge(wish, stats, new Date());
  } catch {
    renderWishes();
    toast('這張照片讀不出來，再拍一次試試。');
    return;
  }
  if (!verdict.pass) {
    renderWishes();
    $('photo-fill').style.width = `${Math.min(100, Math.round((verdict.pct / Math.max(1, verdict.need)) * 100))}%`;
    $('photo-fill').style.background = wish.swatch;
    $('photo-title').textContent = verdict.title;
    $('photo-text').textContent = verdict.text;
    $('photo-ok').textContent = verdict.early ? '知道了' : '再試一次';
    $('photo').showModal();
    buzz(8);
    return;
  }

  // 先結算並存檔（只會執行這一次），之後才是動畫；動畫中途關掉也不會重複領獎
  if (photoDate !== todayKey()) { state = (await updateState(() => {})).state; renderAll(); toast('新的一天開始了，請重新選擇願望。'); return; }
  const photo = await freshPhoto(file);
  if (photo.duplicate) { renderWishes(); toast('這張照片今天已經用過了喔，換一張新的吧～'); return; }
  const transaction = await updateState(current => { const r = completeDaily(current, photoDate, wish.id); if (r.awarded && photo.hash) rememberPhoto(current, photo.hash, todayKey()); return r; });
  if (transaction.result.awarded && wish.kind === 'theme') saveAlbumPhoto(wish, photoDate);
  await celebrateWish(wish, transaction);
}

// 願望達成的演出（拍照、陪伴、小恐龍的問題共用）
async function celebrateWish(wish, transaction, extra = '') {
  state = transaction.state;
  if (!transaction.result.awarded) { renderAll(); return; }
  renderHome();
  renderWishes({ fresh: wish.id });
  restart($('book'), 'is-fresh');
  buzz([20, 40, 60]);

  await sleep(950);
  const gem = $('book-gems').querySelector('[aria-pressed="true"] .progress-gem');
  pageSparks(gem);
  toast(`${extra ? `${extra} · ` : ''}願望達成 · +${WISH_REWARD} 能量 · +${DAILY_XP} XP`);
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
$('feed-all').addEventListener('click', () => void onFeedAll());
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
  else { alertDismissed = `${$('guide').dataset.mode}|${$('bubble-text').textContent}`; openBubble(); }
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
  else if (result?.daily === 'county') { title = owned ? `${c.name}：又見面了！` : `${c.name}的蛋又出現了`; text = owned ? `「你又來${county}啦，這顆蛋送你，說不定會孵出新朋友喔。」` : '「快點把我孵出來嘛……」'; note = `今天的探索禮物：一顆「縣市蛋 · ${county}」，到「選擇蛋」把它拿出來吧。${owned ? '（已經有她了的話，孵出來會變成化石）' : ''}`; }
  else if (result?.daily === 'wish' || result?.daily === 'weather') { title = owned ? `${c.name}：又見面了！` : `${county}的訊號`; text = owned ? `「你又來${county}啦，我在路上撿到一顆蛋，給你！」` : '這附近好像有什麼東西在閃閃發光……'; note = `今天的探索禮物：一顆「${result.daily === 'wish' ? '願望蛋' : '天氣蛋'}」，到「選擇蛋」把它拿出來吧。`; }
  else if (owned) { title = `${c.name}：又見面了！`; text = `「你又來${county}啦，今天也一起走走吧。」明天再來探索，還會有一顆蛋喔。`; }
  else if (waiting) { title = `${c.name}還在蛋裡等你`; text = '「快點把我孵出來嘛……我已經準備好了！」'; }
  else { title = `${county}的訊號`; text = '這裡的小湘已經和你打過招呼了。'; }
  $('county-title').textContent = title;
  $('county-text').textContent = text;
  note = [note, weatherNote(weather)].filter(Boolean).join('\n');
  $('county-note').textContent = note;
  $('county-note').hidden = !note;
  $('county-go').hidden = !(result?.egg || result?.daily || weather?.egg);
  $('county-call').showModal(); syncRoomActivity();
}

// 查天氣（失敗就算了，不影響探索）；每天第一次感應到天氣送天氣蛋
async function checkWeather(pos) {
  let kind;
  try { kind = await fetchWeather(pos.lat, pos.lon); } catch { return null; }
  const transaction = await updateState(current => recordWeather(current, kind, todayKey()));
  state = transaction.state; renderAll();
  return transaction.result;
}
const WEATHER_GIFT = { rain: '外面在下雨，雨裡撿到一顆「天氣蛋」！', thunder: '外面在打雷！雷聲裡滾來一顆「天氣蛋」！', hail: '外面下冰雹了！冰塊堆裡有一顆「天氣蛋」！', snow: '外面在下雪！雪地裡撿到一顆「天氣蛋」！', fog: '外面起霧了，霧裡撿到一顆「天氣蛋」！', windy: '外面風好大，一顆「天氣蛋」被吹到你腳邊！', clear: '今天是晴天，陽光下撿到一顆「天氣蛋」！', cloudy: '今天陰陰的，窗邊多了一顆「天氣蛋」。' };
const weatherNote = (w) => (w?.egg ? `${w.rainbow ? '雨停了，天空出現彩虹！' : ''}${WEATHER_GIFT[w.kind] || '撿到一顆「天氣蛋」！'}到「選擇蛋」把它拿出來吧。` : '');
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
    if (!silent || transaction.result.egg || transaction.result.daily) showCountyCall({ county, result: transaction.result, weather });
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

/* ---------- 外出合照 ---------- */
const photoBooth = createPhotoBooth({ dialog: $('photo-dialog'), getState: () => state, onTaken: no => {
  void updateState(current => { current.player.stats.photos = (current.player.stats.photos || 0) + 1; return gainBond(current, no, 'photo', todayKey()); }).then(t => {
    state = t.state; const bond = t.result;
    if (bond.added) toast(`和${CHARACTERS[no].name}拍了合照！♡+${bond.added}`);
    if (bond.up.length) queueBondUps([{ no, up: bond.up }]);
  });
} });
$('open-photo').addEventListener('click', () => { $('function-center').close(); photoBooth.open(); });
$('dex-photo').addEventListener('click', () => { const no = $('dex-photo').dataset.no; $('dex-detail').close(); photoBooth.open(no); });

/* ---------- 焦點框：手指點不畫、鍵盤才畫 ---------- */
document.addEventListener('pointerdown', () => { document.documentElement.dataset.input = 'pointer'; }, { capture: true, passive: true });
document.addEventListener('keydown', (e) => { if (e.key === 'Tab') document.documentElement.dataset.input = 'keyboard'; }, { capture: true });

/* ---------- 開發團隊系列 ---------- */
let devteamBusy = false;
const DEVTEAM_GIFT = {
  '086': '有人抱著畫板敲門，留下一顆沾著顏料的蛋就跑了……「再畫一隻就好！」',
  '087': '門口出現一顆頭頂著小鴨的蛋，旁邊貼著便利貼：「這個也要做嗎？！」',
  '088': '一顆閃閃發光的蛋從天而降：「欸欸欸！我又想到一個！」',
};
function checkDevteam() {
  if (devteamBusy || !state.seenIntro) return;
  const ctx = { residents: residentsFor(state.dex), today: todayKey() };
  const due = devteam.devteamDue(state, ctx), ev = devteam.eventDue(state, ctx) && !document.querySelector('dialog[open]');
  if (!due && !ev) return;
  devteamBusy = true;
  void updateState(current => ({ tick: due ? devteam.tickDevteam(current, ctx) : { eggs: [], day: null }, show: ev ? devteam.rollEvent(current, ctx.today) : false })).then(t => {
    state = t.state; devteamBusy = false; renderAll();
    const { tick, show } = t.result;
    if (tick.eggs.length) { toast(`${DEVTEAM_GIFT[tick.eggs[0]]}到「選擇蛋」看看吧。`); say('好像有什麼特別的東西送來了！', 'cheer', 3500); }
    else if (tick.day) say(`加班皮寶和崩潰德寶好像在偷偷開會……（${tick.day} / ${devteam.NEED.days}）`, 'happy', 4500);
    if (show) showDevteamEvent();
  }, () => { devteamBusy = false; });
}
function showDevteamEvent() {
  const list = $('devteam-event-lines'); list.replaceChildren(); let i = 0;
  const next = () => {
    if (i < DEVTEAM_EVENT.lines.length) {
      const [who, text] = DEVTEAM_EVENT.lines[i++];
      const p = document.createElement('p'); p.className = who === '系統' ? 'devteam-line is-system' : 'devteam-line';
      if (who !== '系統') p.append(Object.assign(document.createElement('b'), { textContent: who }));
      p.append(document.createTextNode(text)); list.append(p); p.scrollIntoView({ block: 'nearest' });
      $('devteam-event-next').textContent = i < DEVTEAM_EVENT.lines.length ? '繼續 ›' : '……然後呢？';
    } else if (i === DEVTEAM_EVENT.lines.length) {
      i++; list.append(Object.assign(document.createElement('p'), { className: 'devteam-caption', textContent: DEVTEAM_EVENT.caption }));
      $('devteam-event-next').textContent = '關掉，讓她們睡覺';
    } else $('devteam-event').close();
  };
  $('devteam-event-next').onclick = next;
  $('devteam-event').showModal(); next();
}

/* ---------- 隱藏配方 ---------- */
let recipeBusy = false;
function checkRecipes() {
  if (recipeBusy || !state.seenIntro) return;
  const ctx = { residents: residentsFor(state.dex), raining: rainingToday(state, todayKey()), today: todayKey(), night: nightKey() };
  if (!recipeDue(state, ctx)) return;
  recipeBusy = true;
  void updateState(current => tickRecipes(current, ctx)).then(t => {
    state = t.state; recipeBusy = false; renderAll();
    const { progressed, completed } = t.result;
    if (completed.length) { toast(`🍰 ${completed.map(r => r.members.map(no => CHARACTERS[no].name).join('和')).join('、')}一起做出了驚喜！收到一顆紀念蛋，到「選擇蛋」看看吧。`); say('好像有什麼新的東西誕生了！', 'cheer', 3500); }
    else if (progressed.length) { const r = progressed[0]; say(`${r.members.map(no => CHARACTERS[no].name).join('和')}好像在偷偷準備什麼……（${state.recipes[r.id].days.length} / ${r.days}${r.night ? ' 個夜晚' : ''}）`, 'happy', 4500); }
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
  if (recipe) { const rec = state.recipes[recipe.id]; return `隱藏配方：${state.dex[c.no] || rec.days.length ? recipe.text : '某兩位小湘一起入住首頁，就會發生什麼……'}${rec.done ? '' : rec.days.length ? `（已累積 ${rec.days.length} / ${recipe.days} ${recipe.night ? '個夜晚' : recipe.rain ? '個下雨天' : '天'}）` : ''}`; }
  if (c.badge) { const h = battle.heroStatus(state, c.no); return `在討伐的「特訓與兌換」用 ${h.cost} 枚討伐徽章兌換${h.requireText ? `（${h.requireText}）` : ''}`; }
  if (c.no === '089') return state.dex[c.no] ? '湘考上研究所時，用暗號送給大家的紀念' : '湘有好消息的時候，會用暗號送給大家……';
  if (c.series === 'devteam') {
    const p = devteam.progress(state, c.no).map(x => `${x.label} ${Math.min(x.now, x.need)} / ${x.need}${x.unit || ''}`).join('、');
    return state.dex[c.no] ? '開發團隊限定：達成條件後收到紀念蛋' : `開發團隊限定：${p}`;
  }
  if (c.series === 'date') return '見面時掃描湘的約會 QR Code，取得約會蛋來孵';
  const eggs = Object.values(EGGS).filter(e => e.pool?.[c.no]).map(e => e.name);
  return eggs.length ? `${eggs.join('、')}可能孵出` : '特殊方式取得';
}
function openDexDetail(no) {
  const c = CHARACTERS[no];
  const owned = Boolean(state.dex[no]);
  const img = $('dex-detail-img');
  img.className = `dex-detail__img${owned ? '' : ' is-locked'}`; img.alt = owned ? c.name : '尚未收集的小湘';
  loadWithFallback(img, characterSources(c.image));
  $('dex-photo').hidden = !owned; $('dex-photo').dataset.no = no;
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
  renderBond(no, owned);
  if (owned) showTip('bond', $('dex-detail-bond'));
  $('dex-detail').classList.toggle('is-shiny', owned && bondInfo(state, no, todayKey()).max);
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
    btn.disabled = o.id === 'pick' ? state.fossils < cheapestPick(state, EGGS, CHARACTERS) : state.fossils < o.cost;
    const text = document.createElement('div'); const b = document.createElement('b'); b.textContent = o.name; const sm = document.createElement('small'); sm.textContent = o.desc; text.append(b, sm);
    const cost = document.createElement('span'); cost.textContent = o.from ? `${o.cost} 化石起` : `${o.cost} 化石`;
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
  $('fossil-status').textContent = offerId === 'slot' ? `蛋架擴充到 ${state.cradle.slots} 格！暫放架最前面的蛋也會一起保溫。` : offerId === 'energy' ? '換到 30 能量了！' : offerId === 'pick' ? `用 ${t.result.cost} 化石換到一顆暗號蛋，裡面是${CHARACTERS[no].name}！到「選擇蛋」把它拿出來吧。` : `換到${t.result.name}了！到「選擇蛋」把它拿出來吧。`;
  openFossils();
}
$('chip-fossil').addEventListener('click', openFossils);
$('close-fossil').addEventListener('click', () => $('fossil-dialog').close());
$('fossil-dialog').addEventListener('close', syncRoomActivity);
$('fossil-offers').addEventListener('click', event => {
  const btn = event.target.closest('[data-offer]'); if (!btn || btn.disabled) return;
  if (btn.dataset.offer !== 'pick') { void doExchange(btn.dataset.offer); return; }
  const list = pickable(state, EGGS, CHARACTERS);
  $('fossil-pick-list').replaceChildren(...['N', 'R', 'SR', 'SSR'].flatMap(r => {
    const nos = list.filter(no => CHARACTERS[no].rarity === r); if (!nos.length) return [];
    const head = document.createElement('p'); head.className = 'fossil-pick-tier'; head.textContent = `${r} · 每位 ${PICK_COSTS[r]} 化石${state.fossils < PICK_COSTS[r] ? `（還差 ${PICK_COSTS[r] - state.fossils}）` : ''}`;
    return [head, ...nos.map(no => {
      const c = CHARACTERS[no]; const b = document.createElement('button'); b.type = 'button'; b.className = 'fossil-pick'; b.dataset.pick = no;
      b.disabled = state.fossils < pickCost(CHARACTERS, no);
      const img = document.createElement('img'); img.alt = ''; loadWithFallback(img, characterSources(c.image));
      b.append(img, `No.${c.no} · ${pickCost(CHARACTERS, no)}`); return b;
    })];
  }));
  $('fossil-pick').hidden = false;
  $('fossil-pick').scrollIntoView({ block: 'nearest' });
});
$('fossil-pick-list').addEventListener('click', event => { const b = event.target.closest('[data-pick]'); if (b && !b.disabled) void doExchange('pick', b.dataset.pick); });

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
    const t = await updateState(current => { const energy = feedSnack(current, todayKey()); return { energy, bond: energy ? gainBond(current, no, 'snack', todayKey()) : null }; });
    state = t.state; renderAll();
    if (!t.result.energy) { toast('今天的布丁吃完了，明天再來～'); return; }
    if (t.result.bond?.up.length) queueBondUps([{ no, up: t.result.bond.up }]);
    room.happy(no); room.hearts(no, 6); room.bubble(no, ['布丁好好吃！謝謝你～', '是我最喜歡的焦糖口味！', '再一口……就一口！'][Math.floor(Math.random() * 3)]);
    restart($('chip-energy'), 'is-bump'); toast(`${CHARACTERS[no].name}吃得好開心！+${t.result.energy} 能量${t.result.bond?.added ? ` · ♡+${t.result.bond.added}` : ''}`);
  },
});

setupThemes({ onOpen: syncRoomActivity });
for (const id of ['home-errand', 'open-errands']) $(id).querySelector('svg')?.replaceWith(featureIcon('errand'));
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
  const battlesBack = (state.battle?.active || []).filter(a => battle.isBack(a)).length;
  const back = returned(state).length + battlesBack;
  $('errand-badge').hidden = !back; $('errand-badge').textContent = back;
  $('battle-tab-badge').hidden = !battlesBack; $('battle-tab-badge').textContent = battlesBack;
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
    const busy = new Set([...busyNos(state), ...battle.battleNos(state)]);
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
  showTip('errand', $('errand-pane'));
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
  $('errand-result').showModal(); $('errand-result').scrollTop = 0;
}
async function collectErrand(id) {
  const t = await updateState(current => {
    const r = collect(current, id, { eggs: EGGS });
    if (r) {
      const today = todayKey();
      r.bondUps = r.nos.map(no => ({ no, up: [...gainBond(current, no, 'errand', today).up, ...(r.story ? gainBond(current, no, 'story', today).up : [])] })).filter(x => x.up.length);
      r.gains = [...r.gains, `${r.nos.length > 1 ? '每位' : ''}好感度 ♡+${GAIN_ERRAND + (r.story ? 2 : 0)}`];
    }
    return r;
  });
  state = t.state;
  if (!t.result) { renderErrands(); return; }
  renderAll(); renderErrands(); restart($('chip-energy'), 'is-bump');
  showErrandResult(t.result);
  if (t.result.bondUps?.length) queueBondUps(t.result.bondUps);
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
$('open-battle').addEventListener('click', () => { $('function-center').close(); openErrands(); showErrandTab('battle'); });
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
function fillWhatsNew(entries, freshVersions = new Set()) {
  $('whats-new-list').replaceChildren(...entries.map(entry => {
    const box = document.createElement('section'); box.className = `whats-new__entry${freshVersions.has(entry.version) ? ' is-new' : ''}`;
    const h = document.createElement('h3'); h.textContent = entry.title ? `${entry.title}` : entry.version;
    const date = document.createElement('small'); date.textContent = `${entry.date || entry.version}${freshVersions.has(entry.version) ? ' · NEW' : ''}`;
    const ul = document.createElement('ul'); ul.append(...entry.items.map(t => Object.assign(document.createElement('li'), { textContent: t })));
    box.append(date, h, ul); return box;
  }));
}
async function showWhatsNew(tries = 0) {
  if (navigator.webdriver && !window.__testWhatsNew) return; // 自動化測試不跳更新內容
  const list = await loadChangelog();
  const fresh = unseen(list, { returning: isReturning() });
  $('updates-new').hidden = !fresh.length;
  if (!fresh.length) return;
  if (!state.seenIntro || document.querySelector('dialog[open]')) { if (tries < 30) setTimeout(() => void showWhatsNew(tries + 1), 4000); return; }
  $('whats-new-title').textContent = '更新了什麼';
  fillWhatsNew(fresh);
  $('whats-new').showModal();
  $('whats-new-ok').onclick = () => { markSeen(list); $('updates-new').hidden = true; $('whats-new').close(); };
  $('whats-new').addEventListener('cancel', () => { markSeen(list); $('updates-new').hidden = true; }, { once: true });
}
// 研究者手記「更新紀錄」：隨時翻看全部更新，還沒看過的標 NEW
$('open-updates').addEventListener('click', async () => {
  $('function-center').close();
  let list = [];
  try { list = await loadChangelog(); } catch {}
  const fresh = new Set(unseen(list, { returning: isReturning() }).map(e => e.version));
  $('whats-new-title').textContent = '更新紀錄';
  if (list.length) fillWhatsNew(list, fresh);
  else $('whats-new-list').replaceChildren(Object.assign(document.createElement('p'), { textContent: '更新紀錄暫時讀不到，等一下再試試看。' }));
  $('whats-new').showModal(); $('whats-new').scrollTop = 0;
  const done = () => { if (list.length) markSeen(list); $('updates-new').hidden = true; };
  $('whats-new-ok').onclick = () => { done(); $('whats-new').close(); };
  $('whats-new').addEventListener('cancel', done, { once: true });
});
setTimeout(() => void showWhatsNew(), 1500);

// ── 不用拍照的願望（陪伴、小恐龍的問題）
let claimWishBusy = false;
async function onClaimWish(wish, choice) {
  if (claimWishBusy || wish.date !== todayKey()) return;
  claimWishBusy = true;
  try {
    const transaction = await updateState(current => completeDaily(current, wish.date, wish.id));
    if (!transaction.result.awarded) { state = transaction.state; renderAll(); if (wish.kind === 'act') toast('還沒完成喔，再加油一下！'); return; }
    const reply = wish.kind === 'quiz' ? quizReply(wish, choice) : '';
    if (reply) say(reply, 'happy', 5000);
    await celebrateWish(wish, transaction, reply ? `小恐龍：「${reply}」` : '');
  } finally { claimWishBusy = false; state = loadState(); renderAll(); }
}

// ── 每日相簿：主題照片的小縮圖，只存在這支手機
const ALBUM_KEY = 'siang-collector:daily-album:v1';
const ALBUM_MAX = 60;
function loadAlbum() { try { const list = JSON.parse(localStorage.getItem(ALBUM_KEY) || '[]'); return Array.isArray(list) ? list : []; } catch { return []; } }
function saveAlbumPhoto(wish, date) {
  try {
    const src = $('photo-thumb'); const c = document.createElement('canvas'); c.width = c.height = 200;
    c.getContext('2d').drawImage(src, 0, 0, 200, 200);
    const list = loadAlbum().filter(e => !(e.date === date && e.id === wish.id));
    list.unshift({ id: wish.id, date, title: wish.hint, img: c.toDataURL('image/jpeg', 0.72) });
    localStorage.setItem(ALBUM_KEY, JSON.stringify(list.slice(0, ALBUM_MAX)));
  } catch { /* 空間不夠就算了，不影響願望 */ }
}
function openAlbum() {
  const list = loadAlbum();
  $('album-grid').replaceChildren(...(list.length ? list.map(e => {
    const fig = document.createElement('figure'); fig.className = 'album-item';
    const img = document.createElement('img'); img.src = e.img; img.alt = e.title;
    const cap = document.createElement('figcaption'); cap.innerHTML = `<b></b><small></small>`;
    cap.querySelector('b').textContent = e.title.replace(/^拍/, ''); cap.querySelector('small').textContent = e.date.slice(5).replace('-', '/');
    fig.append(img, cap); return fig;
  }) : [Object.assign(document.createElement('p'), { className: 'residents-intro', textContent: '完成每天的主題拍照，照片就會收進這裡。' })]));
  $('album-dialog').showModal();
}
$('open-album').addEventListener('click', openAlbum);
$('close-album').addEventListener('click', () => $('album-dialog').close());

// ── 小恐龍轉盤
let wheelStake = STAKES[0];
let wheelTurn = 0; // 累計角度，轉盤不會倒轉回去
let wheelBusy = false;
function drawWheel() {
  const svg = $('wheel'); const n = SEGMENTS.length; const r = 96;
  const pt = (deg, rad) => { const a = (deg - 90) * Math.PI / 180; return [Math.cos(a) * rad, Math.sin(a) * rad]; };
  svg.innerHTML = SEGMENTS.map((seg, i) => {
    const a0 = i * 360 / n; const a1 = (i + 1) * 360 / n; const [x0, y0] = pt(a0, r); const [x1, y1] = pt(a1, r);
    const mid = (a0 + a1) / 2; const [tx, ty] = pt(mid, r * 0.64);
    const dark = ['#ffd36b', '#f0b03a', '#7fb0d8', '#8a7aa8', '#e07ac0', '#b08a5a'].includes(seg.color);
    return `<path d="M0 0L${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z" fill="${seg.color}" stroke="#1c1520" stroke-width="1.5"/>`
      + `<text x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" transform="rotate(${mid} ${tx.toFixed(2)} ${ty.toFixed(2)})" text-anchor="middle" dominant-baseline="central" font-size="${seg.short.length > 2 ? 12 : 15}" font-weight="700" fill="${dark ? '#1c1520' : '#fff'}">${seg.short}</text>`;
  }).join('') + `<circle r="${r}" fill="none" stroke="#ffd9a8" stroke-width="3"/>`;
}
function renderWheel(resultText) {
  const left = spinsLeft(state);
  $('wheel-left').textContent = left ? `今天還可以轉 ${left} 次 · 目前能量 ${state.energy}` : `今天的 ${WHEEL_SPINS} 次都轉完了，明天再來！`;
  $('wheel-stakes').replaceChildren(...STAKES.map(stake => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'wheel-stake';
    b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(stake === wheelStake));
    b.disabled = wheelBusy || !left; b.innerHTML = `押 <b>${stake}</b>`;
    b.addEventListener('click', () => { wheelStake = stake; renderWheel(); });
    return b;
  }));
  $('wheel-spin').disabled = wheelBusy || !left || state.energy < wheelStake;
  $('wheel-spin').textContent = !left ? '明天再來' : state.energy < wheelStake ? '能量不夠' : `押 ${wheelStake} 能量，轉！`;
  if (resultText !== undefined) $('wheel-result').textContent = resultText;
  const t = state.wheel?.total;
  $('wheel-total').textContent = t?.spins ? `一共轉了 ${t.spins} 次 · 贏 ${t.won} · 輸 ${t.lost}${t.jackpots ? ` · 大獎 ${t.jackpots} 次` : ''}` : '';
}
function openWheel() {
  if (!$('wheel').childElementCount) drawWheel();
  renderWheel('');
  if (!$('wheel-dialog').open) { $('wheel-dialog').showModal(); syncRoomActivity(); }
  showTip('wheel', $('wheel-dialog').querySelector('.wheel-wrap'), 'before');
}
$('wheel-spin').addEventListener('click', async () => {
  if (wheelBusy) return;
  wheelBusy = true;
  const stake = wheelStake;
  const t = await updateState(current => { const r = spinWheel(current, stake); return typeof r === 'string' ? { error: r } : r; });
  state = t.state;
  if (t.result.error) { wheelBusy = false; renderWheel(t.result.error); return; }
  const { index, payout, fossils, net } = t.result; const seg = SEGMENTS[index];
  renderWheel('轉呀轉……');
  const center = (index + 0.5) * 360 / SEGMENTS.length;
  const jitter = (Math.random() - 0.5) * (360 / SEGMENTS.length) * 0.4;
  wheelTurn += 360 * 5 + ((360 - center - jitter - (wheelTurn % 360)) % 360 + 360) % 360;
  const wheelEl = $('wheel');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  wheelEl.style.transition = reduce ? 'none' : 'transform 3.2s cubic-bezier(.17,.67,.21,1)';
  wheelEl.style.transform = `rotate(${wheelTurn}deg)`;
  buzz(10);
  await sleep(reduce ? 50 : 3300);
  wheelBusy = false;
  const gain = net > 0 ? `+${net}` : net < 0 ? `${net}` : '±0';
  renderWheel(`${seg.label}！${seg.line}（能量 ${gain}${fossils ? `，化石 +${fossils}` : ''}）`);
  renderResources(); restart($('chip-energy'), 'is-bump');
  if (net > 0) buzz(seg.id === 'jackpot' ? [40, 60, 40, 60, 120] : [20, 40, 30]);
  if (seg.id === 'jackpot') say('大獎！我們發財了！', 'happy', 5000);
  if (payout === 0) say('沒關係，明天再轉一次！', 'normal', 3500);
});
$('open-wheel').addEventListener('click', () => { $('function-center').close(); openWheel(); });
$('home-wheel').addEventListener('click', openWheel);
function renderWheelBadge() {
  const left = spinsLeft(state);
  $('home-wheel').hidden = !state.seenIntro;
  $('wheel-badge').hidden = !left; $('wheel-badge').textContent = left;
  $('home-wheel').classList.toggle('is-spent', !left);
}
$('wheel-dialog').addEventListener('close', () => renderWheelBadge());
$('close-wheel').addEventListener('click', () => $('wheel-dialog').close());
$('wheel-dialog').addEventListener('close', syncRoomActivity);

// ── 小湘好感度
function renderBond(no, owned) {
  const box = $('dex-detail-bond'); box.hidden = !owned;
  if (!owned) return;
  const b = bondInfo(state, no, todayKey());
  const pct = b.max ? 100 : Math.round(((b.pts - b.prev) / (b.next - b.prev)) * 100);
  $('bond-hearts').textContent = '♥'.repeat(b.level) + '♡'.repeat(MAX_LEVEL - b.level);
  $('bond-level').textContent = b.max ? `好感度 Lv.${b.level} · 滿級` : `好感度 Lv.${b.level} · ${b.pts} / ${b.next}`;
  $('bond-bar').style.setProperty('--p', `${pct}%`);
  $('bond-today').textContent = b.max ? '已經是最好的朋友了！' : b.left ? `今天在首頁還能增加 ${b.left} 點（點她、摸摸頭、餵布丁）· 一起出門 +${BOND_GAIN.errand}` : `今天在首頁的好感度滿了（每天 ${DAILY_CAP} 點），可以帶她出門，或明天再來。`;
  const texts = bondText(no);
  $('bond-unlocks').replaceChildren(...[2, 3, 4, 5].map(lv => {
    const li = document.createElement('li'); const open = b.level >= lv;
    li.className = open ? 'is-open' : '';
    const tag = document.createElement('b'); tag.textContent = `Lv.${lv} ${UNLOCK_LABEL[lv]}`;
    const body = document.createElement('span'); body.textContent = open ? (lv === 3 ? texts[lv] : `「${texts[lv]}」`) : '🔒 再親近一點就能看到';
    li.append(tag, body); return li;
  }));
}
let bondQueue = [];
function queueBondUps(list) {
  for (const { no, up } of list) for (const u of up) bondQueue.push({ no, ...u });
  showNextBondUp();
}
function showNextBondUp(tries = 0) {
  if (!bondQueue.length || $('bond-up').open) return;
  if (document.querySelector('dialog[open]')) { if (tries < 40) setTimeout(() => showNextBondUp(tries + 1), 1500); return; }
  const { no, level, reward, unlock, text } = bondQueue.shift();
  const c = CHARACTERS[no];
  loadWithFallback($('bond-up-img'), characterSources(c.image)); $('bond-up-img').alt = c.name;
  $('bond-up-title').textContent = `${c.name}的好感度升到 Lv.${level}！`;
  $('bond-up-unlock').textContent = `解鎖：${unlock}`;
  $('bond-up-text').textContent = level === 3 ? text : `「${text}」`;
  const r = describeLevelReward(reward);
  $('bond-up-reward').textContent = r ? `禮物：${r}` : '';
  $('bond-up').classList.toggle('is-shiny', level >= MAX_LEVEL);
  $('bond-up').showModal(); syncRoomActivity(); buzz([20, 40, 20]);
  renderResources();
}
$('bond-up-ok').addEventListener('click', () => $('bond-up').close());
$('bond-up').addEventListener('close', () => { syncRoomActivity(); renderAll(); setTimeout(showNextBondUp, 300); });
const bondCapTold = new Set();
function bondCapNotice(no) {
  const key = `${todayKey()}:${no}`;
  if (bondCapTold.has(key) || !state.dex[no]) return;
  bondCapTold.add(key);
  toast(`${CHARACTERS[no].name}今天跟你已經很親了（好感度今天滿了）。換別的小湘入住，或帶她出門吧！`);
}
// 住在首頁的小湘每天 ♡+2
function tickHomeBond() {
  const residents = room.residents();
  if (!residents.length) return;
  const today = todayKey();
  if (residents.every(no => state.affection?.[no]?.home === today)) return;
  void updateState(current => homeTick(current, residents, today)).then(t => { state = t.state; if (t.result.length) queueBondUps(t.result); });
}
if (initialSave.result?.homeBond?.length) setTimeout(() => queueBondUps(initialSave.result.homeBond), 1200);
document.addEventListener('visibilitychange', () => { if (!document.hidden) tickHomeBond(); });

// ── 討伐
let battleEnemy = null; let battlePicked = [];
const enemyArt = (id, cls = '') => {
  const e = battle.enemyFor(state, id) || battle.ENEMIES[id];
  const box = document.createElement('div'); box.className = `enemy-art ${cls}${e?.trait?.shiny ? ' is-shiny' : ''}`;
  if (e?.trait) { box.style.setProperty('--hue', `${e.trait.hue}deg`); box.style.setProperty('--scale', e.trait.scale); }
  const img = document.createElement('img'); img.alt = e.name; img.src = battle.enemyArtPath(id, state);
  img.onerror = () => { img.remove(); const em = document.createElement('span'); em.className = 'enemy-art__emoji'; em.textContent = e.emoji; box.prepend(em); };
  box.append(img);
  if (e?.trait) box.append(Object.assign(document.createElement('i'), { className: 'enemy-art__trait', textContent: e.trait.icon }));
  return box;
};
const allBusy = () => new Set([...busyNos(state), ...battle.battleNos(state)]);
function showErrandTab(tab) {
  $('tab-errand').setAttribute('aria-selected', String(tab === 'errand'));
  $('tab-battle').setAttribute('aria-selected', String(tab === 'battle'));
  $('errand-pane').hidden = tab !== 'errand'; $('battle-pane').hidden = tab !== 'battle';
  $('errand-title').textContent = tab === 'battle' ? '討伐' : '派小湘出門';
  $('errand-title').previousElementSibling.textContent = tab === 'battle' ? 'BATTLE' : 'ERRANDS';
  if (tab === 'battle') { renderBattle(); showTip('battle', $('battle-pane')); }
}
$('tab-errand').addEventListener('click', () => showErrandTab('errand'));
$('tab-battle').addEventListener('click', () => showErrandTab('battle'));
function renderBattle() {
  const b = state.battle; const now = Date.now();
  $('battle-badges').textContent = b.badges;
  $('battle-slots').textContent = `隊伍 ${b.active.length} / ${battle.teamSlots(state)}`;
  $('battle-active').replaceChildren(...b.active.map(a => {
    const row = document.createElement('div'); const back = battle.isBack(a, now); row.className = `errand-trip${back ? ' is-back' : ''}`;
    const who = document.createElement('div'); who.className = 'errand-trip__who'; who.append(enemyArt(a.enemy, 'is-mini'));
    const text = document.createElement('div'); const t = document.createElement('b'); const sm = document.createElement('small');
    t.textContent = `討伐 ${(battle.enemyFor(state, a.enemy) || battle.ENEMIES[a.enemy]).name}`; sm.textContent = back ? '回來了！看戰報' : `還要 ${battle.fmtMinutes(Date.parse(a.until) - now)} · ${a.nos.map(no => CHARACTERS[no].name).join('、')}`;
    text.append(t, sm); row.append(who, text);
    if (back) { const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn'; btn.textContent = '戰報'; btn.addEventListener('click', () => void collectBattle(a.id)); row.append(btn); }
    return row;
  }));
  const inStage = Boolean(battleEnemy); const inTrain = !$('battle-train').hidden;
  $('battle-map').hidden = inStage || inTrain; $('battle-stage').hidden = !inStage;
  if (!inStage && !inTrain) {
    const wild = state.battle.wild?.list || [];
    const wildSec = document.createElement('section'); wildSec.className = 'battle-chapter battle-wild';
    const wh = document.createElement('h3'); wh.className = 'egg-choices__heading'; wh.textContent = '野外巡邏 · 今天的野生小怪';
    const wnote = document.createElement('p'); wnote.className = 'residents-intro';
    const wb = battle.weekBest(state);
    wnote.textContent = `每天換一批，強度跟著你的隊伍變化。打跑的那隻今天不會再出現。${wb ? `本週最高分 ${wb}` : ''}`;
    const wgrid = document.createElement('div'); wgrid.className = 'battle-stages';
    const busyKeys = new Set(state.battle.active.map(a => a.enemy));
    wgrid.append(...wild.map(w => {
      const e = battle.wildEnemy(w);
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = `battle-stage-card${e.boss ? ' is-boss' : ''}${e.trait.shiny ? ' is-shiny' : ''}${w.defeated ? ' is-done' : ''}`;
      btn.disabled = w.defeated || busyKeys.has(w.key);
      btn.append(enemyArt(w.key));
      const info = document.createElement('div'); info.className = 'battle-stage-card__info';
      info.innerHTML = '<small></small><b></b><span></span>';
      info.querySelector('small').textContent = e.boss ? '流浪 Boss' : e.trait.shiny ? '稀有！' : '野生';
      info.querySelector('b').textContent = e.name;
      info.querySelector('span').textContent = w.defeated ? '✓ 已經打跑了' : busyKeys.has(w.key) ? '隊伍討伐中…' : `戰力 ${e.power}`;
      btn.append(info);
      btn.addEventListener('click', () => { battleEnemy = w.key; battlePicked = []; $('battle-status').textContent = ''; renderBattle(); });
      return btn;
    }));
    wildSec.append(wh, wnote, wgrid);
    $('battle-map').replaceChildren(wildSec, ...battle.CHAPTERS.map(ch => {
      const sec = document.createElement('section'); sec.className = 'battle-chapter';
      const h = document.createElement('h3'); h.className = 'egg-choices__heading'; h.textContent = `第 ${ch.id} 章 · ${ch.name}`;
      const grid = document.createElement('div'); grid.className = 'battle-stages';
      grid.append(...ch.stages.map(id => {
        const e = battle.ENEMIES[id]; const st = b.stages[id]; const open = battle.unlocked(state, id);
        const btn = document.createElement('button'); btn.type = 'button'; btn.className = `battle-stage-card${e.boss ? ' is-boss' : ''}${open ? '' : ' is-locked'}`; btn.disabled = !open;
        btn.append(enemyArt(id));
        const info = document.createElement('div'); info.className = 'battle-stage-card__info';
        info.innerHTML = `<small>${e.stage}${e.boss ? ' · BOSS' : ''}</small><b></b><span></span>`;
        info.querySelector('b').textContent = open ? e.name : '？？？';
        info.querySelector('span').textContent = !open ? '🔒 先打贏前一關' : st?.clears ? `${'★'.repeat(st.stars)}${'☆'.repeat(3 - st.stars)} · 最高 ${st.best}` : `建議戰力 ${e.power}`;
        btn.append(info);
        btn.addEventListener('click', () => { battleEnemy = id; battlePicked = []; $('battle-status').textContent = ''; renderBattle(); });
        return btn;
      }));
      sec.append(h, grid); return sec;
    }));
    // 特殊關卡（EX）：還沒解鎖時整區不出現，避免劇透
    for (const x of battle.EXTRA_STAGES) {
      if (!battle.unlocked(state, x.id)) continue;
      const e = battle.ENEMIES[x.id]; const st = b.stages[x.id];
      const sec = document.createElement('section'); sec.className = 'battle-chapter battle-extra';
      const h = document.createElement('h3'); h.className = 'egg-choices__heading'; h.textContent = x.title;
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'battle-stage-card is-extra';
      btn.append(enemyArt(x.id));
      const info = document.createElement('div'); info.className = 'battle-stage-card__info'; info.innerHTML = '<small></small><b></b><span></span>';
      info.querySelector('small').textContent = `${e.stage} · 可重複挑戰`; info.querySelector('b').textContent = e.name;
      info.querySelector('span').textContent = st?.clears ? `${'★'.repeat(st.stars)}${'☆'.repeat(3 - st.stars)} · 最高 ${st.best}` : `建議戰力 ${e.power}`;
      btn.append(info);
      btn.addEventListener('click', () => { battleEnemy = x.id; battlePicked = []; $('battle-status').textContent = ''; renderBattle(); });
      const grid = document.createElement('div'); grid.className = 'battle-stages'; grid.append(btn);
      sec.append(h, grid); $('battle-map').append(sec);
    }
  }
  if (inStage) renderBattleStage();
}
function renderBattleStage() {
  const id = battleEnemy; const e = battle.enemyFor(state, id); const st = e.wild ? null : state.battle.stages[id];
  if (!e) { battleEnemy = null; renderBattle(); return; }
  $('battle-enemy-art').replaceChildren(enemyArt(id, 'is-big'));
  $('battle-enemy-stage').textContent = e.wild ? e.stage : `${e.stage}${e.boss ? ' · BOSS' : ''}`;
  $('battle-enemy-name').textContent = e.name;
  $('battle-enemy-meta').textContent = `戰力 ${e.power} · 怕：${e.weak.map(sr => SERIES[sr]?.short).join('、')}系列${st?.tries ? ` · 最高 ${st.best} 分（${'★'.repeat(st.stars)}${'☆'.repeat(3 - st.stars)}）` : ''}`;
  $('battle-story').hidden = !e.story; if (e.story) $('battle-story').textContent = e.story.before;
  $('battle-enemy-intro').textContent = e.intro;
  const busy = allBusy(); const now = Date.now();
  const owned = Object.keys(CHARACTERS).filter(no => state.dex[no]);
  owned.sort((a, b2) => battle.siangPower(state, b2).power - battle.siangPower(state, a).power);
  $('battle-siangs').replaceChildren(...owned.map(no => {
    const p = battle.siangPower(state, no); const rest = battle.restLeft(state, no, now); const off = busy.has(no) || rest > 0;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'errand-siang'; btn.disabled = off;
    btn.setAttribute('aria-pressed', String(battlePicked.includes(no)));
    btn.append(siangImg(no), Object.assign(document.createElement('span'), { textContent: off ? (rest > 0 ? `休息 ${battle.fmtMinutes(rest)}` : '忙碌中') : `戰力 ${p.power}` }));
    if (e.weak.includes(CHARACTERS[no].series)) btn.append(Object.assign(document.createElement('i'), { className: 'star', textContent: '✦' }));
    btn.addEventListener('click', () => {
      battlePicked = battlePicked.includes(no) ? battlePicked.filter(x => x !== no) : [...battlePicked, no].slice(-battle.TEAM_MAX);
      renderBattleStage();
    });
    return btn;
  }));
  const fc = battlePicked.length ? battle.forecast(state, battlePicked, id) : null;
  $('battle-forecast').innerHTML = '';
  if (fc) {
    const bonus = [fc.weakHit && '剋制 +30%', fc.sameSeries && '同系列 +15%', fc.heroParty && '勇者小隊 +50%'].filter(Boolean).join(' · ');
    $('battle-forecast').innerHTML = `<b></b><span></span>`;
    $('battle-forecast').querySelector('b').textContent = `隊伍戰力 ${fc.total} vs ${e.power} · ${fc.label}`;
    $('battle-forecast').querySelector('span').textContent = bonus || '沒有加成（帶 ✦ 的小湘有剋制效果）';
    $('battle-forecast').dataset.level = fc.ratio >= 1.2 ? 'good' : fc.ratio >= 1 ? 'ok' : 'risk';
  }
  const full = state.battle.active.length >= battle.teamSlots(state);
  $('battle-go').disabled = !battlePicked.length || full;
  $('battle-go').textContent = full ? '隊伍都派出去了' : `出發討伐${fc ? `（約 ${Math.round(e.minutes * (fc.weakHit ? 0.75 : 1))} 分鐘）` : ''}`;
}
$('battle-back').addEventListener('click', () => { battleEnemy = null; renderBattle(); });
// 野生小怪的戰報：那一天的名單可能已經換掉，用出發時存下的資料畫
function wildArtFrom(snapshot) {
  const e = battle.wildEnemy(snapshot);
  const box = document.createElement('div'); box.className = `enemy-art is-big${e.trait.shiny ? ' is-shiny' : ''}`;
  box.style.setProperty('--hue', `${e.trait.hue}deg`); box.style.setProperty('--scale', e.trait.scale);
  const img = document.createElement('img'); img.alt = e.name; img.src = `assets/enemies/${e.art || e.base}.webp`;
  img.onerror = () => { img.remove(); box.prepend(Object.assign(document.createElement('span'), { className: 'enemy-art__emoji', textContent: e.emoji })); };
  box.append(img, Object.assign(document.createElement('i'), { className: 'enemy-art__trait', textContent: e.trait.icon }));
  return box;
}
$('battle-go').addEventListener('click', async () => {
  if (!battleEnemy || !battlePicked.length) return;
  const id = battleEnemy; const nos = [...battlePicked];
  const t = await updateState(current => { const r = battle.startBattle(current, id, nos, { busy: new Set([...busyNos(current), ...battle.battleNos(current)]) }); return typeof r === 'string' ? { error: r } : { battle: r }; });
  state = t.state;
  if (t.result.error) { $('battle-status').textContent = t.result.error; return; }
  battleEnemy = null; battlePicked = [];
  renderAll(); renderBattle();
  toast(`出發討伐${battle.enemyFor(state, id).name}！${battle.fmtMinutes(Date.parse(t.result.battle.until) - Date.now())}後回來。`);
});
async function collectBattle(id) {
  const t = await updateState(current => battle.collectBattle(current, id));
  state = t.state; renderAll(); renderBattle();
  if (!t.result) return;
  const r = t.result; const rep = r.report; const e = r.snapshot ? battle.wildEnemy(r.snapshot) : battle.ENEMIES[r.enemy];
  $('battle-result-art').replaceChildren(r.snapshot ? wildArtFrom(r.snapshot) : enemyArt(r.enemy, 'is-big'));
  $('battle-result-eyebrow').textContent = `${e.stage} · ${e.name}`;
  $('battle-result-title').textContent = rep.win ? '討伐成功！' : '先撤退了……';
  $('battle-result-stars').textContent = rep.win ? `${'★'.repeat(rep.stars)}${'☆'.repeat(3 - rep.stars)}` : '';
  const delta = r.delta === null ? '第一次挑戰' : r.delta > 0 ? `比上次 +${r.delta}` : r.delta < 0 ? `比上次 ${r.delta}` : '跟上次一樣';
  $('battle-result-score').innerHTML = '';
  for (const [label, value, cls] of [['這次分數', rep.score, ''], [r.wild ? '本週最高' : '歷史最高', r.best, r.record ? 'is-record' : ''], ['進步', r.wild && r.delta === null ? '新的對手' : delta, r.delta > 0 ? 'is-up' : '']]) {
    const box = document.createElement('div'); box.className = cls; box.innerHTML = '<small></small><b></b>';
    box.querySelector('small').textContent = label; box.querySelector('b').textContent = value; $('battle-result-score').append(box);
  }
  if (r.record && r.delta !== null) $('battle-result-score').lastChild.previousSibling.querySelector('small').textContent = '新紀錄！';
  $('battle-result-log').replaceChildren(...rep.log.map(line => Object.assign(document.createElement('li'), { textContent: line, className: line.startsWith('✦') ? 'is-special' : '' })));
  $('battle-result-log').append(Object.assign(document.createElement('li'), { className: 'is-power', textContent: `隊伍戰力 ${rep.power} vs ${rep.enemyPower}` }));
  $('battle-result-review').hidden = !r.review;
  if (r.review) { guguAvatar(document.querySelector('#battle-result-review .gugu-review__avatar')); $('battle-review-label').textContent = `咕咕書評 · ${REVIEW_LABEL[r.review.kind] || ''}`; $('battle-review-text').textContent = r.review.text; $('battle-review-note').textContent = r.review.note || ''; $('battle-review-note').hidden = !r.review.note; }
  $('battle-result-advice').hidden = !rep.advice; if (rep.advice) $('battle-result-advice').textContent = `💡 ${rep.advice.text}`;
  const storyText = [r.clue && `🔍 線索：${r.clue}`, r.story && `📖 ${r.story}`].filter(Boolean).join('\n\n');
  $('battle-result-story').hidden = !storyText; $('battle-result-story').textContent = storyText;
  $('battle-result-gains').replaceChildren(...r.gains.map(g => Object.assign(document.createElement('li'), { textContent: g })));
  $('battle-result').showModal(); $('battle-result').scrollTop = 0; $('battle-result-ok').blur(); buzz(rep.win ? [20, 40, 30] : 15); // 長戰報從最上面（分數）開始看
  restart($('chip-energy'), 'is-bump');
}
$('battle-result-ok').addEventListener('click', () => $('battle-result').close());
// 特訓
function renderTrain() {
  const owned = Object.keys(CHARACTERS).filter(no => state.dex[no]).sort((a, b2) => battle.siangPower(state, b2).power - battle.siangPower(state, a).power);
  $('train-list').replaceChildren(...owned.map(no => {
    const p = battle.siangPower(state, no); const cost = battle.trainCost(state, no);
    const row = document.createElement('div'); row.className = 'train-row';
    const info = document.createElement('div'); info.innerHTML = '<b></b><small></small>';
    info.querySelector('b').textContent = `${CHARACTERS[no].name} · 戰力 ${p.power}`;
    info.querySelector('small').textContent = `${CHARACTERS[no].rarity} · 好感 Lv.${p.bond} · ${p.stars} 星 · 特訓 ${p.train}/${battle.MAX_TRAIN}`;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn btn--quiet';
    btn.textContent = cost === null ? '滿級' : `🛡️ ${cost}`; btn.disabled = cost === null || state.battle.badges < cost;
    btn.addEventListener('click', async () => {
      const t = await updateState(current => battle.train(current, no)); state = t.state;
      $('train-status').textContent = typeof t.result === 'string' ? t.result : `${CHARACTERS[no].name}特訓到 Lv.${t.result.level}！戰力變成 ${battle.siangPower(state, no).power}。`;
      $('battle-badges').textContent = state.battle.badges; renderTrain();
    });
    row.append(siangImg(no), info, btn); return row;
  }));
}
// 徽章兌換：勇者小隊
function renderHeroShop() {
  $('hero-shop').replaceChildren(...HERO_SHOP.map(({ no }) => {
    const h = battle.heroStatus(state, no); const c = CHARACTERS[no];
    const row = document.createElement('div'); row.className = `train-row${h.owned ? ' is-owned' : ''}`;
    const img = siangImg(no); if (!h.owned) { img.classList.add('is-locked'); img.alt = '尚未兌換的小湘'; }
    const info = document.createElement('div'); info.innerHTML = '<b></b><small></small>';
    info.querySelector('b').textContent = `${c.name} · ${c.rarity}`;
    info.querySelector('small').textContent = h.owned ? '已經加入隊伍 ✓' : h.locked ? `🔒 ${h.requireText}` : h.short ? `還差 ${h.short} 枚徽章` : '可以兌換了！';
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn btn--quiet';
    btn.textContent = h.owned ? '已兌換' : `🛡️ ${h.cost}`; btn.disabled = !h.ready;
    btn.addEventListener('click', () => void redeemHeroFor(no));
    row.append(img, info, btn); return row;
  }));
}
async function redeemHeroFor(no) {
  const t = await updateState(current => battle.redeemHero(current, no));
  state = t.state;
  if (typeof t.result === 'string') { $('hero-status').textContent = t.result; return; }
  welcomeResident(no, state.dex);
  $('hero-status').textContent = `${CHARACTERS[no].name}：「${t.result.line}」`;
  $('battle-badges').textContent = state.battle.badges;
  renderAll(); renderHeroShop(); renderTrain(); buzz([20, 40, 30]);
  toast(`${CHARACTERS[no].name}加入了！「${t.result.line}」`);
}
$('open-train').addEventListener('click', () => { battleEnemy = null; $('battle-train').hidden = false; $('train-status').textContent = ''; $('hero-status').textContent = ''; renderBattle(); renderHeroShop(); renderTrain(); });
$('train-back').addEventListener('click', () => { $('battle-train').hidden = true; renderBattle(); });
$('errand-dialog').addEventListener('close', () => { battleEnemy = null; $('battle-train').hidden = true; showErrandTab('errand'); });
setInterval(() => { if (!document.hidden && !$('battle-pane').hidden && $('errand-dialog').open && !battleEnemy) renderBattle(); }, 30 * 1000);

// ── 咕咕的故事檔案館（只讀現有存檔）
const GUGU_GREETS = ['「噓……翻書請小聲。」', '「想重讀哪一本？手洗乾淨了嗎？」', '「沒解鎖的頁面，我不會偷偷給你看。」', '「今天也來借故事啊。登記一下。」'];
let archiveTab = 'battle';
const fmtDate = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`; };
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
function guguAvatar(box) {
  if (box.childElementCount) return;
  const img = document.createElement('img'); img.alt = ''; img.src = battle.enemyArtPath('gugu');
  img.onerror = () => { img.remove(); box.textContent = '👻'; };
  box.append(img);
}
function lockedCard(text) { const c = el('div', 'archive-card is-locked'); c.append(el('b', '', '🔒 ？？？'), el('small', '', text)); return c; }
function renderArchive() {
  const ba = battleArchive(state); const bo = bondArchive(state); const tr = travelArchive(state);
  $('archive-count-battle').textContent = `${ba.collected}/${ba.total}`;
  $('archive-count-bond').textContent = `${bo.unlocked}/${bo.total}`;
  $('archive-count-travel').textContent = `${tr.unlocked}/${tr.total}`;
  document.querySelectorAll('[data-archive-tab]').forEach(t => t.setAttribute('aria-selected', String(t.dataset.archiveTab === archiveTab)));
  const body = $('archive-body'); body.replaceChildren();
  if (archiveTab === 'battle') {
    for (const ch of ba.chapters) {
      const sec = el('section', 'archive-section');
      sec.append(el('h3', 'archive-section__title', ch.locked ? `第 ${ch.id} 章 · ？？？` : `第 ${ch.id} 章 · ${ch.name}`));
      if (ch.locked) { sec.append(lockedCard('打到這一章就會解鎖。')); body.append(sec); continue; }
      if (ch.bossStory) {
        for (const [key, label] of [['before', 'Boss 開場'], ['after', 'Boss 過關後']]) {
          const text = ch.bossStory[key];
          if (!text) { sec.append(lockedCard(key === 'before' ? '挑戰這一章的 Boss 時解鎖。' : '打倒 Boss 後解鎖。')); continue; }
          const det = el('details', 'archive-card archive-story'); const sum = el('summary');
          sum.append(el('b', '', `📖 ${label}${ch.bossStory.bossName ? ` · ${ch.bossStory.bossName}` : ''}`)); det.append(sum, el('p', '', text)); sec.append(det);
        }
      }
      if (ch.clueTotal) {
      const clues = el('div', 'archive-card archive-clues');
      clues.append(el('b', '', `🔍 線索 ${ch.clues.length} / ${ch.clueTotal}`));
      if (ch.clues.length) { const ul = el('ul'); ul.append(...ch.clues.map(c => el('li', '', `${c.stage}　${c.text}`))); clues.append(ul); }
      else clues.append(el('small', '', '第一次通關各關卡時會撿到線索。'));
      sec.append(clues);
      }
      sec.append(...ch.stages.map(stageCard));
      body.append(sec);
    }
    for (const x of ba.extras) {
      if (x.file.locked) continue;
      const sec = el('section', 'archive-section'); sec.append(el('h3', 'archive-section__title', x.title), stageCard(x.file)); body.append(sec);
    }
    const pages = el('section', 'archive-section');
    pages.append(el('h3', 'archive-section__title', `特殊書頁 ${ba.pages.owned.length}`), lockedCard('這一頁還是空白的……咕咕說，有些故事要等時候到了才會出現。'));
    body.append(pages);
  } else if (archiveTab === 'bond') {
    body.append(el('p', 'archive-note', `已相遇 ${bo.met} 位 · 好感度 Lv.3 解鎖每位小湘的小故事。`));
    for (const x of bo.list) {
      if (!x.story) { const c = lockedCard(`${x.name}：好感度 Lv.3 解鎖（目前 Lv.${x.level}）`); body.append(c); continue; }
      const det = el('details', 'archive-card archive-story'); const sum = el('summary');
      const img = document.createElement('img'); img.className = 'archive-face'; img.alt = ''; loadWithFallback(img, characterSources(x.image));
      sum.append(img, el('b', '', `${x.name} · Lv.${x.level}`)); det.append(sum, el('p', '', x.story));
      if (x.lines.length) { const ul = el('ul', 'archive-lines'); ul.append(...x.lines.map(l => el('li', '', `Lv.${l.level}「${l.text}」`))); det.append(ul); }
      body.append(det);
    }
  } else {
    body.append(el('p', 'archive-note', '兩位小湘一起出門，有時會發生小故事。'));
    for (const t of tr.list) {
      if (t.locked) { body.append(lockedCard('讓特定的兩位小湘一起出門就可能發現。')); continue; }
      const det = el('details', 'archive-card archive-story'); const sum = el('summary');
      sum.append(el('b', '', `📖 ${t.title}`), el('small', '', [t.who, t.place, fmtDate(t.at)].filter(Boolean).join(' · ')));
      det.append(sum, el('p', '', t.text)); body.append(det);
    }
  }
}
function stageCard(f) {
  if (f.locked) return lockedCard(`${f.stage}${f.boss ? ' · BOSS' : ''} · 打贏前一關解鎖`);
  const c = el('div', `archive-card archive-file${f.cleared ? '' : ' is-uncleared'}`);
  const top = el('div', 'archive-file__top');
  const art = enemyArt(f.id, 'is-mini');
  const head = el('div'); head.append(el('small', '', `${f.stage}${f.boss ? ' · BOSS' : ''}${f.extra ? ' · 特殊' : ''}`), el('b', '', f.name));
  top.append(art, head, el('span', 'archive-stars', f.cleared ? `${'★'.repeat(f.stars)}${'☆'.repeat(3 - f.stars)}` : ''));
  c.append(top);
  const facts = el('dl', 'archive-facts');
  for (const [k, v] of [['首次通關', f.cleared ? (f.firstAt ? fmtDate(f.firstAt) : f.firstLabel) : '尚未通關'], ['最高分', f.best || '—'], ['討伐', `${f.clears} 勝 / ${f.tries} 戰`]]) { facts.append(el('dt', '', k), el('dd', '', String(v))); }
  c.append(facts);
  if (f.bio) c.append(el('p', 'archive-bio', f.bio));
  if (f.review) { const r = el('div', 'gugu-review is-small'); const av = el('span', 'gugu-review__avatar'); guguAvatar(av); const t = el('div'); t.append(el('small', '', `咕咕書評 · ${f.review.label}`), el('p', '', f.review.text)); if (f.review.note) t.append(el('p', 'gugu-review__note', f.review.note)); r.append(av, t); c.append(r); }
  return c;
}
function openArchive(tab = archiveTab) {
  archiveTab = tab;
  guguAvatar(document.querySelector('#archive .gugu-avatar'));
  $('archive-greet').textContent = GUGU_GREETS[Math.floor(Math.random() * GUGU_GREETS.length)];
  renderArchive();
  if (!$('archive').open) { $('archive').showModal(); syncRoomActivity(); }
  showTip('archive', $('archive-body'));
}
document.querySelectorAll('[data-archive-tab]').forEach(t => t.addEventListener('click', () => { archiveTab = t.dataset.archiveTab; renderArchive(); }));
$('open-archive').addEventListener('click', () => { $('function-center').close(); openArchive('battle'); });
$('open-archive-battle').addEventListener('click', () => openArchive('battle'));
$('close-archive').addEventListener('click', () => $('archive').close());
$('archive').addEventListener('close', syncRoomActivity);

// ── 玩家指引：第一次打開的小恐龍解說、功能逐步出現、今天可以做的事
function automatedGuide() { return navigator.webdriver && !window.__testGuide; }
function showTip(id, host, where = 'prepend') {
  if (!host || !guide.tipWanted(state, id) || host.querySelector?.(`.guide-tip[data-tip="${id}"]`) || document.querySelector(`.guide-tip[data-tip="${id}"]`)) return;
  const f = guide.FEATURES[id];
  const card = document.createElement('div'); card.className = 'guide-tip'; card.dataset.tip = id;
  card.innerHTML = '<img class="guide-tip__dino" src="assets/mascot/dinosaur-idle.webp" alt=""><div><small></small><p></p></div><button type="button" class="guide-tip__ok">知道了</button>';
  card.querySelector('small').replaceChildren(featureIcon(f.icon), document.createTextNode(f.name));
  card.querySelector('p').textContent = f.tip;
  card.querySelector('button').addEventListener('click', async () => { card.remove(); state = (await updateState(current => guide.markSeen(current, id))).state; });
  if (where === 'before') host.before(card); else host.prepend(card);
}
function applyGates() {
  const GATE_ELEMENTS = { errand: ['home-errand', 'open-errands'], wheel: ['home-wheel', 'open-wheel'], battle: ['open-battle', 'tab-battle'], archive: ['open-archive', 'open-archive-battle'] }; // 放在函式裡：renderAll 在檔案尾端之前就會跑
  for (const [id, els] of Object.entries(GATE_ELEMENTS)) {
    if (guide.isUnlocked(state, id)) continue;
    for (const el of els) { const node = document.getElementById(el); if (node) node.hidden = true; }
  }
  // 討伐分頁鎖著時，出門視窗的分頁列整個收起來
  $('errand-dialog').querySelector('.errand-tabs').hidden = !guide.isUnlocked(state, 'battle');
  if (!automatedGuide() && guide.GATED.some(id => !state.guide?.unlocked?.includes(id) && guide.FEATURES[id].unlock(state))) void checkUnlocks();
}
var unlockBusy = false; var unlockQueue = [];
async function checkUnlocks() {
  if (unlockBusy) return; unlockBusy = true;
  try {
    const t = await updateState(current => guide.unlockNew(current));
    state = t.state;
    if (t.result.length) { unlockQueue.push(...t.result); applyGates(); renderAll(); showNextUnlock(); }
  } finally { unlockBusy = false; }
}
function showNextUnlock(tries = 0) {
  if (!unlockQueue.length || $('unlock-dialog').open) return;
  if (document.querySelector('dialog[open]')) { if (tries < 40) setTimeout(() => showNextUnlock(tries + 1), 1500); return; }
  const id = unlockQueue.shift(); const f = guide.FEATURES[id];
  $('unlock-icon').replaceChildren(featureIcon(f.icon)); $('unlock-title').textContent = `新功能：${f.name}`; $('unlock-tip').textContent = f.tip;
  $('unlock-dialog').dataset.feature = id; $('unlock-dialog').showModal(); syncRoomActivity(); buzz([15, 30, 15]);
}
const OPEN_FEATURE = { errand: () => openErrands(), wheel: () => openWheel(), battle: () => { openErrands(); showErrandTab('battle'); }, archive: () => openArchive('battle') };
$('unlock-go').addEventListener('click', () => { const id = $('unlock-dialog').dataset.feature; $('unlock-dialog').close(); OPEN_FEATURE[id]?.(); });
$('unlock-later').addEventListener('click', () => $('unlock-dialog').close());
$('unlock-dialog').addEventListener('close', () => { syncRoomActivity(); setTimeout(showNextUnlock, 300); });

// 今天可以做的事：列出還沒做的，點一下就過去
function todayItems() {
  const items = []; const today = todayKey(); const add = (key, label, detail, go) => items.push({ key, label, detail, go });
  const owned = Object.keys(state.dex || {}).length;
  if (!$('daily-gift').hidden) add('gift', '領今天的見面禮', '首頁右邊的禮物', () => { $('today-dialog').close(); $('daily-gift').click(); });
  if (!$('letter-badge')?.hidden) add('letter', '看新的紙條', '首頁右邊的紙條', () => { $('today-dialog').close(); $('home-letter').click(); });
  const done = state.wishes?.date === today ? state.wishes.done.length : 0;
  if (done < 3) add('wish', `完成今日願望（${done} / 3）`, '拍顏色、陪小湘、主題拍照各一個', () => showView('wish'));
  if (state.eggOffer) add('offer', '挑一顆新蛋', '小恐龍找到三顆蛋', () => showView('incubate'));
  else if ($('enter-incubator').classList.contains('is-ready')) add('hatch', '蛋可以破殼了！', '去培育室迎接新夥伴', () => showView('incubate'));
  else if (state.energy >= 10) add('feed', `幫蛋保溫（能量 ${state.energy}）`, '能量用來孵蛋', () => showView('incubate'));
  if (owned && state.bonus?.explored !== today) add('explore', '按一次「探索附近」', '每天第一次會送一顆蛋', () => { $('today-dialog').close(); $('explore').click(); });
  if (guide.isUnlocked(state, 'wheel') && owned >= 1 && spinsLeft(state) > 0) add('wheel', `小恐龍轉盤（還有 ${spinsLeft(state)} 次）`, '押一點能量轉轉看', () => { $('today-dialog').close(); openWheel(); });
  if (guide.isUnlocked(state, 'errand') && owned) {
    const back = returned(state).length;
    if (back) add('errand-back', `${back} 趟出門回來了`, '收下她們帶回來的東西', () => { $('today-dialog').close(); openErrands(); });
    else if ((state.errands?.active?.length || 0) < ERRAND_SLOTS) add('errand', '派小湘出門', `還可以再派 ${ERRAND_SLOTS - (state.errands?.active?.length || 0)} 趟`, () => { $('today-dialog').close(); openErrands(); });
  }
  if (guide.isUnlocked(state, 'battle') && owned) {
    const backs = (state.battle?.active || []).filter(a => battle.isBack(a)).length;
    const wildLeft = (state.battle?.wild?.list || []).filter(w => !w.defeated).length;
    const heroReady = HERO_SHOP.find(({ no }) => battle.heroStatus(state, no).ready);
    if (heroReady) add('hero', `徽章夠換${CHARACTERS[heroReady.no].name}了`, '討伐 → 特訓與兌換', () => { $('today-dialog').close(); openErrands(); showErrandTab('battle'); $('open-train').click(); });
    if (backs) add('battle-back', `${backs} 份戰報可以看`, '討伐回來了', () => { $('today-dialog').close(); openErrands(); showErrandTab('battle'); });
    else if ((state.battle?.active?.length || 0) < battle.teamSlots(state) && wildLeft) add('battle', `討伐野生小怪（今天還有 ${wildLeft} 隻）`, '打贏拿徽章，可以特訓小湘', () => { $('today-dialog').close(); openErrands(); showErrandTab('battle'); });
  }
  const pettable = room.residents().filter(no => bondInfo(state, no, today).left > 0 && !bondInfo(state, no, today).max);
  if (pettable.length) add('bond', '摸摸首頁的小湘', `${pettable.map(no => CHARACTERS[no].name).join('、')}今天還能增加好感`, () => $('today-dialog').close());
  return items;
}
function renderToday() {
  const items = todayItems();
  $('today-pill').hidden = !state.seenIntro;
  $('today-pill-text').textContent = items.length ? `今天還有 ${items.length} 件事可以做` : '今天的事都做完了 ✓';
  $('today-pill').classList.toggle('is-done', !items.length);
  if ($('today-dialog').open) fillToday(items);
}
function fillToday(items = todayItems()) {
  $('today-intro').textContent = items.length ? '點一下就會帶你過去。做完的會自動消失。' : '今天的事都做完了，辛苦了！明天見～';
  $('today-list').replaceChildren(...items.map(it => {
    const li = document.createElement('li'); const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'today-item';
    btn.innerHTML = '<span class="today-item__text"><b></b><small></small></span><span aria-hidden="true">›</span>';
    btn.querySelector('b').textContent = it.label; btn.querySelector('small').textContent = it.detail;
    btn.addEventListener('click', it.go); li.append(btn); return li;
  }));
}
$('today-pill').addEventListener('click', () => { fillToday(); $('today-dialog').showModal(); syncRoomActivity(); });
$('close-today').addEventListener('click', () => $('today-dialog').close());
$('today-dialog').addEventListener('close', syncRoomActivity);
setInterval(() => { if (!document.hidden) renderToday(); }, 60 * 1000);
// 玩法指南：各功能說明（還沒解鎖的會寫解鎖條件）
function renderGuideFeatures() {
  $('guide-features').replaceChildren(...Object.entries(guide.FEATURES).map(([id, f]) => {
    const open = guide.isUnlocked(state, id);
    const card = document.createElement('div'); card.className = `guide-feature${open ? '' : ' is-locked'}`;
    card.innerHTML = '<b></b><p></p>';
    card.querySelector('b').replaceChildren(featureIcon(f.icon), document.createTextNode(`${f.name}${open ? '' : '（還沒出現）'}`));
    card.querySelector('p').textContent = open ? f.tip : `${f.unlockText}後就會出現。`;
    return card;
  }));
}
$('open-tutorial').addEventListener('click', renderGuideFeatures);
document.getElementById('tutorial-more')?.addEventListener('click', renderGuideFeatures);
