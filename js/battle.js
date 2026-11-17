// 討伐：派 1～3 位小湘去打敵人（像皮克敏那樣派遣，回來看戰報）。
// 設計原則（皮寶 11/17）：剋制只影響效率與評分、不是通關必要條件；只有原味小湘也能打完入門關；
// 戰敗提示依實際原因；保留分數、歷史最高與進步；徽章可以拿來特訓，讓下一次打得更好。
import { CHARACTERS, SERIES } from './eggs.js';
import { levelOf } from './affection.js';
import { todayKey } from './wishes.js';

// 敵人。圖片照皮寶的命名放在 assets/enemies/chapter-0N/（沒有圖就顯示 emoji）。
// 文字欄位都可以直接改：intro 開場、weakHit 被剋制的反應（weakTag 是戰報上的小標）、win 玩家打贏時敵人說的話、
// lose 玩家打輸時敵人說的話、clue 第一次通關揭露的章節線索、story Boss 前後故事。
// 皮寶的素材資料檔在 data/enemies/*.json，這裡是遊戲實際使用的版本。
export const ENEMIES = {
  mochi: { stage: '1-1', name: '偷吃鬼糰子', emoji: '🍡', art: 'chapter-01/ch1-01-mochi-thief', power: 8, minutes: 30, weak: ['daily', 'recipe'], // 皮寶標的「甜點」對應到日常（甜點小湘）與隱藏配方
    intro: '「噓！我只吃一口……真的只有一口！你沒看到吧？」', weakTag: '偷吃術失靈', weakHit: '「咦？！你們連焦糖味都聞得出來！我的偷吃術失效啦！」糰子額頭冒出一滴汗。',
    win: '「嗚……好啦，布丁還你！可是湯匙可以留下嗎？」', lose: '「嘿嘿！這些布丁就先借我保管～下次再來抓我呀！」',
    clue: '糰子逃跑時掉下的金湯匙，背面竟刻著一枚小小的焦糖王冠。' },
  sock: { stage: '1-2', name: '襪子遊俠', emoji: '🧦', art: 'chapter-01/ch1-02-sock-ranger', power: 10, minutes: 30, weak: ['animals'],
    intro: '「左腳的歸我，右腳的也歸我！嘿嘿！」', weakTag: '飛毛腿失速', weakHit: '「等等！你怎麼跑得比我還快？！犯規啦！」襪子遊俠嚇得把袋裡的單邊襪子掉了一地。',
    win: '「嗚哇！還你還你！可是這雙真的好好看嘛！」', lose: '「追不到我吧！你的另一隻襪子我也收下囉！」',
    clue: '牠的戰利品袋裡夾著一張沾著焦糖的便當菜單，背面寫著：「青椒不可以剩下！」' },
  bento: { stage: '1-3', name: '碎碎念便當盒', emoji: '🍱', art: 'chapter-01/ch1-03-nagging-bento', power: 22, minutes: 45, weak: ['friends'],
    intro: '「青椒不吃就不准走！」', weakHit: '摯友小湘們互相分著吃青椒，便當盒感動得說不出話。', win: '「……好啦，下次少放一點青椒。」', lose: '「便當要吃完才能走喔！」' },
  'caramel-king': { stage: '1-B', name: '焦糖大王', emoji: '🍮', art: 'chapter-01/ch1-boss-caramel-king', power: 40, minutes: 90, boss: true, weak: ['daily'],
    intro: '「全世界的布丁都是本王的！」', weakHit: '日常小湘們一起喊「分享才好吃！」，焦糖王冠晃了一下。', win: '「本王……本王只是想有人陪我一起吃布丁……」', lose: '「哈哈哈！布丁王國永垂不朽！」',
    story: { // 皮寶初稿（docs/COMBAT_CHAPTER01_ENEMY_HANDOFF.md）
      before: '便利商店、廚房、街角的布丁接連失蹤。追著金湯匙上的焦糖王冠標記，小湘在倉庫裡發現一座由布丁堆成的王座。焦糖大王揚起小湯匙權杖：「全世界的布丁都是本王的！誰也不能拿走！」小湘歪頭：「可是……你真的吃得完嗎？」焦糖大王氣呼呼地把披風甩到自己臉上：「本王可以慢慢吃！」',
      after: '布丁山塌了一角，焦糖大王抱著最後一杯布丁小聲說：「我只是想開一場點心宴……可是沒有人來。」小湘發現邀請卡全被焦糖沾住，根本沒寄出去。她把卡片擦乾淨，邀請大家一起做點心。糰子偷偷舉手：「我可以當試吃員嗎？」「可以，」小湘說，「但這次真的只能先吃一口！」' } },
  'sneeze-cloud': { stage: '2-1', name: '噴嚏烏雲', emoji: '🌧️', art: 'chapter-02/ch2-01-sneeze-cloud', power: 45, minutes: 60, weak: ['weather'],
    intro: '「哈——啾！對不起……哈啾！」', weakHit: '天氣小湘一揮手，烏雲被吹散了，噴嚏停了一下下。', win: '「謝謝你們……鼻子終於通了。」', lose: '「哈啾！哈啾！哈——啾！」' },
  'lost-shadow': { stage: '2-2', name: '迷路影子', emoji: '👤', art: 'chapter-02/ch2-02-lost-shadow', power: 55, minutes: 60, weak: ['weather', 'county'],
    intro: '迷路影子躲在石頭後面，手上的地圖拿反了。', weakHit: '縣市小湘幫它把地圖轉正，影子的眼睛亮了起來。', win: '「原來出口在那邊……謝謝。」', lose: '影子一溜煙躲進更深的地方了。' },
  'angry-mushroom': { stage: '2-3', name: '生氣蘑菇', emoji: '🍄', art: 'chapter-02/ch2-03-angry-mushroom', power: 65, minutes: 75, weak: ['animals'],
    intro: '「是誰踩到我的！給我站出來！」', weakHit: '動物小湘蹭蹭蘑菇，蘑菇的臉頰慢慢消氣了。', win: '「……下次走路看路啦。」', lose: '蘑菇噴了一大團孢子，大家咳個不停。' },
  'thunder-king': { stage: '2-B', name: '雷雷大魔王', emoji: '⛈️', art: 'chapter-02/ch2-boss-thunder-king', power: 95, minutes: 120, boss: true, weak: ['weather'],
    intro: '「轟隆隆——！誰敢踏進我的山谷！」', weakHit: '天氣小湘撐開一片晴天，雷雲的閃電頭髮垂了下來。', win: '「……你們會再來找我玩嗎？」', lose: '「轟隆！再來幾次都一樣！」',
    story: { before: '山谷裡已經打雷打了一整個月，大家都不敢靠近。聽說雷雲最深的地方，住著一位大魔王……', after: '雷雷大魔王其實只是怕寂寞，才一直打雷想讓大家注意到他。現在山谷放晴了，他每天都在等小湘們來玩。' } },
};
export const CHAPTERS = [
  { id: 1, name: '布丁失竊事件', stages: ['mochi', 'sock', 'bento', 'caramel-king'], bg: 'conv' },
  { id: 2, name: '烏雲山谷', stages: ['sneeze-cloud', 'lost-shadow', 'angry-mushroom', 'thunder-king'], bg: 'mountain' },
];
const ORDER = CHAPTERS.flatMap((c) => c.stages);

export const RARITY_POWER = { N: 10, R: 13, SR: 17, SSR: 22, UR: 28 };
export const BOND_STEP = 0.2; // 好感度每級 +20%
export const STAR_STEP = 0.1; // 星級（重複孵到）每星 +10%，最多 5 星
export const TRAIN_STEP = 0.08; // 特訓每級 +8%，最多 5 級
export const TRAIN_COST = [3, 5, 8, 12, 16]; // 特訓到下一級需要的徽章
export const MAX_STARS = 5; export const MAX_TRAIN = 5;
export const SERIES_BONUS = 0.15; // 同系列 2 位以上
export const WEAK_BONUS = 0.3; // 帶了剋制的系列
export const TEAM_MAX = 3;
export const REST_MINUTES = 60; // 打完要休息
// 徽章限定角色（皮寶製作中）：角色編號確定後填上，勇者小隊連攜就會生效
export const BADGE_HEROES = { knight: null, mage: null, hero: null };
export const HERO_PARTY_BONUS = 0.5;

const iso = (d) => d.toISOString();
const isStr = (v) => typeof v === 'string';

export function ensureBattle(state) {
  const old = state.battle || {};
  const stages = {};
  for (const [id, v] of Object.entries(old.stages || {})) if (ENEMIES[id] && v) stages[id] = { stars: v.stars | 0, best: v.best | 0, last: v.last | 0, clears: v.clears | 0, tries: v.tries | 0 };
  state.battle = {
    active: Array.isArray(old.active) ? old.active.filter((a) => a && (ENEMIES[a.enemy] || a.snapshot) && Array.isArray(a.nos) && isStr(a.until) && a.report) : [],
    stages,
    badges: Number.isSafeInteger(old.badges) ? old.badges : 0,
    train: old.train && typeof old.train === 'object' ? old.train : {},
    rest: old.rest && typeof old.rest === 'object' ? old.rest : {},
    story: old.story && typeof old.story === 'object' ? old.story : {}, // 看過的 Boss 故事
    total: Number.isSafeInteger(old.total) ? old.total : 0,
    wild: old.wild && isStr(old.wild.date) && Array.isArray(old.wild.list) ? old.wild : null,
    week: isStr(old.week) ? old.week : '',
    weekBest: Number.isSafeInteger(old.weekBest) ? old.weekBest : 0,
    wildWins: Number.isSafeInteger(old.wildWins) ? old.wildWins : 0,
  };
  ensureWild(state);
  return state.battle;
}

// 章節敵人或野生小怪（wild:<id>）都用這個取得資料
export function enemyFor(state, key) {
  if (ENEMIES[key]) return { key, ...ENEMIES[key] };
  if (typeof key === 'string' && key.startsWith('wild:')) {
    const w = state.battle?.wild?.list?.find((x) => x.key === key) || state.battle?.active?.find((a) => a.enemy === key)?.snapshot;
    return w ? wildEnemy(w) : null;
  }
  return null;
}

export const unlocked = (state, enemy) => {
  if (typeof enemy === 'string' && enemy.startsWith('wild:')) return Boolean(enemyFor(state, enemy));
  const i = ORDER.indexOf(enemy);
  return i === 0 || Boolean(state.battle?.stages?.[ORDER[i - 1]]?.clears);
};
export const teamSlots = (state) => { const n = Object.keys(state.dex || {}).length; return n >= 25 ? 3 : n >= 10 ? 2 : 1; };

// 一位小湘的戰力與組成
export function siangPower(state, no) {
  const c = CHARACTERS[no]; if (!c) return null;
  const base = RARITY_POWER[c.rarity] || 10;
  const bond = levelOf(state.affection?.[no]?.pts || 0);
  const stars = Math.min(MAX_STARS, state.dex?.[no]?.dup || 0);
  const train = Math.min(MAX_TRAIN, state.battle?.train?.[no] || 0);
  const power = base * (1 + BOND_STEP * (bond - 1)) * (1 + STAR_STEP * stars) * (1 + TRAIN_STEP * train);
  return { no, base, bond, stars, train, power: Math.round(power * 10) / 10 };
}

export function teamPower(state, nos, enemyId) {
  const enemy = enemyFor(state, enemyId);
  const members = nos.map((no) => siangPower(state, no)).filter(Boolean);
  const raw = members.reduce((n, m) => n + m.power, 0);
  const counts = {};
  for (const no of nos) { const s = CHARACTERS[no]?.series; if (s) counts[s] = (counts[s] || 0) + 1; }
  const sameSeries = Object.values(counts).some((n) => n >= 2);
  const weakHit = Boolean(enemy) && nos.some((no) => enemy.weak.includes(CHARACTERS[no]?.series));
  const heroIds = Object.values(BADGE_HEROES);
  const heroParty = heroIds.every(Boolean) && heroIds.every((no) => nos.includes(no));
  const mult = (1 + (sameSeries ? SERIES_BONUS : 0)) * (1 + (weakHit ? WEAK_BONUS : 0)) * (1 + (heroParty ? HERO_PARTY_BONUS : 0));
  return { members, raw: Math.round(raw * 10) / 10, total: Math.round(raw * mult * 10) / 10, sameSeries, weakHit, heroParty };
}

// 預估：勝率與評語
export function forecast(state, nos, enemyId) {
  const team = teamPower(state, nos, enemyId);
  const ratio = team.total / enemyFor(state, enemyId).power;
  const chance = ratio >= 1 ? 1 : ratio < 0.7 ? 0 : (ratio - 0.7) / 0.3;
  const label = ratio >= 1.6 ? '輕鬆勝利' : ratio >= 1.2 ? '穩穩的' : ratio >= 1 ? '勢均力敵' : ratio >= 0.7 ? '有點危險' : '還打不贏';
  return { ...team, ratio, chance, label };
}

export const scoreOf = (ratio, weakHit, win) => (win ? Math.round(ratio * 1000) + (weakHit ? 150 : 0) : Math.round(ratio * 400));
export const starsOf = (ratio, win) => (!win ? 0 : ratio >= 1.6 ? 3 : ratio >= 1.2 ? 2 : 1);

const ACTIONS = {
  daily: '{name}揮了揮湯匙，認真地打了一下！', weather: '{name}招來一陣風，把對手吹得東倒西歪。', animals: '{name}撲上去咬了一口（輕輕的）。',
  friends: '{name}大喊「大家加油！」，隊伍士氣上升！', date: '{name}拋了一個飛吻，對手害羞得愣住了。', holiday: '{name}放了一串小煙火，砰砰砰！',
  county: '{name}拿出家鄉名產，丟！', recipe: '{name}丟出剛烤好的餅乾，香到對手分心。', memorial: '{name}拿出珍藏的照片，閃光攻擊！', special: '{name}身上冒出神秘的光芒。',
};
const actionLine = (no) => (ACTIONS[CHARACTERS[no]?.series] || ACTIONS.daily).replaceAll('{name}', CHARACTERS[no].name);

// 目前能派的小湘（有收集、沒有在出門或討伐、沒有在休息）
export function available(state, now = Date.now(), busy = new Set()) {
  const rest = state.battle?.rest || {};
  return Object.keys(state.dex || {}).filter((no) => CHARACTERS[no] && !busy.has(no) && !(Date.parse(rest[no] || 0) > now));
}

// 最強隊伍（從可派的小湘裡挑）
export function bestTeam(state, enemyId, pool) {
  const ranked = [...pool].sort((a, b) => siangPower(state, b).power - siangPower(state, a).power);
  const candidates = [ranked.slice(0, TEAM_MAX)];
  const weak = pool.filter((no) => enemyFor(state, enemyId).weak.includes(CHARACTERS[no]?.series)).sort((a, b) => siangPower(state, b).power - siangPower(state, a).power);
  if (weak.length) candidates.push([weak[0], ...ranked.filter((no) => no !== weak[0]).slice(0, TEAM_MAX - 1)]);
  for (const series of new Set(pool.map((no) => CHARACTERS[no].series))) {
    const same = ranked.filter((no) => CHARACTERS[no].series === series);
    if (same.length >= 2) candidates.push([...same.slice(0, 2), ...ranked.filter((no) => !same.slice(0, 2).includes(no)).slice(0, 1)].slice(0, TEAM_MAX));
  }
  return candidates.map((nos) => ({ nos, ...forecast(state, nos, enemyId) })).sort((a, b) => b.total - a.total)[0] || null;
}

// 戰敗原因：先看換隊能不能贏，再看哪一項成長最有效
export function diagnose(state, nos, enemyId, pool) {
  const enemy = enemyFor(state, enemyId);
  const now = forecast(state, nos, enemyId);
  const best = bestTeam(state, enemyId, [...new Set([...pool, ...nos])]);
  if (best && best.ratio >= 1 && best.total > now.total * 1.05) {
    const names = best.nos.map((no) => CHARACTERS[no].name).join('、');
    const why = nos.length < TEAM_MAX && best.nos.length > nos.length ? '多帶幾位一起去' : best.weakHit && !now.weakHit ? `帶上${enemy.weak.map((s) => SERIES[s]?.short).join('或')}系列的小湘` : '換一下隊伍';
    return { kind: 'team', text: `${why}就打得贏！試試看：${names}（預估戰力 ${best.total}，對手 ${enemy.power}）。`, team: best.nos };
  }
  // 換隊也打不贏 → 成長方向
  const members = now.members;
  const lowBond = members.filter((m) => m.bond < 5).sort((a, b) => a.bond - b.bond)[0];
  const lowTrain = members.filter((m) => m.train < MAX_TRAIN).sort((a, b) => a.train - b.train)[0];
  const gap = Math.max(0, Math.ceil(enemy.power - now.total));
  const tips = [];
  if (lowBond) tips.push(`把${CHARACTERS[lowBond.no].name}的好感度從 Lv.${lowBond.bond} 練高（每級 +20% 戰力）`);
  if (lowTrain) tips.push(`用徽章特訓${CHARACTERS[lowTrain.no].name}（每級 +8%）`);
  if (!now.weakHit && enemy.weak.length) tips.push(`收集${enemy.weak.map((s) => SERIES[s]?.short).join('或')}系列的小湘（剋制 +30%）`);
  if (!tips.length) tips.push('先回前面的關卡多打幾次，累積徽章');
  return { kind: 'grow', text: `還差大約 ${gap} 點戰力。建議${tips.slice(0, 2).join('，或')}。` };
}

// 出發：先算好結果存起來（重新整理不會重抽）。回傳錯誤字串或 battle 物件
export function startBattle(state, enemyId, nos, { now = new Date(), rand = Math.random, busy = new Set() } = {}) {
  const b = ensureBattle(state);
  const enemy = enemyFor(state, enemyId);
  if (!enemy) return '找不到這個對手。';
  const wildEntry = enemy.wild ? b.wild.list.find((x) => x.key === enemyId) : null;
  if (wildEntry?.defeated) return '這隻已經被打跑了，明天會有新的野生小怪。';
  if (b.active.some((a) => a.enemy === enemyId)) return '已經有隊伍在打這隻了。';
  if (!unlocked(state, enemyId)) return '要先打贏前一關。';
  nos = [...new Set(nos || [])];
  if (!nos.length) return '先選一位小湘。';
  if (nos.length > TEAM_MAX) return `一隊最多 ${TEAM_MAX} 位。`;
  if (b.active.length >= teamSlots(state)) return `同時最多 ${teamSlots(state)} 隊，等她們回來吧。`;
  const free = available(state, now.getTime(), busy);
  if (nos.some((no) => !free.includes(no))) return '有小湘正在忙或休息中。';
  const f = forecast(state, nos, enemyId);
  const win = rand() < f.chance;
  const score = scoreOf(f.ratio, f.weakHit, win);
  const stars = starsOf(f.ratio, win);
  const minutes = Math.round(enemy.minutes * (f.weakHit ? 0.75 : 1));
  const log = [enemy.intro, ...nos.map(actionLine)];
  if (f.weakHit) log.push(`✦ 效果拔群${enemy.weakTag ? `｜${enemy.weakTag}` : ''}！${enemy.weakHit}`);
  if (f.heroParty) log.push('✦ 勇者小隊集結！三人連攜，全隊力量大增！');
  log.push(win ? enemy.win : enemy.lose);
  const advice = win ? null : diagnose(state, nos, enemyId, free.filter((no) => !nos.includes(no)));
  const prev = enemy.wild ? { stars: 0, best: b.weekBest, last: wildEntry?.last || 0, clears: 0, tries: wildEntry?.tries || 0 } : (b.stages[enemyId] || { stars: 0, best: 0, last: 0, clears: 0, tries: 0 });
  const loot = enemy.wild
    ? (win ? { badges: Math.max(1, Math.round((enemy.boss ? 3 : 1) * enemy.reward)), energy: Math.round(enemy.power * 0.4 * enemy.reward), fossils: (enemy.trait.id === 'shiny' ? 3 : 0) + (enemy.boss ? 2 : 0) } : { badges: 0, energy: 5, fossils: 0 })
    : win
      ? { badges: (enemy.boss ? 3 : 1) + (stars === 3 && prev.stars < 3 ? 1 : 0), energy: Math.round(enemy.power * (0.5 + 0.1 * stars)), fossils: enemy.boss ? 3 : 0, firstBoss: enemy.boss && !prev.clears }
      : { badges: 0, energy: 5, fossils: 0 };
  const report = { win, score, stars, ratio: Math.round(f.ratio * 100) / 100, power: f.total, enemyPower: enemy.power, weakHit: f.weakHit, sameSeries: f.sameSeries, heroParty: f.heroParty, log, advice, loot, prevBest: prev.best, prevLast: prev.last, tries: prev.tries };
  const battle = { id: `${now.getTime().toString(36)}-${enemyId}`, enemy: enemyId, nos, start: iso(now), until: iso(new Date(now.getTime() + minutes * 60e3)), report, ...(wildEntry ? { snapshot: wildEntry } : {}) };
  b.active.push(battle);
  return battle;
}

export const isBack = (battle, now = Date.now()) => Date.parse(battle.until) <= now;
export const battleNos = (state) => new Set((state.battle?.active || []).flatMap((a) => a.nos));

// 收下戰報：發獎勵、記分數、讓小湘休息
export function collectBattle(state, id, now = new Date()) {
  const b = ensureBattle(state);
  const i = b.active.findIndex((a) => a.id === id);
  if (i < 0 || !isBack(b.active[i], now.getTime())) return null;
  const [battle] = b.active.splice(i, 1);
  const { report: r } = battle; const enemy = battle.snapshot ? wildEnemy(battle.snapshot) : ENEMIES[battle.enemy];
  let st;
  if (enemy.wild) {
    // 野外：記「本週最高分」，打贏的那隻今天就不會再出現
    const week = weekOf(now);
    if (b.week !== week) { b.week = week; b.weekBest = 0; }
    const entry = b.wild?.list.find((x) => x.key === battle.enemy);
    if (entry) { entry.tries = (entry.tries || 0) + 1; entry.last = r.score; if (r.win) entry.defeated = true; }
    st = { best: b.weekBest, clears: r.win ? 1 : 0 };
    if (r.score > b.weekBest) b.weekBest = r.score;
    if (r.win) b.wildWins += 1;
  } else {
    st = (b.stages[battle.enemy] ||= { stars: 0, best: 0, last: 0, clears: 0, tries: 0 });
    st.tries += 1; st.last = r.score;
    if (r.win) { st.clears += 1; st.stars = Math.max(st.stars, r.stars); }
  }
  const record = r.score > (enemy.wild ? r.prevBest : st.best); if (!enemy.wild && record) st.best = r.score;
  const best = enemy.wild ? b.weekBest : st.best;
  b.badges += r.loot.badges; state.energy += r.loot.energy; if (r.loot.fossils) state.fossils = (state.fossils || 0) + r.loot.fossils;
  if (r.loot.firstBoss) state.wishEgg.stock += 1;
  const restUntil = iso(new Date(now.getTime() + REST_MINUTES * 60e3));
  for (const no of battle.nos) b.rest[no] = restUntil;
  b.total += 1;
  const gains = [r.loot.badges && `徽章 +${r.loot.badges}`, r.loot.energy && `+${r.loot.energy} 能量`, r.loot.fossils && `+${r.loot.fossils} 化石`, r.loot.firstBoss && '第一次打倒 Boss：願望蛋 +1'].filter(Boolean);
  const firstClear = r.win && st.clears === 1;
  const story = enemy.story && r.win && !b.story[`${battle.enemy}:after`] ? (b.story[`${battle.enemy}:after`] = now.toISOString(), enemy.story.after) : null;
  const clue = firstClear && enemy.clue ? enemy.clue : null;
  return { ...battle, report: r, record, best, delta: r.tries ? r.score - r.prevLast : null, gains, story, clue, wild: Boolean(enemy.wild) };
}

// 特訓：花徽章讓一位小湘永久變強
export function trainCost(state, no) { const lv = state.battle?.train?.[no] || 0; return lv >= MAX_TRAIN ? null : TRAIN_COST[lv]; }
export function train(state, no) {
  const b = ensureBattle(state);
  if (!state.dex?.[no]) return '還沒遇見這位小湘。';
  const cost = trainCost(state, no);
  if (cost === null) return '特訓已經滿級了！';
  if (b.badges < cost) return `徽章不夠，需要 ${cost} 個。`;
  b.badges -= cost; b.train[no] = (b.train[no] || 0) + 1;
  return { no, level: b.train[no], cost };
}

// Boss 開戰前的故事（每個 Boss 只自動顯示一次）
export function bossIntro(state, enemyId) {
  const e = ENEMIES[enemyId]; if (!e?.story) return null;
  const key = `${enemyId}:before`;
  if (state.battle.story[key]) return null;
  state.battle.story[key] = new Date().toISOString();
  return e.story.before;
}
export const restLeft = (state, no, now = Date.now()) => Math.max(0, Date.parse(state.battle?.rest?.[no] || 0) - now);
export const fmtMinutes = (ms) => { const m = Math.ceil(ms / 60e3); return m >= 60 ? `${Math.floor(m / 60)} 小時 ${m % 60} 分` : `${Math.max(1, m)} 分鐘`; };

export const enemyArtPath = (id, state) => { const e = state ? enemyFor(state, id) : ENEMIES[id]; return `assets/enemies/${e?.art || id}.webp`; };

// ── 野外巡邏：每天隨機生成野生小怪（用現有敵人的圖＋隨機個性）
export const WILD_TRAITS = [
  { id: 'sleepy', label: '愛睏的', icon: '💤', power: 0.75, reward: 0.8, scale: 0.92, hue: 0, line: '打了一個大大的呵欠，眼睛快閉起來了。' },
  { id: 'tiny', label: '迷你的', icon: '🔹', power: 0.6, reward: 0.7, scale: 0.72, hue: 0, line: '小小一隻，但看起來很努力。' },
  { id: 'lost', label: '迷路的', icon: '❓', power: 0.85, reward: 0.9, scale: 1, hue: 0, line: '東張西望，好像在找回家的路。' },
  { id: 'hungry', label: '肚子餓的', icon: '🍽️', power: 0.95, reward: 1, scale: 1, hue: 10, line: '肚子咕嚕咕嚕叫，看到什麼都想吃。' },
  { id: 'angry', label: '生氣的', icon: '💢', power: 1.15, reward: 1.2, scale: 1.02, hue: -20, line: '氣到冒煙，誰靠近就跟誰吵架！' },
  { id: 'proud', label: '驕傲的', icon: '👑', power: 1.25, reward: 1.3, scale: 1.05, hue: 30, line: '抬頭挺胸：「本大爺很強的！」' },
  { id: 'giant', label: '巨大的', icon: '⬆️', power: 1.45, reward: 1.6, scale: 1.18, hue: 0, line: '比平常大了好幾號，影子把大家都蓋住了！' },
  { id: 'shiny', label: '閃亮的', icon: '✨', power: 1.2, reward: 2, scale: 1, hue: 0, shiny: true, rare: true, line: '全身閃閃發光，好像是很稀有的品種！' },
];
const WILD_SERIES = ['daily', 'weather', 'animals', 'friends', 'county', 'holiday', 'date'];
export const WILD_PER_DAY = 4;
const BOSS_IDS = Object.keys(ENEMIES).filter((id) => ENEMIES[id].boss);
const MINION_IDS = Object.keys(ENEMIES).filter((id) => !ENEMIES[id].boss);

function seeded(text) {
  let h = 2166136261;
  for (const ch of text) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function weekOf(date) { const d = new Date(date); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

// 目前最強三人的戰力（不含加成），當作野生小怪的強度基準
function strength(state) {
  const powers = Object.keys(state.dex || {}).map((no) => siangPower(state, no)?.power || 0).sort((a, b) => b - a);
  return Math.max(10, powers.slice(0, TEAM_MAX).reduce((n, p) => n + p, 0));
}

export function wildEnemy(w) {
  const base = ENEMIES[w.base]; const trait = WILD_TRAITS.find((t) => t.id === w.trait) || WILD_TRAITS[0];
  return {
    key: w.key, wild: true, base: w.base, trait, boss: Boolean(w.boss), stage: w.boss ? '野外 · 流浪 Boss' : '野外', name: `${trait.label}${base.name}`,
    emoji: base.emoji, art: base.art, power: w.power, minutes: Math.round(base.minutes * (w.boss ? 1 : 0.8)), weak: w.weak, reward: trait.reward * (w.boss ? 1.5 : 1),
    intro: `${trait.line}${base.intro}`, weakHit: base.weakHit, weakTag: base.weakTag, win: base.win, lose: base.lose, clue: null, story: null,
  };
}

// 每天換一批：強度從「很好打」到「要努力」，偶爾有閃亮小怪或流浪 Boss
export function ensureWild(state, date = todayKey()) {
  const b = state.battle;
  if (b.wild?.date === date) return b.wild;
  const rand = seeded(`wild:${date}`);
  const pick = (list) => list[Math.floor(rand() * list.length) % list.length];
  const base = strength(state);
  const ratios = [0.55, 0.85, 1.05, 1.35];
  const commons = WILD_TRAITS.filter((t) => !t.rare);
  const list = ratios.map((ratio, i) => {
    const wandering = i === WILD_PER_DAY - 1 && rand() < 0.15;
    const enemy = wandering ? pick(BOSS_IDS) : pick(MINION_IDS);
    const trait = rand() < 0.12 ? WILD_TRAITS.find((t) => t.shiny) : pick(commons);
    const weak = [...new Set([pick(WILD_SERIES), ...(rand() < 0.4 ? [pick(WILD_SERIES)] : [])])];
    const power = Math.max(6, Math.round(base * ratio * (wandering ? 1.15 : 1) * (0.9 + rand() * 0.2)));
    return { key: `wild:${date}:${i}`, base: enemy, trait: trait.id, boss: wandering, weak, power, defeated: false };
  });
  b.wild = { date, list };
  return b.wild;
}
export const weekBest = (state, now = new Date()) => (state.battle?.week === weekOf(now) ? state.battle.weekBest : 0);
