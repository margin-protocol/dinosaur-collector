// Tutorial metadata travels with the save. It never grants resources or replays game actions.
export function startTutorial(state) {
  state.tutorial = { version: 1, status: 'active', visitedEgg: Boolean(state.tutorial?.visitedEgg || state.egg?.warmth > 0) };
}
export function tutorialStep(state, { needed, giftAvailable, residents = 0, view = 'home', snapsRemaining = 10 }) {
  if (!state.seenIntro || state.tutorial?.status !== 'active') return null;
  if (state.hatched > 0 || Object.keys(state.dex || {}).length) return {
    id: 'home', number: 5, title: '相遇之後，就是一起生活',
    copy: '首頁最多住三位小湘。點她打招呼、滑動摸摸頭，或把布丁拖給她；更多夥伴都會留在圖鑑裡。',
    action: view !== 'home' ? '一起回家' : residents ? '開始我們的日常' : '安排小湘入住',
    target: residents ? '#resident-lanes' : '#open-residents', view: 'home',
  };
  const ready = state.egg.warmth >= needed;
  if (!state.tutorial.visitedEgg && !ready) return {
    id: 'egg', number: 1, title: '有一顆蛋，正在等你',
    copy: `小恐龍會陪你迎接第一位小湘。先去培育室看看，這顆蛋需要 ${needed} 點溫暖才會破殼。`,
    action: '去看看我的蛋', view: 'incubate', target: '#egg-name',
  };
  if (!ready && giftAvailable && !state.bonus?.total?.gifts) return {
    id: 'gift', number: 2, title: '先收下今天的小小心意',
    copy: '每天都有一次見面禮，收下 30 能量吧。以後也能在首頁找到它，不用重新做教學。',
    action: '領取見面禮 · +30', target: '#chip-energy',
  };
  if (!ready && state.energy <= 0 && state.wishes?.done?.length >= 3) return snapsRemaining > 0 ? {
    id: 'wish', number: 3, title: '今天的顏色，都找齊了',
    copy: '還想再照顧一下蛋？到隨手收藏拍喜歡的東西，每張 +10 能量，每天最多十張。照片一樣不上傳。',
    action: view === 'wish' ? '找到隨手收藏' : '前往隨手收藏', view: 'wish', target: '#snap-label',
  } : {
    id: 'rest', number: 4, title: '今天很努力了，讓蛋暖暖睡吧',
    copy: '今日願望和隨手收藏都完成了。培養架每小時會自動保溫 +5，離開最多累積 12 小時；明天再來找新的顏色吧。',
    action: view === 'incubate' ? '看看自動保溫' : '回培育室看看', view: 'incubate', target: '#incubation-omen',
  };
  if (!ready && (!(state.player?.stats?.wishes > 0) || state.energy <= 0)) return {
    id: 'wish', number: 3, title: state.player?.stats?.wishes ? '再帶一點溫暖回來' : '陪小湘找找世界的顏色',
    copy: '今日願望每天三個。拍照或選相簿，讓指定顏色占畫面 25% 以上，每項就能得到 35 能量與 10 XP。照片只在手機辨色。',
    action: view === 'wish' ? '找到拍照探索' : '前往今日願望', view: 'wish', target: '.mission:not([hidden]) .mission-shoot, #snap-label',
  };
  return {
    id: 'feed', number: 4, title: ready ? '聽，她好像準備好了！' : '把剛剛的心意，送進蛋裡',
    copy: ready ? '孵化進度已滿。點「迎接新夥伴」，和她正式見面吧。' : `回到培育室，點「注入能量」，每次最多注入 10 點。還差 ${Math.max(0, needed - state.egg.warmth)} 點溫暖；能量用完就再找一個願望。`,
    action: view === 'incubate' ? ready ? '找到迎接按鈕' : '找到注入能量' : '帶著能量去培育', view: 'incubate', target: '#cultivate',
  };
}

export function createTutorial({ getState, save, context, navigate, collectGift, arrange, onDialog, notify }) {
  const $ = id => document.getElementById(id);
  let pending = false;
  let highlighted = null;
  function clearTarget() { highlighted?.classList.remove('tutorial-target'); highlighted = null; }
  function render() {
    const state = getState();
    const step = tutorialStep(state, context());
    $('tutorial-coach').hidden = !step;
    if (highlighted && (!step || highlighted.dataset.tutorialStep !== step.id)) clearTarget();
    if (!step) return;
    $('tutorial-step').textContent = `初次相遇 / 0${step.number} OF 05`;
    $('tutorial-title').textContent = step.title;
    $('tutorial-copy').textContent = step.copy;
    $('tutorial-action').textContent = step.action;
    $('tutorial-coach').dataset.step = step.id;
  }
  async function write(mutator) {
    if (pending) return false;
    pending = true;
    for (const id of ['tutorial-action', 'tutorial-pause', 'tutorial-resume']) $(id).disabled = true;
    try { await save(mutator); return true; }
    finally { pending = false; for (const id of ['tutorial-action', 'tutorial-pause', 'tutorial-resume']) $(id).disabled = false; render(); }
  }
  function point(step) {
    clearTarget();
    const target = document.querySelector(step.target);
    if (!target) return;
    highlighted = target; target.dataset.tutorialStep = step.id; target.classList.add('tutorial-target');
    target.scrollIntoView({ block: 'center', behavior: 'auto' });
    // Focus a real control without opening the camera or performing a game action.
    const control = target.matches('button, input') ? target : target.querySelector('button, input');
    control?.focus({ preventScroll: true });
  }
  function openGuide() {
    const status = getState().tutorial?.status;
    $('tutorial-guide-status').textContent = status === 'active' ? '帶路進度會隨遊戲儲存，離開後可以繼續。' : status === 'complete' ? '你們已經開始一起生活了，也可以再請小恐龍帶路。' : '可以隨時從研究者手記回來，不會清除進度。';
    $('function-center').close();
    $('tutorial-guide').showModal(); onDialog();
  }
  $('tutorial-more').addEventListener('click', openGuide);
  $('open-tutorial').addEventListener('click', openGuide);
  $('close-tutorial').addEventListener('click', () => $('tutorial-guide').close());
  $('tutorial-pause').addEventListener('click', async () => {
    if (await write(s => { if (s.tutorial) s.tutorial.status = 'paused'; })) { clearTarget(); notify('好呀，慢慢逛。研究者手記裡的「旅程指南」隨時陪你。'); }
  });
  $('tutorial-resume').addEventListener('click', async () => {
    if (await write(startTutorial)) { $('tutorial-guide').close(); navigate('home'); $('tutorial-coach').scrollIntoView({ block: 'start' }); }
  });
  $('tutorial-action').addEventListener('click', async () => {
    if (pending) return;
    const ctx = context(); const step = tutorialStep(getState(), ctx);
    if (!step) return;
    if (step.id === 'gift') { await collectGift(); render(); return; }
    if (step.id === 'home' && ctx.view === 'home') {
      if (!ctx.residents) { arrange(); return; }
      if (await write(s => { if (s.tutorial?.status === 'active') s.tutorial.status = 'complete'; })) { clearTarget(); notify('初次相遇完成。接下來的日常，也請多多指教！'); $('open-center').focus(); }
      return;
    }
    if (step.view) navigate(step.view);
    if (step.id === 'wish') document.getElementById('tab-daily').click();
    point(step);
  });
  return { render, clearTarget };
}
