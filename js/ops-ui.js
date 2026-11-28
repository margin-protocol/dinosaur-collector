// 審核室「營運」分頁：上線看板＋Bug 清單（湘 11/28）。資料規則見 js/ops.js。
import { OPS_PATH, PRIORITIES, PEOPLE, cmpVersion, bugStage, STAGE_LABEL, sortBugs, timeline, fmtTaipei, fmtLeft, cleanBoard, emptyBoard, sampleBoard, newId } from './ops.js';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const MAIN_URL = 'https://raw.githubusercontent.com/margin-protocol/dinosaur-collector/main/changelog.json';

let store = null; // () => 小湘雲端（審核員）
let board = emptyBoard();
let loaded = false;
let live = { version: '', title: '' };
let main = { version: '', title: '' };
let filter = 'todo';
let editing = null; // bug id 或 'new'
let fixing = null; // 正在填「修在哪一版」的 bug id

async function readVersion(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const list = await r.json();
  return { version: list[0]?.version || '', title: list[0]?.title || '' };
}

async function save(message = '已存好') {
  board.updated = new Date().toISOString();
  $('ops-status').textContent = '儲存中…';
  try { await store().putJSON(OPS_PATH, board, 'ops', { overwrite: true }); $('ops-status').textContent = message; }
  catch (err) { $('ops-status').textContent = `沒存成功：${err.message}（重新整理再試一次）`; }
  render();
}

/* ---------- 上線看板 ---------- */
function renderVersions() {
  $('ops-live').textContent = live.version ? `v${live.version}` : '讀取中…';
  $('ops-live-title').textContent = live.title;
  $('ops-main').textContent = main.version ? `v${main.version}` : '—';
  const diff = main.version && live.version ? cmpVersion(main.version, live.version) : 0;
  $('ops-sync').textContent = !main.version || !live.version ? '' : diff > 0 ? '主分支比玩家版新：網站還在部署，通常 1～2 分鐘就好。' : '玩家版和主分支一樣新。';
  $('ops-sync').classList.toggle('is-behind', diff > 0);
}
function renderTimeline(now = Date.now()) {
  const items = timeline();
  const next = items.findIndex((x) => x.at > now);
  const shown = items.filter((x, i) => x.at > now || i === next - 1);
  $('ops-times').replaceChildren(...shown.map((x) => {
    const li = el('li', `ops-time${x.at <= now ? ' is-past' : ''}${x === items[next] ? ' is-next' : ''}`);
    li.append(el('span', 'ops-time__when', fmtTaipei(x.at)), el('b', null, x.label), el('small', null, x.at <= now ? '已經過了' : fmtLeft(x.at - now)));
    return li;
  }));
}
function renderChecks() {
  const liveBugs = board.bugs.filter((b) => bugStage(b, live.version) === 'live');
  const manual = board.checks[live.version] || [];
  const rows = [
    ...liveBugs.map((b) => { const li = el('li', 'ops-check is-bug'); li.append(el('span', 'ops-check__tag', b.priority), el('span', null, b.title)); li.addEventListener('click', () => { filter = 'live'; render(); $('ops-bugs').scrollIntoView({ behavior: 'smooth' }); }); return li; }),
    ...manual.map((c, i) => {
      const li = el('li', `ops-check${c.done ? ' is-done' : ''}`);
      const box = Object.assign(el('button', 'ops-check__box', c.done ? '✓' : ''), { type: 'button' });
      box.setAttribute('aria-label', `${c.done ? '取消勾選' : '勾選'}：${c.text}`);
      box.addEventListener('click', () => { c.done = !c.done; void save(); });
      const del = Object.assign(el('button', 'link ops-check__del', '移除'), { type: 'button' });
      del.addEventListener('click', () => { manual.splice(i, 1); void save('已移除'); });
      li.append(box, el('span', null, c.text), del); return li;
    }),
  ];
  $('ops-checks').replaceChildren(...(rows.length ? rows : [el('li', 'ops-empty', '這版沒有要驗的東西。')]));
  $('ops-check-version').textContent = live.version ? `v${live.version}` : '這版';
}

/* ---------- Bug 清單 ---------- */
const FILTERS = { todo: (s) => s !== 'verified', open: (s) => s === 'open', live: (s) => s === 'live' || s === 'fixed', verified: (s) => s === 'verified', all: () => true };
function bugForm(bug) {
  const f = el('form', 'form ops-form');
  f.innerHTML = `<label>標題<input name="title" maxlength="120" required placeholder="一句話講哪裡壞掉"></label>
<label>重現步驟<textarea name="steps" rows="5" maxlength="2000" placeholder="1. 打開…&#10;2. 按…&#10;3. 應該…，結果…"></textarea></label>
<div class="ops-form__row"><label>優先<select name="priority">${Object.entries(PRIORITIES).map(([k, v]) => `<option value="${k}">${k} ${v}</option>`).join('')}</select></label>
<label>誰回報<select name="reporter">${PEOPLE.map((p) => `<option>${p}</option>`).join('')}</select></label></div>
<label>備註<input name="note" maxlength="600" placeholder="可不填"></label>
<div class="row"><button class="btn btn--small" type="submit">${bug ? '存好' : '加進清單'}</button><button class="btn btn--quiet btn--small" type="button" data-cancel>取消</button></div>`;
  const v = bug || { title: '', steps: '', priority: 'P1', reporter: '皮寶', note: '' };
  for (const k of ['title', 'steps', 'priority', 'reporter', 'note']) f.elements[k].value = v[k] || '';
  f.querySelector('[data-cancel]').addEventListener('click', () => { editing = null; render(); });
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(['title', 'steps', 'priority', 'reporter', 'note'].map((k) => [k, f.elements[k].value.trim()]));
    if (!data.title) return;
    if (bug) Object.assign(bug, data);
    else board.bugs.unshift({ id: newId(), ...data, fixVersion: '', fixed: false, verified: false, verifiedBy: '', verifiedAt: '', created: new Date().toISOString() });
    editing = null; void save(bug ? '已更新' : '已加進清單');
  });
  return f;
}
// 進度步驟（湘 11/28 選 B）：回報 → 主分支已修 → 玩家版有了 → 玩家版已驗；版本和驗的人寫在步驟底下
function stepper(bug, stage) {
  const steps = [['open', '回報', bug.reporter || ''], ['fixed', '主分支已修', bug.fixVersion ? bug.fixVersion.replace(/^\d{4}\./, '') : ''], ['live', '玩家版有了', ''], ['verified', '玩家版已驗', bug.verifiedBy || '']];
  const at = steps.findIndex(([k]) => k === stage);
  const ol = el('ol', 'ops-steps');
  ol.setAttribute('aria-label', `進度：${STAGE_LABEL[stage]}`);
  steps.forEach(([, label, sub], i) => {
    const li = el('li', i < at ? 'is-done' : i === at ? 'is-now' : '', label);
    if (sub && i <= at) li.append(el('small', null, sub));
    ol.append(li);
  });
  return ol;
}
function bugItem(bug) {
  if (editing === bug.id) { const li = el('li', 'ops-bug is-editing'); li.append(bugForm(bug)); return li; }
  const stage = bugStage(bug, live.version);
  const li = el('li', `ops-bug is-${stage} is-${bug.priority.toLowerCase()}`);
  const head = el('div', 'ops-bug__head');
  head.append(el('span', `ops-pri is-${bug.priority.toLowerCase()}`, bug.priority), el('b', null, bug.title));
  li.append(head);
  li.append(stepper(bug, stage));
  if (bug.steps) li.append(el('pre', 'ops-bug__steps', bug.steps));
  const meta = [bug.created && `${Number(bug.created.slice(5, 7))}/${Number(bug.created.slice(8, 10))} 回報`, bug.note].filter(Boolean).join('・');
  if (meta) li.append(el('small', 'ops-bug__meta', meta));

  const acts = el('div', 'row ops-acts');
  const btn = (text, fn, cls = 'btn btn--quiet btn--small') => { const b = Object.assign(el('button', cls, text), { type: 'button' }); b.addEventListener('click', fn); acts.append(b); return b; };
  if (!bug.fixed && fixing === bug.id) {
    const ver = Object.assign(el('input', 'ops-ver'), { value: main.version || live.version || '', placeholder: '2026.11.28o', inputMode: 'url' });
    ver.setAttribute('aria-label', '修在哪一版');
    acts.append(el('span', 'ops-ver__label', '修在 v'), ver);
    btn('確定', () => { bug.fixed = true; bug.fixVersion = ver.value.trim().replace(/^v/i, ''); fixing = null; void save('已標成主分支已修'); }, 'btn btn--small');
    btn('取消', () => { fixing = null; render(); });
    li.append(acts); return li;
  }
  if (!bug.fixed) btn('標成主分支已修', () => { fixing = bug.id; render(); }, 'btn btn--small');
  else if (!bug.verified) {
    const who = el('select', 'ops-who'); who.setAttribute('aria-label', '誰驗的');
    who.replaceChildren(...PEOPLE.filter((p) => p !== '玩家').map((p) => Object.assign(el('option', null, p), { value: p })));
    who.value = '皮寶';
    const b = btn('標成玩家版已驗', () => { bug.verified = true; bug.verifiedBy = who.value; bug.verifiedAt = new Date().toISOString(); void save('已標成玩家版已驗'); }, 'btn btn--small');
    if (stage !== 'live') { b.disabled = true; b.title = '玩家版還沒更新到這一版'; }
    acts.prepend(who);
    btn('退回待修', () => { bug.fixed = false; bug.fixVersion = ''; void save('已退回待修'); });
  } else btn('取消已驗', () => { bug.verified = false; bug.verifiedBy = ''; bug.verifiedAt = ''; void save('已取消'); });
  btn('編輯', () => { editing = bug.id; render(); }, 'link ops-link');
  const del = btn('刪除', () => {
    if (!del.dataset.confirm) { del.dataset.confirm = '1'; del.textContent = '確定刪除？'; setTimeout(() => { delete del.dataset.confirm; del.textContent = '刪除'; }, 4000); return; }
    board.bugs = board.bugs.filter((b) => b !== bug); void save('已刪除');
  }, 'link ops-link');
  li.append(acts);
  return li;
}
function renderBugs() {
  const stages = board.bugs.map((b) => bugStage(b, live.version));
  document.querySelectorAll('#ops-filter [data-filter]').forEach((c) => {
    c.setAttribute('aria-pressed', String(c.dataset.filter === filter));
    c.querySelector('span').textContent = stages.filter(FILTERS[c.dataset.filter]).length;
  });
  const list = sortBugs(board.bugs, live.version).filter((b) => FILTERS[filter](bugStage(b, live.version)));
  const rows = list.map(bugItem);
  if (editing === 'new') { const li = el('li', 'ops-bug is-editing'); li.append(bugForm(null)); rows.unshift(li); }
  $('ops-bug-list').replaceChildren(...(rows.length ? rows : [el('li', 'ops-empty', filter === 'todo' ? '沒有待處理的 bug 🎉' : '這一類沒有 bug。')]));
  $('ops-add').hidden = editing === 'new';
}

function render() {
  if (!loaded) return;
  renderVersions(); renderTimeline(); renderChecks(); renderBugs();
}

export async function refreshOps() {
  if (!store) return;
  $('ops-locked').hidden = true;
  $('sec-ops-board').hidden = false; $('ops-bugs').hidden = false;
  $('ops-status').textContent = '讀取中…';
  const versions = Promise.allSettled([readVersion(new URL('changelog.json', location.href).href), readVersion(MAIN_URL)]);
  try {
    const got = await store().getJSON(OPS_PATH);
    if (got) board = cleanBoard(got.data);
    else { board = sampleBoard(); await store().putJSON(OPS_PATH, board, 'ops', { overwrite: true }); }
    $('ops-status').textContent = '';
  } catch (err) { $('ops-status').textContent = `讀不到營運資料：${err.message}`; }
  const [l, m] = await versions;
  if (l.status === 'fulfilled') live = l.value;
  if (m.status === 'fulfilled') main = m.value;
  loaded = true; render();
}

export function initOps({ getStore }) {
  store = getStore;
  document.querySelectorAll('#ops-filter [data-filter]').forEach((c) => c.addEventListener('click', () => { filter = c.dataset.filter; render(); }));
  $('ops-add').addEventListener('click', () => { editing = 'new'; filter = 'todo'; render(); });
  $('ops-check-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('ops-check-text').value.trim();
    if (!text || !live.version) return;
    (board.checks[live.version] ||= []).push({ text, done: false });
    $('ops-check-text').value = ''; void save('已加進這版要驗');
  });
  $('ops-refresh').addEventListener('click', () => void refreshOps());
  setInterval(() => { if (loaded && !$('sec-ops-board').hidden) renderTimeline(); }, 60e3);
}
export function lockOps() { $('ops-locked').hidden = false; $('sec-ops-board').hidden = true; $('ops-bugs').hidden = true; loaded = false; }
