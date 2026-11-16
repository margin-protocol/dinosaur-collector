// 首席研究員審核室：只在湘的手機使用。印章（私鑰）存在這支手機的 IndexedDB。
import { cloudConfig, saveCloudConfig, createCloud } from './cloud.js';
import { generateKeys, exportJwk, importPrivate, publicFromPrivate, signPayload, normalizeCode, sha256Hex } from './sign.js';
import { CHARACTERS, EGGS } from './eggs.js';
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
const samePublic = (a, b) => a && b && a.x === b.x && a.y === b.y;

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
// 多位玩家：每位玩家一個私人資料庫＋一把 token，審核室可以切換。印章（私鑰）全部共用同一把
const PLAYERS_KEY = 'siang-collector:review-players:v1';
function loadPlayers() {
  try {
    const p = JSON.parse(localStorage.getItem(PLAYERS_KEY) || 'null');
    if (p && Array.isArray(p.list)) return { list: p.list.filter(x => x && /^[\w.-]+\/[\w.-]+$/.test(x.repo) && x.token), active: p.active || 0 };
  } catch {}
  const old = cloudConfig(REVIEW_CLOUD_KEY); // 舊版只有一位玩家，搬進名單
  return { list: old ? [{ name: '玩家 1', ...old }] : [], active: 0 };
}
let players = loadPlayers();
const savePlayers = () => localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
const config = () => players.list[players.active] || null;
const cloud = () => { const c = config(); if (!c) throw new Error('請先在第 1 步連線資料庫'); return createCloud(c); };
let adding = false;
function renderCloud(message = '') {
  const c = config();
  const sel = $('player-select');
  sel.replaceChildren(...players.list.map((p, i) => Object.assign(document.createElement('option'), { value: String(i), textContent: `${p.name}（${p.repo}）` })));
  sel.value = String(players.active);
  $('player-row').hidden = !players.list.length;
  const editing = adding || !c;
  $('player-name').value = editing ? '' : c.name;
  $('cloud-repo').value = editing ? '' : c.repo;
  $('cloud-token').value = '';
  $('cloud-token').placeholder = editing ? 'github_pat_…' : '已儲存（要更換再貼上新的）';
  $('cloud-save').textContent = editing ? '新增並連線' : '更新這位玩家';
  $('player-cancel').hidden = !(adding && c);
  $('player-remove').hidden = editing || players.list.length < 1;
  $('cloud-status').textContent = message || (c && !adding ? `目前：${c.name}` : '');
  document.querySelectorAll('[data-player-name]').forEach(el => { el.textContent = c ? c.name : '玩家'; });
}
function switched() { void refreshCodes(); void refreshLetters(); void refreshMissions(); void refreshPostcards(); $('date-qr').hidden = true; }
$('player-select').addEventListener('change', () => { players.active = Number($('player-select').value); adding = false; savePlayers(); renderCloud(); switched(); });
$('player-add').addEventListener('click', () => { adding = true; renderCloud('輸入新玩家的名字、他的私人資料庫，以及妳那把審核員 token。'); });
$('player-cancel').addEventListener('click', () => { adding = false; renderCloud(); });
$('player-remove').addEventListener('click', () => {
  const c = config(); if (!c) return;
  if (!$('player-remove').dataset.confirm) { $('player-remove').dataset.confirm = '1'; $('cloud-status').textContent = `確定要從審核室移除「${c.name}」嗎？（資料庫裡的東西不會被刪）再按一次確認。`; return; }
  delete $('player-remove').dataset.confirm;
  players.list.splice(players.active, 1); players.active = 0; savePlayers(); renderCloud('已移除。'); switched();
});
$('cloud-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const editing = adding || !config();
  const name = $('player-name').value.trim() || (editing ? `玩家 ${players.list.length + 1}` : config().name);
  const repo = $('cloud-repo').value.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
  const token = $('cloud-token').value.trim() || (editing ? '' : config().token);
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !token) { $('cloud-status').textContent = '請填資料庫名稱（owner/repo）和通行碼。'; return; }
  if (editing && players.list.some(p => p.repo === repo)) { $('cloud-status').textContent = '這個資料庫已經在名單裡了。每位玩家要用自己的資料庫。'; return; }
  $('cloud-status').textContent = '連線中…';
  try {
    const info = await createCloud({ repo, token }).test();
    if (editing) { players.list.push({ name, repo, token }); players.active = players.list.length - 1; }
    else players.list[players.active] = { name, repo, token };
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
$('code-character').append(...Object.values(CHARACTERS).map((c) => Object.assign(document.createElement('option'), { value: c.no, textContent: `No.${c.no} ${c.name}` })));
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
  if (!privateKey) { $('code-status').textContent = '請先在第 2 步準備好印章。'; return; }
  $('code-create').disabled = true; $('code-status').textContent = '蓋章中…';
  try {
    const c = cloud();
    const hash = await sha256Hex(phrase);
    if (await c.exists(`codes/${hash}.json`)) { $('code-status').textContent = '這句暗號已經設定過了，換一句吧。'; return; }
    const expires = $('code-expires').value ? new Date(`${$('code-expires').value}T23:59:59+08:00`).toISOString() : null;
    const payload = { v: 1, type: 'code', hash, reward: rewardFromForm(), once: !$('code-reusable').checked, expires, createdAt: new Date().toISOString() };
    await c.putJSON(`codes/${hash}.json`, await signPayload(privateKey, payload), 'add code');
    saveNote(hash, { phrase: $('code-phrase').value.trim(), note: $('code-note').value.trim() });
    $('code-status').textContent = `完成！暗號「${$('code-phrase').value.trim()}」可以兌換${describeReward(payload.reward, CHARACTERS, EGGS)}。`;
    $('code-phrase').value = ''; $('code-note').value = '';
    void refreshCodes();
  } catch (err) { $('code-status').textContent = `送出失敗：${err.message}`; }
  finally { $('code-create').disabled = !privateKey; }
});

async function refreshCodes() {
  if (!config()) return;
  try {
    const c = cloud();
    const [codes, redeemed] = await Promise.all([c.list('codes'), c.list('redeemed')]);
    const used = new Set(redeemed.map((f) => f.name));
    const n = notes();
    const items = await Promise.all(codes.filter((f) => f.name.endsWith('.json')).map(async (f) => ({ hash: f.name.slice(0, -5), file: await c.getJSON(f.path) })));
    items.sort((a, b) => String(b.file?.data?.payload?.createdAt).localeCompare(String(a.file?.data?.payload?.createdAt)));
    $('code-list').replaceChildren(...items.map(({ hash, file }) => {
      const p = file?.data?.payload || {};
      const li = document.createElement('li');
      const name = document.createElement('b'); name.textContent = n[hash]?.phrase || '（在別支手機設定的暗號）';
      const info = document.createElement('small');
      const status = used.has(`${hash}.json`) ? '已兌換' : p.expires && Date.now() > Date.parse(p.expires) ? '已過期' : '等待兌換';
      info.textContent = `${describeReward(p.reward || {}, CHARACTERS, EGGS)} · ${p.once === false ? '可重複' : '一次'} · ${status}${n[hash]?.note ? ` · ${n[hash].note}` : ''}`;
      const row = document.createElement('div'); row.className = 'row';
      const del = Object.assign(document.createElement('button'), { className: 'btn btn--quiet', type: 'button', textContent: '刪除' });
      del.addEventListener('click', async () => { del.disabled = true; await c.remove(`codes/${hash}.json`, 'remove code'); void refreshCodes(); });
      row.append(del); li.append(name, info, row); return li;
    }));
    if (!items.length) $('code-list').replaceChildren(Object.assign(document.createElement('li'), { textContent: '還沒有暗號。' }));
  } catch (err) { $('code-status').textContent = `讀取暗號失敗：${err.message}`; }
}
$('code-refresh').addEventListener('click', refreshCodes);

/* ---------- 寄紙條 ---------- */
$('letter-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = $('letter-body').value.trim();
  if (!body) { $('letter-status').textContent = '先寫點什麼吧。'; return; }
  if (!privateKey) { $('letter-status').textContent = '請先在第 2 步準備好印章。'; return; }
  $('letter-send').disabled = true; $('letter-status').textContent = '蓋章中…';
  try {
    const id = `${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 6)}`;
    const payload = { v: 1, type: 'letter', id, title: $('letter-title').value.trim(), body, createdAt: new Date().toISOString() };
    await cloud().putJSON(`letters/${id}.json`, await signPayload(privateKey, payload), 'send letter');
    $('letter-status').textContent = '寄出了！他下次打開遊戲就會收到。';
    $('letter-title').value = ''; $('letter-body').value = '';
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
      const small = document.createElement('small'); small.textContent = data?.createdAt ? new Date(data.createdAt).toLocaleString('zh-TW') : '';
      const pre = document.createElement('pre'); pre.textContent = data?.body || '';
      const row = document.createElement('div'); row.className = 'row';
      const del = Object.assign(document.createElement('button'), { className: 'btn btn--quiet', type: 'button', textContent: '收回（他已收到的不會消失）' });
      del.addEventListener('click', async () => { del.disabled = true; await c.remove(f.path, 'remove letter'); void refreshLetters(); });
      row.append(del); li.append(b, small, pre, row); return li;
    }));
    if (!items.length) $('letter-list').replaceChildren(Object.assign(document.createElement('li'), { textContent: '還沒有寄過紙條。' }));
  } catch (err) { $('letter-status').textContent = `讀取紙條失敗：${err.message}`; }
}

/* ---------- 照片委託 ---------- */
$('mission-character').append(...Object.values(CHARACTERS).map((c) => Object.assign(document.createElement('option'), { value: c.no, textContent: `No.${c.no} ${c.name}` })));
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
  if (!privateKey) { $('mission-status').textContent = '請先在第 2 步準備好印章。'; return; }
  $('mission-create').disabled = true; $('mission-status').textContent = '蓋章中…';
  try {
    const id = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 7)}`;
    const expires = $('mission-expires').value ? new Date(`${$('mission-expires').value}T23:59:59+08:00`).toISOString() : null;
    const payload = { v: 1, type: 'mission', id, title, body: $('mission-body').value.trim(), reward: missionReward(), expires, createdAt: new Date().toISOString() };
    await cloud().putJSON(`missions/${id}.json`, await signPayload(privateKey, payload), 'add mission');
    $('mission-status').textContent = `出題了！他下次打開遊戲就會看到「${title}」。`;
    $('mission-title').value = ''; $('mission-body').value = '';
    void refreshMissions();
  } catch (err) { $('mission-status').textContent = `出題失敗：${err.message}`; }
  finally { $('mission-create').disabled = !privateKey; }
});
const photoUrls = [];
async function refreshMissions() {
  if (!config()) return;
  photoUrls.splice(0).forEach((u) => URL.revokeObjectURL(u));
  try {
    const c = cloud();
    const [missions, reviews] = await Promise.all([c.list('missions'), c.list('reviews')]);
    const reviewed = new Set(reviews.map((f) => f.name));
    const items = await Promise.all(missions.filter((f) => f.name.endsWith('.json')).map(async (f) => ({ id: f.name.slice(0, -5), p: (await c.getJSON(f.path))?.data?.payload })));
    items.sort((a, b) => String(b.p?.createdAt).localeCompare(String(a.p?.createdAt)));
    const lis = [];
    for (const { id, p } of items) {
      const li = document.createElement('li');
      const b = document.createElement('b'); b.textContent = p?.title || id;
      const subs = (await c.list(`submissions/${id}`)).filter((f) => f.name.endsWith('.jpg'));
      const waiting = subs.filter((f) => !reviewed.has(`${id}__${f.name.slice(0, -4)}.json`));
      const info = document.createElement('small'); info.textContent = `${describeReward(p?.reward || {}, CHARACTERS, EGGS)} · 提交 ${subs.length} 次 · ${waiting.length ? `${waiting.length} 張待審核` : '沒有待審核的照片'}`;
      li.append(b, info);
      for (const f of waiting) {
        const sid = f.name.slice(0, -4);
        const bytes = await c.getBytes(f.path);
        const img = document.createElement('img'); img.className = 'review-photo'; img.alt = `${p?.title} 的照片`;
        if (bytes) { const url = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' })); photoUrls.push(url); img.src = url; }
        const note = document.createElement('textarea'); note.rows = 2; note.maxLength = 600; note.placeholder = '首席研究員的批註（會收進他的記憶檔案）';
        const row = document.createElement('div'); row.className = 'row';
        const ok = Object.assign(document.createElement('button'), { className: 'btn', type: 'button', textContent: '通過' });
        const no = Object.assign(document.createElement('button'), { className: 'btn btn--quiet', type: 'button', textContent: '退回' });
        const decide = async (approvedFlag) => {
          if (!privateKey) { $('mission-status').textContent = '請先準備好印章。'; return; }
          ok.disabled = no.disabled = true;
          const payload = { v: 1, type: 'review', mission: id, submission: sid, approved: approvedFlag, note: note.value.trim(), createdAt: new Date().toISOString() };
          await c.putJSON(`reviews/${id}__${sid}.json`, await signPayload(privateKey, payload), approvedFlag ? 'approve submission' : 'reject submission');
          $('mission-status').textContent = approvedFlag ? '已通過！他下次打開遊戲就會收到獎勵。' : '已退回，他可以再拍一次。';
          void refreshMissions();
        };
        ok.addEventListener('click', () => decide(true)); no.addEventListener('click', () => decide(false));
        row.append(ok, no); li.append(img, note, row);
      }
      const row = document.createElement('div'); row.className = 'row';
      const del = Object.assign(document.createElement('button'), { className: 'btn btn--quiet', type: 'button', textContent: '撤回題目' });
      del.addEventListener('click', async () => { del.disabled = true; await c.remove(`missions/${id}.json`, 'remove mission'); void refreshMissions(); });
      row.append(del); li.append(row); lis.push(li);
    }
    $('mission-list').replaceChildren(...(lis.length ? lis : [Object.assign(document.createElement('li'), { textContent: '還沒有委託。' })]));
  } catch (err) { $('mission-status').textContent = `讀取委託失敗：${err.message}`; }
}
$('mission-refresh').addEventListener('click', refreshMissions);

/* ---------- 約會 QR Code ---------- */
const URL_KEY = 'siang-collector:review-game-url:v1';
$('date-url').value = localStorage.getItem(URL_KEY) || new URL('./', location.href).href;
$('date-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!privateKey) { $('date-status').textContent = '請先在第 2 步準備好印章。'; return; }
  $('date-create').disabled = true; $('date-status').textContent = '蓋章中…';
  try {
    const gameUrl = $('date-url').value.trim(); localStorage.setItem(URL_KEY, gameUrl);
    const code = newDateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const payload = { v: 1, type: 'date', code, title: $('date-title').value.trim() || '今天的約會', note: $('date-note').value.trim(), expires, createdAt: new Date().toISOString() };
    await cloud().putJSON(`dates/${code}.json`, await signPayload(privateKey, payload), 'date code');
    const q = qrcode(0, 'M'); q.addData(`${gameUrl.replace(/#.*$/, '')}#date=${code}`); q.make();
    $('date-qr-svg').innerHTML = q.createSvgTag({ cellSize: 6, margin: 2 });
    $('date-code').textContent = code;
    $('date-expire').textContent = `有效到 ${new Date(expires).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}，只能用一次`;
    $('date-qr').hidden = false; $('date-status').textContent = '請他用手機相機掃描，或在遊戲「輸入暗號」打上這 6 碼。';
  } catch (err) { $('date-status').textContent = `產生失敗：${err.message}`; }
  finally { $('date-create').disabled = !privateKey; }
});

/* ---------- 他寄來的照片 ---------- */
const postcardUrls = [];
async function refreshPostcards() {
  if (!config()) return;
  postcardUrls.splice(0).forEach((u) => URL.revokeObjectURL(u));
  try {
    const c = cloud();
    const [cards, replies] = await Promise.all([c.list('postcards'), c.list('postcard-replies')]);
    const replied = new Set(replies.map((f) => f.name));
    const metas = cards.filter((f) => f.name.endsWith('.json')).sort((a, b) => b.name.localeCompare(a.name)).slice(0, 30);
    const lis = [];
    for (const f of metas) {
      const id = f.name.slice(0, -5);
      const meta = (await c.getJSON(f.path))?.data || {};
      const li = document.createElement('li');
      const b = document.createElement('b'); b.textContent = meta.at ? new Date(meta.at).toLocaleString('zh-TW') : id;
      const bytes = await c.getBytes(`postcards/${id}.jpg`);
      const img = document.createElement('img'); img.className = 'review-photo'; img.alt = '他寄來的照片';
      if (bytes) { const url = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' })); postcardUrls.push(url); img.src = url; }
      li.append(b, img);
      if (meta.text) { const pre = document.createElement('pre'); pre.textContent = meta.text; li.append(pre); }
      if (replied.has(`${id}.json`)) {
        const r = (await c.getJSON(`postcard-replies/${id}.json`))?.data?.payload;
        const sm = document.createElement('small'); sm.textContent = `妳回覆了：${r?.note || ''}`; li.append(sm);
      } else {
        const note = document.createElement('textarea'); note.rows = 2; note.maxLength = 600; note.placeholder = '回他一句話';
        const row = document.createElement('div'); row.className = 'row';
        const send = Object.assign(document.createElement('button'), { className: 'btn', type: 'button', textContent: '蓋章回覆' });
        send.addEventListener('click', async () => {
          if (!privateKey) { $('postcard-status').textContent = '請先在第 2 步準備好印章。'; return; }
          if (!note.value.trim()) { $('postcard-status').textContent = '先寫一句話吧。'; return; }
          send.disabled = true;
          const payload = { v: 1, type: 'postcard-reply', id, note: note.value.trim(), createdAt: new Date().toISOString() };
          await c.putJSON(`postcard-replies/${id}.json`, await signPayload(privateKey, payload), 'reply postcard');
          $('postcard-status').textContent = '回覆了！他下次打開遊戲就會看到。';
          void refreshPostcards();
        });
        row.append(send); li.append(note, row);
      }
      lis.push(li);
    }
    $('postcard-list').replaceChildren(...(lis.length ? lis : [Object.assign(document.createElement('li'), { textContent: '還沒有收到照片。' })]));
  } catch (err) { $('postcard-status').textContent = `讀取照片失敗：${err.message}`; }
}
$('postcard-refresh').addEventListener('click', refreshPostcards);

/* ---------- 啟動 ---------- */
renderCloud();
await setKey((await loadJwk()) || null);
renderKey();
void refreshCodes();
void refreshLetters();
void refreshMissions();
void refreshPostcards();
