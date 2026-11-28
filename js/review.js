// 首席研究員審核室：只在湘的手機使用。印章（私鑰）存在這支手機的 IndexedDB。
import { cloudConfig, saveCloudConfig, createCloud, claimReviewer, reviewerClaimed } from './cloud.js';
import { generateKeys, exportJwk, importPrivate, publicFromPrivate, signPayload, normalizeCode, sha256Hex } from './sign.js';
import { CHARACTERS, EGGS, noLabel } from './eggs.js';
import { describeReward } from './gifts.js';
import { REVIEWER_PUBLIC_JWK } from './reviewer-key.js';
import qrcode from './vendor/qrcode.mjs';
import { newDateCode } from './commissions.js';

export const REVIEW_CLOUD_KEY = 'siang-collector:review-cloud:v1';
const NOTES_KEY = 'siang-collector:review-notes:v1'; // 暗號原文與備註只存在湘的手機
const $ = (id) => document.getElementById(id);

/* ---------- 印章保存（IndexedDB） ---------- */
function db() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('siang-review', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('keys');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idb(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction('keys', mode);
    const req = fn(tx.objectStore('keys'));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
const loadJwk = () => idb('readonly', (s) => s.get('reviewer'));
const storeJwk = (jwk) => idb('readwrite', (s) => s.put(jwk, 'reviewer'));

let privateJwk = null;
let privateKey = null;
async function setKey(jwk) { privateJwk = jwk; privateKey = jwk ? await importPrivate(jwk) : null; }
const samePublic = (a, b) => Array.isArray(b) ? b.some(k => samePublic(a, k)) : Boolean(a && b && a.x === b.x && a.y === b.y);

function renderKey(message = '') {
  const has = Boolean(privateJwk);
  const pub = has ? publicFromPrivate(privateJwk) : null;
  const matches = samePublic(pub, REVIEWER_PUBLIC_JWK);
  $('key-state').textContent = !has ? '這支手機還沒有印章。第一次使用請按「產生新的印章」；換手機請按「從備份還原」。'
    : matches ? '✓ 印章已就緒，遊戲也認得這個章。'
    : REVIEWER_PUBLIC_JWK ? '⚠ 這支手機的印章和遊戲裡記錄的不一樣，遊戲不會接受它蓋的章。請用備份還原正確的印章。'
    : '印章已產生。請把下方公鑰交給德寶寫進遊戲，完成後遊戲才會認得。';
  $('key-info').hidden = !has;
  $('key-generate').textContent = has ? '重新產生印章（舊章會失效）' : '產生新的印章';
  if (pub) $('key-public').value = JSON.stringify(pub);
  $('key-status').textContent = message;
  for (const id of ['code-create', 'letter-send', 'mission-create', 'date-create']) $(id).disabled = !has;
}

/* ---------- 連線 ---------- */
// 小湘雲端：審核員通行碼存在這支手機；玩家名單從雲端讀。舊的 GitHub 玩家（每人一個私人 repo）也還能選。
const PLAYERS_KEY = 'siang-collector:review-players:v1';
const REVIEWER_KEY = 'siang-collector:reviewer-token:v1';
function loadPlayers() {
  try {
    const p = JSON.parse(localStorage.getItem(PLAYERS_KEY) || 'null');
    if (p && Array.isArray(p.list)) return { list: p.list.filter(x => x && /^[\w.-]+\/[\w.-]+$/.test(x.repo) && x.token), active: p.active ?? null };
  } catch {}
  const old = cloudConfig(REVIEW_CLOUD_KEY); // 舊版只有一位玩家，搬進名單
  return { list: old ? [{ name: '玩家 1', ...old }] : [], active: null };
}
let players = loadPlayers(); // 舊 GitHub 玩家
let cloudPlayers = []; // 小湘雲端玩家
let reviewerToken = (() => { try { return localStorage.getItem(REVIEWER_KEY) || ''; } catch { return ''; } })();
const savePlayers = () => localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
// active：'cf:<玩家 id>' 或 'gh:<序號>'；舊存的數字當成 gh
const activeKey = () => (players.active == null ? null : typeof players.active === 'number' ? `gh:${players.active}` : players.active);
function entries() {
  return [
    ...cloudPlayers.map(p => ({ key: `cf:${p.id}`, label: `${p.name}${p.revoked ? '（已停用）' : ''}`, config: { kind: 'siang', token: reviewerToken, player: p.id }, name: p.name, cloud: p })),
    ...players.list.map((p, i) => ({ key: `gh:${i}`, label: `${p.name}（GitHub 舊）`, config: p, name: p.name })),
  ];
}
const current = () => entries().find(e => e.key === activeKey()) || entries()[0] || null;
const config = () => current()?.config || null;
const cloud = () => { const c = config(); if (!c) throw new Error('請先到「設定」選一位玩家'); return createCloud(c); };
const admin = () => createCloud({ kind: 'siang', token: reviewerToken });
// 寄給所有玩家（湘 11/20）：同一份蓋章的檔案寫進每一位小湘雲端玩家的資料夾（停用的不寄）
const everyoneStores = () => cloudPlayers.filter(p => !p.revoked).map(p => ({ name: p.name, store: createCloud({ kind: 'siang', token: reviewerToken, player: p.id }) }));
async function putForEveryone(path, signed, message) {
  const targets = everyoneStores();
  if (!targets.length) throw new Error('小湘雲端還沒有玩家');
  const results = await Promise.allSettled(targets.map(t => t.store.putJSON(path, signed, message)));
  const failed = targets.filter((t, i) => results[i].status === 'rejected').map(t => t.name);
  return { sent: targets.length - failed.length, failed };
}
const everyoneText = (r, what) => `${what}給 ${r.sent} 位玩家了！${r.failed.length ? `（${r.failed.join('、')} 沒有成功，等一下再試）` : ''}`;
let adding = false;

function renderCloud(message = '') {
  const cur = current();
  const sel = $('player-select');
  sel.replaceChildren(...entries().map(e => Object.assign(document.createElement('option'), { value: e.key, textContent: e.label })));
  if (cur) sel.value = cur.key;
  const mk = $('make-player');
  mk.replaceChildren(...entries().map(e => Object.assign(document.createElement('option'), { value: e.key, textContent: e.label })));
  if (cur) mk.value = cur.key;
  mk.disabled = entries().length < 2;
  $('rv-setup').hidden = Boolean(reviewerToken);
  $('player-row').hidden = !reviewerToken && !players.list.length;
  $('player-add').hidden = !reviewerToken;
  $('rv-player-actions').hidden = !cur?.cloud;
  $('rv-revoke').textContent = cur?.cloud?.revoked ? '恢復這位玩家' : '停用這位玩家';
  // 舊 GitHub 表單
  const gh = cur && !cur.cloud ? cur.config : null;
  const editing = adding || !gh;
  $('player-name').value = editing ? '' : gh.name;
  $('cloud-repo').value = editing ? '' : gh.repo;
  $('cloud-token').value = '';
  $('cloud-token').placeholder = editing ? 'github_pat_…' : '已儲存（要更換再貼上新的）';
  $('cloud-save').textContent = editing ? '新增並連線' : '更新這位玩家';
  $('player-cancel').hidden = !(adding && gh);
  $('player-remove').hidden = !gh;
  $('cloud-status').textContent = message || (cur ? `目前：${cur.name}` : reviewerToken ? '還沒有玩家，按「＋ 新增玩家」產生第一組邀請碼。' : '');
  document.querySelectorAll('[data-player-name]').forEach(el => { el.textContent = cur ? cur.name : '玩家'; });
}
function switched() { void refreshCodes(); void refreshLetters(); void refreshMissions(); if ($('postcard-history').open) void refreshPostcards(); maybeRefreshInbox(); $('date-qr').hidden = true; $('rv-invite').hidden = true; }
async function loadCloudPlayers(message) {
  if (!reviewerToken) { cloudPlayers = []; renderCloud(message); return; }
  try { cloudPlayers = await admin().players(); renderCloud(message); maybeRefreshInbox(); void loadNewbies(); }
  catch (err) { cloudPlayers = []; renderCloud(err.status === 401 ? '審核員通行碼不對，請重新登入。' : `讀不到玩家名單：${err.message}`); if (err.status === 401) { reviewerToken = ''; localStorage.removeItem(REVIEWER_KEY); renderCloud('審核員通行碼不對，請重新登入。'); } }
}
/* ---------- 新玩家（湘 11/26）：每天有幾支新手機第一次打開遊戲 ---------- */
const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400e3).toISOString().slice(0, 10);
function newbieView(stats, span = 14) {
  const map = new Map((stats.days || []).map((d) => [d.day, d]));
  const today = stats.today;
  const days = Array.from({ length: span }, (_, i) => { const day = addDays(today, i - span + 1); const d = map.get(day); return { day, gh: d?.gh || 0, cf: d?.cf || 0, total: d?.total || 0 }; });
  const week = days.slice(-7).reduce((n, d) => n + d.total, 0);
  return { days, today: map.get(today)?.total || 0, week, total: stats.total || 0, since: stats.since };
}
function renderNewbies(stats) {
  const v = newbieView(stats);
  $('np-today').textContent = v.today; $('np-week').textContent = v.week; $('np-total').textContent = v.total;
  const max = Math.max(1, ...v.days.map((d) => d.total));
  $('np-chart').replaceChildren(...v.days.map((d, i) => {
    const col = document.createElement('div'); col.className = `np-col${i === v.days.length - 1 ? ' is-today' : ''}`;
    const n = document.createElement('i'); n.textContent = d.total; if (!d.total) n.classList.add('is-zero');
    const bar = document.createElement('div'); bar.className = 'np-bar'; bar.style.height = `${d.total ? Math.max(4, (d.total / max) * 100) : 0}%`;
    for (const k of ['gh', 'cf']) if (d[k]) { const s = document.createElement('span'); s.className = k; s.style.flex = String(d[k]); bar.append(s); }
    col.append(n, bar); col.title = `${d.day}：${d.total} 位`; return col;
  }));
  $('np-days').replaceChildren(...v.days.map((d) => {
    const s = document.createElement('span'); s.textContent = String(Number(d.day.slice(8))); return s;
  }));
  const md = (day) => `${Number(day.slice(5, 7))}/${Number(day.slice(8))}`;
  $('np-range').textContent = `近 14 天（${md(v.days[0].day)}–${md(v.days.at(-1).day)}）`;
  $('np-chart').setAttribute('aria-label', `近 14 天每日新玩家：${v.days.map((d) => `${d.day.slice(5)} ${d.total} 位`).join('、')}`);
  $('np-since').textContent = `${v.since ? `從 ${v.since.slice(5).replace('-', '/')} 開始記錄。` : '還沒有新玩家的紀錄。'}只算「第一次在一支新手機打開遊戲」的人（台灣時間），不記任何個人資料。已經在玩的人不會補算，測試服不算。`;
}
async function loadNewbies() {
  if (!reviewerToken) { $('np-body').hidden = true; $('np-status').textContent = '用審核員通行碼登入後就看得到。'; return; }
  $('np-status').textContent = '讀取中…';
  try { renderNewbies(await admin().newPlayers()); $('np-body').hidden = false; $('np-status').textContent = ''; }
  catch (err) { $('np-status').textContent = `讀不到新玩家數：${err.message}`; }
}
$('np-refresh').addEventListener('click', () => { void loadNewbies(); });

function useReviewer(token) { reviewerToken = token; try { localStorage.setItem(REVIEWER_KEY, token); } catch {} }

$('rv-claim').addEventListener('click', async () => {
  $('rv-claim').disabled = true; $('cloud-status').textContent = '設定中…';
  try {
    const token = await claimReviewer();
    useReviewer(token);
    $('rv-backup-text').value = token; $('rv-backup').hidden = false;
    await loadCloudPlayers('設定完成！請先把通行碼存起來。');
  } catch (err) { $('cloud-status').textContent = `設定失敗：${err.message}`; }
  finally { $('rv-claim').disabled = false; }
});
$('rv-login').addEventListener('click', async () => {
  const token = $('rv-token').value.trim();
  if (!token) { $('cloud-status').textContent = '請貼上審核員通行碼。'; return; }
  $('cloud-status').textContent = '登入中…';
  try { const me = await createCloud({ kind: 'siang', token }).test(); if (me.role !== 'admin') throw new Error('這是玩家的邀請碼，不是審核員通行碼'); useReviewer(token); $('rv-token').value = ''; await loadCloudPlayers('登入成功！'); switched(); }
  catch (err) { $('cloud-status').textContent = `登入失敗：${err.message}`; }
});
$('rv-backup-copy').addEventListener('click', () => copyTo($('rv-backup-text').value, '通行碼已複製，記得存進密碼管理器。'));
$('rv-backup-done').addEventListener('click', () => { $('rv-backup').hidden = true; $('rv-backup-text').value = ''; renderCloud(); });
const copyTo = async (text, done) => { try { await navigator.clipboard.writeText(text); $('cloud-status').textContent = done; } catch { $('cloud-status').textContent = '無法自動複製，請長按文字框手動複製。'; } };
function showInvite(name, invite) {
  $('rv-invite-hint').textContent = `「${name}」的邀請碼（只會顯示這一次）：傳給他，請他在遊戲的「雲端與備份」貼上。`;
  $('rv-invite-text').value = invite; $('rv-invite').hidden = false;
}
$('rv-invite-copy').addEventListener('click', () => copyTo($('rv-invite-text').value, '邀請碼已複製，傳給玩家就好。'));
$('make-player').addEventListener('change', () => { $('player-select').value = $('make-player').value; $('player-select').dispatchEvent(new Event('change')); });
$('player-select').addEventListener('change', () => { $('rv-rename').hidden = true; players.active = $('player-select').value; adding = false; savePlayers(); renderCloud(); switched(); });
$('player-add').addEventListener('click', () => { $('rv-new').hidden = false; $('rv-new-name').focus(); });
$('rv-new-cancel').addEventListener('click', () => { $('rv-new').hidden = true; });
$('rv-new').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $('rv-new-name').value.trim() || `玩家 ${cloudPlayers.length + 1}`;
  $('cloud-status').textContent = '產生中…';
  try {
    const p = await admin().addPlayer(name);
    $('rv-new').hidden = true; $('rv-new-name').value = '';
    players.active = `cf:${p.id}`; savePlayers();
    await loadCloudPlayers(`已新增「${p.name}」！`); switched();
    showInvite(p.name, p.invite);
  } catch (err) { $('cloud-status').textContent = `新增失敗：${err.message}`; }
});
$('rv-rename-open').addEventListener('click', () => { const cur = current(); if (!cur?.cloud) return; $('rv-rename-name').value = cur.name; $('rv-rename').hidden = false; $('rv-rename-name').focus(); });
$('rv-rename-cancel').addEventListener('click', () => { $('rv-rename').hidden = true; });
$('rv-rename').addEventListener('submit', async (e) => {
  e.preventDefault();
  const cur = current(); if (!cur?.cloud) return;
  const name = $('rv-rename-name').value.trim();
  if (!name) { $('cloud-status').textContent = '名字不能空白喔。'; return; }
  try { await admin().playerAction(cur.cloud.id, 'rename', { name }); $('rv-rename').hidden = true; await loadCloudPlayers(`已改成「${name}」。`); }
  catch (err) { $('cloud-status').textContent = `改名失敗：${err.message}`; }
});
$('rv-reset').addEventListener('click', async () => {
  const cur = current(); if (!cur?.cloud) return;
  if (!$('rv-reset').dataset.confirm) { $('rv-reset').dataset.confirm = '1'; $('cloud-status').textContent = `重新產生後，「${cur.name}」舊的邀請碼會立刻失效（進度不會不見）。再按一次確認。`; return; }
  delete $('rv-reset').dataset.confirm;
  try { const r = await admin().playerAction(cur.cloud.id, 'reset'); await loadCloudPlayers('已重新產生。'); showInvite(cur.name, r.invite); }
  catch (err) { $('cloud-status').textContent = `失敗：${err.message}`; }
});
$('rv-revoke').addEventListener('click', async () => {
  const cur = current(); if (!cur?.cloud) return;
  const restore = cur.cloud.revoked;
  if (!restore && !$('rv-revoke').dataset.confirm) { $('rv-revoke').dataset.confirm = '1'; $('cloud-status').textContent = `停用後「${cur.name}」就連不上雲端（資料會保留，之後可以恢復）。再按一次確認。`; return; }
  delete $('rv-revoke').dataset.confirm;
  try { await admin().playerAction(cur.cloud.id, restore ? 'restore' : 'revoke'); await loadCloudPlayers(restore ? '已恢復。' : '已停用。'); }
  catch (err) { $('cloud-status').textContent = `失敗：${err.message}`; }
});

// 舊方式：GitHub 私人資料庫
$('gh-add').addEventListener('click', () => { adding = true; renderCloud('輸入新玩家的名字、他的私人資料庫，以及妳那把審核員 token。'); });
$('player-cancel').addEventListener('click', () => { adding = false; renderCloud(); });
$('player-remove').addEventListener('click', () => {
  const cur = current(); if (!cur || cur.cloud) return;
  if (!$('player-remove').dataset.confirm) { $('player-remove').dataset.confirm = '1'; $('cloud-status').textContent = `確定要從審核室移除「${cur.name}」嗎？（資料庫裡的東西不會被刪）再按一次確認。`; return; }
  delete $('player-remove').dataset.confirm;
  players.list.splice(Number(cur.key.slice(3)), 1); players.active = null; savePlayers(); renderCloud('已移除。'); switched();
});
$('cloud-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const cur = current(); const gh = cur && !cur.cloud ? cur : null;
  const editing = adding || !gh;
  const name = $('player-name').value.trim() || (editing ? `玩家 ${players.list.length + 1}` : gh.name);
  const repo = $('cloud-repo').value.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
  const token = $('cloud-token').value.trim() || (editing ? '' : gh.config.token);
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !token) { $('cloud-status').textContent = '請填資料庫名稱（owner/repo）和通行碼。'; return; }
  if (editing && players.list.some(p => p.repo === repo)) { $('cloud-status').textContent = '這個資料庫已經在名單裡了。每位玩家要用自己的資料庫。'; return; }
  $('cloud-status').textContent = '連線中…';
  try {
    const info = await createCloud({ repo, token }).test();
    if (editing) { players.list.push({ name, repo, token }); players.active = `gh:${players.list.length - 1}`; }
    else players.list[Number(gh.key.slice(3))] = { name, repo, token };
    adding = false; savePlayers();
    renderCloud(info.private ? `連線成功！目前：${name}` : '連線成功，但這個資料庫是公開的，建議改成私人。');
    switched();
  } catch (err) { $('cloud-status').textContent = `連不上：${err.message}`; }
});

/* ---------- 印章操作 ---------- */
$('key-generate').addEventListener('click', async () => {
  if (privateJwk && !$('key-generate').dataset.confirm) { $('key-generate').dataset.confirm = '1'; $('key-status').textContent = '確定嗎？舊章蓋過、還沒兌換的暗號會失效。再按一次確認。'; return; }
  delete $('key-generate').dataset.confirm;
  const pair = await generateKeys();
  const jwk = await exportJwk(pair.privateKey);
  await storeJwk(jwk); await setKey(jwk);
  renderKey('新印章已產生。記得先複製「印章備份」自己保存，再把公鑰交給德寶。');
});
$('key-show-import').addEventListener('click', () => { $('key-import').hidden = !$('key-import').hidden; });
$('key-import-ok').addEventListener('click', async () => {
  try {
    const jwk = JSON.parse($('key-import-text').value.trim());
    if (jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.d) throw new Error();
    await importPrivate(jwk);
    await storeJwk(jwk); await setKey(jwk);
    $('key-import').hidden = true; $('key-import-text').value = '';
    renderKey('印章已還原。');
  } catch { $('key-status').textContent = '這段不是有效的印章備份。'; }
});
const copy = async (text, done) => { try { await navigator.clipboard.writeText(text); $('key-status').textContent = done; } catch { $('key-status').textContent = '無法自動複製，請長按文字框手動複製。'; } };
$('key-copy-public').addEventListener('click', () => copy($('key-public').value, '公鑰已複製，貼給德寶就好。'));
$('key-copy-backup').addEventListener('click', () => copy(JSON.stringify(privateJwk), '印章備份已複製。請存在只有妳看得到的地方。'));

/* ---------- 暗號 ---------- */
const notes = () => { try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}'); } catch { return {}; } };
const saveNote = (hash, v) => { const n = notes(); n[hash] = v; localStorage.setItem(NOTES_KEY, JSON.stringify(n)); };
const WORDS = ['恐龍', '草莓', '星星', '月亮', '雨傘', '蛋糕', '膠卷', '琥珀', '小火車', '天燈', '布丁', '貓咪', '花園', '晴天'];
const VERBS = ['偷吃', '收藏', '親了', '抱著', '藏起', '想念', '追著', '點亮'];
$('code-random').addEventListener('click', () => {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  $('code-phrase').value = `${pick(WORDS)}${pick(VERBS)}${pick(WORDS)}`;
});
$('code-character').append(...Object.values(CHARACTERS).map((c) => Object.assign(document.createElement('option'), { value: c.no, textContent: `${noLabel(c.no)} ${c.name}` })));
$('code-reward').addEventListener('change', () => { $('code-character-row').hidden = $('code-reward').value !== 'character'; });

function rewardFromForm() {
  const v = $('code-reward').value;
  if (v === 'character') return { type: 'character', no: $('code-character').value };
  const [type, val] = v.split(':');
  return type === 'energy' ? { type, amount: Number(val) } : { type, egg: val };
}

$('code-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const phrase = normalizeCode($('code-phrase').value);
  if (phrase.length < 2) { $('code-status').textContent = '暗號至少要兩個字。'; return; }
  if (!privateKey) { $('code-status').textContent = '請先到「設定」準備好印章。'; return; }
  $('code-create').disabled = true; $('code-status').textContent = '蓋章中…';
  try {
    const everyone = Boolean(reviewerToken) && $('code-everyone').checked;
    const c = everyone ? admin() : cloud();
    const dir = everyone ? 'shared/codes' : 'codes';
    const hash = await sha256Hex(phrase);
    if (await c.exists(`${dir}/${hash}.json`)) { $('code-status').textContent = '這句暗號已經設定過了，換一句吧。'; return; }
    const expires = $('code-expires').value ? new Date(`${$('code-expires').value}T23:59:59+08:00`).toISOString() : null;
    const payload = { v: 1, type: 'code', hash, reward: rewardFromForm(), once: !$('code-reusable').checked, expires, createdAt: new Date().toISOString() };
    await c.putJSON(`${dir}/${hash}.json`, await signPayload(privateKey, payload), 'add code');
    saveNote(hash, { phrase: $('code-phrase').value.trim(), note: $('code-note').value.trim() });
    $('code-status').textContent = `完成！暗號「${$('code-phrase').value.trim()}」可以兌換${describeReward(payload.reward, CHARACTERS, EGGS)}。`;
    $('code-phrase').value = ''; $('code-note').value = '';
    void refreshCodes();
  } catch (err) { $('code-status').textContent = `送出失敗：${err.message}`; }
  finally { $('code-create').disabled = !privateKey; }
});

async function refreshCodes() {
  $('code-everyone-row').hidden = !reviewerToken;
  $('letter-everyone-row').hidden = $('mission-everyone-row').hidden = !reviewerToken;
  if (!config()) return;
  try {
    const c = cloud();
    const [codes, redeemed] = await Promise.all([c.list('codes'), c.list('redeemed')]);
    const used = new Set(redeemed.map((f) => f.name));
    const n = notes();
    const own = await Promise.all(codes.filter((f) => f.name.endsWith('.json')).map(async (f) => ({ hash: f.name.slice(0, -5), file: await c.getJSON(f.path), store: c, dir: 'codes' })));
    let shared = [];
    if (reviewerToken) { const a = admin(); shared = await Promise.all((await a.list('shared/codes')).filter((f) => f.name.endsWith('.json')).map(async (f) => ({ hash: f.name.slice(0, -5), file: await a.getJSON(f.path), store: a, dir: 'shared/codes', everyone: true }))); }
    const items = [...own, ...shared];
    items.sort((a, b) => String(b.file?.data?.payload?.createdAt).localeCompare(String(a.file?.data?.payload?.createdAt)));
    $('code-list').replaceChildren(...items.map(({ hash, file, store, dir, everyone }) => {
      const p = file?.data?.payload || {};
      const li = document.createElement('li');
      const name = document.createElement('b'); name.textContent = n[hash]?.phrase || '（在別支手機設定的暗號）';
      const info = document.createElement('small');
      const status = used.has(`${hash}.json`) ? '已兌換' : p.expires && Date.now() > Date.parse(p.expires) ? '已過期' : '等待兌換';
      info.textContent = `${everyone ? '全體玩家 · ' : ''}${describeReward(p.reward || {}, CHARACTERS, EGGS)} · ${p.once === false ? '可重複' : '一次'} · ${everyone ? (p.expires && Date.now() > Date.parse(p.expires) ? '已過期' : '開放中') : status}${n[hash]?.note ? ` · ${n[hash].note}` : ''}`;
      const row = document.createElement('div'); row.className = 'row';
      const del = Object.assign(document.createElement('button'), { className: 'btn btn--quiet', type: 'button', textContent: '刪除' });
      del.addEventListener('click', async () => { del.disabled = true; await store.remove(`${dir}/${hash}.json`, 'remove code'); void refreshCodes(); });
      row.append(del); li.append(name, info, row); return li;
    }));
    if (!items.length) $('code-list').replaceChildren(Object.assign(document.createElement('li'), { textContent: '還沒有暗號。' }));
  } catch (err) { $('code-status').textContent = `讀取暗號失敗：${err.message}`; }
}
$('code-refresh').addEventListener('click', refreshCodes);

/* ---------- 寄紙條（湘 11/21：可以附禮物） ---------- */
$('letter-character').append(...Object.values(CHARACTERS).map((c) => Object.assign(document.createElement('option'), { value: c.no, textContent: `${noLabel(c.no)} ${c.name}` })));
$('letter-reward').addEventListener('change', () => { $('letter-character-row').hidden = $('letter-reward').value !== 'character'; });
function letterReward() {
  const v = $('letter-reward').value;
  if (!v) return null;
  if (v === 'character') return { type: 'character', no: $('letter-character').value };
  const [type, x] = v.split(':');
  return type === 'energy' ? { type, amount: Number(x) } : { type, egg: x };
}
$('letter-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = $('letter-body').value.trim();
  if (!body) { $('letter-status').textContent = '先寫點什麼吧。'; return; }
  if (!privateKey) { $('letter-status').textContent = '請先到「設定」準備好印章。'; return; }
  $('letter-send').disabled = true; $('letter-status').textContent = '蓋章中…';
  try {
    const id = `${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 6)}`;
    const reward = letterReward();
    const payload = { v: 1, type: 'letter', id, title: $('letter-title').value.trim(), body, ...(reward ? { reward } : {}), createdAt: new Date().toISOString() };
    const signed = await signPayload(privateKey, payload);
    if (reviewerToken && $('letter-everyone').checked) $('letter-status').textContent = everyoneText(await putForEveryone(`letters/${id}.json`, signed, 'send letter'), '寄');
    else { await cloud().putJSON(`letters/${id}.json`, signed, 'send letter'); $('letter-status').textContent = `寄出了！${reward ? `附上${describeReward(reward, CHARACTERS, EGGS)}，` : ''}他下次打開遊戲就會收到。`; }
    $('letter-title').value = ''; $('letter-body').value = ''; $('letter-reward').value = ''; $('letter-character-row').hidden = true;
    void refreshLetters();
  } catch (err) { $('letter-status').textContent = `寄送失敗：${err.message}`; }
  finally { $('letter-send').disabled = !privateKey; }
});
async function refreshLetters() {
  if (!config()) return;
  try {
    const c = cloud();
    const files = (await c.list('letters')).filter((f) => f.name.endsWith('.json')).sort((a, b) => b.name.localeCompare(a.name));
    const items = await Promise.all(files.map(async (f) => ({ f, data: (await c.getJSON(f.path))?.data?.payload })));
    $('letter-list').replaceChildren(...items.map(({ f, data }) => {
      const li = document.createElement('li');
      const b = document.createElement('b'); b.textContent = data?.title || '（無標題）';
      const small = document.createElement('small'); small.textContent = [data?.createdAt ? new Date(data.createdAt).toLocaleString('zh-TW') : '', data?.reward ? `附上${describeReward(data.reward, CHARACTERS, EGGS)}` : ''].filter(Boolean).join(' · ');
      const pre = document.createElement('pre'); pre.textContent = data?.body || '';
      const row = document.createElement('div'); row.className = 'row';
      const del = Object.assign(document.createElement('button'), { className: 'btn btn--quiet', type: 'button', textContent: '收回（他已收到的不會消失）' });
      del.addEventListener('click', async () => { del.disabled = true; await c.remove(f.path, 'remove letter'); void refreshLetters(); });
      row.append(del); li.append(b, small, pre, row); return li;
    }));
    if (!items.length) $('letter-list').replaceChildren(Object.assign(document.createElement('li'), { textContent: '還沒有寄過紙條。' }));
  } catch (err) { $('letter-status').textContent = `讀取紙條失敗：${err.message}`; }
}


/* ---------- 全服信箱、全服兌換碼（湘 11/27）：不用邀請碼，所有玩家都收得到 ---------- */
// 禮物欄位：數字留空＝不給。兩張表單共用同一種欄位
const GIFT_EGG_OPTIONS = [['', '不送蛋'], ['wish', '願望蛋'], ['weather', '天氣蛋'], ['cipher', '暗號蛋（隨機小湘）'], ['star', '星光蛋'], ['mohen', '墨痕蛋']];
function buildGiftFields(box, prefix) {
  const num = (id, label, max, ph = '') => `<label>${label}<input id="${prefix}-${id}" type="number" min="1" max="${max}" inputmode="numeric" placeholder="${ph}"></label>`;
  box.insertAdjacentHTML('beforeend', [
    num('energy', '能量', 9999), num('moyu', '墨玉', 9999), num('fossils', '化石碎片', 9999),
    `<label>星光糖<span class="gift-duo"><select id="${prefix}-candy-r" aria-label="星光糖稀有度">${['N', 'R', 'SR', 'SSR', 'UR'].map((r) => `<option>${r}</option>`).join('')}</select><input id="${prefix}-candy" type="number" min="1" max="50" inputmode="numeric" placeholder="顆" aria-label="星光糖顆數"></span></label>`,
    `<label class="gift-wide">蛋<span class="gift-duo"><select id="${prefix}-egg">${GIFT_EGG_OPTIONS.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select><input id="${prefix}-egg-n" type="number" min="1" max="20" inputmode="numeric" placeholder="1 顆" aria-label="幾顆蛋"></span></label>`,
    `<label class="gift-wide">指定居民的暗號蛋<select id="${prefix}-char"><option value="">不送</option></select></label>`,
  ].join(''));
  $(`${prefix}-char`).append(...Object.values(CHARACTERS).map((c) => Object.assign(document.createElement('option'), { value: c.no, textContent: `${noLabel(c.no)} ${c.name}` })));
}
function giftsFrom(prefix) {
  const n = (id) => { const v = Math.floor(Number($(`${prefix}-${id}`).value)); return Number.isFinite(v) && v > 0 ? v : 0; };
  const out = [];
  if (n('energy')) out.push({ type: 'energy', amount: Math.min(9999, n('energy')) });
  if (n('moyu')) out.push({ type: 'token', event: 'mo', amount: Math.min(9999, n('moyu')) });
  if (n('fossils')) out.push({ type: 'fossils', amount: Math.min(9999, n('fossils')) });
  if (n('candy')) out.push({ type: 'candy', rarity: $(`${prefix}-candy-r`).value, amount: Math.min(50, n('candy')) });
  if ($(`${prefix}-egg`).value) out.push({ type: 'egg', egg: $(`${prefix}-egg`).value, ...(n('egg-n') > 1 ? { count: Math.min(20, n('egg-n')) } : {}) });
  if ($(`${prefix}-char`).value) out.push({ type: 'character', no: $(`${prefix}-char`).value });
  return out;
}
const giftsText = (list) => (list?.length ? list.map((r) => describeReward(r, CHARACTERS, EGGS)).join('、') : '');
function clearGifts(prefix) { for (const el of $(`${prefix}-gifts`).querySelectorAll('input, select')) el.value = el.tagName === 'SELECT' && el.id.endsWith('-candy-r') ? 'N' : ''; }
const dayEnd = (v) => (v ? new Date(`${v}T23:59:59+08:00`).toISOString() : null);
const fmtDay = (iso) => new Date(iso).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });
const expired = (p) => Boolean(p?.expires && Date.now() > Date.parse(p.expires));
buildGiftFields($('bc-gifts'), 'bc'); buildGiftFields($('gc-gifts'), 'gc');
const bcPreview = () => { const g = giftsText(giftsFrom('bc')); $('bc-preview').textContent = g ? `🎁 每個人會收到：${g}` : ''; };
const gcPreview = () => { const g = giftsText(giftsFrom('gc')); $('gc-preview').textContent = g ? `🎁 兌換到：${g}` : ''; };
$('bc-gifts').addEventListener('input', bcPreview); $('bc-gifts').addEventListener('change', bcPreview);
$('gc-gifts').addEventListener('input', gcPreview); $('gc-gifts').addEventListener('change', gcPreview);
function renderAllLock() {
  const ok = Boolean(reviewerToken && privateKey);
  $('all-locked').dataset.ok = ok ? '1' : '';
  $('bc-send').disabled = $('gc-create').disabled = !ok;
}
const claimsOf = async () => { try { return await admin().claims(); } catch { return {}; } };

let bcArmed = 0;
$('bc-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = $('bc-title').value.trim(); const body = $('bc-body').value.trim();
  if (!body) { $('bc-status').textContent = '先寫點什麼吧。'; return; }
  if (!reviewerToken || !privateKey) { $('bc-status').textContent = '要先到「設定」登入審核員通行碼、準備好印章。'; return; }
  const gifts = giftsFrom('bc');
  // 寄出去所有人都會收到，按兩次才寄（湘 11/27）
  if (Date.now() - bcArmed > 6000) { bcArmed = Date.now(); $('bc-send').textContent = '再按一次確認寄給所有人'; $('bc-status').textContent = `確認一下：「${title || '給大家'}」${gifts.length ? `，附上${giftsText(gifts)}` : '，沒有附禮物'}。`; return; }
  bcArmed = 0; $('bc-send').textContent = '蓋章並寄給所有人';
  $('bc-send').disabled = true; $('bc-status').textContent = '蓋章中…';
  try {
    const id = `${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 6)}`;
    const payload = { v: 1, type: 'broadcast', id, title, body, rewards: gifts, expires: dayEnd($('bc-expires').value), createdAt: new Date().toISOString() };
    await admin().putJSON(`shared/broadcast/${id}.json`, await signPayload(privateKey, payload), 'broadcast');
    $('bc-status').textContent = `寄出了！所有玩家下次打開遊戲就會收到${gifts.length ? `，拆開領${giftsText(gifts)}` : ''}。`;
    $('bc-title').value = ''; $('bc-body').value = ''; $('bc-expires').value = ''; clearGifts('bc'); bcPreview();
    void refreshBroadcast();
  } catch (err) { $('bc-status').textContent = `寄送失敗：${err.message}`; }
  finally { renderAllLock(); }
});
async function refreshBroadcast() {
  if (!reviewerToken) return;
  try {
    const a = admin();
    const [files, claims] = await Promise.all([a.list('shared/broadcast'), claimsOf()]);
    const items = await Promise.all(files.filter((f) => f.name.endsWith('.json')).sort((x, y) => y.name.localeCompare(x.name)).map(async (f) => ({ f, p: (await a.getJSON(f.path))?.data?.payload })));
    $('bc-list').replaceChildren(...items.map(({ f, p }) => {
      const li = document.createElement('li');
      const b = document.createElement('b'); b.textContent = p?.title || '（無標題）';
      const small = document.createElement('small');
      const n = claims[`bc:${p?.id}`] || 0;
      small.textContent = [p?.createdAt ? new Date(p.createdAt).toLocaleString('zh-TW') : '', p?.rewards?.length ? `附上${giftsText(p.rewards)}` : '沒附禮物', p?.expires ? (expired(p) ? '已過收信期限' : `收信到 ${fmtDay(p.expires)}`) : '不限期'].filter(Boolean).join(' · ');
      const got = Object.assign(document.createElement('small'), { className: 'claimed', textContent: p?.rewards?.length ? `🎁 已經有 ${n} 人領了禮物` : '' });
      const pre = document.createElement('pre'); pre.textContent = p?.body || '';
      const row = document.createElement('div'); row.className = 'row';
      const del = Object.assign(document.createElement('button'), { className: 'btn btn--quiet', type: 'button', textContent: '收回（已收到的人不會消失）' });
      let armed = false;
      del.addEventListener('click', async () => { if (!armed) { armed = true; del.textContent = '再按一次收回'; return; } del.disabled = true; await a.remove(f.path, 'remove broadcast'); void refreshBroadcast(); });
      row.append(del); li.append(b, small, got, pre, row); return li;
    }));
    if (!items.length) $('bc-list').replaceChildren(Object.assign(document.createElement('li'), { textContent: '還沒有寄過全服信。' }));
  } catch (err) { $('bc-status').textContent = `讀取全服信失敗：${err.message}`; }
}
$('bc-refresh').addEventListener('click', refreshBroadcast);

const GC_WORDS = ['書頁', '江湖', '墨玉', '星光', '海棠', '小湘', '布丁', '月見', '琥珀', '天燈'];
$('gc-random').addEventListener('click', () => {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  $('gc-phrase').value = `${pick(GC_WORDS)}${String(Math.floor(Math.random() * 9000) + 1000)}`;
});
$('gc-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const label = $('gc-phrase').value.trim();
  const phrase = normalizeCode(label);
  if (phrase.length < 2) { $('gc-status').textContent = '兌換碼至少要兩個字。'; return; }
  if (!reviewerToken || !privateKey) { $('gc-status').textContent = '要先到「設定」登入審核員通行碼、準備好印章。'; return; }
  const gifts = giftsFrom('gc');
  if (!gifts.length) { $('gc-status').textContent = '至少要選一樣禮物。'; return; }
  $('gc-create').disabled = true; $('gc-status').textContent = '蓋章中…';
  try {
    const a = admin();
    const hash = await sha256Hex(phrase);
    if (await a.exists(`shared/giftcodes/${hash}.json`)) { $('gc-status').textContent = '這組兌換碼已經有了，換一組吧。'; return; }
    const limit = Math.floor(Number($('gc-limit').value)) || null;
    const payload = { v: 1, type: 'giftcode', hash, label, rewards: gifts, expires: dayEnd($('gc-expires').value), limit: limit && limit > 0 ? limit : null, createdAt: new Date().toISOString() };
    await a.putJSON(`shared/giftcodes/${hash}.json`, await signPayload(privateKey, payload), 'add gift code');
    $('gc-status').textContent = `完成！兌換碼「${label}」可以換${giftsText(gifts)}${payload.limit ? `，限 ${payload.limit} 人` : ''}。`;
    $('gc-phrase').value = ''; $('gc-limit').value = ''; $('gc-expires').value = ''; clearGifts('gc'); gcPreview();
    void refreshGiftCodes();
  } catch (err) { $('gc-status').textContent = `建立失敗：${err.message}`; }
  finally { renderAllLock(); }
});
async function refreshGiftCodes() {
  if (!reviewerToken) return;
  try {
    const a = admin();
    const [files, claims] = await Promise.all([a.list('shared/giftcodes'), claimsOf()]);
    const items = await Promise.all(files.filter((f) => f.name.endsWith('.json')).map(async (f) => ({ f, hash: f.name.slice(0, -5), p: (await a.getJSON(f.path))?.data?.payload })));
    items.sort((x, y) => String(y.p?.createdAt).localeCompare(String(x.p?.createdAt)));
    $('gc-list').replaceChildren(...items.map(({ f, hash, p }) => {
      const li = document.createElement('li');
      const b = document.createElement('b'); b.textContent = p?.label || '（兌換碼）';
      const n = claims[`gc:${hash}`] || 0;
      const small = document.createElement('small');
      small.textContent = [giftsText(p?.rewards), p?.expires ? (expired(p) ? '已過期' : `到 ${fmtDay(p.expires)}`) : '不限期'].filter(Boolean).join(' · ');
      const got = Object.assign(document.createElement('small'), { className: 'claimed', textContent: p?.limit ? `已兌換 ${n} / ${p.limit}${n >= p.limit ? '（額滿）' : ''}` : `已兌換 ${n} 次` });
      const row = document.createElement('div'); row.className = 'row';
      const copyBtn = Object.assign(document.createElement('button'), { className: 'btn btn--quiet', type: 'button', textContent: '複製' });
      copyBtn.addEventListener('click', async () => { try { await navigator.clipboard.writeText(p?.label || ''); copyBtn.textContent = '已複製'; } catch { copyBtn.textContent = '複製失敗'; } });
      const del = Object.assign(document.createElement('button'), { className: 'btn btn--quiet', type: 'button', textContent: '停用' });
      let armed = false;
      del.addEventListener('click', async () => { if (!armed) { armed = true; del.textContent = '再按一次停用'; return; } del.disabled = true; await a.remove(f.path, 'remove gift code'); void refreshGiftCodes(); });
      row.append(copyBtn, del); li.append(b, small, got, row); return li;
    }));
    if (!items.length) $('gc-list').replaceChildren(Object.assign(document.createElement('li'), { textContent: '還沒有兌換碼。' }));
  } catch (err) { $('gc-status').textContent = `讀取兌換碼失敗：${err.message}`; }
}
$('gc-refresh').addEventListener('click', refreshGiftCodes);

/* ---------- 照片委託 ---------- */
$('mission-character').append(...Object.values(CHARACTERS).map((c) => Object.assign(document.createElement('option'), { value: c.no, textContent: `${noLabel(c.no)} ${c.name}` })));
// 隨機題目（湘 11/21）：題目和說明一起換，按一次換一個
const MISSION_IDEAS = [
  ['今天晚餐吃什麼', '拍下你今天的晚餐，要有飲料喔！'],
  ['今天的天空', '抬頭拍一張現在的天空，什麼天氣都可以。'],
  ['你的桌面', '拍下你現在的桌面，不用整理，我想看真實的樣子。'],
  ['路上遇到的貓狗', '今天遇到的貓咪或狗狗，偷偷拍一張就好。'],
  ['今天穿什麼', '拍一張今天的穿搭，鏡子自拍也可以。'],
  ['手上的飲料', '今天喝的第一杯飲料，杯子要入鏡。'],
  ['窗外的風景', '從你現在待的地方往窗外拍一張。'],
  ['最近在看的東西', '書、劇、漫畫或影片都可以，拍下封面或畫面。'],
  ['今天最開心的一刻', '拍下讓你今天笑出來的東西。'],
  ['你的鞋子', '低頭拍一下今天穿的鞋子，跟地板一起入鏡。'],
  ['找一個愛心', '在路上找一個愛心形狀的東西拍下來 ♡'],
  ['找一隻小恐龍', '玩具、圖案、招牌都算，找到就拍下來！'],
  ['粉紅色的東西', '找一個粉紅色的東西拍給我。'],
  ['今天的早餐', '早餐吃了什麼？沒吃也拍一下空空的桌子。'],
  ['睡前的樣子', '睡前拍一張你的枕頭或被窩。'],
  ['回家的路', '拍一張回家路上的街景。'],
  ['你的手', '拍一張你的手，比個 YA 也可以。'],
  ['今天的月亮', '晚上找找看月亮，拍不到就拍夜空。'],
  ['一朵花', '路邊的小花、盆栽或花店都可以。'],
  ['最想帶我去的地方', '拍一個你想帶我一起去的地方。'],
  ['你的手機桌布', '截圖或拍下你現在的手機桌布。'],
  ['今天的小確幸', '一件讓你覺得幸福的小事，拍下來給我看。'],
];
let lastIdea = -1;
$('mission-random').addEventListener('click', () => {
  let i; do { i = Math.floor(Math.random() * MISSION_IDEAS.length); } while (i === lastIdea && MISSION_IDEAS.length > 1);
  lastIdea = i; [$('mission-title').value, $('mission-body').value] = MISSION_IDEAS[i];
});
$('mission-reward').addEventListener('change', () => { $('mission-character-row').hidden = $('mission-reward').value !== 'character'; });
function missionReward() {
  const v = $('mission-reward').value;
  if (v === 'character') return { type: 'character', no: $('mission-character').value };
  const [type, val] = v.split(':');
  return type === 'energy' ? { type, amount: Number(val) } : { type, egg: val };
}
$('mission-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = $('mission-title').value.trim();
  if (!title) { $('mission-status').textContent = '先寫題目吧。'; return; }
  if (!privateKey) { $('mission-status').textContent = '請先到「設定」準備好印章。'; return; }
  $('mission-create').disabled = true; $('mission-status').textContent = '蓋章中…';
  try {
    const id = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7)}`;
    const expires = $('mission-expires').value ? new Date(`${$('mission-expires').value}T23:59:59+08:00`).toISOString() : null;
    const payload = { v: 1, type: 'mission', id, title, body: $('mission-body').value.trim(), reward: missionReward(), expires, createdAt: new Date().toISOString() };
    const signed = await signPayload(privateKey, payload);
    if (reviewerToken && $('mission-everyone').checked) $('mission-status').textContent = everyoneText(await putForEveryone(`missions/${id}.json`, signed, 'add mission'), `「${title}」出題`);
    else { await cloud().putJSON(`missions/${id}.json`, signed, 'add mission'); $('mission-status').textContent = `出題了！他下次打開遊戲就會看到「${title}」。`; }
    $('mission-title').value = ''; $('mission-body').value = '';
    void refreshMissions();
  } catch (err) { $('mission-status').textContent = `出題失敗：${err.message}`; }
  finally { $('mission-create').disabled = !privateKey; }
});
const photoUrls = [];
async function refreshMissions() {
  if (!config()) return;
  try {
    const c = cloud();
    const [missions, reviews] = await Promise.all([c.list('missions'), c.list('reviews')]);
    const reviewed = new Set(reviews.map((f) => f.name));
    const items = await Promise.all(missions.filter((f) => f.name.endsWith('.json')).map(async (f) => {
      const id = f.name.slice(0, -5);
      const [p, subs] = await Promise.all([c.getJSON(f.path).then((r) => r?.data?.payload), c.list(`submissions/${id}`)]);
      return { id, p, subs: subs.filter((x) => x.name.endsWith('.jpg')) };
    }));
    items.sort((a, b) => String(b.p?.createdAt).localeCompare(String(a.p?.createdAt)));
    const lis = items.map(({ id, p, subs }) => {
      const li = document.createElement('li');
      const b = document.createElement('b'); b.textContent = p?.title || id;
      const waiting = subs.filter((f) => !reviewed.has(`${id}__${f.name.slice(0, -4)}.json`)).length;
      const info = document.createElement('small'); info.textContent = `${describeReward(p?.reward || {}, CHARACTERS, EGGS)} · 提交 ${subs.length} 次${waiting ? ` · ${waiting} 張在「審核」等妳` : ''}`;
      const row = document.createElement('div'); row.className = 'row';
      const del = Object.assign(document.createElement('button'), { className: 'btn btn--quiet', type: 'button', textContent: '撤回題目' });
      del.addEventListener('click', async () => { del.disabled = true; await c.remove(`missions/${id}.json`, 'remove mission'); void refreshMissions(); maybeRefreshInbox(true); });
      row.append(del); li.append(b, info, row); return li;
    });
    $('mission-list').replaceChildren(...(lis.length ? lis : [Object.assign(document.createElement('li'), { textContent: '還沒有委託。' })]));
  } catch (err) { $('mission-status').textContent = `讀取委託失敗：${err.message}`; }
}
$('mission-refresh').addEventListener('click', refreshMissions);

/* ---------- 約會 QR Code ---------- */
const URL_KEY = 'siang-collector:review-game-url:v1';
$('date-url').value = localStorage.getItem(URL_KEY) || new URL('./', location.href).href;
$('date-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!privateKey) { $('date-status').textContent = '請先到「設定」準備好印章。'; return; }
  $('date-create').disabled = true; $('date-status').textContent = '蓋章中…';
  try {
    const gameUrl = $('date-url').value.trim(); localStorage.setItem(URL_KEY, gameUrl);
    const code = newDateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const character = ['014', '042', '083', '084', '107'].includes($('date-character').value) ? $('date-character').value : '';
    const payload = { v: 1, type: 'date', code, title: $('date-title').value.trim() || '今天的約會', note: $('date-note').value.trim(), ...(character ? { character } : {}), expires, createdAt: new Date().toISOString() };
    await cloud().putJSON(`dates/${code}.json`, await signPayload(privateKey, payload), 'date code');
    const q = qrcode(0, 'M'); q.addData(`${gameUrl.replace(/#.*$/, '')}#date=${code}`); q.make();
    $('date-qr-svg').innerHTML = q.createSvgTag({ cellSize: 6, margin: 2 });
    $('date-code').textContent = code;
    $('date-expire').textContent = `有效到 ${new Date(expires).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}，只能用一次`;
    $('date-qr').hidden = false; $('date-status').textContent = `${character ? `這顆蛋會孵出${$('date-character').selectedOptions[0].textContent.replace('指定：', '')}。` : '這顆蛋會隨機孵出一位約會小湘。'}請他用手機相機掃描，或在遊戲「輸入暗號」打上這 6 碼。`;
  } catch (err) { $('date-status').textContent = `產生失敗：${err.message}`; }
  finally { $('date-create').disabled = !privateKey; }
});

/* ---------- 已回覆過的照片（目前玩家，打開才載入） ---------- */
const postcardUrls = [];
async function refreshPostcards() {
  if (!config()) return;
  postcardUrls.splice(0).forEach((u) => URL.revokeObjectURL(u));
  try {
    const c = cloud();
    const replies = (await c.list('postcard-replies')).filter((f) => f.name.endsWith('.json')).sort((a, b) => b.name.localeCompare(a.name)).slice(0, 20);
    const lis = await Promise.all(replies.map(async (f) => {
      const id = f.name.slice(0, -5);
      const [meta, r, bytes] = await Promise.all([c.getJSON(`postcards/${id}.json`).then((x) => x?.data || {}), c.getJSON(f.path).then((x) => x?.data?.payload), c.getBytes(`postcards/${id}.jpg`)]);
      const li = document.createElement('li');
      const b = document.createElement('b'); b.textContent = meta.at ? new Date(meta.at).toLocaleString('zh-TW') : id;
      const img = document.createElement('img'); img.className = 'review-photo review-photo--small'; img.alt = '他寄來的照片';
      if (bytes) { const url = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' })); postcardUrls.push(url); img.src = url; }
      li.append(b, img);
      if (meta.text) { const pre = document.createElement('pre'); pre.textContent = meta.text; li.append(pre); }
      const sm = document.createElement('small'); sm.textContent = `妳回覆了：${r?.note || ''}`; li.append(sm);
      return li;
    }));
    $('postcard-list').replaceChildren(...(lis.length ? lis : [Object.assign(document.createElement('li'), { textContent: '還沒有回覆過的照片。' })]));
    $('postcard-status').textContent = '';
  } catch (err) { $('postcard-status').textContent = `讀取照片失敗：${err.message}`; }
}
$('postcard-history').addEventListener('toggle', () => { if ($('postcard-history').open) void refreshPostcards(); });

/* ---------- 營運（湘 11/28）：用到才載入，審核室打開不會變慢 ---------- */
let opsMod = null;
async function openOps() {
  if (!opsMod) { opsMod = await import('./ops-ui.js'); opsMod.initOps({ getStore: () => admin() }); }
  if (currentTab() !== 'ops') return;
  if (reviewerToken) void opsMod.refreshOps(); else opsMod.lockOps();
}

/* ---------- 分頁（湘 11/21：審核｜出題｜設定，打開先停在審核） ---------- */
function showTab(name) {
  if (name === 'all') { renderAllLock(); void refreshBroadcast(); void refreshGiftCodes(); }
  document.querySelectorAll('[data-tab]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
  document.querySelectorAll('[data-panel]').forEach((el) => { el.hidden = el.dataset.panel !== name || (el.id === 'all-locked' && el.dataset.ok === '1'); });
  if (name === 'ops') void openOps();
  $('batch-bar').hidden = name !== 'inbox' || !selected.size;
  document.body.classList.toggle('has-batch', !$('batch-bar').hidden);
}
document.querySelectorAll('[data-tab]').forEach((t) => t.addEventListener('click', () => { showTab(t.dataset.tab); window.scrollTo({ top: 0 }); }));
const currentTab = () => document.querySelector('[data-tab][aria-selected=true]')?.dataset.tab;

/* ---------- 待審核收件匣（所有玩家合在一起，按完只收掉那一張） ---------- */
let inboxItems = [];
let inboxFilter = 'all';
let inboxSig = null;
let inboxRun = 0;
const selected = new Set();
const inboxUrls = [];
const inboxSources = () => entries().filter((e) => !e.cloud?.revoked);
const timeOf = (kind, id, at) => { const t = at ? Date.parse(at) : kind === 'mission' ? parseInt(id.slice(0, -4), 36) : NaN; return Number.isFinite(t) ? t : 0; };
function maybeRefreshInbox(force = false) {
  const sig = inboxSources().map((e) => e.key).join('|');
  if (!force && sig === inboxSig) return;
  inboxSig = sig; void refreshInbox();
}
async function pendingFor(e) {
  const s = createCloud(e.config);
  const [missions, reviews, cards, replies] = await Promise.all([s.list('missions'), s.list('reviews'), s.list('postcards'), s.list('postcard-replies')]);
  const done = new Set(reviews.map((f) => f.name)); const replied = new Set(replies.map((f) => f.name));
  const out = [];
  await Promise.all(missions.filter((f) => f.name.endsWith('.json')).map(async (f) => {
    const id = f.name.slice(0, -5);
    const subs = (await s.list(`submissions/${id}`)).filter((x) => x.name.endsWith('.jpg') && !done.has(`${id}__${x.name.slice(0, -4)}.json`));
    if (!subs.length) return;
    const p = (await s.getJSON(f.path))?.data?.payload;
    for (const x of subs) { const sid = x.name.slice(0, -4); out.push({ kind: 'mission', key: `${e.key}/m/${id}/${sid}`, entry: e, store: s, id, sid, photo: `submissions/${id}/${sid}.jpg`, title: p?.title || id, reward: p?.reward, time: timeOf('mission', sid) }); }
  }));
  await Promise.all(cards.filter((f) => f.name.endsWith('.json') && !replied.has(f.name)).map(async (f) => {
    const id = f.name.slice(0, -5);
    const meta = (await s.getJSON(f.path))?.data || {};
    out.push({ kind: 'postcard', key: `${e.key}/p/${id}`, entry: e, store: s, id, photo: `postcards/${id}.jpg`, text: meta.text || '', time: timeOf('postcard', id, meta.at) });
  }));
  return out;
}
async function refreshInbox() {
  const run = ++inboxRun;
  const sources = inboxSources();
  if (!sources.length) { inboxItems = []; selected.clear(); renderInbox(); $('inbox-status').textContent = '還沒有玩家：到「設定」新增或登入。'; return; }
  $('inbox-status').textContent = '整理中…';
  const results = await Promise.allSettled(sources.map(pendingFor));
  if (run !== inboxRun) return;
  const failed = sources.filter((_, i) => results[i].status === 'rejected').map((e) => e.name);
  inboxItems = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])).sort((a, b) => a.time - b.time);
  for (const k of [...selected]) if (!inboxItems.some((i) => i.key === k)) selected.delete(k);
  inboxUrls.splice(0).forEach((u) => URL.revokeObjectURL(u));
  renderInbox();
  $('inbox-status').textContent = failed.length ? `${failed.join('、')} 讀取失敗，等一下再按重新整理。` : '';
  void loadInboxPhotos(run);
}
const fmtTime = (t) => (t ? new Date(t).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
function inboxCard(item) {
  const li = document.createElement('li'); li.className = 'inbox-item'; li.dataset.kind = item.kind; item.li = li;
  const head = document.createElement('div'); head.className = 'inbox-head';
  if (item.kind === 'mission') {
    const pick = document.createElement('label'); pick.className = 'pick';
    const box = Object.assign(document.createElement('input'), { type: 'checkbox', checked: selected.has(item.key) });
    box.setAttribute('aria-label', `選取 ${item.entry.name}「${item.title}」`);
    box.addEventListener('change', () => { if (box.checked) selected.add(item.key); else selected.delete(item.key); li.classList.toggle('is-picked', box.checked); renderBatch(); });
    pick.append(box); head.append(pick); li.classList.toggle('is-picked', box.checked);
  }
  const txt = document.createElement('div'); txt.className = 'inbox-title';
  const who = document.createElement('span'); who.className = 'who'; who.textContent = item.entry.name;
  const b = document.createElement('b'); b.textContent = item.kind === 'mission' ? `委託：${item.title}` : '寄來的照片';
  const sm = document.createElement('small'); sm.textContent = [fmtTime(item.time), item.kind === 'mission' ? describeReward(item.reward || {}, CHARACTERS, EGGS) : ''].filter(Boolean).join(' · ');
  txt.append(who, b, sm); head.append(txt);
  const img = document.createElement('img'); img.className = 'review-photo is-loading'; img.alt = item.kind === 'mission' ? `${item.title} 的照片` : '他寄來的照片'; item.img = img;
  li.append(head, img);
  if (item.text) { const pre = document.createElement('pre'); pre.textContent = item.text; li.append(pre); }
  const note = document.createElement('textarea'); note.rows = 1; note.maxLength = 600; item.note = note;
  note.placeholder = item.kind === 'mission' ? '批註（可不填，會收進他的記憶檔案）' : '回他一句話';
  const row = document.createElement('div'); row.className = 'row';
  if (item.kind === 'mission') {
    const ok = Object.assign(document.createElement('button'), { className: 'btn', type: 'button', textContent: '通過' });
    const no = Object.assign(document.createElement('button'), { className: 'btn btn--quiet', type: 'button', textContent: '退回' });
    const one = async (approved) => {
      ok.disabled = no.disabled = true;
      try { await decide(item, approved, note.value.trim()); $('inbox-status').textContent = approved ? `已通過 ${item.entry.name} 的照片！他下次打開遊戲就會收到獎勵。` : `已退回 ${item.entry.name} 的照片，他可以再拍一次。`; }
      catch (err) { $('inbox-status').textContent = err.message; ok.disabled = no.disabled = false; }
    };
    ok.addEventListener('click', () => one(true)); no.addEventListener('click', () => one(false));
    row.append(ok, no);
  } else {
    const send = Object.assign(document.createElement('button'), { className: 'btn', type: 'button', textContent: '蓋章回覆' });
    send.addEventListener('click', async () => {
      if (!note.value.trim()) { $('inbox-status').textContent = '先寫一句話吧。'; note.focus(); return; }
      send.disabled = true;
      try { await reply(item, note.value.trim()); $('inbox-status').textContent = `回覆了！${item.entry.name}下次打開遊戲就會看到。`; }
      catch (err) { $('inbox-status').textContent = err.message; send.disabled = false; }
    });
    row.append(send);
  }
  li.append(note, row);
  return li;
}
function renderInbox() {
  const n = { all: inboxItems.length, mission: inboxItems.filter((i) => i.kind === 'mission').length, postcard: inboxItems.filter((i) => i.kind === 'postcard').length };
  document.querySelectorAll('#inbox-filter [data-n]').forEach((el) => { el.textContent = n[el.dataset.n]; });
  document.querySelectorAll('#inbox-filter [data-filter]').forEach((el) => el.setAttribute('aria-pressed', String(el.dataset.filter === inboxFilter)));
  $('inbox-count').textContent = n.all; $('inbox-count').hidden = !n.all;
  const shown = inboxItems.filter((i) => inboxFilter === 'all' || i.kind === inboxFilter);
  $('inbox-list').replaceChildren(...(shown.length ? shown.map((i) => i.li || inboxCard(i)) : [Object.assign(document.createElement('li'), { className: 'inbox-empty', textContent: inboxItems.length ? '這一類都審完了。' : '都審完了，沒有等妳的照片 ♡' })]));
  renderBatch();
}
async function loadInboxPhotos(run) {
  const queue = inboxItems.filter((i) => !i.img.src);
  const worker = async () => {
    while (queue.length && run === inboxRun) {
      const item = queue.shift();
      try { const bytes = await item.store.getBytes(item.photo); if (bytes && run === inboxRun) { const url = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' })); inboxUrls.push(url); item.img.src = url; } } catch {}
      item.img.classList.remove('is-loading');
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
}
function removeItem(item) {
  inboxItems = inboxItems.filter((i) => i !== item); selected.delete(item.key);
  item.li?.remove();
  renderInbox();
}
async function decide(item, approved, note) {
  if (!privateKey) throw new Error('請先到「設定」準備好印章。');
  const payload = { v: 1, type: 'review', mission: item.id, submission: item.sid, approved, note, createdAt: new Date().toISOString() };
  try { await item.store.putJSON(`reviews/${item.id}__${item.sid}.json`, await signPayload(privateKey, payload), approved ? 'approve submission' : 'reject submission'); }
  catch (err) { throw new Error(`${item.entry.name}「${item.title}」沒有送出：${err.message}`); }
  removeItem(item);
  if (item.entry.key === current()?.key) void refreshMissions();
}
async function reply(item, note) {
  if (!privateKey) throw new Error('請先到「設定」準備好印章。');
  const payload = { v: 1, type: 'postcard-reply', id: item.id, note, createdAt: new Date().toISOString() };
  try { await item.store.putJSON(`postcard-replies/${item.id}.json`, await signPayload(privateKey, payload), 'reply postcard'); }
  catch (err) { throw new Error(`回覆失敗：${err.message}`); }
  removeItem(item);
  if ($('postcard-history').open && item.entry.key === current()?.key) void refreshPostcards();
}
document.querySelectorAll('#inbox-filter [data-filter]').forEach((el) => el.addEventListener('click', () => { inboxFilter = el.dataset.filter; renderInbox(); }));
$('inbox-refresh').addEventListener('click', () => maybeRefreshInbox(true));

/* 批次：勾選的委託照片一次通過／退回。沒寫個別批註的用共用批註。退回要按兩次確認。 */
const pickedItems = () => inboxItems.filter((i) => selected.has(i.key));
function renderBatch() {
  const n = pickedItems().length;
  $('batch-count').textContent = `已選 ${n} 張`;
  $('batch-bar').hidden = !n || currentTab() !== 'inbox';
  document.body.classList.toggle('has-batch', !$('batch-bar').hidden);
  delete $('batch-reject').dataset.confirm; $('batch-reject').textContent = '退回';
}
function setPicked(on) {
  for (const i of inboxItems) if (i.kind === 'mission' && (inboxFilter === 'all' || inboxFilter === 'mission')) {
    if (on) selected.add(i.key); else selected.delete(i.key);
    const box = i.li?.querySelector('.pick input'); if (box) box.checked = on; i.li?.classList.toggle('is-picked', on);
  }
  renderBatch();
}
$('batch-all').addEventListener('click', () => setPicked(true));
$('batch-clear').addEventListener('click', () => setPicked(false));
async function runBatch(approved) {
  const items = pickedItems(); if (!items.length) return;
  if (!privateKey) { $('inbox-status').textContent = '請先到「設定」準備好印章。'; return; }
  const shared = $('batch-note').value.trim();
  $('batch-approve').disabled = $('batch-reject').disabled = true;
  let ok = 0; const errors = [];
  for (const [i, item] of items.entries()) {
    $('inbox-status').textContent = `${approved ? '通過' : '退回'}中 ${i + 1}/${items.length}…`;
    try { await decide(item, approved, item.note?.value.trim() || shared); ok += 1; } catch (err) { errors.push(err.message); }
  }
  $('batch-approve').disabled = $('batch-reject').disabled = false;
  if (!errors.length) $('batch-note').value = '';
  $('inbox-status').textContent = `已${approved ? '通過' : '退回'} ${ok} 張${approved ? '！他們下次打開遊戲就會收到獎勵。' : '，他們可以再拍一次。'}${errors.length ? `\n${errors.join('\n')}` : ''}`;
}
$('batch-approve').addEventListener('click', () => runBatch(true));
$('batch-reject').addEventListener('click', () => {
  const btn = $('batch-reject');
  if (!btn.dataset.confirm) { btn.dataset.confirm = '1'; btn.textContent = `確定退回 ${pickedItems().length} 張？`; setTimeout(() => { if (btn.dataset.confirm) { delete btn.dataset.confirm; btn.textContent = '退回'; } }, 4000); return; }
  delete btn.dataset.confirm; btn.textContent = '退回';
  void runBatch(false);
});


/* ---------- 啟動 ---------- */
renderCloud();
await loadCloudPlayers();
if (!reviewerToken) reviewerClaimed().then(c => { if (c) { $('rv-claim').hidden = true; $('rv-setup-hint').textContent = '審核員通行碼已經設定過了：請貼上妳存起來的那組登入。'; } }).catch(() => {});
await setKey((await loadJwk()) || null);
renderKey();
showTab(privateKey && (reviewerToken || players.list.length) ? 'inbox' : 'setup');
void refreshCodes();
void refreshLetters();
void refreshMissions();
maybeRefreshInbox();
