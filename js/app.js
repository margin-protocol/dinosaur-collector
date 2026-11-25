import { renderBattleLog } from './battle-log.js';
import { createBattleTheater } from './battle-theater.js';
import { createEpilogueTheater } from './chapter-epilogue.js';
import { renderAtlas, renderTeamTools } from './team-ui.js';
import { savePreset, ensureTeamBonds, effectText, teamBond } from './team-bonds.js';
import { featureIcon } from './ui-icons.js';
import { setupThemes, THEME_KEY } from './themes.js';
import { createTutorial, startTutorial } from './tutorial.js';
import { EGGS, SHELF_MAX, CHARACTERS, SERIES, DUPLICATE_FOSSILS, rollFor, isRandomEgg, isHigh, activePool, JOIN_WHEN_OWNED, NEW_FACE_TIMES, DUP_PITY, SR_PITY, COUNTY_CHARACTER, characterSources, loadWithFallback, eggLayerSources, WORLDS, worldOf, worldLabel, noLabel } from './eggs.js';
import { createIncubator, createEggView, stageOf, restart, reducedMotion } from './egg-view.js';
import { loadState, updateState, resetState, newEgg } from './state.js';
import { WISH_STAMPS_PER_EGG } from './wish-egg.js';
import { unlockedMilestones, allLetters, unreadCount, lockedMilestones, stampLetters, starredLetters, isStarred, toggleStar } from './letters.js';
import { chatterLine, canOffer, makeTask, taskProgress, completeTask, TASK_REWARD } from './dino.js';
import { activeHolidays, HOLIDAYS, TAIWAN_NO, EVENTS, activeEvents, VOTE_DAYS } from './holidays.js';
import { INTROS, MYSTERY_INTROS } from './intros.js';
import { HERO_SHOP } from './badge-heroes.js';
import { createAmbience, startChats, attachSnackDrag } from './home-life.js';
import { photoHash, similarPhoto } from './photo-hash.js';
import { compressPhoto, thumbnail, DATE_CODE } from './commissions.js';
import { offersFor, pickable, exchange, pickCost, cheapestPick, PICK_COSTS, PICK_TIERS, FOSSIL_ENERGY } from './fossils.js';
import { FLAVORS, makeOffer, eggLabel, naughtyRequest, NAUGHTY_BONUS } from './egg-traits.js';
import { ACHIEVEMENT_GROUPS, achievementStatus, claimAchievement } from './achievements.js';
import { RECIPES } from './recipes.js';
import * as lab from './lab.js';
import { ensureBingo, bingoStatus, bingoReady, claimBingo, REWARDS as BINGO_REWARDS } from './bingo.js';
import { PASSIVE, SNAP, DAILY_GIFT, accruePassive, giftReady, claimGift, snapsToday, takeSnap, greet, pet, feedSnack, snacksLeft, PET, SNACK, photoSeen, rememberPhoto } from './energy.js';
import { checkIn } from './travel.js';
import { cloudConfig, saveCloudConfig, createCloud, isInvite } from './cloud.js';
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
import { loadCounties, countyAt, spotAt, offshoreAt, MAIN_ISLAND, currentPosition, geoPermission } from './geo.js';
import { createRoom, residentsFor, saveResidents, welcomeResident, ROOM_KEY, ROOM_LIMIT } from './room.js';
import { WISH_REWARD, PASS_RATIO, WISH_POOL, todayKey, analyzePhoto, photoStats, judge, actProgress, quizReply, isPhotoWish, inWindow, wishById } from './wishes.js';
import { createMissions } from './missions.js';
import { createResearch } from './research.js';
import { studyPair } from './research-notes.js';
import { DAILY_XP, GROWTH_XP, GROWTH_ENERGY, XP_PER_LEVEL, playerLevel, rankTitle, ensureDaily, completeDaily, growthGoals, goalProgress, claimGrowth, describeChapterReward, todaysWishList, swapTodayWish } from './progression.js';
import * as install from './install.js';
import { CHARACTER_REPORTS, SERIES_REPORTS } from './errand-copy.js';
import { PLACES, HOME_TASKS, STORIES, errandSlots, errandSlotHint, depart, collect, recall, busyNos, awayNos, returned, isBack, hasAffinity, storyFor, fmtLeft, tossCard, CARD_RECYCLE } from './errands.js';
import { watchForUpdates, loadChangelog, unseen, markSeen, noteNewPlayer, serverTime } from './updates.js';
import * as events from './events.js';
const { noteServerTime } = events;
import { SEGMENTS, STAKES, WHEEL_SPINS, spin as spinWheel, spinsLeft } from './wheel.js';
import { gain as gainBond, homeTick, bondInfo, bondText, LEVELS, MAX_LEVEL, UNLOCK_LABEL, DAILY_CAP, GAIN as BOND_GAIN, describeLevelReward, cookLeft, COOK_CAP } from './affection.js';
const GAIN_ERRAND = BOND_GAIN.errand;
import * as battle from './battle.js';
import { siangStatuses, statusCounts } from './siang-status.js';
import * as kitchen from './kitchen.js';
import { talkFor } from './luck-talk.js';
import { residentLine } from './resident-lines.js';
import { SCENES as UNLUCKY_SCENES, unluckyDue, grantUnlucky } from './unlucky.js';
import { CHECKIN_REWARDS, ensureCheckin, checkIn as monthlyCheckIn, checkedToday, daysInMonth } from './checkin.js';
import { battleArchive, bondArchive, travelArchive } from './archive.js';
import { REVIEW_LABEL } from './gugu-reviews.js';
import * as guide from './guide.js';
import { pushState, enablePush, disablePush, refreshPush } from './push.js';
import { PRESENTER_KEY, selectedPresenter, presenterCopy, recentPresenters, rememberPresenter } from './wish-presenter.js';

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

const wishBook = createMissions({ book: $('book'), steps: $('book-gems'), onShoot: (wish, file) => onPhoto(wish, file), onClaim: (wish, choice) => onClaimWish(wish, choice), onSelect: renderWishCompanion, onSwap: (wish, i) => void onSwapWish(wish, i) });
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
// 歐非彩蛋：兩位輪流冒對話框
const luckTalkAt = new Map(); let luckTalkTimers = [];
let lastTapAt = Date.now(); // 待機台詞：太久沒點居民，聞止水會說「睡著了？」
function playLuckTalk(talk) {
  luckTalkAt.set(talk.pair.join(), Date.now());
  luckTalkTimers.forEach(clearTimeout); luckTalkTimers = [];
  talk.lines.forEach(([no, text], i) => luckTalkTimers.push(setTimeout(() => room.bubble(no, text, 2500), i * 2300)));
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
  const talk = talkFor(character.no, room.residents());
  if (talk && Date.now() - (luckTalkAt.get(talk.pair.join()) || 0) > 10 * 60 * 1000) playLuckTalk(talk); // 歐非彩蛋：同一對 10 分鐘演一次
  else say(residentLine(character.no, { level: bondInfo(state, character.no, todayKey()).level, residents: room.residents(), idleMs: Date.now() - lastTapAt }) || character.line, 'happy', 4000);
  lastTapAt = Date.now();
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
    if (task?.type === 'greet' && task.accepted !== false && task.target === character.no) void finishTask();
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
  onBrew: async (recipeId) => {
    const t = await updateState(current => lab.startBrew(current, recipeId, { busy: new Set([...busyNos(current), ...battle.battleNos(current)]) }));
    state = t.state; renderAll();
    if (typeof t.result === 'string') return t.result;
    const names = t.result.recipe.members.map(no => CHARACTERS[no].name).join('和');
    toast(`🧪 ${names}進研究室了！${t.result.recipe.days} 天後見～`);
    return null;
  },
  onCancelBrew: async () => { const t = await updateState(current => lab.cancelBrew(current)); state = t.state; renderAll(); },
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

  $('egg-name').textContent = CHARACTERS[state.egg.character]?.badge ? `${CHARACTERS[state.egg.character].name}專屬蛋` : state.egg.county ? `${egg.name} · ${state.egg.county}` : eggLabel(state.egg, egg.name);
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
  renderSideCradles();
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

  const away = new Set([...awayNos(state), ...(state.battle?.active || []).filter(a => !battle.isBack(a)).flatMap(a => a.nos), ...lab.labNos(state)]); // 研究室調配中的不在首頁
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
  const gift = exploredToday ? todayGift(state) : null;
  $('explore').classList.toggle('is-gifted', Boolean(gift)); // 今天的探索禮物收過了（湘 11/25 選 C）
  $('explore').classList.toggle('is-flash', Boolean(gift) && Date.now() < giftFlashUntil);
  $('explore').classList.toggle('is-compact', exploredToday && !exploring);
  $('explore').setAttribute('aria-label', gift ? `今天的探索禮物已收到：${giftLabel(gift)}，再探索一次附近` : exploredToday ? '再探索一次附近' : '探索附近');
  $('explore-tag').textContent = gift ? `${giftShort(gift)} ✓` : '';
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
    image.classList.toggle('is-cheshire', Boolean(id && CHARACTERS[id].cheshire));
    image.alt = id ? CHARACTERS[id].name : '蛋裡的小湘';
    loadWithFallback(image, id ? characterSources(CHARACTERS[id].image) : eggLayerSources('origin', 'shell'));
  }
  $('wish-line').textContent = `「${wish.copy.line}」`;
  $('wish-speaker').textContent = `— ${wish.copy.speaker}`;
  $('open-presenter').textContent = id ? '切換小湘 ⌄' : '等待初次相遇 ⌄';
}

let swapBusy = false;
async function onSwapWish(wish, index) {
  if (swapBusy || photoBusy) return;
  swapBusy = true;
  try {
    const t = await updateState(current => swapTodayWish(current, index));
    state = t.state;
    if (t.result.ok) { const next = wishById(t.result.to); toast(`換好了！新的願望：${next?.name || next?.label || '去看看吧'}`); }
    else toast(t.result.reason);
  } finally { swapBusy = false; renderAll(); }
}
function renderWishes(effects = {}) {
  const wishes = todaysWishes();
  const done = wishes.filter(w => w.done).length;
  const now = new Date();
  $('book-day').textContent = `${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
  $('book-progress').textContent = `今日 ${done} / 3`;
  const feedback = photoBusy ? { scanning: activePhotoId, ...effects } : effects;
  wishBook.update(wishes, WISH_REWARD, feedback, { date: state.wishes.date, canSwap: !state.wishes.swapped });
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
  $('growth-action').textContent = pending ? ({ daily: '去實現今日願望 ⟶', incubate: '前往培育 ⟶', errands: '派小湘出門 ⟶', home: '回首頁 ⟶', dex: '看看圖鑑 ⟶', kitchen: '去小湘廚房 ⟶', battle: '去對戰 ⟶', achievements: '看看成就 ⟶' }[pending.destination] || '前往培育 ⟶') : chapter.goals.some(g => !goalProgress(state, g).claimed) ? '領取已完成的願望' : '看看今日願望 ⟶';
}

// 存在 gifts.eggs 裡的蛋（暗號、紀念、約會、星光、墨痕）
const GIFT_EGGS = ['cipher', 'keepsake', 'date', 'star', 'mohen'];
// 從蛋庫取出的蛋（願望蛋、縣市蛋）
function eggStock(s, id) {
  if (id === 'wish') return s.wishEgg?.stock || 0;
  if (id === 'county') return s.travel?.eggs?.length || 0;
  if (id === 'weather') return s.weather?.stock || 0;
  if (GIFT_EGGS.includes(id)) return s.gifts?.eggs?.filter(e => e.egg === id).length || 0;
  return 0;
}
function returnEgg(s, egg) {
  if (egg.id === 'wish') s.wishEgg.stock += 1;
  if (egg.id === 'county' && egg.county) s.travel.eggs.unshift(egg.county);
  if (egg.id === 'weather') s.weather.stock += 1;
  if (GIFT_EGGS.includes(egg.id)) s.gifts.eggs.unshift({ egg: egg.id, ...(egg.character ? { character: egg.character } : {}), from: 'returned', at: egg.since });
}
function takeEgg(s, egg, county, character) {
  if (egg.id === 'wish') s.wishEgg.stock -= 1;
  if (egg.id === 'county') {
    const i = county ? s.travel.eggs.indexOf(county) : 0;
    egg.county = s.travel.eggs.splice(Math.max(i, 0), 1)[0];
  }
  if (egg.id === 'weather') s.weather.stock -= 1;
  if (GIFT_EGGS.includes(egg.id)) {
    let i = character ? s.gifts.eggs.findIndex(e => giftMatch(e, egg.id, character)) : -1;
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
  if (prev.warmth > 0) current.shelf.unshift(prev); // 剛換下來的蛋放最前面：有副架的話，它會在副架上繼續保溫
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
const EGG_CATEGORIES = ['ordinary', 'wish', 'weather', 'county', 'cipher', 'keepsake', 'date', 'star'];
// 異世活動的蛋：有排活動、或手上／架上有這種蛋才顯示分類
const eggCategories = () => EGG_CATEGORIES.concat(['mohen'].filter(id => eggStock(state, id) || state.egg.id === id || state.shelf.some(x => x.id === id) || events.activeEvents(state, Date.now()).some(x => x.def.world === EGGS[id].world)));
let eggCategory = null;
const eggArt = (egg, pct = 0) => { const art = document.createElement('div'); art.className = 'egg-choice__art'; art.setAttribute('aria-hidden', 'true'); const v = createEggView(egg); v.setProgress(pct); art.append(v.el); return art; };
const swapLabel = () => sideTarget !== null ? (pickBlocked() ? '暫放架滿了，先孵完一顆' : state.shelf[sideTarget] ? '換進這一格副架' : '放進這一格副架') : shelfFull(state) ? '暫放架滿了，先孵完一顆' : state.egg.warmth > 0 ? '換這顆（目前的蛋會暫放）' : '選擇這顆蛋';

// 副架換蛋（湘 11/22）：點副架某一格 → 打開選蛋清單，選的蛋放進「那一格副架」，主架的蛋不動；
// 原本那顆回暫放架（還沒孵過的庫存蛋收回蛋庫），保溫進度都跟著蛋走
let sideTarget = null;
const sideSlots = (s) => Math.max(0, (s.cradle?.slots || 1) - 1);
const sideKeepsOld = (s, i) => { const old = s.shelf[i]; return Boolean(old) && !(old.warmth === 0 && EGGS[old.id]?.stocked); };
const sideRoom = (s, i) => !sideKeepsOld(s, i) || s.shelf.length < SHELF_MAX;
const pickBlocked = () => sideTarget === null ? shelfFull(state) : !sideRoom(state, sideTarget);
function canSideEgg(s, id) {
  if (!EGGS[id] || id === 'origin' || !(s.hatched > 0 || s.dex['001'])) return false;
  if (EGGS[id].stocked && eggStock(s, id) <= 0) return false;
  return sideRoom(s, sideTarget);
}
function placeOnSide(current, i, ds) {
  if (i === null || i >= sideSlots(current)) return false;
  const here = state.shelf[i];
  const sameHere = () => current.shelf[i] && current.shelf[i].id === here?.id && current.shelf[i].since === here?.since;
  if (ds.sideMain !== undefined) { // 跟主架互換
    if (!sameHere()) return false;
    const next = current.shelf[i]; current.shelf[i] = current.egg; current.egg = next; return 'main';
  }
  if (ds.shelf !== undefined) { // 暫放架上的蛋換進這一格，原本這格的蛋去它的位置
    const saved = state.shelf[Number(ds.shelf)];
    const j = current.shelf.findIndex(e => e.id === saved?.id && e.since === saved?.since);
    if (j < sideSlots(current) || !sameHere()) return false;
    [current.shelf[i], current.shelf[j]] = [current.shelf[j], current.shelf[i]];
    return 'shelf';
  }
  if (here && !sameHere()) return false;
  if (!sideRoom(current, i)) return false;
  const { egg: id, county, character } = ds;
  let next;
  if (county) {
    if (!current.travel?.eggs?.includes(county)) return false;
    next = newEgg('county'); takeEgg(current, next, county);
  } else {
    if (!canSideEgg(current, id)) return false;
    if (character && !current.gifts.eggs.some(g => giftMatch(g, id, character))) return false;
    next = newEgg(id); if (EGGS[id].stocked) takeEgg(current, next, null, character);
  }
  const old = i < current.shelf.length ? current.shelf.splice(i, 1)[0] : null;
  current.shelf.splice(Math.min(i, current.shelf.length), 0, next);
  if (!old) return 'placed';
  if (old.warmth === 0 && EGGS[old.id]?.stocked) { returnEgg(current, old); return 'stock'; }
  const at = Math.min(sideSlots(current), current.shelf.length);
  current.shelf.splice(at, 0, old);
  return at < sideSlots(current) ? 'side' : 'back';
}
function openSidePicker(i) {
  state = loadState(); sideTarget = i; eggCategory = null; renderEggChoices(); $('egg-picker-feedback').textContent = ''; $('egg-picker').showModal(); syncRoomActivity();
}

// 副架：用化石擴充後，培養架旁邊多出來的保溫位置（放暫放架最前面的蛋）
function renderSideCradles() {
  const host = $('side-cradles'); if (!host) return;
  const extra = Math.max(0, (state.cradle?.slots || 1) - 1);
  host.hidden = !extra;
  if (!extra) { host.replaceChildren(); return; }
  const head = document.createElement('p'); head.className = 'side-cradles__head'; head.textContent = `副架 · ${extra} 格（點一下換蛋，放這裡也會自動保溫）`;
  const row = document.createElement('div'); row.className = 'side-cradles__row';
  for (let i = 0; i < extra; i++) {
    const saved = state.shelf[i];
    const b = document.createElement('button'); b.type = 'button'; b.className = `side-cradle${saved ? '' : ' is-empty'}`;
    if (saved) {
      const egg = EGGS[saved.id]; const pct = Math.min(100, Math.round(100 * saved.warmth / egg.warmthNeeded));
      b.dataset.sideShelf = String(i); b.disabled = busy;
      const t = document.createElement('span'); t.className = 'side-cradle__name'; t.textContent = saved.county ? `${egg.name}·${saved.county}` : eggLabel(saved, egg.name);
      const s = document.createElement('span'); s.className = 'side-cradle__pct'; s.textContent = `保溫中 ${pct}%`;
      b.setAttribute('aria-label', `副架上的${t.textContent}，孵化進度 ${pct}%，點一下換這一格的蛋`);
      const go = document.createElement('span'); go.className = 'side-cradle__swap'; go.setAttribute('aria-hidden', 'true'); go.textContent = '換這格的蛋';
      b.append(eggArt(egg, pct), t, s, go);
    } else {
      b.dataset.sideEmpty = String(i);
      const t = document.createElement('span'); t.className = 'side-cradle__name'; t.textContent = '空的副架';
      const s = document.createElement('span'); s.className = 'side-cradle__pct'; s.textContent = '點一下，選一顆蛋放上來保溫';
      b.append(t, s);
    }
    row.append(b);
  }
  host.replaceChildren(head, row);
}
function shelfCard(saved, index) {
  const egg = EGGS[saved.id];
  const onSide = sideTarget !== null && index < sideSlots(state);
  const card = document.createElement('button'); card.type = 'button'; card.className = 'egg-choice egg-choice--shelf'; card.dataset.shelf = String(index); card.disabled = busy || (sideTarget !== null ? onSide || !state.shelf[sideTarget] : shelfFull(state));
  const pct = Math.min(100, Math.round(100 * saved.warmth / egg.warmthNeeded));
  const content = document.createElement('div');
  const title = document.createElement('h3'); title.textContent = CHARACTERS[saved.character]?.badge ? `${CHARACTERS[saved.character].name}專屬蛋` : saved.county ? `${egg.name} · ${saved.county}` : eggLabel(saved, egg.name);
  const detail = document.createElement('p'); detail.textContent = `${index < (state.cradle?.slots || 1) - 1 ? '副架保溫中' : '暫放中'} · 孵化進度 ${pct}%（${saved.warmth} / ${egg.warmthNeeded}）`;
  const label = document.createElement('span'); label.className = 'egg-choice__state'; label.textContent = sideTarget !== null ? (index === sideTarget ? '就是這一格' : onSide ? '已經在副架上' : state.shelf[sideTarget] ? '換進這一格副架' : '已經在暫放架') : shelfFull(state) ? '暫放架滿了，先孵完一顆' : '繼續培育這顆';
  content.append(title, detail, label); card.append(eggArt(egg, pct), content); return card;
}
function countyCard(county) {
  const egg = EGGS.county;
  const card = document.createElement('button'); card.type = 'button'; card.className = 'egg-choice'; card.dataset.egg = 'county'; card.dataset.county = county; card.disabled = busy || pickBlocked();
  const content = document.createElement('div');
  const title = document.createElement('h3'); title.textContent = `${egg.name} · ${county}`;
  const detail = document.createElement('p'); detail.textContent = `固定遇見${CHARACTERS[COUNTY_CHARACTER[county]]?.name || '這裡的小湘'}`;
  const cost = document.createElement('p'); cost.textContent = `孵化需要 ${egg.warmthNeeded} 能量`;
  const label = document.createElement('span'); label.className = 'egg-choice__state'; label.textContent = swapLabel();
  content.append(title, detail, cost, label); card.append(eggArt(egg), content); return card;
}
// 禮物蛋（紀念、約會；暗號蛋是驚喜不列）一顆一顆列出來，同一位的疊成一張，可以自己選先孵哪顆（湘 11/20）
const giftKey = (gift) => gift.character || 'random';
const giftMatch = (gift, id, key) => gift.egg === id && giftKey(gift) === key;
function giftCards(id) {
  const groups = new Map();
  for (const g of state.gifts.eggs.filter(g => g.egg === id)) groups.set(giftKey(g), (groups.get(giftKey(g)) || 0) + 1);
  return [...groups].map(([key, n]) => giftCard(id, key, n));
}
function giftCard(id, key, n = 1) {
  const egg = EGGS[id]; const c = CHARACTERS[key];
  const card = document.createElement('button'); card.type = 'button'; card.className = 'egg-choice'; card.dataset.egg = id; card.dataset.character = key; card.disabled = busy || pickBlocked();
  const content = document.createElement('div');
  const title = document.createElement('h3'); title.textContent = c?.badge ? `${c.name}專屬蛋` : egg.name;
  const detail = document.createElement('p'); detail.textContent = c ? `裡面是${c.name}` : '隨機遇見一位約會小湘';
  const cost = document.createElement('p'); cost.textContent = `孵化需要 ${egg.warmthNeeded} 能量${n > 1 ? ` · 持有 ${n} 顆` : ''}`;
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
  const side = sideTarget !== null ? state.shelf[sideTarget] : null;
  const sideName = side ? (side.county ? `${EGGS[side.id].name}·${side.county}` : eggLabel(side, EGGS[side.id].name)) : '';
  if (!eggCategory) {
   if (sideTarget !== null) {
    $('egg-picker-title').textContent = `換副架第 ${sideTarget + 1} 格的蛋`;
    $('egg-picker-note').textContent = side ? `選一顆蛋放進這一格，主架的蛋不會動。原本的「${sideName}」會回到暫放架，進度都還在。` : '選一顆蛋放進這一格副架，主架的蛋不會動；放在副架的蛋也會自動保溫。';
   } else {
    $('egg-picker-title').textContent = '選擇培育的蛋';
    $('egg-picker-note').textContent = firstHatched ? `先選一個分類。換蛋時，已經注入能量的蛋會放上暫放架（最多 ${SHELF_MAX} 顆），進度不會消失。` : '本源蛋是首次相遇的禮物；完成第一次孵化後，就能培育其他的蛋。';
   }
    const tiles = eggCategories().map(id => {
      const egg = EGGS[id]; const info = categoryInfo(id);
      const tile = document.createElement('button'); tile.type = 'button'; tile.className = 'egg-cat'; tile.dataset.cat = id; tile.disabled = !firstHatched;
      tile.setAttribute('aria-pressed', String(info.current && sideTarget === null));
      const name = document.createElement('b'); name.textContent = egg.name;
      const sub = document.createElement('small');
      sub.textContent = !firstHatched ? '首次孵化後解鎖' : [info.current && sideTarget === null && '培育中', info.shelved && `暫放 ${info.shelved}`, info.stock !== null && `持有 ${info.stock}`].filter(Boolean).join(' · ') || (id === 'ordinary' ? '隨時都有' : '還沒有');
      tile.append(eggArt(egg), name, sub);
      if (info.stock || info.shelved) tile.classList.add('has-eggs');
      return tile;
    });
    const grid = document.createElement('div'); grid.className = 'egg-cats'; grid.append(...tiles);
    const extras = [];
    if (sideTarget !== null && side) { // 想要的話也可以直接跟主架互換
      const mainEgg = EGGS[state.egg.id]; const pct = Math.min(100, Math.round(100 * side.warmth / EGGS[side.id].warmthNeeded));
      const card = document.createElement('button'); card.type = 'button'; card.className = 'egg-choice egg-choice--shelf'; card.dataset.sideMain = '1'; card.disabled = busy || Boolean(state.eggOffer);
      const content = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = `⇄ 跟主架互換`;
      const detail = document.createElement('p'); detail.textContent = `「${sideName}」（${pct}%）換到主架，主架的「${state.egg.county ? `${mainEgg.name}·${state.egg.county}` : eggLabel(state.egg, mainEgg.name)}」放到這一格`;
      const label = document.createElement('span'); label.className = 'egg-choice__state'; label.textContent = '互換';
      content.append(title, detail, label); card.append(eggArt(EGGS[side.id], pct), content); extras.push(card);
    }
    if (sideTarget !== null && !sideRoom(state, sideTarget)) $('egg-picker-note').textContent += `（暫放架滿了，最多 ${SHELF_MAX} 顆，只能跟暫放中的蛋或主架互換）`;
    $('egg-choices').replaceChildren(...(firstHatched ? [] : [eggCard(EGGS.origin)]), ...extras, grid);
    return;
  }
  const egg = EGGS[eggCategory];
  $('egg-picker-title').textContent = sideTarget !== null ? `副架第 ${sideTarget + 1} 格 · ${egg.name}` : egg.name;
  const back = document.createElement('button'); back.type = 'button'; back.className = 'egg-back'; back.dataset.back = '1'; back.textContent = '‹ 所有分類';
  const shelved = state.shelf.map((saved, index) => [saved, index]).filter(([saved]) => saved.id === eggCategory).map(([saved, index]) => shelfCard(saved, index));
  let fresh;
  const mainHere = (id) => sideTarget === null && state.egg.id === id;
  if (eggCategory === 'county') fresh = [...(mainHere('county') ? [eggCard(egg)] : []), ...(state.travel?.eggs || []).map(countyCard)];
  else if (['keepsake', 'date'].includes(eggCategory) && state.gifts.eggs.some(g => g.egg === eggCategory)) fresh = [...(mainHere(eggCategory) ? [eggCard(egg)] : []), ...giftCards(eggCategory)];
  else fresh = [eggCard(egg)];
  if (!fresh.length) fresh = [eggCard(egg)];
  const detailText = { ordinary: '隨時都能培育的蛋，隨機遇見各種小湘。', wish: '三個願望全部完成的日子各得一枚願望印記，集滿 3 枚換一顆。', weather: '每天第一次感應到天氣時取得（需允許定位），每天最多一顆、最多存 2 顆。孵化時，當天的天氣會讓對應的天氣小湘更容易出現：晴天、陰天、下雨、打雷、起霧、大風、下雪、冰雹；雨後放晴有彩虹、黃昏有夕陽；感應過 4 種天氣後，天氣觀測師也會來。', county: '每天第一次按「探索附近」都會收到一顆蛋，大多是當地的縣市蛋（固定孵出當地的小湘），偶爾是願望蛋或天氣蛋。第一次到新縣市一定是縣市蛋。', cipher: '輸入湘給的暗號、完成她的委託時取得。', keepsake: '節日、小湘生日、走遍臺灣或徽章兌換時收到，固定孵出蛋裡指定的小湘。', mohen: '異世活動「墨痕江湖」的活動卡池：在墨玉閣用墨玉兌換，會遇見墨痕江湖的居民。', date: '見面時掃描湘的約會 QR Code 取得，會遇見約會小湘或蝰蝰♡。', star: '月簽到同一個月累積 28 天就會收到，裡面一定是 SR 以上的小湘。' }[eggCategory];
  $('egg-picker-note').textContent = detailText;
  const odds = egg.pool ? Object.assign(document.createElement('button'), { type: 'button', className: 'egg-odds-link', textContent: '📊 看這種蛋的機率表' }) : null;
  if (odds) odds.dataset.odds = egg.id;
  $('egg-choices').replaceChildren(back, ...(odds ? [odds] : []), ...(shelved.length ? [heading('暫放中'), ...shelved, heading('可以培育')] : []), ...fresh);
}

// 機率表（玩家想看，11/20）：基本機率＋「你現在」的機率（含沒遇過 ×2），沒遇過的名字先藏起來
const RARITY_ORDER = ['UR', 'SSR', 'SR', 'R', 'N'];
function openEggOdds(id) {
  const egg = EGGS[id]; if (!egg?.pool) return;
  const pool = activePool(egg, new Date(), state.dex); const total = Object.values(pool).reduce((a, b) => a + b, 0);
  const mine = Object.fromEntries(Object.entries(pool).map(([no, w]) => [no, state.dex[no] ? w : w * NEW_FACE_TIMES]));
  const mineTotal = Object.values(mine).reduce((a, b) => a + b, 0);
  const pct = (v) => { const x = v * 100; return x >= 10 ? `${x.toFixed(0)}%` : x >= 1 ? `${x.toFixed(1)}%` : `${x.toFixed(2)}%`; };
  const body = $('egg-odds-body');
  const intro = el('p', 'residents-intro', `${egg.name}裡共有 ${Object.keys(pool).length} 位小湘。「你現在」已經算進沒遇過的小湘 ×${NEW_FACE_TIMES}；蛋的個性、天氣和時間的加成另外算。`);
  const luck = el('div', 'egg-odds__luck');
  luck.append(el('span', '', `連續重複 ${Math.min(state.dupStreak || 0, DUP_PITY)} / ${DUP_PITY}（到了下一顆必定是新面孔）`), el('span', '', `沒出 SR 以上 ${Math.min(state.srStreak || 0, SR_PITY - 1)} / ${SR_PITY - 1}（到了下一顆必定 SR 以上）`));
  const sections = RARITY_ORDER.map(r => {
    const list = Object.keys(pool).filter(no => CHARACTERS[no]?.rarity === r);
    if (!list.length) return null;
    const sec = el('section', 'egg-odds__group');
    const sum = list.reduce((a, no) => a + pool[no], 0) / total; const sumMine = list.reduce((a, no) => a + mine[no], 0) / mineTotal;
    const h = el('h3', 'egg-odds__rarity'); h.append(el('b', '', r), el('span', '', `基本 ${pct(sum)} · 你現在 ${pct(sumMine)}`));
    const ul = el('ul', 'egg-odds__list');
    for (const no of list.sort((a, b) => pool[b] - pool[a] || a.localeCompare(b))) {
      const met = Boolean(state.dex[no]);
      const li = el('li', met ? '' : 'is-new');
      li.append(el('span', '', met ? CHARACTERS[no].name : `？？？（${noLabel(no)}）`), el('small', '', met ? pct(pool[no] / total) : `${pct(pool[no] / total)} → ${pct(mine[no] / mineTotal)}`));
      ul.append(li);
    }
    sec.append(h, ul); return sec;
  }).filter(Boolean);
  body.replaceChildren(intro, luck, ...sections);
  $('egg-odds-title').textContent = `${egg.name}的機率表`;
  const back = $('egg-picker').open; $('egg-odds').dataset.back = back ? '1' : '';
  if (back) $('egg-picker').close(); // 不疊在選蛋視窗上（半透明會透出底下的字），關掉再回去
  $('egg-odds').showModal(); $('egg-odds').scrollTop = 0;
}
$('close-egg-odds').addEventListener('click', () => $('egg-odds').close());
$('egg-odds').addEventListener('close', () => { if ($('egg-odds').dataset.back) { $('egg-odds').dataset.back = ''; renderEggChoices(); $('egg-picker').showModal(); } });
$('egg-choices').addEventListener('click', (e) => { const b = e.target.closest('[data-odds]'); if (b) { e.stopPropagation(); openEggOdds(b.dataset.odds); } }, true);

function eggCard(egg) {
  const firstHatched = state.hatched > 0 || Boolean(state.dex['001']);
  {
    const current = sideTarget === null && state.egg.id === egg.id;
    const card = document.createElement('button'); card.type = 'button'; card.className = 'egg-choice'; card.dataset.egg = egg.id; card.setAttribute('aria-pressed', String(current)); card.disabled = busy || !(sideTarget !== null ? canSideEgg(state, egg.id) : canChooseEgg(state, egg.id));
    const art = document.createElement('div'); art.className = 'egg-choice__art'; art.setAttribute('aria-hidden', 'true');
    const preview = createEggView(egg); preview.setProgress(0); art.append(preview.el);
    const content = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = current && CHARACTERS[state.egg.character]?.badge ? `${CHARACTERS[state.egg.character].name}專屬蛋` : current && state.egg.county ? `${egg.name} · ${state.egg.county}` : egg.name;
    const detail = document.createElement('p'); detail.textContent = egg.id === 'origin' ? '固定遇見原味小湘' : egg.id === 'keepsake' ? '紀念特別日子的蛋，固定遇見那一天的小湘' : egg.id === 'cipher' ? '湘準備的驚喜，裡面也許是她指定的小湘' : egg.id === 'star' ? `月簽到的獎勵，一定是 SR 以上（${Object.keys(activePool(egg, new Date(), state.dex)).length} 種）` : egg.id === 'weather' ? `天氣的蛋，今天的天氣決定誰比較容易出現（${Object.keys(activePool(egg, new Date(), state.dex)).length} 種）` : egg.byCounty ? `固定遇見打卡縣市的小湘${current && state.egg.county ? `（${state.egg.county}）` : ''}` : `隨機遇見 ${Object.keys(activePool(egg, new Date(), state.dex)).length} 種小湘${egg.id === 'wish' ? '，R 與 SR 機率較高' : '，可能重複'}`;
    const cost = document.createElement('p'); cost.textContent = `孵化需要 ${egg.warmthNeeded} 能量`;
    const stock = eggStock(state, egg.id);
    const label = document.createElement('span'); label.className = 'egg-choice__state'; label.textContent = current ? '✓ 正在培育' : egg.id === 'origin' && firstHatched ? '首次相遇限定 · 已完成' : !firstHatched && egg.id !== 'origin' ? '首次孵化後解鎖' : egg.stocked && !stock ? '尚未持有' : swapLabel();
    content.append(title, detail, cost);
    if (egg.stocked) {
      const own = document.createElement('p'); own.className = 'egg-choice__stock';
      own.textContent = egg.id === 'wish'
        ? `持有 ${stock} 顆 · 願望印記 ${state.wishEgg?.stamps || 0} / ${WISH_STAMPS_PER_EGG}（三個願望全部完成的日子各得一枚）`
        : egg.id === 'weather' ? `持有 ${stock} 顆（每天第一次感應到天氣時取得）`
        : egg.id === 'cipher' ? `持有 ${stock} 顆（輸入湘給的暗號、完成她的委託時取得）`
        : egg.id === 'star' ? `持有 ${stock} 顆（月簽到滿 28 天取得，一定是 SR 以上）`
        : egg.id === 'mohen' ? `持有 ${stock} 顆（墨痕江湖活動期間，在墨玉閣用墨玉兌換）`
        : egg.id === 'date' ? (stock ? `持有 ${stock} 顆：${state.gifts.eggs.filter(e => e.egg === 'date').map(e => CHARACTERS[e.character]?.name || '隨機').join('、')}` : '見面時掃描湘的約會 QR Code 取得')
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

let presenterFilter = 'all';
function presenterTile(character, selected, extraClass = '') {
  const button = document.createElement('button'); button.type = 'button';
  button.className = `presenter-tile${extraClass}`; button.dataset.presenter = character.no;
  const on = selected === character.no;
  button.setAttribute('aria-pressed', String(on));
  button.setAttribute('aria-label', `${character.name}，${character.rarity}${on ? '，陪伴中' : ''}`);
  const image = document.createElement('img'); image.alt = ''; image.loading = 'lazy'; image.decoding = 'async'; loadWithFallback(image, characterSources(character.image));
  const name = document.createElement('span'); name.className = 'presenter-tile__name'; name.textContent = character.name.replace(/小湘$/, '') || character.name;
  const rarity = document.createElement('i'); rarity.className = 'presenter-tile__rarity'; rarity.dataset.rarity = character.rarity; rarity.textContent = character.rarity;
  button.append(image, name, rarity);
  if (on) button.append(Object.assign(document.createElement('i'), { className: 'presenter-tile__check', textContent: '✓' }));
  return button;
}
function renderPresenterNow(selected, total) {
  const box = $('presenter-now'); const c = CHARACTERS[selected];
  box.hidden = !c; if (!c) return;
  const img = document.createElement('img'); img.alt = ''; loadWithFallback(img, characterSources(c.image));
  const text = document.createElement('div'); text.className = 'presenter-now__text';
  text.append(
    Object.assign(document.createElement('small'), { textContent: '現在陪著你' }),
    Object.assign(document.createElement('b'), { textContent: c.name }),
    Object.assign(document.createElement('span'), { textContent: `${noLabel(c.no)} · ${c.rarity} · ${SERIES[c.series]?.name || ''}` }),
  );
  const count = Object.assign(document.createElement('em'), { className: 'presenter-now__count', textContent: `共 ${total} 位` });
  box.replaceChildren(img, text, count);
}
function renderPresenterList() {
  const selected = selectedPresenter(state);
  const owned = Object.values(CHARACTERS).filter(c => state.dex[c.no]);
  const query = $('presenter-search').value.trim().toLowerCase().replace(/^no\.?/, '');
  const recent = recentPresenters(state).filter(no => no !== selected);
  const list = $('presenter-list');
  // 篩選鈕：全部、最近（有紀錄才出現）、各系列
  const series = Object.keys(SERIES).filter(id => owned.some(c => c.series === id));
  if (presenterFilter === 'recent' && !recent.length) presenterFilter = 'all';
  if (presenterFilter !== 'all' && presenterFilter !== 'recent' && !series.includes(presenterFilter)) presenterFilter = 'all';
  const chips = [['all', `全部 ${owned.length}`], ...(recent.length ? [['recent', '最近']] : []), ...series.map(id => [id, `${SERIES[id].short} ${owned.filter(c => c.series === id).length}`])];
  $('presenter-filters').replaceChildren(...chips.map(([id, label]) => {
    const chip = document.createElement('button'); chip.type = 'button'; chip.className = 'presenter-filter'; chip.dataset.filter = id; chip.textContent = label;
    chip.setAttribute('aria-pressed', String(presenterFilter === id)); return chip;
  }));
  let pool = owned;
  if (query) pool = owned.filter(c => c.name.toLowerCase().includes(query) || c.no.includes(query) || (SERIES[c.series]?.name || '').includes(query) || c.rarity.toLowerCase() === query);
  else if (presenterFilter === 'recent') pool = recent.map(no => CHARACTERS[no]);
  else if (presenterFilter !== 'all') pool = owned.filter(c => c.series === presenterFilter);
  const grid = items => { const g = document.createElement('div'); g.className = 'presenter-grid'; g.append(...items.map(c => presenterTile(c, selected, ' presenter-choice'))); return g; };
  const head = text => Object.assign(document.createElement('p'), { className: 'residents-series presenter-series', textContent: text });
  if (!pool.length) { list.replaceChildren(Object.assign(document.createElement('p'), { className: 'presenter-empty', textContent: query ? `找不到「${$('presenter-search').value.trim()}」，換個字試試看。` : '這裡還沒有小湘。' })); return; }
  if (query || presenterFilter !== 'all') { list.replaceChildren(grid(pool)); return; }
  const groups = Object.keys(SERIES).map(id => [id, owned.filter(c => c.series === id)]).filter(([, l]) => l.length);
  if (groups.length === 1) { list.replaceChildren(grid(owned)); return; }
  const parts = [];
  if (recent.length && owned.length > 8) {
    const row = document.createElement('div'); row.className = 'presenter-grid presenter-grid--recent';
    row.append(...recent.slice(0, 4).map(no => presenterTile(CHARACTERS[no], selected, ' is-recent')));
    parts.push(head('最近陪伴'), row);
  }
  for (const [id, l] of groups) parts.push(head(`${SERIES[id].name} · ${l.length}`), grid(l));
  list.replaceChildren(...parts);
}
function renderPresenters() {
  const selected = selectedPresenter(state);
  const owned = Object.values(CHARACTERS).filter(c => state.dex[c.no]);
  renderPresenterNow(selected, owned.length);
  $('presenter-tools').hidden = owned.length < 2;
  if (!owned.length) {
    const text = document.createElement('p'); text.className = 'residents-intro'; text.textContent = '先前往培育，迎接第一位小湘。孵化後就能選擇陪伴你的角色。';
    const action = document.createElement('button'); action.type = 'button'; action.className = 'btn'; action.textContent = '前往培育'; action.addEventListener('click', () => showView('incubate')); $('presenter-list').replaceChildren(text, action);
    return;
  }
  renderPresenterList();
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
  try { const m = localStorage.getItem(DEX_MODE_KEY); return ['series', 'rarity', 'power'].includes(m) ? m : 'all'; } catch { return 'all'; }
}
document.querySelectorAll('[data-dex-mode]').forEach((button) => button.addEventListener('click', () => {
  try { localStorage.setItem(DEX_MODE_KEY, button.dataset.dexMode); } catch {}
  renderDex();
}));

// 圖鑑分世界（頁間居民 2.0，湘 11/25）：創始系列＝小湘們，其他是「異世」的各個世界
const DEX_WORLD_KEY = 'siang-collector:dex-world:v1';
function dexWorld() {
  try { const w = localStorage.getItem(DEX_WORLD_KEY); return WORLDS[w] ? w : 'origin'; } catch { return 'origin'; }
}
function renderDexWorlds(current) {
  const all = Object.values(CHARACTERS);
  const tally = (id) => { const m = all.filter((c) => worldOf(c) === id); return [m.filter((c) => state.dex[c.no]).length, m.length]; };
  const others = Object.keys(WORLDS).filter((id) => id !== 'origin' && tally(id)[1]);
  const pick = (id) => { try { localStorage.setItem(DEX_WORLD_KEY, id); } catch {} renderDex(); };
  const tab = (cls, selected, onClick) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(selected)); b.addEventListener('click', onClick); return b; };
  // 第一層：創始｜異世（湘 11/25 選兩層）
  const realms = $('dex-realms'); realms.hidden = !others.length;
  const inOther = current !== 'origin';
  const sum = others.reduce((a, id) => { const [g, n] = tally(id); return [a[0] + g, a[1] + n]; }, [0, 0]);
  const realm = (label, [g, n], sel, go) => { const b = tab('dex-realm', sel, go); b.append(label, Object.assign(document.createElement('small'), { textContent: `${g}/${n}` })); return b; };
  realms.replaceChildren(realm('創始', tally('origin'), !inOther, () => pick('origin')), realm('異世', sum, inOther, () => pick(inOther ? current : others[0])));
  // 第二層：異世裡的各個世界，多了可以左右滑
  const box = $('dex-worlds'); box.hidden = !inOther;
  box.replaceChildren(...(inOther ? others : []).map((id) => {
    const w = WORLDS[id], [g, n] = tally(id);
    const b = tab(`dex-world dex-world--${id}`, id === current, () => pick(id)); b.dataset.dexWorld = id;
    b.append(Object.assign(document.createElement('span'), { className: 'dex-world__seal', textContent: w.seal || w.name[0] }), Object.assign(document.createElement('b'), { textContent: w.name }), Object.assign(document.createElement('small'), { textContent: `${g}/${n}` }));
    return b;
  }));
}

function dexCard(c) {
  const has = Boolean(state.dex[c.no]);
  const li = document.createElement('li');
  li.className = `dex__card card${has ? ' is-owned' : ''}`;
  li.dataset.dexNo = c.no; li.tabIndex = 0; li.setAttribute('role', 'button'); li.setAttribute('aria-label', `查看 ${noLabel(c.no)} ${has ? c.name : '尚未收集的小湘'}`);
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
  no.textContent = noLabel(c.no);
  const name = document.createElement('div');
  name.className = 'dex__name';
  name.textContent = has ? c.name : '???';
  li.append(img, no, name);
  if (has) {
    const b = bondInfo(state, c.no, todayKey());
    if (b.level > 1) { const tag = document.createElement('span'); tag.className = 'dex__bond'; tag.textContent = `♥ ${b.level}`; li.append(tag); }
    const stars = state.dex[c.no]?.dup || 0;
    if (stars) { const tag = document.createElement('span'); tag.className = `dex__stars${stars >= battle.MAX_STARS ? ' is-full' : ''}`; tag.textContent = `★${stars}`; tag.title = `星級 ${stars}`; li.append(tag); }
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
  const world = dexWorld();
  renderDexWorlds(world);
  const all = Object.values(CHARACTERS).filter((c) => worldOf(c) === world);
  if (world !== 'origin') all.sort((a, b) => noLabel(a.no).localeCompare(noLabel(b.no))); // 異世照顯示編號排（MO-002 海棠新娘小湘存檔 key 是 117）
  const owned = all.filter((c) => state.dex[c.no]);
  $('dex-count').textContent = `已收集 ${owned.length} / ${all.length}`;
  const mode = dexMode();
  document.querySelectorAll('[data-dex-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.dexMode === mode)));
  if (mode === 'all') { $('dex-grid').replaceChildren(dexList(all)); return; }
  if (mode === 'power') {
    // 依戰力：已收集的照戰力高到低（同分照編號），還沒收集的放後面照編號（湘 11/22）
    const power = new Map(owned.map((c) => [c.no, battle.siangPower(state, c.no).power]));
    const sorted = [...owned].sort((a, b) => power.get(b.no) - power.get(a.no) || a.no.localeCompare(b.no));
    const rest = all.filter((c) => !state.dex[c.no]).sort((a, b) => a.no.localeCompare(b.no));
    const ul = dexList([...sorted, ...rest]);
    ul.classList.add('is-power');
    ul.querySelectorAll('[data-dex-no]').forEach((li) => { if (power.has(li.dataset.dexNo)) li.querySelector('.dex__name').after(Object.assign(document.createElement('div'), { className: 'dex__power', textContent: `戰力 ${power.get(li.dataset.dexNo)}` })); });
    $('dex-grid').replaceChildren(ul); return;
  }
  const groups = mode === 'rarity'
    ? RARITY_ORDER.map((r) => [r, { name: r }])
    : Object.entries(SERIES).filter(([id]) => all.some((c) => c.series === id));
  const key = mode === 'rarity' ? 'rarity' : 'series';
  $('dex-grid').replaceChildren(...groups.map(([id, series]) => {
    const members = all.filter((c) => c[key] === id);
    if (mode === 'rarity' && world === 'origin') members.sort((a, b) => a.no.localeCompare(b.no));
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

// 不在家的小湘：出門中或討伐中，這段時間不能安排入住（已經入住的可以先讓她休息）
function awayReasons() {
  const map = new Map();
  for (const no of awayNos(state)) map.set(no, '出門中');
  for (const a of state.battle?.active || []) if (!battle.isBack(a)) for (const no of a.nos) map.set(no, '討伐中');
  for (const no of lab.labNos(state)) map.set(no, '調配中');
  return map;
}
function renderResidents() {
  const selected = residentsFor(state.dex);
  const owned = Object.values(CHARACTERS).filter(character => state.dex[character.no]);
  const away = awayReasons();
  const today = todayKey();
  const interacted = owned.filter(c => bondInfo(state, c.no, today).left < DAILY_CAP).length;
  $('residents-bond-summary').textContent = `今日已互動 ${interacted} / ${owned.length} 位 · 點她、摸頭、餵布丁每天共 ${DAILY_CAP} 點`;
  $('residents-summary').textContent = `已收集 ${owned.length} 位 · 已入住 ${selected.length} / ${ROOM_LIMIT}`;
  // 上方三個入住位置：點一下讓她休息
  $('residents-current').hidden = !owned.length;
  $('residents-current').replaceChildren(...Array.from({ length: ROOM_LIMIT }, (_, i) => {
    const no = selected[i];
    const slot = document.createElement('button'); slot.type = 'button'; slot.className = `residents-slot${no ? '' : ' is-empty'}`;
    if (no) {
      slot.dataset.current = no; slot.setAttribute('aria-label', `${CHARACTERS[no].name}，點一下讓她休息`);
      slot.classList.toggle('is-shiny', bondInfo(state, no, today).max);
      const img = document.createElement('img'); img.alt = ''; loadWithFallback(img, characterSources(CHARACTERS[no].image));
      slot.append(img, Object.assign(document.createElement('span'), { textContent: CHARACTERS[no].name }), Object.assign(document.createElement('i'), { textContent: away.has(no) ? away.get(no) : '×', className: 'residents-slot__x' }));
    } else { slot.disabled = true; slot.append(Object.assign(document.createElement('span'), { textContent: '空位' })); }
    return slot;
  }));
  // 下方依系列排成小格子
  const groups = Object.keys(SERIES).map(id => [id, owned.filter(c => c.series === id)]).filter(([, list]) => list.length);
  $('residents-list').replaceChildren(...groups.flatMap(([id, list]) => {
    const head = document.createElement('p'); head.className = 'residents-series'; head.textContent = `${SERIES[id].name} · ${list.length}`;
    const grid = document.createElement('div'); grid.className = 'residents-grid';
    grid.append(...list.map(character => {
      const inRoom = selected.includes(character.no); const why = away.get(character.no);
      const button = document.createElement('button'); button.type = 'button';
      button.className = `resident-choice${why ? ' is-away' : ''}`; button.dataset.no = character.no;
      button.setAttribute('aria-pressed', String(inRoom));
      const bond = bondInfo(state, character.no, today);
      const left = bond.left;
      const earned = DAILY_CAP - left;
      button.classList.toggle('is-shiny', bond.max);
      const daily = document.createElement('span'); daily.className = 'resident-choice__bond';
      daily.dataset.status = !earned ? 'new' : left ? 'partial' : 'full';
      const label = !earned ? '未互動' : left ? `今日 ${earned}/${DAILY_CAP}` : '今日已滿';
      daily.append(featureIcon('bond'), document.createTextNode(label));
      button.setAttribute('aria-label', `${character.name}${inRoom ? '，入住中' : ''}${why ? `，${why}` : ''}${bond.max ? '，好感度滿級' : ''}，今日首頁互動 ${earned} / ${DAILY_CAP} 點，${label}`);
      if (why && !inRoom) button.disabled = true;
      const image = document.createElement('img'); image.alt = ''; loadWithFallback(image, characterSources(character.image));
      const name = document.createElement('span'); name.className = 'resident-choice__name'; name.textContent = character.name.replace(/小湘$/, '') || character.name;
      button.append(image, name, daily);
      if (inRoom) button.append(Object.assign(document.createElement('i'), { className: 'resident-choice__check', textContent: '✓' }));
      if (why) button.append(Object.assign(document.createElement('i'), { className: 'resident-choice__away', textContent: why }));
      return button;
    }));
    return [head, grid];
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

// 好感 Lv5 的小湘：首頁腳邊偶爾冒小閃光
function renderMaxBondResidents() {
  document.querySelectorAll('.resident-slot[data-character]').forEach(slot => {
    const no = slot.dataset.character;
    const max = Boolean(state.dex?.[no]) && bondInfo(state, no, todayKey()).max;
    slot.classList.toggle('is-maxbond', max);
    if (max && !slot.querySelector('.maxbond-sparks')) {
      const s = document.createElement('div'); s.className = 'maxbond-sparks'; s.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < 5; i++) s.append(document.createElement('i'));
      slot.append(s);
    } else if (!max) slot.querySelector('.maxbond-sparks')?.remove();
  });
}
function renderAll() {
  if ($('checkin-badge')) $('checkin-badge').hidden = !state.seenIntro || checkedToday(state);
  if (document.getElementById('missions-badge')) renderMissionsBadge();
  if (document.getElementById('bingo-badge')) { renderBingoBadge(); checkRecipes(); checkDevteam(); checkUnlucky(); }
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
  renderMaxBondResidents();
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
function storyText(c, entry, now = new Date()) {
  const st = entry?.story;
  if (!st) return '';
  const when = new Date(entry.at);
  const date = `${when.getFullYear()} 年 ${when.getMonth() + 1} 月 ${when.getDate()} 日`;
  // 相遇：從破殼那天算到今天（照日曆，破殼當天是第 1 天）
  const midnight = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const metDay = Math.max(1, Math.round((midnight(now) - midnight(when)) / 864e5) + 1);
  const met = metDay === 1 ? '今天是你們相遇的第一天。' : `今天是你們相遇的第 ${metDay} 天。`;
  if (st.from === 'badge') return `${date}，你用 ${st.cost} 枚討伐徽章，把她迎進了隊伍。${met}`;
  // 蛋陪伴：從拿到蛋到破殼（滿 24 小時才算 1 天）
  const days = st.since && !Number.isNaN(Date.parse(st.since)) ? Math.max(0, Math.floor((Date.parse(entry.at) - Date.parse(st.since)) / 864e5)) : null;
  const source = st.county ? `在${st.county}探索時收到的縣市蛋`
    : st.from?.startsWith('badge:') ? '用討伐徽章換來的勇者小隊專屬蛋'
    : st.from?.startsWith('recipe:') ? '兩位小湘在研究室一起調配出來的紀念蛋'
    : st.from?.startsWith('devteam:') ? '開發團隊悄悄送來的紀念蛋'
    : st.from === 'taiwan' ? '走遍臺灣時收到的紀念蛋'
    : st.from === 'code' ? '湘藏在暗號裡的蛋'
    : st.from === 'letter' ? '湘夾在紙條裡的蛋'
    : st.from && HOLIDAYS.some(h => st.from.startsWith(h.id)) ? `${HOLIDAYS.find(h => st.from.startsWith(h.id)).name}收到的紀念蛋`
    : EGGS[st.egg]?.name || '一顆蛋';
  const mood = [st.night && '深夜裡', st.rain && '下著雨的日子'].filter(Boolean).join('、');
  return `${date}${mood ? `，${mood}` : ''}，她從${source}裡孵出來。${days !== null ? `這顆蛋陪了你${days ? ` ${days} 天` : '不到一天'}才破殼，` : ''}是你孵化的第 ${st.nth} 顆蛋${st.wishes ? `；那天你完成了 ${st.wishes} 個願望` : ''}。${met}`;
}

async function hatch(expected) {
  buzz([30, 50, 30, 50, 60]);
  await runAnalysis();
  const transaction = await updateState(current => {
    if (current.egg.id !== expected.id || current.egg.since !== expected.since || current.egg.warmth < EGGS[current.egg.id].warmthNeeded) return null;
    const random = isRandomEgg(current.egg);
    const character = CHARACTERS[rollFor(current.egg, hatchBoosts(current), random ? { dex: current.dex, dupStreak: current.dupStreak || 0, srStreak: current.srStreak || 0 } : {})];
    const duplicate = Boolean(current.dex[character.no]);
    if (random) { current.dupStreak = duplicate ? (current.dupStreak || 0) + 1 : 0; current.srStreak = isHigh(character.no) ? 0 : (current.srStreak || 0) + 1; }
    let bondUp = [];
    if (random && duplicate) current.dupTotal = (current.dupTotal || 0) + 1; // 非酋三部曲：一般（隨機）蛋孵到重複才算
    if (random && !duplicate) current.newTotal = (current.newTotal || 0) + 1; // 歐皇三部曲：一般（隨機）蛋孵到新面孔才算
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

// 星級：重複孵到同一位小湘 +1 星（最多 5 星），每星討伐戰力 +10%
const starText = (n) => `${'★'.repeat(n)}${'☆'.repeat(Math.max(0, battle.MAX_STARS - n))}`;
function showReveal(c, duplicate) {
  loadWithFallback($('reveal-img'), characterSources(c.image));
  $('reveal-img').alt = c.name;
  $('reveal').dataset.duplicate = String(duplicate);
  $('reveal-en').textContent = duplicate ? 'HELLO AGAIN' : 'A NEW COMPANION';
  $('reveal-greeting').textContent = duplicate ? '是你呀，我們又見面了。' : '初次見面，請多指教。';
  $('reveal-no').textContent = `${noLabel(c.no)} ｜ ${c.rarity}`;
  $('reveal-name').textContent = c.name;
  const hatchLine = WEATHER_LINES[c.no]?.hatch || RECIPE_LINES[c.no]?.hatch || FRIEND_LINES[c.no]?.hatch || NAP_LINES[c.no]?.hatch || DEVTEAM_LINES[c.no]?.hatch || EXTRA_LINES[c.no]?.hatch;
  $('reveal-line').textContent = hatchLine ? `「${hatchLine}」` : c.line;
  $('reveal-bonus').hidden = !duplicate;
  const stars = state.dex[c.no]?.dup || 0;
  $('reveal-bonus').textContent = `再次相遇的禮物 · 化石碎片 +${DUPLICATE_FOSSILS}${duplicate ? ` · ${stars >= battle.MAX_STARS ? `星級已滿 ${starText(stars)}` : `星級 +1 → ${starText(stars)}`}` : ''}`;
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
// 領取成長願望：ids 可一次多項（「領取已完成的願望」按鈕一次全領）
async function claimGoals(ids, focusId) {
  if (claimBusy || !ids.length) return;
  claimBusy = true;
  document.querySelectorAll('#growth-list .growth-claim').forEach(b => { b.disabled = true; });
  $('growth-action').disabled = true;
  const chapter = viewedChapter;
  try {
    const transaction = await updateState(current => {
      const results = ids.map(id => claimGrowth(current, chapter, id)).filter(r => r.awarded);
      return { awarded: results.length, levelBefore: results[0]?.levelBefore, chapter: results.find(r => r.chapter)?.chapter };
    });
    state = transaction.state; renderAll();
    if (transaction.result.awarded) {
      const n = transaction.result.awarded;
      $('growth-feedback').textContent = n > 1 ? `${n} 個心願達成，獲得 ${GROWTH_XP * n} XP 與 ${GROWTH_ENERGY * n} 能量。` : `心願達成，獲得 ${GROWTH_XP} XP 與 ${GROWTH_ENERGY} 能量。`;
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
  } finally {
    claimBusy = false; $('growth-action').disabled = false; state = loadState(); renderAll();
    if (focusId) $('growth-list').querySelector(`[data-goal-row="${focusId}"]`)?.focus({ preventScroll: true });
  }
}
$('growth-list').addEventListener('click', event => {
  const button = event.target.closest('[data-goal]');
  if (button) claimGoals([button.dataset.goal], button.dataset.goal);
});
$('growth-action').addEventListener('click', () => {
  const goals = growthGoals(viewedChapter).goals;
  const pending = goals.find(g => !goalProgress(state, g).complete);
  if (pending?.destination === 'incubate') showView('incubate');
  else if (pending?.destination === 'errands') openErrands();
  else if (pending?.destination === 'home') showView('home');
  else if (pending?.destination === 'dex') showView('dex');
  else if (pending?.destination === 'kitchen') { openErrands(); showErrandTab('kitchen'); }
  else if (pending?.destination === 'battle') { openErrands(); showErrandTab('battle'); }
  else if (pending?.destination === 'achievements') openAchievements();
  else if (!pending && goals.some(g => !goalProgress(state, g).claimed)) claimGoals(goals.filter(g => !goalProgress(state, g).claimed).map(g => g.id));
  else showWishTab('daily', true);
});
$('open-presenter').addEventListener('click', () => { $('presenter-search').value = ''; renderPresenters(); $('presenter-feedback').textContent = ''; $('presenter').showModal(); $('presenter-list').scrollTop = 0; syncRoomActivity(); });
$('presenter-search').addEventListener('input', () => { renderPresenterList(); $('presenter-list').scrollTop = 0; });
$('presenter-search').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } });
$('presenter-filters').addEventListener('click', event => {
  const chip = event.target.closest('[data-filter]'); if (!chip) return;
  presenterFilter = chip.dataset.filter; $('presenter-search').value = '';
  renderPresenterList(); $('presenter-list').scrollTop = 0;
});
$('close-presenter').addEventListener('click', () => $('presenter').close());
$('presenter-list').addEventListener('click', event => {
  const button = event.target.closest('[data-presenter]');
  if (!button) return;
  state = loadState();
  const id = button.dataset.presenter;
  if (!CHARACTERS[id] || !state.dex[id]) return;
  const before = selectedPresenter(state);
  try { localStorage.setItem(PRESENTER_KEY, id); }
  catch { $('presenter-feedback').textContent = '這次選擇無法儲存，請再試一次。'; return; }
  if (before && before !== id) rememberPresenter(before);
  rememberPresenter(id);
  renderWishes(); $('presenter').close();
});

/* ---------- 事件 ---------- */

eggButton.addEventListener('click', onEggTap);
$('open-eggs').addEventListener('click', () => {
  state = loadState(); sideTarget = null; eggCategory = null; renderEggChoices(); $('egg-picker-feedback').textContent = ''; $('egg-picker').showModal(); syncRoomActivity();
});
$('egg-picker').addEventListener('close', () => { if (!$('egg-odds').dataset.back) sideTarget = null; });
$('close-eggs').addEventListener('click', () => $('egg-picker').close());
$('egg-choices').addEventListener('click', async event => {
  const nav = event.target.closest('[data-cat], [data-back]');
  if (nav && !nav.disabled) { eggCategory = nav.dataset.cat || null; renderEggChoices(); $('egg-picker-feedback').textContent = ''; return; }
  const choice = event.target.closest('[data-egg], [data-shelf], [data-side-main]');
  if (!choice || choice.disabled || busy) return;
  busy = true;
  if (sideTarget !== null) {
    try {
      const { state: latest, result } = await updateState(current => placeOnSide(current, sideTarget, choice.dataset));
      state = latest;
      if (result) {
        $('egg-picker').close();
        toast({ main: '換好了！副架的蛋換到主架，主架那顆放上副架繼續保溫。', shelf: '換好了！原本那顆回到暫放架，進度都還在。', back: '換好了！原本那顆回到暫放架，進度都還在。', side: '換好了！原本那顆移到另一格副架，一樣會保溫。', stock: '換好了！原本那顆還沒開始孵，先收回蛋庫了。', placed: '放好了！這顆蛋在副架上也會自動保溫。' }[result]);
      } else { renderEggChoices(); $('egg-picker-feedback').textContent = '培育進度已更新，請再選一次。'; }
    } finally { busy = false; state = loadState(); renderAll(); }
    return;
  }
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
      if (current.egg.id !== id || (character && (current.egg.character || 'random') !== character)) {
        if (character && !current.gifts.eggs.some(g => giftMatch(g, id, character))) return false;
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
$('side-cradles')?.addEventListener('click', event => {
  const b = event.target.closest('[data-side-shelf], [data-side-empty]'); if (!b || busy) return;
  // 點副架哪一格，就換那一格的蛋（湘 11/22）
  openSidePicker(Number(b.dataset.sideShelf ?? b.dataset.sideEmpty));
});
$('feed-all').addEventListener('click', () => void onFeedAll());
$('home-wishes').addEventListener('click', () => showView('wish'));
$('incubate-wishes').addEventListener('click', () => showView('wish'));
$('enter-incubator').addEventListener('click', () => showView('incubate'));
$('home-letter').addEventListener('click', openLetterBox);
$('open-residents').addEventListener('click', () => { renderResidents(); $('residents-feedback').textContent = ''; $('residents').showModal(); syncRoomActivity(); });
$('close-residents').addEventListener('click', () => $('residents').close());
$('residents-done').addEventListener('click', () => $('residents').close());
$('residents-current').addEventListener('click', event => {
  const slot = event.target.closest('[data-current]'); if (!slot) return;
  $('residents-list').querySelector(`[data-no="${slot.dataset.current}"]`)?.click();
});
$('residents-list').addEventListener('click', event => {
  const button = event.target.closest('button[data-no]');
  if (!button) return;
  const no = button.dataset.no;
  const latest = loadState();
  if (!CHARACTERS[no] || !latest.dex[no]) return;
  state = latest;
  let ids = residentsFor(state.dex);
  const why = awayReasons().get(no);
  if (ids.includes(no)) ids = ids.filter(id => id !== no);
  else if (why) { $('residents-feedback').textContent = `${CHARACTERS[no].name}${why}，回來之後才能入住喔。`; return; }
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
  if ($('reveal').dataset.kind === 'gift') { $('reveal').dataset.kind = ''; return; } // 非酋小湘這類直接加入收藏的，不是蛋孵出來的
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
  if (error === 'denied') { title = '小湘感應不到你在哪裡'; text = '需要允許定位，才能知道你在哪個縣市。'; note = 'iPhone：設定 › 隱私權與安全性 › 定位服務，打開定位，並允許 Safari 網站（或這個遊戲）使用位置。\nAndroid：在 Chrome 網址列左邊的圖示 › 權限 › 位置，改成允許。'; }
  else if (error === 'unsupported') { title = '這個瀏覽器不能定位'; text = '換成 Safari 或 Chrome 打開遊戲，再按一次「探索附近」試試。'; }
  else if (error === 'data') { title = '地圖還沒載好'; text = '縣市地圖沒有下載成功，等網路穩一點再試一次。'; }
  else if (error) { title = '訊號有點微弱'; text = 'WiFi 和 GPS 都試過了，還是沒抓到。'; note = '可以這樣試試：\n・手機的定位服務要打開，iPhone 也要打開「精確位置」\n・連著 WiFi 抓不到時，先關掉 WiFi，用行動網路試一次\n・走到窗邊或室外，GPS 比較收得到'; }
  else if (!county) { title = '這裡還沒有小湘的訊號'; text = '臺灣 22 個縣市和綠島都有小湘，到別的地方再試試看吧。'; }
  else if (!c) { title = `${county}的訊號`; text = `${county}的小湘還在路上，之後再來找她吧！`; }
  else if (result?.egg) { title = `${c.name}想出現！`; text = c.line; note = `獲得一顆「縣市蛋 · ${county}」，到培育室的「選擇蛋」把它拿出來吧。`; }
  else if (result?.daily === 'county') { title = owned ? `${c.name}：又見面了！` : `${c.name}的蛋又出現了`; text = owned ? `「你又來${county}啦，這顆蛋送你，說不定會孵出新朋友喔。」` : '「快點把我孵出來嘛……」'; note = `今天的探索禮物：一顆「縣市蛋 · ${county}」，到「選擇蛋」把它拿出來吧。${owned ? '（已經有她了的話，孵出來會變成化石）' : ''}`; }
  else if (result?.daily === 'wish' || result?.daily === 'weather') { title = owned ? `${c.name}：又見面了！` : `${county}的訊號`; text = owned ? `「你又來${county}啦，我在路上撿到一顆蛋，給你！」` : '這附近好像有什麼東西在閃閃發光……'; note = `今天的探索禮物：一顆「${result.daily === 'wish' ? '願望蛋' : '天氣蛋'}」，到「選擇蛋」把它拿出來吧。`; }
  else if (owned) { title = `${c.name}：又見面了！`; text = `「你又來${county}啦，今天也一起走走吧。」${todayGift(state) ? '' : '明天再來探索，還會有一顆蛋喔。'}`; }
  else if (waiting) { title = `${c.name}還在蛋裡等你`; text = '「快點把我孵出來嘛……我已經準備好了！」'; }
  else { title = `${county}的訊號`; text = '這裡的小湘已經和你打過招呼了。'; }
  // 今天的禮物已經收過（常常是開遊戲時自動探索拿走的）：講清楚收過什麼，湘 11/23
  const gift = todayGift(state);
  if (!error && county && c && !result?.egg && !result?.daily && gift) note = `今天的探索禮物已經收過了\n${giftTime(gift) ? `${giftTime(gift)} ` : ''}${gift.auto ? '開遊戲時自動感應到' : '探索時收到'}\n一顆「${giftLabel(gift)}」，在「選擇蛋」裡\n明天再來，還會有一顆喔。`;
  if (result?.auto && result.daily) $('county-eyebrow').textContent = `打開遊戲時自動感應 · ${county}`;
  $('county-title').textContent = title;
  $('county-text').textContent = text;
  note = [note, weatherNote(weather)].filter(Boolean).join('\n');
  if (error) $('county-note').replaceChildren(...note.split('\n').map(line => Object.assign(document.createElement('span'), { className: line.startsWith('・') ? 'is-item' : '', textContent: line }))); // 提示一行一條，換行時縮排對齊
  else $('county-note').textContent = note;
  $('county-note').hidden = !note;
  $('county-note').classList.toggle('is-tips', Boolean(error));
  $('county-go').hidden = !(result?.egg || result?.daily || weather?.egg);
  $('county-note').classList.toggle('is-gift', Boolean(!error && (result?.daily || (gift && county && c))));
  $('county-retry').hidden = !error || error === 'unsupported';
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
// 每日探索禮物（travel.gift）：今天收過什麼、幾點收的
let giftFlashUntil = 0; // 剛收到禮物時標籤亮 8 秒就收起，不擋畫面（湘 11/25 選 B）
const todayGift = (s) => (s.travel?.gift?.date === todayKey() ? s.travel.gift : null);
const giftLabel = (g) => (g.kind === 'county' ? `縣市蛋 · ${g.county}` : g.kind === 'wish' ? '願望蛋' : '天氣蛋');
const giftShort = (g) => (g.kind === 'county' ? '縣市蛋' : g.kind === 'wish' ? '願望蛋' : '天氣蛋');
function giftTime(g) { const d = new Date(g.at); if (!g.at || Number.isNaN(+d)) return ''; const h = d.getHours(); return `${h < 12 ? '上午' : '下午'} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} `.trim(); }
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
    catch (err) { if (!silent) showCountyCall({ error: err?.code === 1 ? 'denied' : err?.code === 'unsupported' ? 'unsupported' : 'failed' }); return; }
    let counties;
    try { counties = await loadCounties(); } catch { if (!silent) showCountyCall({ error: 'data' }); return; }
    const county = spotAt(pos.lon, pos.lat) || offshoreAt(pos.lon, pos.lat) || countyAt(counties, pos.lon, pos.lat);
    state = (await updateState(current => { if (current.bonus.explored !== todayKey()) current.bonus.total.explores += 1; current.bonus.explored = todayKey(); })).state;
    const weather = await checkWeather(pos);
    if (!county || !COUNTY_CHARACTER[county]) { if (!silent) showCountyCall({ county: county || null, weather }); else announceWeather(weather); return; } // 還沒有小湘的地方（例如金門）先不送蛋
    const transaction = await updateState(current => { const r = checkIn(current, county, todayKey()); if (silent && r.daily) { current.travel.gift.auto = true; r.auto = true; } return r; });
    if (transaction.result.daily) giftFlashUntil = Infinity; // 彈窗關掉後才開始算 8 秒
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
$('county-call').addEventListener('close', () => { if (giftFlashUntil === Infinity) { giftFlashUntil = Date.now() + 8000; renderHome(); setTimeout(renderHome, 8100); } });
$('county-retry').addEventListener('click', () => { $('county-call').close(); void explore(); });
$('county-go').addEventListener('click', () => { $('county-call').close(); showView('incubate'); });
$('county-call').addEventListener('close', syncRoomActivity);

/* ---------- 長按小湘看她是誰（出門、討伐選人時） ---------- */
let pressTimer = null, pressShown = false;
function hidePressTip() { document.querySelector('.press-tip')?.remove(); }
function showPressTip(btn) {
  hidePressTip();
  const tip = document.createElement('div'); tip.className = 'press-tip'; tip.setAttribute('role', 'tooltip');
  if (btn.dataset.more) tip.append(Object.assign(document.createElement('b'), { textContent: '也吃過' }), Object.assign(document.createElement('span'), { className: 'press-tip__list', textContent: btn.dataset.more })); // 料理小書「+N」
  else {
    const c = CHARACTERS[btn.dataset.siang]; if (!c) return;
    if (btn.dataset.taste) tip.append(Object.assign(document.createElement('b'), { textContent: c.name }), Object.assign(document.createElement('span'), { textContent: `吃過，覺得 ${btn.dataset.taste}` })); // 料理小書吃過的小湘
    else {
      const p = battle.siangPower(state, c.no);
      const b = bondInfo(state, c.no, todayKey());
      tip.append(Object.assign(document.createElement('b'), { textContent: c.name }), Object.assign(document.createElement('span'), { textContent: `${c.rarity} · ${SERIES[c.series]?.name || ''} · 戰力 ${p.power} · ♥ Lv.${b.level}${p.stars ? ` · ★${p.stars}` : ''}` }));
    }
  }
  const host = btn.closest('dialog') || document.body; host.append(tip);
  const r = btn.getBoundingClientRect(); const hr = host.getBoundingClientRect();
  const half = tip.offsetWidth / 2 + 8; // 不要超出畫面左右
  tip.style.left = `${Math.min(Math.max(half, r.left - hr.left + r.width / 2), hr.width - half)}px`;
  tip.style.top = `${r.top - hr.top + host.scrollTop - 6}px`;
  buzz(15);
}
const PRESS_SEL = '.errand-siang[data-siang], .cookbook-eater[data-siang], .cookbook-eater-more';
document.addEventListener('pointerdown', e => {
  const btn = e.target.closest(PRESS_SEL); if (!btn) return;
  pressShown = false; clearTimeout(pressTimer);
  pressTimer = setTimeout(() => { pressShown = true; showPressTip(btn); }, 450);
}, { passive: true });
for (const type of ['pointerup', 'pointercancel', 'pointerleave', 'scroll']) document.addEventListener(type, () => { clearTimeout(pressTimer); if (pressShown) setTimeout(hidePressTip, 1600); }, { capture: true, passive: true });
// 長按完不要順便選到她
document.addEventListener('click', e => { if (pressShown && e.target.closest(PRESS_SEL)) { e.stopPropagation(); e.preventDefault(); pressShown = false; } }, true);
document.addEventListener('contextmenu', e => { if (e.target.closest(PRESS_SEL)) e.preventDefault(); });
// 料理小書的頭像本來點了沒反應，輕點也顯示是誰
document.addEventListener('click', e => { const el = e.target.closest('.cookbook-eater[data-siang], .cookbook-eater-more'); if (!el || pressShown) return; showPressTip(el); setTimeout(hidePressTip, 1800); });

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
// 非酋三部曲：重複次數達標就自動加入收藏，用相遇畫面介紹她（不在其他視窗開著的時候跳）
let unluckyBusy = false;
function checkUnlucky() {
  if (unluckyBusy || !state.seenIntro || !unluckyDue(state).length || document.querySelector('dialog[open]')) return;
  unluckyBusy = true;
  void updateState(current => grantUnlucky(current)).then(t => {
    state = t.state; unluckyBusy = false;
    if (!t.result) return;
    const c = CHARACTERS[t.result];
    showReveal(c, false);
    $('reveal-en').textContent = c.newNeed ? 'LUCKY STAR' : 'UNLUCKY BUT HOPEFUL';
    $('reveal-greeting').textContent = UNLUCKY_SCENES[c.no];
    $('reveal').dataset.kind = 'gift';
    welcomeResident(c.no, state.dex); renderAll();
  }, () => { unluckyBusy = false; });
}
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

/* ---------- 隱藏配方：研究室調配（js/lab.js，湘 11/19：放在研究室才有調配的感覺，不再是一起入住首頁） ---------- */
let recipeBusy = false;
function checkRecipes() {
  if (recipeBusy || !state.seenIntro || !lab.labStatus(state)?.ready) return;
  recipeBusy = true;
  void updateState(current => lab.finishBrew(current)).then(t => {
    state = t.state; recipeBusy = false; renderAll(); research.update();
    const r = t.result;
    if (r) { toast(`🧪 ${r.members.map(no => CHARACTERS[no].name).join('和')}在研究室調配完成！收到一顆紀念蛋，到「選擇蛋」看看吧。`); say('研究室那邊傳來好香的味道……好像有新的蛋！', 'happy', 5200); }
  }).catch(() => { recipeBusy = false; });
}
setInterval(() => { if (!document.hidden) checkRecipes(); }, 60 * 1000);

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

/* ---------- 月簽到（湘 11/20） ---------- */
function renderCheckin() {
  const now = new Date(); const c = state.checkin?.month ? state.checkin : ensureCheckin({ ...state });
  const signed = new Set(state.checkin?.month === c.month ? c.days : []); const total = daysInMonth(now);
  const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const count = signed.size; const next = CHECKIN_REWARDS.find(r => count < r.days);
  $('checkin-title').textContent = `${now.getMonth() + 1} 月簽到`;
  $('checkin-intro').textContent = `這個月已經簽到 ${count} 天${next ? `，再 ${next.days - count} 天可以拿「${next.label}」` : '，獎勵全部拿到了！'}。每個月 1 號重新開始，漏掉的日子不能補簽喔。`;
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(mkEl('span', 'checkin-day is-blank'));
  for (let d = 1; d <= total; d++) {
    const cell = mkEl('span', `checkin-day${signed.has(d) ? ' is-signed' : ''}${d === now.getDate() ? ' is-today' : ''}${d < now.getDate() && !signed.has(d) ? ' is-missed' : ''}`);
    cell.append(mkEl('b', '', String(d)), mkEl('i', '', signed.has(d) ? '✓' : ''));
    cells.push(cell);
  }
  $('checkin-grid').replaceChildren(...cells);
  $('checkin-rewards').replaceChildren(...CHECKIN_REWARDS.map(r => {
    const got = state.checkin?.claimed?.includes(r.days); const box = mkEl('div', `checkin-reward${got ? ' is-got' : ''}${r.egg ? ' is-egg' : ''}`);
    const [main, note] = r.label.replace('）', '').split('（'); // 「星光蛋（SR 以上）」在 360px 會擠成四行，括號裡的拆成小字
    box.append(mkEl('b', '', `${r.days} 天`), mkEl('span', '', main), ...(note ? [mkEl('small', 'checkin-reward__note', note)] : []), mkEl('small', '', got ? '✓ 已領取' : `${Math.min(count, r.days)} / ${r.days}`));
    return box;
  }));
  const done = checkedToday(state, now);
  $('checkin-sign').disabled = done; $('checkin-sign').textContent = done ? '今天簽過了 ✓' : '簽到';
  $('checkin-badge').hidden = done;
}
function openCheckin() { $('checkin-status').textContent = ''; renderCheckin(); $('checkin-dialog').showModal(); syncRoomActivity(); }
$('open-checkin').addEventListener('click', () => { $('function-center').close(); openCheckin(); });
$('close-checkin').addEventListener('click', () => $('checkin-dialog').close());
$('checkin-dialog').addEventListener('close', syncRoomActivity);
$('checkin-sign').addEventListener('click', async () => {
  $('checkin-sign').disabled = true;
  const t = await updateState(current => monthlyCheckIn(current));
  state = t.state; renderAll();
  if (t.result) {
    const egg = t.result.rewards.find(r => r.egg);
    $('checkin-status').textContent = t.result.rewards.length ? `簽到成功！累積 ${t.result.count} 天，拿到${t.result.rewards.map(r => r.label).join('、')}${egg ? '，到「選擇蛋」把星光蛋拿出來吧！' : '！'}` : `簽到成功！這個月第 ${t.result.count} 天。`;
    buzz([10, 30, 10]); if (t.result.rewards.length) say(egg ? '一整個月都有來找我！這顆星光蛋送你♡' : '簽到獎勵送到囉！', 'cheer', 3500);
  }
  renderCheckin();
});
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
  if (!(a.done && !a.claimed)) { showAchievementInfo(a); if (a.claimed && a.story) showAchievementStory(a); return; }
  tile.disabled = true;
  const t = await updateState(current => claimAchievement(current, a.id, CHARACTERS));
  state = t.state; renderAll();
  if (t.result) { restart($('chip-energy'), 'is-bump'); toast(`🏆 ${a.title} · +${t.result} 能量`); }
  openAchievements();
  if (t.result && a.story) showAchievementStory(a);
});
$('open-achievements').addEventListener('click', () => { $('function-center').close(); openAchievements(); });
$('close-achievements').addEventListener('click', () => $('achievement-dialog').close());
$('achievement-dialog').addEventListener('close', syncRoomActivity);

/* ---------- 紀念蛋：節日、生日、走遍臺灣 ---------- */
let keepsakeBusy = false;
function pendingKeepsakes(current) {
  const got = current.gifts?.keepsakes || [];
  const list = activeHolidays().filter(h => !got.includes(h.key)).map(h => ({ key: h.key, no: h.no, message: h.id === 'birthday' ? '今天是小湘的生日！收到一顆紀念蛋，只有今天才有喔。' : `${h.name}快樂！收到一顆${h.name}的紀念蛋。` }));
  for (const e of activeEvents()) if (!got.includes(e.key)) list.push({ key: e.key, no: e.no, message: `${e.name}！收到一顆紀念蛋，裡面是${CHARACTERS[e.no].name}。` });
  const counties = Object.values(CHARACTERS).filter(c => c.county && MAIN_ISLAND.has(c.county));
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
    if (t.result.length) { toast(`${t.result[0].message}${state.hatched > 0 || state.dex['001'] ? '到「選擇蛋」把它拿出來吧。' : '先孵出第一位小湘，之後就能到「選擇蛋」把它拿出來。'}`); say('有特別的禮物送到了！', 'cheer', 3000); }
  });
}

/* ---------- 投票日提醒（湘 11/20）：當天第一次打開遊戲跳一次，公民小湘提醒 ---------- */
function voteDayDue(s, now = new Date()) {
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return VOTE_DAYS.find(v => v.date === d && !(s.notices || []).includes(v.key)) || null;
}
function showVoteDay() {
  if (navigator.webdriver && !window.__testVoteDay) return; // 自動化測試不跳
  const v = voteDayDue(state); if (!v || $('vote-day').open) return;
  if (!state.seenIntro || document.querySelector('dialog[open]')) return; // 有別的視窗開著，等下一輪再看
  loadWithFallback($('vote-day-img'), characterSources(CHARACTERS[v.no].image));
  $('vote-day-text').textContent = '你去投票了嗎？還沒的話記得要去喔♡ 投票到下午 4 點，記得帶身分證、印章和投票通知單！';
  $('vote-day-note').textContent = '有投票資格的人才需要喔。投票所在哪裡，可以到中選會網站查詢。要投給誰，由你自己決定。';
  $('vote-day').dataset.key = v.key;
  $('vote-day').showModal();
}
async function markVoteDay() {
  const key = $('vote-day').dataset.key; if (!key) return;
  $('vote-day').dataset.key = '';
  const t = await updateState(current => { current.notices = [...new Set([...(current.notices || []), key])]; });
  state = t.state;
}
$('vote-day-ok').addEventListener('click', () => $('vote-day').close());
$('vote-day').addEventListener('close', () => void markVoteDay());
setTimeout(() => showVoteDay(), 2500);
setInterval(() => showVoteDay(), 4000); // 別的視窗開很久、或過了午夜才到投票日，也還是會跳

/* ---------- 圖鑑：小湘介紹 ---------- */
function howToGet(c) {
  if (c.no === '001') return '從小湘本源蛋孵出';
  if (c.county) return `到${c.county}探索，收到縣市蛋後孵出`;
  if (c.no === TAIWAN_NO) return '集滿 19 位縣市小湘時收到紀念蛋';
  const ev = EVENTS.find(x => x.no === c.no);
  if (ev) return `${ev.when} 打開遊戲收到紀念蛋；${CHARACTERS[c.no].poolFrom ? `${CHARACTERS[c.no].poolFrom.slice(5).replace('-', '/')} 起普通蛋也孵得到` : ''}`;
  const h = HOLIDAYS.find(x => x.no === c.no);
  if (h) return h.window ? `${h.name}（${h.when}）前後 3 天打開遊戲，收到紀念蛋` : `只在小湘生日（${h.when}）收到紀念蛋`;
  const recipe = RECIPES.find(r => r.target === c.no);
  if (recipe) { const st = lab.labStatus(state); const brewing = st?.recipe.id === recipe.id; return `隱藏配方：${state.dex[c.no] || brewing ? recipe.text : '找到某兩位小湘的配方，放進研究室調配，就會發生什麼……'}${brewing ? `（調配中，還要 ${lab.fmtLeft(st.left)}）` : ''}`; }
  if (c.badge) { const h = battle.heroStatus(state, c.no); const joined = JOIN_WHEN_OWNED.includes(c.no) && state.dex[c.no] ? Object.values(EGGS).filter(e => activePool(e, new Date(), state.dex)?.[c.no]).map(e => e.name) : []; return `在討伐的「特訓與兌換」用 ${h.cost} 枚討伐徽章兌換專屬蛋，培育後固定孵出${h.requireText ? `（${h.requireText}）` : ''}${joined.length ? `；已經加入收藏，現在${joined.join('、')}也孵得到` : ''}`; }
  if (JOIN_WHEN_OWNED.includes(c.no) && state.dex[c.no]) { const eggs = Object.values(EGGS).filter(e => activePool(e, new Date(), state.dex)?.[c.no]).map(e => e.name); if (eggs.length) return `已經加入收藏，現在${eggs.join('、')}也孵得到`; }
  if (c.newNeed) return `一般的蛋累計孵到新朋友 ${c.newNeed} 次，她會自己來找你（目前 ${Math.min(state.newTotal || 0, c.newNeed)} / ${c.newNeed}）`;
  if (c.dupNeed) return `累計孵到重複的小湘 ${c.dupNeed} 次，她會自己來找你（目前 ${Math.min(state.dupTotal || 0, c.dupNeed)} / ${c.dupNeed}）`;
  if (c.no === '090') return state.dex[c.no] ? '湘研究所沒考上時，用暗號送給大家的紀念（沒關係，先吃蛋糕）' : '湘有心事的時候，會用暗號送給大家……';
  if (c.no === '089') return state.dex[c.no] ? '湘考上研究所時，用暗號送給大家的紀念' : '湘有好消息的時候，會用暗號送給大家……';
  if (c.series === 'devteam') {
    const p = devteam.progress(state, c.no).map(x => `${x.label} ${Math.min(x.now, x.need)} / ${x.need}${x.unit || ''}`).join('、');
    return state.dex[c.no] ? '開發團隊限定：達成條件後收到紀念蛋' : `開發團隊限定：${p}`;
  }
  if (c.series === 'date') return '見面時掃描湘的約會 QR Code，取得約會蛋來孵';
  if (c.no === '117' || c.no === 'MO-001') return c.no === 'MO-001' ? '異世活動「墨痕江湖」：墨痕蛋（活動卡池），或在墨玉閣用 500 墨玉直接兌換' : '異世活動「墨痕江湖」：墨痕蛋（活動卡池）';
  const eggs = Object.values(EGGS).filter(e => activePool(e)?.[c.no]).map(e => e.name);
  return eggs.length ? `${eggs.join('、')}可能孵出` : '特殊方式取得';
}
function openDexDetail(no) {
  const c = CHARACTERS[no];
  const owned = Boolean(state.dex[no]);
  const img = $('dex-detail-img');
  img.className = `dex-detail__img${owned ? '' : ' is-locked'}${owned && c.cheshire ? ' is-cheshire' : ''}`; img.alt = owned ? c.name : '尚未收集的小湘'; // is-cheshire：柴郡貓小湘慢慢隱身只剩笑容（純視覺）
  loadWithFallback(img, characterSources(c.image));
  $('dex-photo').hidden = !owned; $('dex-photo').dataset.no = no;
  $('dex-detail-no').textContent = `${noLabel(c.no)} · ${owned ? c.rarity : '?'} · ${worldOf(c) === 'origin' ? (SERIES[c.series]?.name || '') : worldLabel(worldOf(c))}`;
  const stars = owned ? state.dex[no]?.dup || 0 : 0;
  $('dex-detail-stars').hidden = !owned;
  $('dex-detail-stars').replaceChildren(Object.assign(document.createElement('b'), { textContent: starText(stars) }), Object.assign(document.createElement('span'), { textContent: stars >= battle.MAX_STARS ? `星級 ${stars} / ${battle.MAX_STARS} · 已滿星！討伐戰力 +${stars * 10}%` : `星級 ${stars} / ${battle.MAX_STARS} · 再孵到她一次 +1 星${stars ? `（目前討伐戰力 +${stars * 10}%）` : '（每星討伐戰力 +10%）'}` }));
  $('dex-detail-name').textContent = owned ? c.name : '???';
  $('dex-detail-line').textContent = owned ? c.line : '';
  $('dex-detail-line').hidden = !owned;
  // 居民檔案／原典（湘 11/25）：有原典資料的居民，收集後才看得到
  $('dex-detail-origin').hidden = !(owned && c.origin);
  if (owned && c.origin) {
    $('dex-origin-eyebrow').textContent = `居民檔案 / ${c.no}`;
    $('dex-origin-world').textContent = c.origin.world || '—';
    $('dex-origin-role').textContent = c.origin.role || '—';
    $('dex-origin-series').textContent = worldLabel(worldOf(c));
    $('dex-origin-now').textContent = c.worldRole || '—';
    $('dex-origin-quote').textContent = c.quote || '';
    $('dex-origin-quote').hidden = !c.quote;
  }
  setParas($('dex-detail-intro'), owned ? (INTROS[no] || '') : (MYSTERY_INTROS[no] || '遠處好像有誰探了一下頭。再靠近一點，下次也許就能打個招呼。'), 90, true); // 長介紹照句子分段（11/21）
  $('dex-detail-how').textContent = `取得方式：${howToGet(c)}`;
  const at = state.dex[no]?.at;
  const story = owned ? storyText(c, state.dex[no]) : '';
  $('dex-detail-story').textContent = story;
  $('dex-detail-story').hidden = !story;
  $('dex-detail-at').textContent = !story && owned && at && !Number.isNaN(Date.parse(at)) ? `相遇日期：${new Date(at).toLocaleDateString('zh-TW')}` : '';
  renderBond(no, owned);
  renderTaste(no, owned);
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
    const t = await updateState(current => { if (current.dino.task || !canOffer(current, ctx.today)) return null; current.dino.task = { ...makeTask(current, ctx), accepted: false }; return current.dino.task; });
    state = t.state; sayOverride = null; renderAll();
    if (t.result) say(`要接下這個委託嗎？完成給你 ${TASK_REWARD} 能量！`, 'happy', 4000, 'chat');
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

// 委託卡（湘 11/20）：先問「接下／先不要」；接下之後縮成旁邊的小恐龍圓鈕，點一下才展開，不會一直擋住小湘
let dinoTaskOpen = false; let dinoTaskTimer = 0;
function setDinoTaskOpen(open) {
  dinoTaskOpen = open; clearTimeout(dinoTaskTimer);
  if (open) dinoTaskTimer = setTimeout(() => { dinoTaskOpen = false; renderDinoTask(); }, 6000);
  renderDinoTask();
}
function renderDinoTask() {
  const task = state.dino?.task;
  $('dino-task').hidden = !task;
  if (!task) { dinoTaskOpen = false; return; }
  const pending = task.accepted === false; // 舊存檔沒有這個欄位＝已經接下
  const mini = !pending && !dinoTaskOpen;
  const progress = taskProgress(state, task, { today: todayKey(), snapsToday: snapsToday(state, todayKey()) });
  $('dino-task').classList.toggle('is-mini', mini); $('dino-task').classList.toggle('is-pending', pending);
  $('dino-task-toggle').setAttribute('aria-expanded', String(!mini));
  $('dino-task-toggle').setAttribute('aria-label', mini ? `小恐龍的委託：${task.text}（點一下展開）` : '收起小恐龍的委託');
  $('dino-task-mini').textContent = task.goal > 1 ? `${Math.max(0, progress)}/${task.goal}` : '';
  $('dino-task-choice').hidden = !pending; $('dino-task-skip').hidden = pending;
  $('dino-task-text').textContent = task.text;
  $('dino-task-progress').textContent = task.goal > 1 ? `${Math.max(0, progress)} / ${task.goal}` : '';
  $('dino-task-photo').hidden = task.type !== 'color' || pending;
  if (!pending && task.type !== 'color' && task.type !== 'greet' && progress >= task.goal) void finishTask();
}
$('dino-task-toggle').addEventListener('click', () => { if (state.dino?.task?.accepted !== false) setDinoTaskOpen(!dinoTaskOpen); });
$('dino-task-accept').addEventListener('click', async () => {
  const t = await updateState(current => { if (current.dino.task) current.dino.task.accepted = true; });
  state = t.state; dinoTaskOpen = false; renderAll(); say('謝謝你！我在旁邊等你喔～', 'happy', 2500);
});
$('dino-task-decline').addEventListener('click', async () => {
  const t = await updateState(current => { current.dino.task = null; });
  state = t.state; renderAll(); say('好～那下次再拜託你！', 'idle', 2500);
});
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
  if (unlockedMilestones(state, CHARACTERS).some(m => !state.letters.seen?.[m.id])) void updateState(current => stampLetters(current, CHARACTERS)).then(t => { state = t.state; if ($('letter-box').open) renderLetterList(); });
  renderLetterList();
  $('letter-box').showModal(); syncRoomActivity();
}
let letterTab = 'all';
function setLetterTab(tab) {
  letterTab = tab;
  $('letter-tab-all').setAttribute('aria-selected', String(tab === 'all'));
  $('letter-tab-starred').setAttribute('aria-selected', String(tab === 'starred'));
  renderLetterList();
}
const letterSub = (letter) => letter.kind === 'mail' ? `湘寄來的 · ${new Date(letter.at).toLocaleDateString('zh-TW')}`
  : letter.kind === 'note' ? `小湘寫的 · ${new Date(letter.at).toLocaleDateString('zh-TW')}`
  : letter.kind === 'intro' ? '最初的紙條' : `里程碑 · ${letter.hint}`;
function renderLetterList() {
  const read = state.letters.read;
  const starred = starredLetters(state, CHARACTERS);
  $('letter-starred-count').textContent = starred.length ? String(starred.length) : '';
  const list = letterTab === 'starred' ? starred : allLetters(state, CHARACTERS);
  if (!list.length) {
    $('letter-list').replaceChildren(Object.assign(document.createElement('p'), { className: 'letter-empty', textContent: '還沒有重要紙條。\n讀紙條時按「☆ 收藏成重要紙條」，就會放到這裡。' }));
  } else $('letter-list').replaceChildren(...list.map(letter => {
    const unread = letter.kind !== 'intro' && !read.includes(letter.id);
    const star = isStarred(state, letter.id);
    const item = document.createElement('button'); item.type = 'button'; item.className = `letter-item${letter.kind === 'mail' || letter.kind === 'note' ? ' is-mail' : ''}${unread ? ' is-unread' : ''}${star ? ' is-starred' : ''}`;
    item.innerHTML = LETTER_ICON;
    const text = document.createElement('span'); text.textContent = letter.title || '湘寄來的紙條';
    const sub = document.createElement('small'); sub.textContent = letterSub(letter);
    text.append(sub);
    const badge = document.createElement('span'); badge.className = 'letter-new';
    if (star) badge.append(Object.assign(document.createElement('b'), { className: 'letter-star', textContent: '★', title: '重要紙條' }));
    if (state.letters.mail.some(m => m.id === letter.id && m.gift && !m.giftAt)) badge.append(Object.assign(document.createElement('b'), { className: 'letter-gift-dot', textContent: '🎁', title: '附了禮物' }));
    if (unread) badge.append('未讀');
    item.append(text, badge);
    if (star) item.setAttribute('aria-label', `${letter.title || '湘寄來的紙條'}（重要紙條）`);
    item.addEventListener('click', () => readLetter(letter));
    return item;
  }));
  const locked = lockedMilestones(state, CHARACTERS).length;
  $('letter-locked').hidden = letterTab === 'starred';
  $('letter-locked').textContent = locked ? `還有 ${locked} 張紙條等你發現。` : '所有里程碑紙條都收齊了！';
}
let readingLetter = null;
function renderLetterStar() {
  const on = Boolean(readingLetter && isStarred(state, readingLetter.id));
  $('letter-read-star').setAttribute('aria-pressed', String(on));
  $('letter-read-star').textContent = on ? '★ 已是重要紙條' : '☆ 收藏成重要紙條';
}
// 湘隨紙條附的禮物（11/21）：第一次拆開紙條時收下，只會收一次
function renderLetterGift(letter) {
  const mail = state.letters.mail.find(m => m.id === letter.id);
  const gift = mail?.gift;
  $('letter-read-gift').hidden = !gift;
  if (gift) $('letter-read-gift').textContent = `🎁 隨信附上：${describeReward(gift, CHARACTERS, EGGS)}${mail.giftAt ? '（已收下）' : ''}`;
}
function claimLetterGift(letter) {
  const mail = state.letters.mail.find(m => m.id === letter.id);
  if (!mail?.gift || mail.giftAt) return;
  void updateState(current => {
    const m = current.letters.mail.find(x => x.id === letter.id);
    if (!m?.gift || m.giftAt || !validReward(m.gift, CHARACTERS)) return false;
    applyReward(current, m.gift, 'letter'); m.giftAt = new Date().toISOString(); return true;
  }).then(t => { state = t.state; if (!t.result) return; renderAll(); if (readingLetter?.id === letter.id) renderLetterGift(letter); toast(`收下湘附的禮物：${describeReward(mail.gift, CHARACTERS, EGGS)}！`); });
}
function readLetter(letter) {
  readingLetter = letter;
  $('letter-read-title').textContent = letter.kind === 'intro' ? '' : letter.title || '湘寄來的紙條';
  $('letter-read-title').hidden = letter.kind === 'intro';
  $('letter-read-body').textContent = letter.body;
  renderLetterGift(letter);
  renderLetterStar();
  $('letter-read').showModal();
  claimLetterGift(letter);
  if (letter.kind !== 'intro' && !state.letters.read.includes(letter.id)) {
    void updateState(current => { if (!current.letters.read.includes(letter.id)) current.letters.read.push(letter.id); }).then(t => { state = t.state; renderLetterBadge(); });
  }
}
$('letter-read-star').addEventListener('click', async () => {
  if (!readingLetter) return;
  const id = readingLetter.id;
  const t = await updateState(current => { toggleStar(current, id); });
  state = t.state; renderLetterStar();
  if ($('letter-box').open) renderLetterList();
});
$('letter-tab-all').addEventListener('click', () => setLetterTab('all'));
$('letter-tab-starred').addEventListener('click', () => setLetterTab('starred'));
$('close-letter-box').addEventListener('click', () => $('letter-box').close());
$('letter-box').addEventListener('close', syncRoomActivity);
$('letter-read-ok').addEventListener('click', () => { $('letter-read').close(); if ($('letter-box').open) renderLetterList(); });

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
    fresh.push({ id, title: typeof p.title === 'string' ? p.title.slice(0, 40) : '', body: p.body, at: p.createdAt || new Date().toISOString(), ...(p.reward && validReward(p.reward, CHARACTERS) ? { gift: p.reward } : {}) });
  }
  if (!fresh.length) return 0;
  const t = await updateState(current => { const ids = new Set(current.letters.mail.map(m => m.id)); for (const m of fresh) if (!ids.has(m.id)) current.letters.mail.push(m); });
  state = t.state; renderAll();
  const gifts = fresh.filter(m => m.gift).length;
  toast(fresh.length > 1 ? `湘寄來 ${fresh.length} 張新紙條！${gifts ? '裡面還附了禮物🎁' : ''}` : `湘寄來一張新紙條！${gifts ? '還附了禮物🎁 ' : ''}到首頁的紙條看看吧。`);
  say('有一張新紙條送到了！', 'happy', 3000);
  return fresh.length;
}

/* ---------- 湘的委託、記憶檔案、約會碼 ---------- */
// 審核結果小卡（湘 11/21）：通過或退回都跳一張要按按鈕才會關的小卡，附照片和湘的批註，一次一張
const reviewQueue = [];
function showReviewResults(list) {
  reviewQueue.push(...list);
  if (!$('review-result').open) nextReviewResult();
}
function nextReviewResult() {
  const r = reviewQueue.shift();
  if (!r) return;
  $('review-result-kicker').textContent = r.approved ? 'COMMISSION APPROVED' : 'COMMISSION RETURNED';
  $('review-result-title').textContent = r.approved ? '委託通過了！' : '委託被退回了';
  $('review-result-mission').textContent = `「${r.mission.title}」`;
  $('review-result-img').hidden = !r.thumb; if (r.thumb) $('review-result-img').src = r.thumb;
  $('review-result-img').alt = `${r.mission.title} 的照片`;
  $('review-result-reward').hidden = !r.approved;
  $('review-result-reward').textContent = r.approved ? `🎁 獲得 ${describeReward(r.mission.reward, CHARACTERS, EGGS)}，照片收進記憶檔案` : '';
  const note = String(r.note || '').trim();
  $('review-result-note').hidden = !note && r.approved;
  $('review-result-note').textContent = note ? `湘的批註：\n${note}` : '湘沒有寫批註，換個角度再拍一張試試吧！';
  $('review-result-ok').textContent = r.approved ? '收下' : '知道了，再拍一次';
  $('review-result').dataset.approved = r.approved ? '1' : '';
  $('review-result').showModal();
  say(r.approved ? '委託通過了！好開心～' : '沒關係，再拍一次吧！', r.approved ? 'happy' : 'cheer', 3000);
}
$('review-result-ok').addEventListener('click', () => $('review-result').close());
$('review-result').addEventListener('close', () => setTimeout(nextReviewResult, 200));

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
        applied.push({ ...r, mission, thumb: pending.thumb || '' });
      }
      return { fresh, applied, badSeal };
    });
    state = t.state; renderAll();
    if (t.result.applied.length) showReviewResults(t.result.applied);
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
    if (cloudConfig()?.kind === 'siang' && (await pushState().catch(() => 'unsupported')) === 'off') $('missions-status').textContent += '\n想在審完時收到通知？到「雲端與備份」開啟手機通知 🔔';
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
    const pick = EGGS.date.pool[p.character] ? p.character : null; // 湘在審核室可以指定孵出誰，不指定就隨機
    current.gifts.eggs.push({ egg: 'date', ...(pick ? { character: pick } : {}), from: 'date', at: new Date().toISOString() });
    current.memories.push({ id: `d-${code}`, kind: 'date', title: p.title || '今天的約會', note: String(p.note || '').slice(0, 600), at: new Date().toISOString(), character: pick || '014' });
    return pick || true;
  });
  state = t.state; renderAll();
  if (!t.result) return '這個約會碼已經用過了。';
  say('約會快樂！我收到一顆特別的蛋喔♡', 'cheer', 4000);
  return `約會快樂♡ 獲得一顆約會蛋${typeof t.result === 'string' ? `（會孵出${CHARACTERS[t.result].name}）` : ''}，今天的約會也收進記憶檔案了。到「選擇蛋」把它拿出來吧！`;
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
    // 指定小湘：化石不夠也能點進去看清單（湘 11/23：灰掉卻不知道為什麼）；只有全部收集完才停用
    const pickMin = o.id === 'pick' ? cheapestPick(state, EGGS, CHARACTERS) : 0;
    btn.disabled = o.id === 'pick' ? pickMin === Infinity : state.fossils < o.cost;
    const text = document.createElement('div'); const b = document.createElement('b'); b.textContent = o.name; const sm = document.createElement('small'); sm.textContent = o.id === 'pick' && pickMin === Infinity ? '蛋裡能孵出的小湘你都遇見了！' : o.desc; text.append(b, sm);
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
  $('fossil-status').textContent = offerId === 'slot' ? `蛋架擴充到 ${state.cradle.slots} 格！到培育室就能看到副架：換蛋時，正在孵的那顆會放上去繼續保溫。` : offerId === 'energy' ? `換到 ${FOSSIL_ENERGY} 能量了！` : offerId === 'pick' ? `用 ${t.result.cost} 化石換到一顆暗號蛋，裡面是${CHARACTERS[no].name}！到「選擇蛋」把它拿出來吧。` : `換到${t.result.name}了！到「選擇蛋」把它拿出來吧。`;
  openFossils();
}
$('chip-fossil').addEventListener('click', openFossils);
$('close-fossil').addEventListener('click', () => $('fossil-dialog').close());
$('fossil-dialog').addEventListener('close', syncRoomActivity);
$('fossil-offers').addEventListener('click', event => {
  const btn = event.target.closest('[data-offer]'); if (!btn || btn.disabled) return;
  if (btn.dataset.offer !== 'pick') { void doExchange(btn.dataset.offer); return; }
  const list = pickable(state, EGGS, CHARACTERS);
  const min = cheapestPick(state, EGGS, CHARACTERS);
  const note = document.createElement('p'); note.className = 'fossil-pick-note';
  note.textContent = state.fossils < min ? `現在最便宜的一位要 ${min} 化石，還差 ${min - state.fossils} 個，先存起來吧！` : '';
  $('fossil-pick-list').replaceChildren(...(note.textContent ? [note] : []), ...PICK_TIERS.flatMap(r => {
    const nos = list.filter(no => CHARACTERS[no].rarity === r); if (!nos.length) return [];
    const cost = PICK_COSTS[r];
    const head = document.createElement('p'); head.className = 'fossil-pick-tier'; head.textContent = `${r} · 每位 ${cost} 化石${state.fossils < cost ? `（還差 ${cost - state.fossils}）` : ''}`;
    return [head, ...nos.map(no => {
      const c = CHARACTERS[no]; const b = document.createElement('button'); b.type = 'button'; b.className = 'fossil-pick'; b.dataset.pick = no;
      b.disabled = state.fossils < pickCost(CHARACTERS, no);
      const img = document.createElement('img'); img.alt = ''; loadWithFallback(img, characterSources(c.image));
      b.append(img, `${noLabel(c.no)} · ${pickCost(CHARACTERS, no)}`); return b;
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
  const siang = config?.kind === 'siang';
  $('cloud-invite').value = '';
  $('cloud-invite').placeholder = siang ? '已儲存（要更換再貼上新的）' : 'SIANG-……';
  $('cloud-repo').value = config?.repo || $('cloud-repo').value;
  $('cloud-token').value = '';
  $('cloud-token').placeholder = config && !siang ? '已儲存（要更換再貼上新的）' : 'github_pat_…';
  if (config && !siang) $('cloud-legacy').open = true;
  $('cloud-save').textContent = config ? '更新連線' : '連線';
  $('cloud-backup').hidden = !config;
  $('cloud-restore-confirm').hidden = true;
  const last = lastBackup();
  $('cloud-last').textContent = last ? `上次備份：${new Date(last).toLocaleString('zh-TW')}（每天打開遊戲時自動備份）` : '還沒有備份過';
  $('cloud-status').textContent = message;
  void renderPush();
}
// 手機通知（11/21）：只有小湘雲端（邀請碼）的玩家可以開
const PUSH_HINTS = {
  on: '已開啟：湘審完委託、寄紙條或回覆照片時，這支手機會跳通知。',
  off: '打開後，湘審完委託、寄紙條或回覆照片時，就算沒開遊戲也會跳通知。',
  'need-home-screen': 'iPhone 要先用 Safari 的「分享 → 加入主畫面」，再從主畫面的小湘打開，才能開通知。',
  denied: '這支手機擋掉了通知。要開的話，到手機的設定裡把這個遊戲的通知打開。',
  unsupported: '這個瀏覽器不支援通知，可以換成 Chrome 或把遊戲加入主畫面再試試。',
};
async function renderPush() {
  const config = cloudConfig();
  $('cloud-push').hidden = config?.kind !== 'siang';
  if ($('cloud-push').hidden) return;
  const st = await pushState().catch(() => 'unsupported');
  $('push-hint').textContent = PUSH_HINTS[st];
  $('push-toggle').hidden = !['on', 'off'].includes(st);
  $('push-toggle').textContent = st === 'on' ? '關閉手機通知' : '🔔 開啟手機通知';
  $('push-toggle').className = st === 'on' ? 'btn btn--quiet' : 'btn';
  $('push-toggle').dataset.state = st;
}
$('push-toggle').addEventListener('click', async () => {
  const config = cloudConfig(); if (config?.kind !== 'siang') return;
  const on = $('push-toggle').dataset.state === 'on';
  $('push-toggle').disabled = true;
  try {
    if (on) { await disablePush(config.token); $('cloud-status').textContent = '已關閉手機通知。'; }
    else { await enablePush(config.token); $('cloud-status').textContent = '開好了！湘有新消息時這支手機會跳通知 🔔'; }
  } catch (err) { $('cloud-status').textContent = `通知沒有開成功：${err.message}`; }
  finally { $('push-toggle').disabled = false; void renderPush(); }
});

// 進度大小：圖鑑幾位為主，孵化次數次之。用來防止「進度不見的新手機」一連上雲端就把舊備份蓋掉（11/19）
function progressOf(saveText) {
  try { const s = typeof saveText === 'string' ? JSON.parse(saveText) : saveText; return Object.keys(s?.dex || {}).length * 10000 + (s?.hatched || 0); } catch { return 0; }
}
function describeSave(data) {
  try { const s = JSON.parse(data.keys['siang-collector:v1']); return `${new Date(data.at).toLocaleString('zh-TW')}：圖鑑 ${Object.keys(s.dex || {}).length} 位、孵化 ${s.hatched || 0} 次`; } catch { return new Date(data.at).toLocaleString('zh-TW'); }
}
// 雲端上進度最多的那份備份（latest 和每天的備份都看）
async function bestCloudBackup(cloud) {
  const files = new Set(['backups/latest.json']);
  try { for (const f of await cloud.list('backups')) if (f.type === 'file' && /\.json$/.test(f.name)) files.add(`backups/${f.name}`); } catch {}
  let best = null;
  for (const path of files) {
    try {
      const file = await cloud.getJSON(path); const data = file?.data;
      if (data?.app !== 'siang-collector' || !data.keys?.['siang-collector:v1']) continue;
      const score = progressOf(data.keys['siang-collector:v1']);
      if (!best || score > best.score || (score === best.score && data.at > best.data.at)) best = { path, data, score };
    } catch {}
  }
  return best;
}
let forceBackup = false;
async function backupNow({ auto = false } = {}) {
  const config = cloudConfig();
  if (!config) throw new Error('還沒連線');
  const cloud = createCloud(config);
  const local = progressOf(localStorage.getItem('siang-collector:v1'));
  const best = await bestCloudBackup(cloud);
  if (best && best.score > local && !forceBackup) {
    const err = new Error(`雲端上有進度比這支手機多的備份（${describeSave(best.data)}），先不備份，免得蓋掉它。要找回進度請按「從雲端還原」。${auto ? '' : '確定要用這支手機的進度覆蓋，請再按一次「立即備份」。'}`);
    err.regress = true; if (!auto) forceBackup = true; throw err;
  }
  forceBackup = false;
  const keys = {};
  for (const k of BACKUP_KEYS) { try { const v = localStorage.getItem(k); if (v !== null) keys[k] = v; } catch {} }
  const data = { app: 'siang-collector', v: 1, at: new Date().toISOString(), keys };
  await cloud.putJSON('backups/latest.json', data, 'backup: latest', { overwrite: true });
  await cloud.putJSON(`backups/${todayKey()}.json`, data, `backup: ${todayKey()}`, { overwrite: true });
  try { localStorage.setItem(LAST_BACKUP_KEY, data.at); } catch {}
  await pruneBackups(cloud, best?.path);
  return data.at;
}
// 每天的備份只留最近 7 份（湘 11/20：雲端容量有限）；latest 和進度最多的那份永遠不刪
const BACKUP_KEEP = 7;
async function pruneBackups(cloud, keepPath) {
  try {
    const dated = (await cloud.list('backups')).filter(f => f.type === 'file' && /^\d{4}-\d{2}-\d{2}\.json$/.test(f.name)).map(f => f.name).sort().reverse();
    for (const name of dated.slice(BACKUP_KEEP)) if (`backups/${name}` !== keepPath) await cloud.remove(`backups/${name}`, 'prune old backup');
  } catch {} // 刪不掉就下次再說，不影響備份本身
}

async function autoBackup() {
  const last = lastBackup();
  if (!cloudConfig() || (last && todayKey(new Date(last)) === todayKey())) return;
  try { await backupNow({ auto: true }); } catch (err) { if (err.regress) renderCloud(err.message); }
}

$('open-cloud').addEventListener('click', () => { $('function-center').close(); renderCloud(); $('cloud-dialog').showModal(); syncRoomActivity(); });
$('close-cloud').addEventListener('click', () => $('cloud-dialog').close());
$('cloud-dialog').addEventListener('close', syncRoomActivity);
$('cloud-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const invite = $('cloud-invite').value.trim();
  if (invite || (cloudConfig()?.kind === 'siang' && !$('cloud-repo').value.trim())) {
    const token = invite || cloudConfig().token;
    if (!isInvite(token)) { $('cloud-status').textContent = '邀請碼看起來不太對，要是 SIANG- 開頭的那一串。'; return; }
    $('cloud-save').disabled = true; $('cloud-status').textContent = '連線中…';
    try {
      const me = await createCloud({ kind: 'siang', token }).test();
      saveCloudConfig({ kind: 'siang', token, name: me.name });
      renderCloud(`連線成功！歡迎，${me.name}～`);
      void autoBackup().then(() => renderCloud($('cloud-status').textContent));
    } catch (err) { $('cloud-status').textContent = `連不上：${err.message}`; }
    finally { $('cloud-save').disabled = false; }
    return;
  }
  const repo = $('cloud-repo').value.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
  const token = $('cloud-token').value.trim() || cloudConfig()?.token || '';
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !token) { $('cloud-status').textContent = '請貼上湘給你的邀請碼（舊方式才需要資料庫名稱和通行碼）。'; return; }
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
  try { await backupNow(); renderCloud('備份完成。'); } catch (err) { $('cloud-status').textContent = err.regress ? err.message : `備份失敗：${err.message}`; }
  finally { $('cloud-backup-now').disabled = false; }
});
let pendingRestore = null;
// 還原後重新整理，打開「雲端與備份」告訴玩家有沒有成功、現在有幾位小湘（11/19 湘：按了還原不知道有沒有成功）
const RESTORED_KEY = 'siang-collector:restored:v1';
function showRestoreResult() {
  let info = null; try { info = JSON.parse(localStorage.getItem(RESTORED_KEY) || 'null'); localStorage.removeItem(RESTORED_KEY); } catch {}
  if (!info) return;
  const now = progressOf(localStorage.getItem('siang-collector:v1'));
  const ok = now >= info.expect;
  renderCloud(ok ? `✅ 還原成功！現在圖鑑有 ${Object.keys(state.dex || {}).length} 位小湘、孵化 ${state.hatched || 0} 次。（用的是 ${info.from} 的備份）` : '⚠️ 還原好像沒有成功，進度跟備份對不起來。請截圖給湘，先不要按「立即備份」。');
  $('cloud-dialog').showModal(); syncRoomActivity();
}
$('cloud-restore').addEventListener('click', async () => {
  $('cloud-status').textContent = '讀取雲端備份…';
  try {
    const best = await bestCloudBackup(createCloud(cloudConfig()));
    if (!best) { $('cloud-status').textContent = '雲端還沒有備份。'; return; }
    pendingRestore = best.data;
    const saved = JSON.parse(best.data.keys['siang-collector:v1']);
    $('cloud-status').textContent = `找到進度最多的備份（${describeSave(best.data)}、能量 ${saved.energy || 0}）。`;
    $('cloud-restore-confirm').hidden = false;
  } catch (err) { $('cloud-status').textContent = `讀取失敗：${err.message}`; }
});
$('cloud-restore-confirm').addEventListener('click', () => {
  if (!pendingRestore) return;
  for (const [k, v] of Object.entries(pendingRestore.keys)) if (BACKUP_KEYS.includes(k)) localStorage.setItem(k, v);
  try { localStorage.setItem(RESTORED_KEY, JSON.stringify({ from: describeSave(pendingRestore), expect: progressOf(pendingRestore.keys['siang-collector:v1']) })); } catch {}
  location.reload();
});
$('cloud-disconnect').addEventListener('click', () => { saveCloudConfig(null); $('cloud-repo').value = ''; $('cloud-invite').value = ''; renderCloud('已中斷連線，這支手機不再保存通行碼。'); });

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
setTimeout(showRestoreResult, 900); // 等開場切換畫面（showView 會關掉所有彈窗）跑完再打開
void autoBackup().catch(() => {}).then(() => syncFromCloud(true));
if (cloudConfig()?.kind === 'siang') void refreshPush(cloudConfig().token).catch(() => {});
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
  android: ['點右上角的 <b>⋮</b> 選單', '選<b>安裝應用程式</b>或<b>加到主畫面</b>', '按<b>安裝</b>，桌面就會出現頁間居民'],
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
  if (install.isInstalled()) { toast('頁間居民已經在主畫面上了！'); return; }
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
  if (type === 'installed') { if ($('install-dialog').open) $('install-dialog').close(); toast('頁間居民放到主畫面囉！之後點圖示就能打開～'); }
});
if (install.isInstalled()) $('open-install').hidden = true;

// ── 派小湘出門
var errandChoice = null; // { place } 或 { task }
var errandPicked = [];
var recallAsk = null; // 正在問「要叫回來嗎？」的那趟 id
var announcedBack; // var：renderAll 在檔案尾端宣告之前就會跑
function siangImg(no, cls = '') {
  const img = document.createElement('img'); img.alt = CHARACTERS[no].name; img.draggable = false; if (cls) img.className = cls;
  loadWithFallback(img, characterSources(CHARACTERS[no].image)); return img;
}
function tripCard(entry) {
  const card = document.createElement('div'); card.className = 'trip-card'; card.dataset.place = entry.place || 'home';
  const bg = document.createElement('img'); bg.className = 'trip-card__img'; bg.alt = ''; bg.src = `assets/places/${entry.place || (entry.task ? `home-${entry.task}` : 'home')}.webp`; bg.onerror = () => bg.remove();
  const who = document.createElement('div'); who.className = 'trip-card__who'; who.append(...entry.nos.map(no => siangImg(no)));
  const tag = document.createElement('span'); tag.className = 'trip-card__tag'; const spot = PLACES[entry.place] || HOME_TASKS[entry.task]; tag.textContent = `${spot?.emoji || ''} ${spot?.name || ''}`;
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
    else if (recallAsk === e.id) {
      // 二次確認：避免誤按把小湘叫回來
      row.classList.add('is-asking');
      const ask = document.createElement('div'); ask.className = 'errand-recall';
      const p = document.createElement('p'); p.textContent = `要叫${names}回來嗎？這趟不會帶東西回來，下次出門要重新計時。`;
      const yes = document.createElement('button'); yes.type = 'button'; yes.className = 'btn btn--danger errand-recall__yes'; yes.textContent = '叫回來';
      yes.addEventListener('click', () => void recallErrand(e.id));
      const no = document.createElement('button'); no.type = 'button'; no.className = 'btn btn--quiet errand-recall__no'; no.textContent = '再等等';
      no.addEventListener('click', () => { recallAsk = null; renderErrands(); });
      const acts = document.createElement('div'); acts.className = 'errand-recall__acts'; acts.append(no, yes);
      ask.append(p, acts); row.append(ask);
    } else {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn btn--quiet errand-trip__recall'; btn.textContent = e.place ? '叫回來' : '先不做了';
      btn.addEventListener('click', () => { recallAsk = e.id; renderErrands(); });
      row.append(btn);
    }
    return row;
  }));
  const slots = errandSlots(state); const full = er.active.length >= slots;
  const placeBtn = (key, info, kind) => {
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'errand-place';
    btn.setAttribute('aria-pressed', String(errandChoice?.[kind] === key)); btn.disabled = full;
    btn.innerHTML = `<span aria-hidden="true">${info.emoji}</span>${info.name}<small>${info.hours} 小時</small>`;
    { // 地點縮圖（皮寶的地點背景；在家幫忙是 home-*.webp）；圖載不到就留 emoji
      const img = document.createElement('img'); img.className = 'errand-place__img'; img.alt = ''; img.loading = 'lazy'; img.src = `assets/places/${kind === 'task' ? `home-${key}` : key}.webp`;
      img.onload = () => btn.classList.add('has-img'); img.onerror = () => img.remove(); btn.prepend(img);
    }
    btn.addEventListener('click', () => { errandChoice = { [kind]: key }; errandPicked = []; $('errand-status').textContent = ''; renderErrands(); $('errand-pick').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    return btn;
  };
  $('errand-places').replaceChildren(...Object.entries(PLACES).map(([k, v]) => placeBtn(k, v, 'place')));
  $('errand-tasks').replaceChildren(...Object.entries(HOME_TASKS).map(([k, v]) => placeBtn(k, v, 'task')));
  $('errand-status').textContent = full && !$('errand-status').textContent ? `同時最多 ${slots} 趟，等她們回來再派吧。${errandSlotHint(state)}` : $('errand-status').textContent;
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
    const busy = new Set([...busyNos(state), ...battle.battleNos(state), ...lab.labNos(state)]); // 研究室調配中的也不能出門
    const owned = Object.keys(CHARACTERS).filter(no => state.dex[no]);
    owned.sort((a, b) => (place ? Number(hasAffinity(place, b)) - Number(hasAffinity(place, a)) : 0));
    $('errand-siangs').replaceChildren(...owned.map(no => {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'errand-siang'; btn.dataset.siang = no;
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
  renderCardBox();
  $('errand-album').replaceChildren(...(er.album.length ? albumNodes(er.album) : [Object.assign(document.createElement('p'), { className: 'residents-intro', textContent: '還沒有旅行照片，派小湘出門看看吧！' })]));
}
// 旅行相簿：同一個地點合併成一張「×N」，點開再看每一趟（湘 11/21）
let albumOpen = null;
function tripBtn(entry, cls = 'trip-card-btn') {
  const btn = mkEl('button', cls); btn.type = 'button';
  btn.append(tripCard(entry)); btn.setAttribute('aria-label', `${entry.nos.map(no => CHARACTERS[no].name).join('和')}去${PLACES[entry.place]?.name}`);
  btn.addEventListener('click', () => showErrandResult({ ...entry, names: entry.nos.map(no => CHARACTERS[no].name).join('和') }, true));
  return btn;
}
function albumNodes(album) {
  const groups = [];
  for (const entry of album) { let g = groups.find(x => x.place === entry.place); if (!g) groups.push(g = { place: entry.place, list: [] }); g.list.push(entry); }
  if (!groups.some(g => g.place === albumOpen && g.list.length > 1)) albumOpen = null;
  const nodes = [];
  for (const g of groups) {
    if (g.list.length === 1) { nodes.push(tripBtn(g.list[0])); continue; }
    const open = albumOpen === g.place; const name = PLACES[g.place]?.name || '';
    const btn = mkEl('button', `trip-group-btn${open ? ' is-open' : ''}`); btn.type = 'button';
    btn.setAttribute('aria-expanded', String(open)); btn.setAttribute('aria-label', `${name}的 ${g.list.length} 趟旅行`);
    const card = tripCard({ ...g.list[0], story: g.list.some(e => e.story) });
    card.append(mkEl('span', 'trip-card__count', `×${g.list.length}`)); btn.append(card);
    btn.addEventListener('click', () => { albumOpen = open ? null : g.place; renderErrands(); });
    nodes.push(btn);
    if (open) {
      const more = mkEl('div', 'errand-album__more');
      more.append(mkEl('p', 'errand-album__more-title', `${PLACES[g.place]?.emoji || ''} ${name} · ${g.list.length} 趟`));
      const grid = mkEl('div', 'errand-album__more-grid');
      grid.append(...g.list.map(entry => { const b = tripBtn(entry); b.append(mkEl('small', 'trip-card__date', new Date(entry.at).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }))); return b; }));
      more.append(grid); nodes.push(more);
    }
  }
  return nodes;
}
function openErrands() {
  errandChoice = null; errandPicked = []; recallAsk = null; $('errand-status').textContent = '';
  renderErrands();
  if (!$('errand-dialog').open) { $('errand-dialog').showModal(); syncRoomActivity(); }
  showTip('errand', $('errand-pane'));
}
function mkEl(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; } // 函式宣告會提前，開遊戲時就能用
// 重複的家鄉明信片：當場選「留下」或「丟掉（+1 化石）」；沒選就是留下，之後也能在明信片盒丟（湘 11/20）
function renderResultDupes(list) {
  const box = $('errand-result-dupes'); box.hidden = !list.length;
  box.replaceChildren(...list.map(county => {
    const row = mkEl('div', 'card-dupe'); row.append(mkEl('span', '', `📮 ${county}的明信片重複了`));
    const keep = mkEl('button', 'btn btn--quiet', '留下'); keep.type = 'button';
    const toss = mkEl('button', 'btn btn--quiet', `丟掉（+${CARD_RECYCLE} 化石）`); toss.type = 'button';
    keep.addEventListener('click', () => { row.replaceChildren(mkEl('span', '', `📮 ${county}的明信片收進明信片盒了`)); });
    toss.addEventListener('click', async () => { keep.disabled = toss.disabled = true; const n = await doToss(county, 1); row.replaceChildren(mkEl('span', '', n ? `📮 丟掉了一張${county}的明信片，化石 +${n * CARD_RECYCLE}` : '這張已經處理過了')); });
    const btns = mkEl('div', 'card-dupe__btns'); btns.append(keep, toss); row.append(btns); return row;
  }));
}
async function doToss(county, count) {
  const t = await updateState(current => tossCard(current, county, count));
  state = t.state; renderAll(); if ($('errand-dialog').open) renderErrands();
  return t.result || 0;
}
// 明信片盒用按鈕開關（iPhone Safari 上 <details> 點了不會展開，湘 11/21）
$('card-box-summary').addEventListener('click', () => {
  const open = $('card-box-summary').getAttribute('aria-expanded') !== 'true';
  $('card-box-summary').setAttribute('aria-expanded', String(open)); $('card-box-grid').hidden = !open;
});
function renderCardBox() {
  const er = state.errands; const got = Object.keys(er.cards || {});
  const dupTotal = Object.values(er.cardDupes || {}).reduce((a, b) => a + b, 0);
  $('card-box').hidden = !got.length;
  $('card-box-summary').textContent = `📮 明信片盒 · ${got.length} 種${dupTotal ? ` · 重複 ${dupTotal} 張` : ''}`;
  const order = Object.keys(COUNTY_CHARACTER).filter(c => got.includes(c));
  $('card-box-grid').replaceChildren(...order.map(county => {
    const n = er.cardDupes?.[county] || 0;
    const card = mkEl('div', `card-box__card${n ? ' has-dupes' : ''}`);
    const open = mkEl('button', 'card-box__open'); open.type = 'button'; open.setAttribute('aria-label', `看${county}的明信片`);
    open.append(siangImg(COUNTY_CHARACTER[county]), mkEl('b', '', county), mkEl('small', '', n ? `重複 ${n} 張` : '收藏中'));
    open.addEventListener('click', () => showPostcard(county)); card.append(open);
    if (n) {
      const toss = mkEl('button', 'card-box__toss', `丟掉 1 張 +${CARD_RECYCLE}🦴`); toss.type = 'button';
      toss.addEventListener('click', async () => { toss.disabled = true; await doToss(county, 1); });
      card.append(toss);
      if (n > 1) { const all = mkEl('button', 'card-box__toss', `全部丟掉 +${n * CARD_RECYCLE}🦴`); all.type = 'button'; all.addEventListener('click', async () => { all.disabled = true; await doToss(county, n); }); card.append(all); }
    }
    return card;
  }));
}
// 點明信片：放大成一張明信片，正面是家鄉小湘，下面是她的話和旅途中的一句（湘 11/21，用現有台詞）
function postcardTrip(no, county) {
  const c = CHARACTERS[no]; const mine = CHARACTER_REPORTS[no] || {};
  const pool = mine.faraway?.length ? mine.faraway : Object.values(mine).flat();
  const list = pool.length ? pool : (SERIES_REPORTS[c.series]?.faraway || []).map(t => `${c.name}${t}`);
  if (!list.length) return '';
  const h = [...county].reduce((a, ch) => a + ch.codePointAt(0), 0); // 同一張明信片每次打開都是同一句
  return list[h % list.length];
}
function showPostcard(county) {
  const no = COUNTY_CHARACTER[county]; const c = CHARACTERS[no]; const at = state.errands.cards?.[county];
  const card = $('postcard-view-card'); const bg = mkEl('img', 'postcard-view__bg'); bg.alt = ''; bg.src = 'assets/places/faraway.webp'; bg.onerror = () => bg.remove();
  card.replaceChildren(bg, siangImg(no, 'postcard-view__siang'), mkEl('span', 'postcard-view__stamp', county));
  $('postcard-view-date').textContent = at ? `${new Date(at).toLocaleDateString('zh-TW')} 收到` : '';
  $('postcard-view-title').textContent = `${county}的家鄉明信片`;
  const msg = $('postcard-view-msg'); msg.replaceChildren(document.createTextNode(c.line || ''), mkEl('span', 'postcard-view__sign', `— ${c.name}`));
  const trip = postcardTrip(no, county); $('postcard-view-trip').textContent = trip; $('postcard-view-trip').hidden = !trip;
  $('postcard-view').showModal(); $('postcard-view').scrollTop = 0;
}
$('close-postcard-view').addEventListener('click', () => $('postcard-view').close());
function showErrandResult(r, replay = false) {
  // 出門和在家幫忙都用同一種照片卡（在家幫忙的背景是 assets/places/home-*.webp）
  $('errand-result-card').replaceChildren(tripCard(r));
  $('errand-result-eyebrow').textContent = replay ? new Date(r.at).toLocaleDateString('zh-TW') : 'WELCOME BACK';
  $('errand-result-title').textContent = r.place ? `${r.names}從${PLACES[r.place].name}回來了` : `${r.names}的${HOME_TASKS[r.task].name}完成了`;
  $('errand-result-line').textContent = r.line ? `「${r.line}」${r.place && r.boost ? '她好像特別喜歡那裡。' : ''}` : '';
  $('errand-result-story').hidden = !r.story;
  if (r.story) { $('errand-story-title').textContent = `📖 ${r.story.title}${r.storyFirst ? '（新故事！）' : ''}`; setParas($('errand-story-text'), r.story.text); }
  $('errand-result-gains').replaceChildren(...(r.gains || []).map(g => Object.assign(document.createElement('li'), { textContent: g })));
  renderResultDupes(replay ? [] : (r.dupes || []));
  $('errand-result-ok').textContent = replay ? '關閉' : '收下';
  $('errand-result').showModal(); $('errand-result').scrollTop = 0;
}
async function recallErrand(id) {
  recallAsk = null;
  const t = await updateState(current => recall(current, id));
  state = t.state;
  const e = t.result;
  if (e) {
    const names = e.nos.map(no => CHARACTERS[no].name).join('和');
    $('errand-status').textContent = e.place ? `${names}從半路回來了，這趟沒有帶東西。現在可以再派${e.nos.length > 1 ? "她們" : "她"}出門或去討伐。` : `${names}先不${HOME_TASKS[e.task].name}了，隨時可以再拜託她。`;
  }
  renderAll(); renderErrands(); syncRoomActivity();
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
  if (serverTime) { const t = serverTime; void updateState(c => { noteServerTime(c, t.serverMs, t.deviceMs); }); }
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
$('close-whats-new').addEventListener('click', () => $('whats-new-ok').click());
// 研究者手記「更新紀錄」：隨時翻看全部更新，還沒看過的標 NEW
$('open-updates').addEventListener('click', async () => {
  $('function-center').close();
  // 先打開視窗再讀紀錄：網路慢的時候不會在別的視窗打開後才突然跳出來
  $('whats-new-title').textContent = '更新紀錄';
  $('whats-new-list').replaceChildren(Object.assign(document.createElement('p'), { textContent: '讀取中……' }));
  $('whats-new').showModal(); $('whats-new').scrollTop = 0;
  let list = [];
  try { list = await loadChangelog(); } catch {}
  if (!$('whats-new').open) return;
  const fresh = new Set(unseen(list, { returning: isReturning() }).map(e => e.version));
  if (list.length) fillWhatsNew(list, fresh);
  else $('whats-new-list').replaceChildren(Object.assign(document.createElement('p'), { textContent: '更新紀錄暫時讀不到，等一下再試試看。' }));
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
    const body = document.createElement('span'); if (open && lv === 3) { body.className = 'bond-unlocks__story'; setParas(body, texts[lv], 50); } else body.textContent = open ? `「${texts[lv]}」` : '🔒 再親近一點就能看到';
    li.append(tag, body); return li;
  }));
}
// 口味筆記：只顯示玩家餵過推理出來的東西（js/kitchen.js tasteNotes）
const tasteChip = (text, cls) => Object.assign(document.createElement('span'), { className: `dex-taste__chip ${cls}`, textContent: text });
const tagIcons = tag => kitchen.tagIngredients(tag).map(i => i.icon).join('');
function renderTaste(no, owned) {
  const box = $('dex-detail-taste'); box.hidden = !owned;
  if (!owned) return;
  const n = kitchen.tasteNotes(state, no);
  $('taste-tries').textContent = n.tries ? `吃過 ${n.tries} 道` : '';
  const row = (label, fill) => { const r = document.createElement('div'); r.className = 'dex-taste__row'; const v = document.createElement('span'); fill(v); r.append(Object.assign(document.createElement('b'), { textContent: label }), v); return r; };
  const tagRow = (label, sure, list) => row(label, v => {
    if (sure) v.append(tasteChip(sure, 'is-on'), Object.assign(document.createElement('span'), { className: 'dex-taste__ings', textContent: kitchen.tagIngredients(sure).map(i => i.icon + i.name).join('、') }));
    else if (list.length <= 4) v.append(...list.map(t => tasteChip(`${tagIcons(t)} ${t}？`, 'is-maybe')));
    else v.append(Object.assign(document.createElement('span'), { className: 'dex-taste__unknown', textContent: n.tries ? `還在找（${list.length} 種可能）` : '還不知道' }));
  });
  $('taste-rows').replaceChildren(
    tagRow('😋 喜歡', n.like, n.likes),
    tagRow('🤢 討厭', n.dislike, n.dislikes),
    row('💖 最愛', v => v.append(n.secret ? tasteChip(n.secret.name, 'is-on') : Object.assign(document.createElement('span'), { className: 'dex-taste__unknown', textContent: '？＋？（吃到才知道）' }))),
  );
  $('taste-hint').textContent = !n.tries ? '在小湘廚房餵她吃東西，就會慢慢知道她的口味。'
    : n.like && n.dislike ? '' : (!n.like && n.likes.length <= 4) || (!n.dislike && n.dislikes.length <= 4) ? '再餵一道只有其中一種口味的料理，就知道是哪個了。' : '多餵幾道不一樣的料理，範圍會越來越小。';
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
  $('bond-up').querySelector('.county-call__eyebrow').textContent = 'BOND LEVEL UP'; $('bond-up-ok').textContent = '好開心';
  // 「好感度升到 Lv.3！」黏在一起，名字太長時從名字後面換行，不會只剩等級孤單一行（11/21）
  const lv = document.createElement('span'); lv.className = 'bond-up__lv'; lv.textContent = `好感度升到 Lv.${level}！`;
  $('bond-up-title').replaceChildren(`${c.name}的`, lv);
  $('bond-up-unlock').textContent = level === 3 ? unlock : `解鎖：${unlock}`;
  // 小故事照句子分段（約 50 字一段），台詞維持一句（11/21）
  if (level === 3) setParas($('bond-up-text'), text, 50); else $('bond-up-text').textContent = `「${text}」`;
  // Lv.3 小故事用靠左的故事卡片呈現；台詞維持置中引號
  $('bond-up').classList.toggle('is-story', level === 3);
  const r = describeLevelReward(reward);
  $('bond-up-reward').textContent = r ? `禮物：${r}` : '';
  $('bond-up').classList.toggle('is-shiny', level >= MAX_LEVEL);
  $('bond-up').showModal(); $('bond-up').scrollTop = 0; syncRoomActivity(); buzz([20, 40, 20]); // 長故事從頭讀，不要被按鈕的焦點捲到底
  renderResources();
}
$('bond-up-ok').addEventListener('click', () => $('bond-up').close());
// 成就附帶的故事（例如集齊月見町五位的《月見町的最後一盞燈》）：借用好感升級的故事卡片
function showAchievementStory(a) {
  if (!a?.story || $('bond-up').open) return;
  loadWithFallback($('bond-up-img'), characterSources(a.storyArt)); $('bond-up-img').alt = '';
  $('bond-up').querySelector('.county-call__eyebrow').textContent = 'SPECIAL EVENT';
  $('bond-up-title').textContent = a.storyTitle;
  $('bond-up-unlock').textContent = `稱號「${a.title}」`;
  setParas($('bond-up-text'), a.story, 50, true);
  $('bond-up-reward').textContent = '';
  $('bond-up-ok').textContent = a.storyOk || '今日辛苦了';
  $('bond-up').classList.add('is-story', 'is-shiny');
  $('bond-up').showModal(); $('bond-up').scrollTop = 0; buzz([20, 40, 20]);
}
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
const allBusy = () => new Set([...busyNos(state), ...battle.battleNos(state), ...lab.labNos(state)]); // 研究室調配中的也不能討伐
function showErrandTab(tab) {
  for (const t of ['errand', 'battle', 'kitchen']) { $(`tab-${t}`).setAttribute('aria-selected', String(tab === t)); $(`${t}-pane`).hidden = tab !== t; }
  $('errand-title').textContent = { battle: '討伐', kitchen: '小湘廚房' }[tab] || '派小湘出門';
  $('errand-title').previousElementSibling.textContent = { battle: 'BATTLE', kitchen: 'SIANG KITCHEN' }[tab] || 'ERRANDS';
  if (tab === 'battle') { renderBattle(); showTip('battle', $('battle-pane')); }
  if (tab === 'kitchen') { kitchenResult = null; kitchenMeal = null; cookbookPage = 0; renderKitchen(); }
}
$('tab-errand').addEventListener('click', () => showErrandTab('errand'));
$('tab-battle').addEventListener('click', () => showErrandTab('battle'));
$('tab-kitchen').addEventListener('click', () => showErrandTab('kitchen'));

/* ---------- 小湘廚房（皮寶企劃，11/20）：選食材開煮 → 餵小湘 ---------- */
let kitchenPicked = []; let kitchenMeal = null; let kitchenResult = null; let kitchenBusy = false;
function renderKitchen() {
  const k = state.kitchen;
  $('kitchen-ings').replaceChildren(...kitchen.INGREDIENTS.map(i => {
    const n = k.ingredients[i.id] || 0;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'kitchen-ing'; btn.dataset.ing = i.id;
    btn.disabled = !n && !kitchenPicked.includes(i.id); btn.setAttribute('aria-pressed', String(kitchenPicked.includes(i.id)));
    btn.innerHTML = '<span class="kitchen-ing__icon" aria-hidden="true"></span><b></b><small></small>';
    btn.querySelector('span').textContent = i.icon; btn.querySelector('b').textContent = i.name;
    btn.querySelector('small').textContent = n ? `× ${n}` : `第 ${i.chapter} 章`;
    btn.addEventListener('click', () => { kitchenPicked = kitchenPicked.includes(i.id) ? kitchenPicked.filter(x => x !== i.id) : [...kitchenPicked, i.id].slice(-3); renderKitchen(); });
    return btn;
  }));
  const dish = kitchenPicked.length >= 2 ? kitchen.dishOf(kitchenPicked) : null;
  $('kitchen-preview').textContent = !kitchenPicked.length ? '選 2～3 種食材' : !dish ? `${kitchenPicked.map(id => kitchen.ING[id].name).join(' ＋ ')} ＋ …` : k.known[dish.id] ? dish.name : `${kitchenPicked.map(id => kitchen.ING[id].icon).join(' ＋ ')} → ？？？`;
  $('kitchen-cook').disabled = !dish || kitchenBusy;
  const meals = Object.entries(k.meals).map(([id, n]) => ({ dish: kitchen.dishById(id), n })).filter(m => m.dish);
  if (kitchenMeal && !k.meals[kitchenMeal]) kitchenMeal = null;
  $('kitchen-meals').replaceChildren(...(meals.length ? meals.map(({ dish: d, n }) => {
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = `kitchen-meal${d.dark ? ' is-dark' : ''}`; btn.setAttribute('aria-pressed', String(kitchenMeal === d.id));
    btn.innerHTML = '<span aria-hidden="true"></span><b></b><small></small>';
    btn.querySelector('span').textContent = d.dark ? '🫕' : d.recipe ? '🍽️' : '🥣';
    btn.querySelector('b').textContent = `${d.name} × ${n}`;
    btn.querySelector('small').textContent = d.effect ? `${d.type}｜吃了：${kitchen.buffText(d.effect)}` : d.type;
    btn.addEventListener('click', () => { kitchenMeal = kitchenMeal === d.id ? null : d.id; kitchenResult = null; renderKitchen(); });
    return btn;
  }) : [Object.assign(document.createElement('p'), { className: 'residents-intro', textContent: '還沒有料理，先挑食材開煮吧。' })]));
  // 選好料理 → 選小湘
  $('kitchen-feed').hidden = !kitchenMeal;
  if (kitchenMeal) {
    const d = kitchen.dishById(kitchenMeal);
    $('kitchen-feed-hint').textContent = `要把「${d.name}」給誰吃？（料理的好感另外算，每位每天最多 ${COOK_CAP} 點；滿了也還是可以餵）`;
    const owned = Object.keys(CHARACTERS).filter(no => state.dex[no]);
    $('kitchen-siangs').replaceChildren(...owned.map(no => {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'errand-siang'; btn.dataset.siang = no;
      const r = k.tasted[no]?.[d.id]; const left = cookLeft(state, no, todayKey());
      const guess = r === undefined ? kitchen.guessRating(state, no, d) : null; // 口味筆記猜得出來就先提示（秘密最愛猜不到，所以說「應該」）
      const hint = guess === 2 ? '😋 喜歡？' : guess === 0 ? '🤢 討厭？' : '';
      btn.append(siangImg(no), Object.assign(document.createElement('span'), { textContent: r !== undefined ? `${kitchen.RATINGS[r].icon} ${kitchen.RATINGS[r].label}` : [hint, left ? `今天還能 +${left}` : '今天料理好感已滿'].filter(Boolean).join('\n') }));
      if (k.buffs[no]) {
        btn.append(Object.assign(document.createElement('i'), { className: 'star', textContent: '🍳' }));
        const swap = kitchen.replacesBuff(state, no, d); // 餵下去會換掉原本的料理加成就先講
        btn.append(Object.assign(document.createElement('em'), { className: `errand-siang__food${swap !== false ? ' is-swap' : ''}`, textContent: `${swap === true ? '會換掉' : swap === null ? '可能換掉' : '目前'}\n${kitchen.buffShort(k.buffs[no]).replace('🍳', '')}` }));
      }
      btn.addEventListener('click', () => void feedKitchen(no, d.id));
      return btn;
    }));
  }
  const res = $('kitchen-result'); res.hidden = !kitchenResult;
  if (kitchenResult) {
    const r = kitchenResult; const rt = kitchen.RATINGS[r.rating];
    res.replaceChildren(siangImg(r.no, 'kitchen-result__img'));
    const box = document.createElement('div');
    box.innerHTML = '<small></small><b></b><p></p><span></span>';
    box.querySelector('small').textContent = `${CHARACTERS[r.no].name} · ${r.dish.name}`;
    box.querySelector('b').textContent = `${rt.icon} ${rt.label}${r.secretFound ? '　💖 找到秘密最愛！' : ''}`;
    box.querySelector('p').textContent = `「${r.line}」`;
    box.querySelector('span').textContent = [r.added ? `♡ +${r.added}` : '今天的料理好感滿了（明天再來）', r.buff && `下一次討伐：${kitchen.buffText(r.buff)}${r.replaced ? `（換掉了原本的${kitchen.buffText(r.replaced)}）` : ''}`].filter(Boolean).join(' · ');
    const found = [r.learned?.like && `喜歡「${r.learned.like}」${tagIcons(r.learned.like)}`, r.learned?.dislike && `討厭「${r.learned.dislike}」${tagIcons(r.learned.dislike)}`].filter(Boolean);
    if (found.length) box.append(Object.assign(document.createElement('span'), { className: 'kitchen-learned', textContent: `📒 口味筆記新發現：${CHARACTERS[r.no].name}${found.join('，')}` }));
    res.append(box);
  }
  // 圖鑑
  const known = Object.keys(k.known).length;
  $('kitchen-stats').replaceChildren(...[`做過 ${known} / ${kitchen.COMBO_TOTAL} 道`, `特色料理 ${kitchen.recipesFound(state)} / 8`, `秘密最愛 ${kitchen.secretsFound(state)} 個`].flatMap((t, i) => [...(i ? [' '] : []), Object.assign(document.createElement('span'), { textContent: i ? `· ${t}` : t })])); // 「·」跟著後一段，換行時不會落單在行首
  renderCookbook();
  $('kitchen-book').replaceChildren(...kitchen.RECIPES.map(rc => {
    const id = [...rc.ings].sort().join('+'); const got = Boolean(k.known[id]);
    const card = document.createElement('div'); card.className = `kitchen-recipe${got ? ' is-found' : ''}${rc.dark ? ' is-dark' : ''}`;
    card.innerHTML = '<b></b><small></small><p></p>';
    card.querySelector('b').textContent = got ? rc.name : '？？？';
    card.querySelector('small').textContent = got ? `${rc.ings.map(x => kitchen.ING[x].icon + kitchen.ING[x].name).join(' ＋ ')}` : rc.type;
    card.querySelector('p').textContent = got ? (rc.effect ? `${rc.type}｜${kitchen.buffText(rc.effect)}（看小湘喜不喜歡）` : rc.dark ? '黑暗料理｜勇氣可嘉' : `${rc.type}｜好感度專用`) : rc.clue;
    return card;
  }));
  const secrets = Object.entries(k.tasted).flatMap(([no, list]) => Object.entries(list).filter(([, r]) => r === 3).map(([id]) => ({ no, dish: kitchen.dishById(id) })));
  $('kitchen-secrets').replaceChildren(...(secrets.length ? secrets.map(({ no, dish: d }) => {
    const row = document.createElement('div'); row.className = 'kitchen-secret';
    row.append(siangImg(no), Object.assign(document.createElement('span'), { textContent: `💖 ${CHARACTERS[no].name}：${d.name}` }));
    return row;
  }) : [Object.assign(document.createElement('p'), { className: 'residents-intro', textContent: '還沒找到任何一位的秘密最愛。找到的時候，她會把那道料理畫成小愛心貼在這裡。' })]));
}
// 料理小書：做過的每一道，一頁 6 道，新做的在前
const COOKBOOK_PER_PAGE = 6;
const COOKBOOK_TABS = [['all', '全部'], ['recipe', '特色'], ['home', '家常'], ['dark', '黑暗']];
let cookbookTab = 'all'; let cookbookPage = 0;
function renderCookbook() {
  const all = kitchen.cookbook(state);
  const counts = Object.fromEntries(COOKBOOK_TABS.map(([id]) => [id, id === 'all' ? all.length : all.filter(e => e.kind === id).length]));
  $('cookbook-tabs').replaceChildren(...COOKBOOK_TABS.map(([id, label]) => {
    const btn = document.createElement('button'); btn.type = 'button'; btn.role = 'tab'; btn.setAttribute('aria-selected', String(cookbookTab === id)); btn.dataset.tab = id;
    btn.append(label, Object.assign(document.createElement('small'), { textContent: counts[id] }));
    btn.addEventListener('click', () => { cookbookTab = id; cookbookPage = 0; renderCookbook(); });
    return btn;
  }));
  const list = cookbookTab === 'all' ? all : all.filter(e => e.kind === cookbookTab);
  const pages = Math.max(1, Math.ceil(list.length / COOKBOOK_PER_PAGE));
  cookbookPage = Math.min(Math.max(0, cookbookPage), pages - 1);
  const shown = list.slice(cookbookPage * COOKBOOK_PER_PAGE, (cookbookPage + 1) * COOKBOOK_PER_PAGE);
  const md = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()}`; };
  $('cookbook-pages').replaceChildren(...(shown.length ? shown.map(e => {
    const d = e.dish;
    const card = document.createElement('article'); card.className = `cookbook-page is-${e.kind}`; card.dataset.dish = d.id;
    card.innerHTML = '<div class="cookbook-page__head"><span class="cookbook-page__icons" aria-hidden="true"></span><span class="cookbook-page__no"></span></div><b></b><span class="cookbook-page__tag"></span><p class="cookbook-page__meta"></p><div class="cookbook-page__eaters"></div>';
    card.querySelector('.cookbook-page__no').textContent = `No.${String(e.no).padStart(3, '0')}`;
    card.querySelector('.cookbook-page__icons').textContent = d.ings.map(x => kitchen.ING[x].icon).join('');
    card.querySelector('b').textContent = d.name;
    card.querySelector('.cookbook-page__tag').textContent = e.kind === 'recipe' ? `特色｜${d.type}` : e.kind === 'dark' ? '黑暗料理' : '家常料理';
    card.querySelector('.cookbook-page__meta').append(
      Object.assign(document.createElement('span'), { textContent: `做過 ${e.times} 次` }),
      Object.assign(document.createElement('span'), { textContent: md(e.at) && `${md(e.at)} 初登場` }),
      Object.assign(document.createElement('span'), { className: 'cookbook-page__left', textContent: e.left ? `🍽 手上還有 ${e.left} 份` : '' }));
    const eat = card.querySelector('.cookbook-page__eaters');
    if (e.eaters.length) {
      const MAX = 4;
      eat.append(...e.eaters.slice(0, MAX).map(({ no, rating }) => {
        const who = document.createElement('span'); who.className = 'cookbook-eater'; who.dataset.siang = no; who.dataset.taste = `${kitchen.RATINGS[rating].icon} ${kitchen.RATINGS[rating].label}`; who.title = `${CHARACTERS[no].name}：${kitchen.RATINGS[rating].label}`;
        const face = document.createElement('span'); face.className = 'cookbook-eater__face'; face.append(siangImg(no));
        who.append(face, Object.assign(document.createElement('i'), { textContent: kitchen.RATINGS[rating].icon }));
        return who;
      }));
      if (e.eaters.length > MAX) { const more = Object.assign(document.createElement('small'), { className: 'cookbook-eater-more', textContent: `+${e.eaters.length - MAX}` }); more.dataset.more = e.eaters.slice(MAX).map(({ no, rating }) => `${kitchen.RATINGS[rating].icon} ${CHARACTERS[no].name}`).join('\n'); eat.append(more); }
    } else eat.append(Object.assign(document.createElement('small'), { textContent: '還沒給小湘吃過' }));
    return card;
  }) : [Object.assign(document.createElement('p'), { className: 'cookbook__empty', textContent: all.length ? '這一類還沒有做過喔。' : '小書還是空白的。煮出第一道料理，就會寫在第一頁。' })]));
  $('cookbook-nav').hidden = pages <= 1;
  $('cookbook-page').textContent = `第 ${cookbookPage + 1} / ${pages} 頁`;
  $('cookbook-prev').disabled = cookbookPage === 0; $('cookbook-next').disabled = cookbookPage >= pages - 1;
}
// 料理小書可以整本收起來（湘 11/21），開關記在這台裝置，預設打開
const COOKBOOK_KEY = 'siang-collector:cookbook:v1';
let cookbookOpen = (() => { try { return localStorage.getItem(COOKBOOK_KEY) !== 'closed'; } catch { return true; } })();
function syncCookbook() {
  $('cookbook-toggle').setAttribute('aria-expanded', String(cookbookOpen));
  $('cookbook-body').hidden = !cookbookOpen;
  $('kitchen-cookbook').classList.toggle('is-closed', !cookbookOpen);
  $('cookbook-caret').textContent = cookbookOpen ? '收起 ▾' : '打開 ▸';
}
syncCookbook();
$('cookbook-toggle').addEventListener('click', () => { cookbookOpen = !cookbookOpen; try { localStorage.setItem(COOKBOOK_KEY, cookbookOpen ? 'open' : 'closed'); } catch {} syncCookbook(); });
$('cookbook-prev').addEventListener('click', () => { cookbookPage -= 1; renderCookbook(); });
$('cookbook-next').addEventListener('click', () => { cookbookPage += 1; renderCookbook(); });
$('kitchen-cook').addEventListener('click', async () => {
  if (kitchenBusy) return; kitchenBusy = true; $('kitchen-cook').disabled = true;
  try {
    const t = await updateState(current => kitchen.cook(current, kitchenPicked));
    state = t.state;
    if (typeof t.result === 'string') { $('kitchen-status').textContent = t.result; }
    else { const d = t.result.dish; kitchenPicked = []; kitchenMeal = d.id; kitchenResult = null; $('kitchen-status').textContent = `${d.dark ? '🫕 ……煮出了黑暗料理：' : '🍳 煮好了：'}${d.name}${t.result.first ? '（第一次做出來！）' : ''}`; }
  } finally { kitchenBusy = false; renderKitchen(); }
});
async function feedKitchen(no, dishId) {
  if (kitchenBusy) return; kitchenBusy = true;
  try {
    const t = await updateState(current => kitchen.feed(current, no, dishId, todayKey()));
    state = t.state;
    if (typeof t.result === 'string') { $('kitchen-status').textContent = t.result; return; }
    kitchenResult = t.result; $('kitchen-status').textContent = '';
    if (t.result.up.length) queueBondUps([{ no, up: t.result.up }]);
    renderAll();
  } finally { kitchenBusy = false; renderKitchen(); }
}
function renderBattle() {
  renderPresetGlance();
  renderAtlas($('team-bond-atlas'),state);
  const b = state.battle; const now = Date.now();
  $('battle-badges').textContent = b.badges;
  $('battle-slots').textContent = `隊伍 ${b.active.length} / ${battle.teamSlots(state)}`;
  { const nx = battle.nextTeamSlot(state); const hint = $('battle-slot-hint'); hint.hidden = !nx || b.active.length < battle.teamSlots(state); hint.textContent = nx ? `隊伍都派出去了。收集 ${nx.need} 位小湘可以開第 ${nx.slots} 隊（還差 ${nx.left} 位）。` : ''; }
  $('battle-active').classList.toggle('is-compact', b.active.length >= 4); // 4 隊以上改精簡列，手機上不把關卡地圖擠下去
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
      info.querySelector('span').textContent = w.defeated ? '✓ 已經打跑了' : `戰力 ${e.power}`;
      btn.append(info);
      if (!w.defeated) stageFight(btn, info, w.key);
      btn.addEventListener('click', () => { battleEnemy = w.key; battlePicked = []; $('battle-status').textContent = ''; renderBattle(); });
      return btn;
    }));
    wildSec.append(wh, wnote, wgrid);
    const evNow = events.eventNow(structuredClone({ clock: state.clock }));
    const evList = events.activeEvents(state, evNow);
    const shopFor = eventView && evList.find(x => x.def.id === eventView.id && x.sch.state !== 'archived' && x.sch.state !== 'upcoming');
    if (eventView && !shopFor) eventView = null;
    if (shopFor) { $('battle-map').replaceChildren(eventShop(shopFor.def, evNow)); return; }
    $('battle-map').replaceChildren(siangRoster(), ...evList.map(x => eventHub(x.def, x.sch, evNow)), wildSec, ...battle.CHAPTERS.map(ch => {
      const sec = document.createElement('section'); sec.className = 'battle-chapter';
      const h = document.createElement('h3'); h.className = 'egg-choices__heading'; h.textContent = `第 ${ch.id} 章 · ${ch.name}`;
      const chScene = sceneOf(ch); if (chScene) { sec.classList.add('has-scene'); sec.style.setProperty('--scene', `url("${chScene}")`); }
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
        if (open) stageFight(btn, info, id);
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
      stageFight(btn, info, x.id);
      btn.addEventListener('click', () => { battleEnemy = x.id; battlePicked = []; $('battle-status').textContent = ''; renderBattle(); });
      const grid = document.createElement('div'); grid.className = 'battle-stages'; grid.append(btn);
      sec.append(h, grid); $('battle-map').append(sec);
    }
  }
  if (inStage) renderBattleStage();
}
// ── 異世活動（2.0 · 湘 11/25）：討伐頁最上面一區；資料全在 events.js，這裡只負責畫
let eventView = null; // null＝關卡；{ id, view: 'shop' }＝墨玉閣
const tpeDate = ms => new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(ms);
const leftText = ms => { const m = Math.max(1, Math.ceil(ms / 60e3)); const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60); return d ? `${d} 天 ${h} 小時` : h ? `${h} 小時 ${m % 60} 分` : `${m} 分鐘`; };
function eventScene(e) { const s = events.eventDef(e.event)?.stages[e.eventStage]; return s?.scene ? new URL(s.scene, document.baseURI).href : null; }
function eventStageCard(def, stageId, now) {
  const key = events.stageKey(def.id, stageId); const e = events.eventEnemy(def.id, stageId);
  const st = state.events?.[def.id]?.stages?.[stageId]; const lock = events.stageLock(state, def, stageId, now);
  const btn = el('button', `battle-stage-card${e.boss ? ' is-boss' : ''}${lock ? ' is-locked' : ''}`); btn.type = 'button'; btn.disabled = Boolean(lock); btn.dataset.eventStage = stageId;
  btn.append(enemyArt(key));
  const info = el('div', 'battle-stage-card__info'); info.innerHTML = '<small></small><b></b><span></span>';
  info.querySelector('small').textContent = `${e.stage}${e.boss ? ' · BOSS' : ''}`;
  info.querySelector('b').textContent = lock ? def.stages[stageId].title : e.name;
  info.querySelector('span').textContent = lock ? (/前一關|要先打完/.test(lock) ? '🔒 未解鎖' : '🔒 未開放') : st?.clears ? `${'★'.repeat(st.stars)}${'☆'.repeat(3 - st.stars)} · 最高 ${st.best}` : `建議戰力 ${e.power}`;
  btn.append(info);
  if (!lock) stageFight(btn, info, key);
  btn.addEventListener('click', () => { battleEnemy = key; battlePicked = []; $('battle-status').textContent = ''; renderBattle(); });
  return btn;
}
function eventHub(def, sch, now) {
  const prog = state.events?.[def.id] || {}; const ks = def.keepsakes;
  const sec = el('section', 'battle-chapter event-hub'); sec.dataset.event = def.id;
  const ban = el('div', 'event-banner');
  const seal = el('i', 'event-banner__seal', '墨'); seal.setAttribute('aria-hidden', 'true');
  const time = sch.state === 'upcoming' ? `${tpeDate(sch.startMs)} 開始 · 還有 ${leftText(sch.startMs - now)}`
    : sch.state === 'battle' ? `討伐開到 ${tpeDate(sch.battleEndMs)} · 剩 ${leftText(sch.battleEndMs - now)}`
    : sch.state === 'shop' ? `討伐已結束 · 墨玉閣開到 ${tpeDate(sch.shopEndMs)}` : '活動已封存，已經拿到的都會留著';
  ban.append(seal, el('small', 'event-banner__kicker', `${def.code} · ${def.name}`), el('h3', 'event-banner__title', def.subtitle), el('p', 'event-banner__tag', def.tagline), el('p', 'event-banner__time', time));
  const bar = el('div', 'event-banner__bar');
  bar.append(el('span', 'event-chip', `${def.token.icon} ${def.token.name} ${prog.tokens || 0}`));
  if (ks) bar.append(el('span', 'event-chip', `信物 ${Object.keys(prog.keepsakes || {}).length} / ${ks.list.length}`));
  if (sch.state === 'battle' || sch.state === 'shop') { const shop = el('button', 'text-action event-banner__shop', '墨玉閣 ⟶'); shop.type = 'button'; shop.addEventListener('click', () => { eventView = { id: def.id, view: 'shop' }; renderBattle(); }); bar.append(shop); }
  ban.append(bar); sec.append(ban);
  if (sch.state !== 'battle') return sec;
  for (const ph of def.phases) {
    const p = sch.phases.find(x => x.id === ph.id);
    const h = el('h4', 'event-phase', ph.name);
    if (!p.open) h.append(el('small', null, ` · ${leftText(p.leftMs)}後開放`));
    const grid = el('div', 'battle-stages'); grid.append(...ph.stages.map(id => eventStageCard(def, id, now)));
    sec.append(h, grid);
  }
  return sec;
}
function eventShop(def, now) {
  const prog = state.events?.[def.id] || {};
  const sec = el('section', 'battle-chapter event-shop');
  const back = el('button', 'text-action', '⟵ 回關卡列表'); back.type = 'button'; back.addEventListener('click', () => { eventView = null; renderBattle(); });
  const head = el('div', 'event-shop__head'); head.append(el('h3', 'egg-choices__heading', '墨玉閣'), el('span', 'event-chip', `${def.token.icon} ${def.token.name} ${prog.tokens || 0}`));
  const list = el('div', 'event-shop__list');
  list.append(...events.shopList(state, def, now).map(item => {
    const row = el('div', `event-shop__item${item.soldOut ? ' is-sold' : ''}`);
    const txt = el('div'); txt.append(el('b', null, item.name), el('small', null, `${item.cost} ${def.token.name}${item.limit ? ` · 已換 ${item.bought} / ${item.limit}` : ''}`));
    const btn = el('button', 'btn', item.soldOut ? '換完了' : item.ready ? '兌換' : `差 ${item.short}`); btn.type = 'button'; btn.disabled = !item.ready;
    btn.addEventListener('click', () => void buyEventItem(def.id, item.id));
    row.append(txt, btn); return row;
  }));
  const status = el('p', 'cloud-status'); status.id = 'event-shop-status'; status.setAttribute('role', 'status');
  sec.append(back, head, list, status); return sec;
}
async function buyEventItem(eventId, itemId) {
  const t = await updateState(c => { return events.buy(c, events.eventDef(eventId), itemId, events.eventNow(c)); });
  state = t.state; renderAll(); renderBattle();
  const msg = typeof t.result === 'string' ? t.result : t.result.result.egg ? `換到了「${t.result.item.name}」！蛋放在「選擇蛋」裡。` : `換到了「${t.result.item.name}」！`;
  const box = $('event-shop-status'); if (box) box.textContent = msg;
}
// 小湘出勤狀態：不用點進關卡就能看誰可以出戰、誰在休息（還要多久）、誰出門了；收合狀態記在這台裝置
const ROSTER_KEY = 'siang-collector:battle-roster:v1';
let rosterOpen = (() => { try { return localStorage.getItem(ROSTER_KEY) === 'open'; } catch { return false; } })();
const shortLeft = ms => { const m = Math.max(1, Math.ceil(ms / 60e3)); return m >= 60 ? (m % 60 ? `${Math.floor(m / 60)} 時 ${m % 60} 分` : `${m / 60} 小時`) : `${m} 分`; };
// 關卡卡片上的「討伐中」標記（湘 11/21：不用點進去就知道這關已經有隊伍在打）
function stageFight(btn, info, id) {
  const now = Date.now(); const list = (state.battle?.active || []).filter(a => a.enemy === id);
  if (!list.length) return;
  const going = list.filter(a => Date.parse(a.until) > now);
  const box = document.createElement('div'); box.className = 'battle-stage-card__fight';
  const tag = document.createElement('em');
  if (going.length < list.length) { box.classList.add('is-back'); tag.textContent = '📜 戰報待收'; box.append(tag); }
  else {
    tag.textContent = `⚔ ${list.length > 1 ? `${list.length} 隊` : ''}討伐中`;
    box.append(tag, Object.assign(document.createElement('small'), { textContent: `還要 ${shortLeft(Math.min(...going.map(a => Date.parse(a.until))) - now)}` }));
  }
  btn.classList.add('is-fighting'); info.querySelector('b').after(box);
}
function siangRoster() {
  const list = siangStatuses(state, Date.now()); const n = statusCounts(list);
  const sec = document.createElement('section'); sec.className = `siang-roster${rosterOpen ? ' is-open' : ''}`; sec.id = 'siang-roster';
  const head = document.createElement('button'); head.type = 'button'; head.className = 'siang-roster__head'; head.setAttribute('aria-expanded', String(rosterOpen));
  const title = el('b', null, '小湘出勤狀態');
  const sum = el('span', 'siang-roster__sum');
  sum.append(el('em', 'is-ready', `可出戰 ${n.ready}`), el('em', 'is-rest', `休息 ${n.rest}`), el('em', 'is-busy', `忙碌 ${n.busy}`));
  head.append(title, el('i', 'siang-roster__caret', rosterOpen ? '收起 ▾' : '展開 ▸'), sum);
  head.addEventListener('click', () => { rosterOpen = !rosterOpen; try { localStorage.setItem(ROSTER_KEY, rosterOpen ? 'open' : 'closed'); } catch {} $('siang-roster').replaceWith(siangRoster()); });
  sec.append(head);
  if (!rosterOpen) return sec;
  const body = document.createElement('div'); body.className = 'siang-roster__body';
  const groups = [['ready', '可出戰', '點進關卡就能派她們'], ['rest', '休息中', '打完要休息 1 小時'], ['busy', '忙碌中', '出門、討伐或調配中']];
  for (const [kind, label, hint] of groups) {
    const items = list.filter(s => s.kind === kind); if (!items.length) continue;
    const h = el('h4', 'siang-roster__group'); h.append(el('span', null, `${label} ${items.length}`), el('small', null, hint));
    body.append(h);
    // 同一個狀態裡再依系列分組（湘 11/22），組內維持原本的排序（可出戰照戰力、其他照誰先回來）
    for (const sid of Object.keys(SERIES)) {
      const part = items.filter(s => CHARACTERS[s.no].series === sid); if (!part.length) continue;
      body.append(el('p', 'siang-roster__series', `${SERIES[sid].name} · ${part.length}`), rosterGrid(part));
    }
  }
  if (!list.length) body.append(el('p', 'residents-intro', '還沒有小湘，先去孵蛋吧。'));
  sec.append(body); return sec;
}
function rosterGrid(items) {
    const grid = document.createElement('div'); grid.className = 'siang-roster__grid';
    grid.append(...items.map(s => {
      const tile = document.createElement('div'); tile.className = `siang-roster__tile is-${s.kind}`; tile.dataset.siang = s.no;
      const name = CHARACTERS[s.no].name.replace(/小湘.*/, '') || CHARACTERS[s.no].name;
      // 第二行是狀態，休息／忙碌有倒數就再多一行時間（360px 寬也不會擠出格子）
      tile.append(siangImg(s.no), el('span', 'siang-roster__name', name), el('small', 'siang-roster__state', s.kind === 'ready' ? `戰力 ${s.power}` : s.kind === 'rest' ? `還要 ${shortLeft(s.left)}` : s.label));
      if (s.kind === 'busy' && s.left) tile.append(el('small', 'siang-roster__state', shortLeft(s.left)));
      return tile;
    }));
    return grid;
}
// 討伐場景：章節的 bg 剛好是出門地點（conv 便利商店、mountain 山上）時，借用那張地點背景；沒有圖的章節維持原樣
// 注意：CSS 變數裡的 url() 會以 css/ 資料夾為起點解析，所以要給完整網址
function placeUrl(key) { return new URL(`assets/places/${key}.webp`, document.baseURI).href; } // function：renderAll 可能在這行之前就跑
// 章節自己有 scene 圖就用它（第 3 章玩具星球），不然借用同名的出門地點圖（第 1 章便利商店、第 2 章山上）
function sceneOf(ch) { return ch?.scene ? new URL(ch.scene, document.baseURI).href : ch && PLACES[ch.bg] ? placeUrl(ch.bg) : null; }
function chapterScene(id) { return sceneOf(battle.CHAPTERS.find(c => c.stages.includes(id))); }
function renderBattleStage() {
  const id = battleEnemy; const e = battle.enemyFor(state, id);
  if (!e) { battleEnemy = null; renderBattle(); return; }
  const st = e.wild ? null : e.event ? state.events?.[e.event]?.stages?.[e.eventStage] : state.battle.stages[id];
  const bigArt = enemyArt(id, 'is-big'); const scene = e.wild ? null : e.event ? eventScene(e) : chapterScene(id);
  if (scene) { bigArt.classList.add('has-scene'); bigArt.style.setProperty('--scene', `url("${scene}")`); }
  $('battle-enemy-art').replaceChildren(bigArt);
  $('battle-enemy-stage').textContent = e.wild ? e.stage : `${e.stage}${e.boss ? ' · BOSS' : ''}`;
  $('battle-enemy-name').textContent = e.name;
  $('battle-enemy-meta').textContent = `戰力 ${e.power} · 怕：${e.weak.map(sr => SERIES[sr]?.short).join('、')}系列${st?.tries ? ` · 最高 ${st.best} 分（${'★'.repeat(st.stars)}${'☆'.repeat(3 - st.stars)}）` : ''}`;
  $('battle-story').hidden = !e.story; if (e.story) setParas($('battle-story'), e.story.before);
  $('battle-enemy-intro').textContent = e.intro;
  $('battle-gift-hint').hidden = Boolean(e.wild || e.event); if (!e.wild && !e.event) $('battle-gift-hint').textContent = (st?.stars || 0) >= 3 ? `⭐ 已經三星了！之後每次再打到三星 +${battle.STAR_BONUS.fossils} 化石` : `🎁 第一次打到三星，收下戰報時自動送：${battle.starGiftText({ ...battle.STAR_GIFT, ingredients: [] })}、本章食材 1 份`;
  const busy = allBusy(); const now = Date.now();
  const owned = Object.keys(CHARACTERS).filter(no => state.dex[no]);
  // 可以出戰的排前面（照戰力），休息、忙碌的放後面，進關卡就能直接挑還在家的
  const offRank = no => busy.has(no) ? 2 : battle.restLeft(state, no, now) > 0 ? 1 : 0;
  owned.sort((a, b2) => offRank(a) - offRank(b2) || battle.siangPower(state, b2).power - battle.siangPower(state, a).power);
  $('battle-siangs').replaceChildren(...owned.map(no => {
    const p = battle.siangPower(state, no); const rest = battle.restLeft(state, no, now); const off = busy.has(no) || rest > 0;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'errand-siang'; btn.dataset.siang = no; btn.disabled = off;
    btn.setAttribute('aria-pressed', String(battlePicked.includes(no)));
    btn.append(siangImg(no), Object.assign(document.createElement('span'), { textContent: off ? (rest > 0 ? `休息 ${battle.fmtMinutes(rest)}` : '忙碌中') : `戰力 ${p.power}` }));
    if (e.weak.includes(CHARACTERS[no].series)) btn.append(Object.assign(document.createElement('i'), { className: 'star', textContent: '✦' }));
    const meal = state.kitchen?.buffs?.[no]; // 吃過料理、下一場有加成
    if (meal) btn.append(Object.assign(document.createElement('em'), { className: 'errand-siang__food', textContent: kitchen.buffShort(meal) }));
    btn.addEventListener('click', () => {
      battlePicked = battlePicked.includes(no) ? battlePicked.filter(x => x !== no) : [...battlePicked, no].slice(-battle.TEAM_MAX);
      renderBattleStage();
    });
    return btn;
  }));
  const fc = battlePicked.length ? battle.forecast(state, battlePicked, id) : null;
  $('battle-forecast').innerHTML = '';
  if (fc) {
    const bonus = [fc.weakHit && '剋制 +30%', fc.sameSeries && '同系列 +15%', !fc.bond && fc.heroParty && '勇者小隊 +50%', fc.bond && (fc.bond.id==='general'||state.teamBonds?.unlocked[fc.bond.id] ? effectText(fc.bond) : '未知的 LV5 默契'), fc.food && `🍳 ${CHARACTERS[fc.food.no].name}的料理：${kitchen.buffText(fc.food)}${fc.foodPower ? `（+${fc.foodPower}）` : ''}`].filter(Boolean).join(' · ');
    $('battle-forecast').innerHTML = `<b></b><span></span>`;
    $('battle-forecast').querySelector('b').textContent = `隊伍戰力 ${fc.total} vs ${e.power} · ${fc.label}`;
    $('battle-forecast').querySelector('span').textContent = bonus || '沒有加成（帶 ✦ 的小湘有剋制效果）';
    $('battle-forecast').dataset.level = fc.ratio >= 1.2 ? 'good' : fc.ratio >= 1 ? 'ok' : 'risk';
  }
  const free = battle.available(state, now, busy);
  const comparison = battle.compareTeams(state, id, free);
  renderTeamTools($('team-tools'), {state,free,picked:[...battlePicked],comparison,
    onChoose:nos=>{ const currentFree=battle.available(state,Date.now(),allBusy());if(nos.some(n=>!currentFree.includes(n))){toast('有人正在忙或休息，請重新選隊。');return;}battlePicked=[...nos];renderBattleStage(); },
    onSave:async(slot,nos,name)=>{const t=await updateState(current=>savePreset(current,slot,nos,name));state=t.state;toast(t.result?'隊伍已儲存':'請選三位已收集的小湘');renderBattleStage();},
    onDelete:async slot=>{state=(await updateState(current=>{ensureTeamBonds(current).presets[slot]=null;})).state;renderBattleStage();}
  });
  const full = state.battle.active.length >= battle.teamSlots(state);
  $('battle-go').disabled = !battlePicked.length || full;
  $('battle-go').textContent = full ? '隊伍都派出去了' : `出發討伐${fc ? `（約 ${fc.minutes} 分鐘）` : ''}`;
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
  const t = await updateState(current => { const r = battle.startBattle(current, id, nos, { busy: new Set([...busyNos(current), ...battle.battleNos(current), ...lab.labNos(current)]) }); return typeof r === 'string' ? { error: r } : { battle: r }; });
  state = t.state;
  if (t.result.error) { $('battle-status').textContent = t.result.error; return; }
  battleEnemy = null; battlePicked = [];
  renderAll(); renderBattle();
  toast(`出發討伐${battle.enemyFor(state, id).name}！${battle.fmtMinutes(Date.parse(t.result.battle.until) - Date.now())}後回來。`);
});
const battleTheater = createBattleTheater({root:$('battle-theater'),details:$('battle-result-details'),dialog:$('battle-result'),replay:$('battle-replay'),onActivity:syncRoomActivity});
// 章節尾聲劇場：第一次打倒章節 Boss，收下戰報後自動播；故事檔案館可以重看（只演出，不動存檔）
const epilogue = createEpilogueTheater({dialog:$('chapter-epilogue'),onActivity:syncRoomActivity});
let pendingEpilogue = null;
$('battle-result').addEventListener('close', () => { const id = pendingEpilogue; pendingEpilogue = null; if (id) epilogue.play(id); });
function epilogueButton(id, label, before) { const btn = el('button', 'epilogue-cta', label); btn.type = 'button'; btn.addEventListener('click', () => { before?.(); epilogue.play(id); }); return btn; }
async function collectBattle(id) {
  const t = await updateState(current => battle.collectBattle(current, id));
  state = t.state; renderAll(); renderBattle();
  if (!t.result) return;
  const r = t.result; const rep = r.report; const e = r.eventEnemy || (r.snapshot ? battle.wildEnemy(r.snapshot) : battle.ENEMIES[r.enemy]);
  $('battle-result-art').replaceChildren(r.snapshot ? wildArtFrom(r.snapshot) : enemyArt(r.enemy, 'is-big'));
  $('battle-result-eyebrow').textContent = `${e.stage} · ${e.name}`;
  $('battle-result-title').textContent = rep.win ? '討伐成功！' : '先撤退了……';
  $('battle-result-stars').textContent = rep.win ? `${'★'.repeat(rep.stars)}${'☆'.repeat(3 - rep.stars)}` : '';
  $('battle-result-gift').hidden = !r.starGift; if (r.starGift) $('battle-result-gift-text').replaceChildren(...battle.starGiftText(r.starGift).split('、').map(t => el('span', null, t)));
  const delta = r.delta === null ? '第一次挑戰' : r.delta > 0 ? `比上次 +${r.delta}` : r.delta < 0 ? `比上次 ${r.delta}` : '跟上次一樣';
  $('battle-result-score').innerHTML = '';
  for (const [label, value, cls] of [['這次分數', rep.score, ''], [r.wild ? '本週最高' : '歷史最高', r.best, r.record ? 'is-record' : ''], ['進步', r.wild && r.delta === null ? '新的對手' : delta, r.delta > 0 ? 'is-up' : '']]) {
    const box = document.createElement('div'); box.className = cls; box.innerHTML = '<small></small><b></b>';
    box.querySelector('small').textContent = label; box.querySelector('b').textContent = value; $('battle-result-score').append(box);
  }
  if (r.record && r.delta !== null) $('battle-result-score').lastChild.previousSibling.querySelector('small').textContent = '新紀錄！';
  renderBattleLog($('battle-result-log'),rep.log);
  $('battle-result-log').append(Object.assign(document.createElement('li'), { className: 'is-power', textContent: `隊伍戰力 ${rep.power} vs ${rep.enemyPower}` }));
  $('battle-result-review').hidden = !r.review;
  if (r.review) { guguAvatar(document.querySelector('#battle-result-review .gugu-review__avatar')); $('battle-review-label').textContent = `咕咕書評 · ${REVIEW_LABEL[r.review.kind] || ''}`; setParas($('battle-review-text'), r.review.text, 0); setParas($('battle-review-note'), r.review.note || '', 0); $('battle-review-note').hidden = !r.review.note; }
  $('battle-result-advice').hidden = !rep.advice; if (rep.advice) setParas($('battle-result-advice'), `💡 ${rep.advice.text}`, 0);
  const storyLines = [...(r.clue ? storyParas(`🔍 線索：${r.clue}`) : []), ...(r.story ? storyParas(`📖 ${r.story}`) : [])];
  const epi = r.story && !r.snapshot && epilogue.has(r.enemy) ? r.enemy : null; pendingEpilogue = epi;
  const epiLines = epi ? [...(r.clue ? storyParas(`🔍 線索：${r.clue}`) : []), '📖 這一章的故事迎來了尾聲。收下戰報後，會播放尾聲劇場。'] : storyLines;
  $('battle-result-story').hidden = !epiLines.length; $('battle-result-story').replaceChildren(...epiLines.map(t => el('span', 'para', t)));
  if (epi) $('battle-result-story').append(epilogueButton(epi, '▶ 現在觀看尾聲', () => { pendingEpilogue = null; $('battle-result').close(); }));
  $('battle-result-gains').replaceChildren(...r.gains.map(g => Object.assign(document.createElement('li'), { textContent: g })));
  $('battle-result').showModal();
  battleTheater.play({report:r.report,nos:r.nos,enemy:e,scene:r.eventEnemy ? eventScene(r.eventEnemy) : chapterScene(r.enemy),bondUnlocked:Boolean(r.report.bond && state.teamBonds?.unlocked?.[r.report.bond])});
  $('battle-result').scrollTop = 0; $('battle-result-ok').blur(); buzz(rep.win ? [20, 40, 30] : 15); // 長戰報從最上面（分數）開始看
  restart($('chip-energy'), 'is-bump');
}
$('battle-result-ok').addEventListener('click', () => $('battle-result').close());
// 討伐首頁也看得到常用隊伍，對照隱藏羈絆圖鑑組隊（玩家 11/24）
const GLANCE_KEY = 'siang-collector:preset-glance:v1';
function presetBondLine(nos) {
  const lv = nos.map(no => ({ no, bond: battle.siangPower(state, no).bond }));
  const low = lv.filter(x => x.bond < 5);
  if (low.length) return { cls: 'is-wait', text: `還差 ${low.map(x => `${CHARACTERS[x.no].name.replace(/小湘.*/, '') || CHARACTERS[x.no].name} Lv.${x.bond}`).join('、')} → 三位都 LV5 就會發動默契` };
  const b = teamBond(state, nos);
  if (!b || b.id === 'general') return { cls: 'is-general', text: `三位都 LV5 · ${effectText(b)}` };
  return state.teamBonds?.unlocked?.[b.id] ? { cls: 'is-bond', text: `✦ ${b.name} · ${effectText(b)}` } : { cls: 'is-secret', text: '✦ 未知的默契正在共鳴！一起出發就能收藏合照' };
}
function renderPresetGlance() {
  const host = $('team-presets-glance'); if (!host) return;
  const presets = (state.teamBonds?.presets || []).map((p, i) => p && { ...p, i }).filter(p => p && p.nos.every(no => state.dex[no]));
  const status = new Map(siangStatuses(state, Date.now()).map(s => [s.no, s]));
  const open = (() => { try { return localStorage.getItem(GLANCE_KEY) !== 'closed'; } catch { return true; } })();
  const box = el('details', 'team-glance'); box.open = open;
  box.addEventListener('toggle', () => { try { localStorage.setItem(GLANCE_KEY, box.open ? 'open' : 'closed'); } catch {} });
  box.append(el('summary', null, `常用隊伍 · ${presets.length} / 5`));
  if (!presets.length) { box.append(el('p', 'team-glance__empty', '還沒有常用隊伍。點進任一關卡選好三位，在「常用隊伍」按儲存，就會出現在這裡。')); host.replaceChildren(box); return; }
  for (const p of presets) {
    const row = el('article', 'team-glance__row');
    const bond = presetBondLine(p.nos);
    const away = p.nos.filter(no => status.get(no)?.kind !== 'ready');
    const head = el('div', 'team-glance__head'); head.append(el('b', null, p.name), el('small', away.length ? 'is-away' : 'is-ok', away.length ? `${away.length} 位休息或忙碌` : '都可以出發'));
    const faces = el('div', 'team-glance__faces');
    faces.append(...p.nos.map(no => {
      const s = battle.siangPower(state, no); const f = el('span', `team-glance__face${s.bond >= 5 ? ' is-max' : ''}${status.get(no)?.kind !== 'ready' ? ' is-away' : ''}`);
      f.append(siangImg(no), el('em', null, `Lv.${s.bond}`));
      f.append(el('small', null, CHARACTERS[no].name.replace(/小湘.*/, '') || CHARACTERS[no].name));
      return f;
    }));
    row.append(head, faces);
    row.append(el('p', `team-glance__bond ${bond.cls}`, bond.text));
    box.append(row);
  }
  host.replaceChildren(box);
}
// 特訓：改成跟出勤狀態一樣的格子，可以依系列或稀有度分組（玩家 11/24：清單太長常找不到小湘）
const TRAIN_GROUP_KEY = 'siang-collector:train-group:v1';
let trainGroup = (() => { try { return localStorage.getItem(TRAIN_GROUP_KEY) === 'rarity' ? 'rarity' : 'series'; } catch { return 'series'; } })();
const TRAIN_RARITY = ['UR', 'SSR', 'SR', 'R', 'N'];
function trainPips(level) { const pips = el('span', 'train-pips'); pips.setAttribute('aria-label', `特訓 ${level}/${battle.MAX_TRAIN}`); for (let i = 0; i < battle.MAX_TRAIN; i++) pips.append(el('i', i < level ? 'is-on' : '')); return pips; }
async function trainOne(no) {
  const t = await updateState(current => battle.train(current, no)); state = t.state;
  $('train-status').textContent = typeof t.result === 'string' ? t.result : `${CHARACTERS[no].name}特訓到 Lv.${t.result.level}！戰力變成 ${battle.siangPower(state, no).power}。`;
  $('battle-badges').textContent = state.battle.badges; renderTrain();
}
function trainButton(no, cost) {
  const btn = el('button', 'btn btn--quiet train-tile__btn', cost === null ? '滿級' : `🛡️${cost}`); btn.type = 'button';
  btn.disabled = cost === null || state.battle.badges < cost;
  btn.setAttribute('aria-label', cost === null ? `${CHARACTERS[no].name}特訓滿級` : `用 ${cost} 枚徽章特訓${CHARACTERS[no].name}`);
  btn.addEventListener('click', e => { e.stopPropagation(); void trainOne(no); }); return btn;
}
function renderTrain() {
  const owned = Object.keys(CHARACTERS).filter(no => state.dex[no]).map(no => ({ no, ...battle.siangPower(state, no), cost: battle.trainCost(state, no) })).sort((a, b) => b.power - a.power || a.no.localeCompare(b.no));
  const can = owned.filter(s => s.cost !== null && state.battle.badges >= s.cost).length;
  const bar = el('div', 'train-groups');
  const seg = el('div', 'train-groups__seg'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', '分組方式');
  for (const [k, label] of [['series', '依系列'], ['rarity', '依稀有度']]) {
    const b = el('button', null, label); b.type = 'button'; b.setAttribute('aria-pressed', String(trainGroup === k));
    b.addEventListener('click', () => { trainGroup = k; try { localStorage.setItem(TRAIN_GROUP_KEY, k); } catch {} renderTrain(); }); seg.append(b);
  }
  bar.append(seg, el('small', 'train-groups__can', can ? `現在能特訓 ${can} 位` : '徽章還不夠特訓'));
  const list = $('train-list'); list.className = 'train-grid-wrap';
  const out = [bar];
  const groups = trainGroup === 'rarity'
    ? TRAIN_RARITY.map(r => [r, owned.filter(s => CHARACTERS[s.no].rarity === r)])
    : Object.keys(SERIES).map(sid => [SERIES[sid].name, owned.filter(s => CHARACTERS[s.no].series === sid)]);
  for (const [label, items] of groups) {
    if (!items.length) continue;
    out.push(el('p', 'siang-roster__series train-grid__label', `${label} · ${items.length}`));
    const grid = el('div', 'train-grid');
    grid.append(...items.map(s => {
      const c = CHARACTERS[s.no]; const ready = s.cost !== null && state.battle.badges >= s.cost;
      const tile = el('div', `train-tile${ready ? ' is-can' : ''}${s.cost === null ? ' is-max' : ''}`);
      tile.dataset.siang = s.no;
      const name = c.name.replace(/小湘.*/, '') || c.name;
      tile.append(siangImg(s.no), el('span', 'train-tile__name', name), el('small', 'train-tile__power', `戰力 ${s.power}`), trainPips(s.train));
      tile.append(trainButton(s.no, s.cost));
      return tile;
    }));
    out.push(grid);
  }
  if (!owned.length) out.push(el('p', 'residents-intro', '還沒有小湘，先去孵蛋吧。'));
  list.replaceChildren(...out);
}
// 徽章兌換：勇者小隊
function renderHeroShop() {
  $('hero-shop').replaceChildren(...HERO_SHOP.map(({ no }) => {
    const h = battle.heroStatus(state, no); const c = CHARACTERS[no];
    const row = document.createElement('div'); row.className = `train-row${h.owned ? ' is-owned' : ''}`;
    const img = siangImg(no); if (!h.owned) { img.classList.add('is-locked'); img.alt = '尚未兌換的小湘'; }
    const info = document.createElement('div'); info.innerHTML = '<b></b><small></small>';
    info.querySelector('b').textContent = `${c.name} · ${c.rarity}`;
    info.querySelector('small').textContent = h.owned ? '已經加入隊伍 ✓' : h.pending ? '專屬蛋已領取，到培育室孵化' : h.locked ? `🔒 ${h.requireText}` : h.short ? `還差 ${h.short} 枚徽章` : '兌換專屬蛋，培育後加入隊伍';
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn btn--quiet';
    btn.textContent = h.owned ? '已加入' : h.pending ? '待孵化' : `換蛋 ${h.cost}`; btn.disabled = !h.ready;
    btn.addEventListener('click', () => void redeemHeroFor(no));
    row.append(img, info, btn); return row;
  }));
}
async function redeemHeroFor(no) {
  const t = await updateState(current => battle.redeemHero(current, no));
  state = t.state;
  if (typeof t.result === 'string') { $('hero-status').textContent = t.result; return; }
  $('hero-status').textContent = `獲得${CHARACTERS[no].name}專屬蛋！到「培育 → 選擇蛋 → 紀念蛋」注入能量，孵化後她就會加入隊伍。`;
  $('battle-badges').textContent = state.battle.badges;
  renderAll(); renderHeroShop(); renderTrain(); buzz([20, 40, 30]);
  toast(`獲得${CHARACTERS[no].name}專屬蛋，到培育室迎接她吧！`);
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
// 長文自動分段（湘 11/20：沒分行太密）：已有換行就照換行；不然每兩句一段，引號裡的句子不拆開
// maxLen：同一段最多幾個字才換段；0 = 每句一行（短評、小提示用）
function storyParas(text, maxLen = 70) {
  const raw = String(text || '');
  if (raw.includes('\n')) return raw.split(/\n+/).map(s => s.trim()).filter(Boolean);
  // 括號（）也當成一組；句尾標點後面如果緊跟著 ！？。」）或 ，、 就先不切，避免標點或右括號自己掉到下一行（11/21）
  const sentences = []; let buf = ''; let depth = 0; let pending = false;
  for (const ch of raw) {
    if (pending) {
      if ('，、：；,'.includes(ch)) pending = false;
      else if (!'。！？!?」』）)'.includes(ch)) { sentences.push(buf.trim()); buf = ''; pending = false; }
    }
    buf += ch;
    if ('「『（('.includes(ch)) depth += 1; else if ('」』）)'.includes(ch)) depth = Math.max(0, depth - 1);
    if (depth === 0 && ('。！？!?'.includes(ch) || ('」』）)'.includes(ch) && /[。！？!?…～~][」』）)]$/.test(buf)))) pending = true;
  }
  if (buf.trim()) sentences.push(buf.trim());
  const out = []; let cur = '';
  for (const s of sentences) { if (cur && (cur.length + s.length > maxLen || /^[「『]/.test(s))) { out.push(cur); cur = s; } else cur += s; }
  if (cur) out.push(cur);
  return out;
}
// 把多句的字分成一行一行塞進原本的 <p>（每行一個 block span），不會再擠成一大塊（11/20）
// dialogue=true：連續幾句很短的對話（「……新的？」「對呀！」）併成一段，長篇介紹才不會碎成一行一行
function dialogueParas(text, maxLen) {
  const out = []; const pureQuote = (t) => /^[「『][^「『]*[」』]$/.test(t);
  for (const p of storyParas(text, maxLen)) {
    const prev = out[out.length - 1];
    if (prev && pureQuote(p) && /^[「『]/.test(prev) && /[」』]$/.test(prev) && pureQuote(prev.split(/(?<=[」』])/).pop()) && prev.length + p.length <= 26) out[out.length - 1] = prev + p;
    else out.push(p);
  }
  return out;
}
function setParas(node, text, maxLen = 70, dialogue = false) { node.replaceChildren(...(dialogue ? dialogueParas(text, maxLen) : storyParas(text, maxLen)).map(t => el('span', 'para', t))); }
const storyBox = (text) => { const box = el('div', 'archive-text'); box.append(...storyParas(text).map(t => el('p', '', t))); return box; };
let archiveSeries = 'all';
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
          sum.append(el('b', '', `📖 ${label}${ch.bossStory.bossName ? ` · ${ch.bossStory.bossName}` : ''}`)); det.append(sum, storyBox(text)); sec.append(det);
          if (key === 'after' && ch.bossId && epilogue.has(ch.bossId)) det.append(epilogueButton(ch.bossId, '▶ 重看尾聲劇場'));
          if (key === 'after' && ch.bossId && epilogue.sequelOf(ch.bossId)) det.append(epilogueButton(epilogue.sequelOf(ch.bossId), '▶ 重看後日談'));
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
    // 小湘越來越多（湘 11/20）：依系列篩選；解鎖的故事收合成一行，沒解鎖的縮成小格子
    body.append(el('p', 'archive-note', `已相遇 ${bo.met} 位 · 解鎖 ${bo.unlocked} 篇 · 好感度 Lv.3 解鎖每位小湘的小故事。`));
    const seriesOf = (x) => CHARACTERS[x.no]?.series;
    const groups = Object.keys(SERIES).filter(id => bo.list.some(x => seriesOf(x) === id));
    if (!groups.includes(archiveSeries)) archiveSeries = 'all';
    const chips = el('div', 'archive-filter'); chips.setAttribute('role', 'tablist');
    for (const id of ['all', ...groups]) {
      const list = id === 'all' ? bo.list : bo.list.filter(x => seriesOf(x) === id);
      const btn = el('button', '', `${id === 'all' ? '全部' : SERIES[id].short} ${list.filter(x => x.story).length}/${list.length}`);
      btn.type = 'button'; btn.setAttribute('aria-pressed', String(archiveSeries === id));
      btn.addEventListener('click', () => { archiveSeries = id; renderArchive(); });
      chips.append(btn);
    }
    body.append(chips);
    const shown = archiveSeries === 'all' ? bo.list : bo.list.filter(x => seriesOf(x) === archiveSeries);
    for (const x of shown.filter(x => x.story)) {
      const det = el('details', 'archive-card archive-story'); const sum = el('summary');
      const img = document.createElement('img'); img.className = 'archive-face'; img.alt = ''; loadWithFallback(img, characterSources(x.image));
      sum.append(img, el('b', '', `${x.name} · Lv.${x.level}`)); det.append(sum, storyBox(x.story));
      if (x.lines.length) { const ul = el('ul', 'archive-lines'); ul.append(...x.lines.map(l => el('li', '', `Lv.${l.level}「${l.text}」`))); det.append(ul); }
      body.append(det);
    }
    const locked = shown.filter(x => !x.story);
    if (locked.length) {
      body.append(el('h3', 'archive-section__title', `還沒解鎖 ${locked.length} 位`));
      const grid = el('div', 'archive-locked-grid');
      grid.append(...locked.map(x => { const c = el('div', 'archive-locked-chip'); c.append(el('b', '', `🔒 ${x.name}`), el('small', '', `Lv.${x.level} → Lv.3`)); return c; }));
      body.append(grid);
    }
  } else {
    body.append(el('p', 'archive-note', '兩位小湘一起出門，有時會發生小故事。'));
    for (const t of tr.list) {
      if (t.locked) { body.append(lockedCard('讓特定的兩位小湘一起出門就可能發現。')); continue; }
      const det = el('details', 'archive-card archive-story'); const sum = el('summary');
      sum.append(el('b', '', `📖 ${t.title}`), el('small', '', [t.who, t.place, fmtDate(t.at)].filter(Boolean).join(' · ')));
      det.append(sum, storyBox(t.text)); body.append(det);
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
  if (f.review) { const r = el('div', 'gugu-review is-small'); const av = el('span', 'gugu-review__avatar'); guguAvatar(av); const t = el('div'); const rt = el('p'); setParas(rt, f.review.text, 0); t.append(el('small', '', `咕咕書評 · ${f.review.label}`), rt); if (f.review.note) { const rn = el('p', 'gugu-review__note'); setParas(rn, f.review.note, 0); t.append(rn); } r.append(av, t); c.append(r); }
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
  if (state.seenIntro && !checkedToday(state)) add('checkin', '月簽到', `這個月已經簽 ${state.checkin?.days?.length || 0} 天，滿 28 天送星光蛋`, () => { $('today-dialog').close(); openCheckin(); });
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
    else if ((state.errands?.active?.length || 0) < errandSlots(state)) add('errand', '派小湘出門', `還可以再派 ${errandSlots(state) - (state.errands?.active?.length || 0)} 趟`, () => { $('today-dialog').close(); openErrands(); });
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
