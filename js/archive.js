// 咕咕的故事檔案館：只「讀」現有存檔整理出要顯示的內容，自己不存任何東西。
// 討伐故事 ← state.battle（stages / story / pages）；小湘故事 ← state.affection；旅行故事 ← state.errands。
// 沒解鎖的內容只回傳 locked，不帶標題和內文，避免劇透。
import { CHARACTERS } from './eggs.js';
import { ENEMIES, CHAPTERS, EXTRA_STAGES, SPECIAL_PAGES, unlocked } from './battle.js';
import { levelOf, bondText } from './affection.js';
import { STORIES, PLACES } from './errands.js';
import { REVIEW_LABEL } from './gugu-reviews.js';

const PRE_UPDATE = '改版前通關';

function stageFile(state, id) {
  const e = ENEMIES[id]; const st = state.battle?.stages?.[id];
  const open = unlocked(state, id);
  const cleared = Boolean(st?.clears);
  if (!open && !st?.tries) return { id, locked: true, stage: e.stage, boss: Boolean(e.boss), extra: Boolean(e.extra) };
  return {
    id, locked: false, stage: e.stage, boss: Boolean(e.boss), extra: Boolean(e.extra), name: e.name, emoji: e.emoji, art: e.art,
    met: Boolean(st?.tries), cleared,
    bio: st?.tries ? e.bio || '' : '', // 交手過才看得到介紹
    firstAt: cleared ? (st.firstAt || null) : null, firstLabel: cleared ? (st.firstAt ? null : PRE_UPDATE) : null,
    best: st?.best || 0, stars: st?.stars || 0, clears: st?.clears || 0, tries: st?.tries || 0,
    clue: cleared && e.clue ? e.clue : null,
    review: st?.review ? { ...st.review, label: REVIEW_LABEL[st.review.kind] || '' } : null,
    lines: cleared ? { intro: e.intro, weakTag: e.weakTag || '', weakHit: e.weakHit, win: e.win, lose: e.lose } : null,
  };
}

export function battleArchive(state) {
  const story = state.battle?.story || {};
  const chapters = CHAPTERS.map((ch) => {
    const stages = ch.stages.map((id) => stageFile(state, id));
    const boss = ch.stages.map((id) => ENEMIES[id]).find((e) => e.boss);
    const bossId = ch.stages.find((id) => ENEMIES[id].boss);
    const seenBefore = Boolean(story[`${bossId}:before`]) || Boolean(state.battle?.stages?.[bossId]?.tries);
    const seenAfter = Boolean(story[`${bossId}:after`]) || Boolean(state.battle?.stages?.[bossId]?.clears);
    const open = stages.some((s) => !s.locked);
    return {
      id: ch.id, name: open ? ch.name : null, locked: !open, stages, bossId,
      bossStory: boss?.story ? { before: seenBefore ? boss.story.before : null, after: seenAfter ? boss.story.after : null, bossName: seenBefore ? boss.name : null } : null,
      clues: stages.filter((s) => s.clue).map((s) => ({ stage: s.stage, text: s.clue })),
      clueTotal: ch.stages.filter((id) => ENEMIES[id].clue).length,
    };
  });
  const extras = EXTRA_STAGES.map((x) => ({ ...x, file: stageFile(state, x.id) }));
  const files = [...chapters.flatMap((c) => c.stages), ...extras.map((x) => x.file)];
  return {
    chapters, extras,
    collected: files.filter((f) => f.cleared).length, total: files.length,
    pages: { owned: state.battle?.pages || [], slots: SPECIAL_PAGES }, // 預留：特殊書頁
  };
}

export function bondArchive(state) {
  const owned = Object.keys(CHARACTERS).filter((no) => state.dex?.[no]);
  const list = owned.map((no) => {
    const level = levelOf(state.affection?.[no]?.pts || 0);
    const text = bondText(no);
    return {
      no, name: CHARACTERS[no].name, image: CHARACTERS[no].image, level,
      story: level >= 3 ? text[3] : null,
      lines: [2, 4, 5].filter((lv) => level >= lv).map((lv) => ({ level: lv, text: text[lv] })),
    };
  });
  return { list, unlocked: list.filter((x) => x.story).length, total: Object.keys(CHARACTERS).length, met: owned.length };
}

export function travelArchive(state) {
  const found = state.errands?.stories || {};
  const album = state.errands?.album || [];
  const list = STORIES.map((s) => {
    if (!found[s.id]) return { id: s.id, locked: true };
    const entry = album.find((a) => a.story?.id === s.id);
    const text = entry?.story?.text || s.text({ name: '外面', ...(PLACES[entry?.place] || {}) });
    return { id: s.id, locked: false, title: s.title, text, at: found[s.id], who: entry ? entry.nos.map((no) => CHARACTERS[no]?.name).filter(Boolean).join('和') : '', place: entry?.place ? PLACES[entry.place]?.name : '' };
  });
  return { list, unlocked: list.filter((x) => !x.locked).length, total: STORIES.length };
}
