// 首席研究員審核室：只在湘的手機使用。印章（私鑰）存在這支手機的 IndexedDB。
import { cloudConfig, saveCloudConfig, createCloud } from './cloud.js';
import { generateKeys, exportJwk, importPrivate, publicFromPrivate, signPayload, normalizeCode, sha256Hex } from './sign.js';
import { CHARACTERS, EGGS } from './eggs.js';
import { describeReward } from './gifts.js';
import { REVIEWER_PUBLIC_JWK } from './reviewer-key.js';

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
  for (const id of ['code-create', 'letter-send']) $(id).disabled = !has;
}

/* ---------- 連線 ---------- */
const config = () => cloudConfig(REVIEW_CLOUD_KEY);
const cloud = () => { const c = config(); if (!c) throw new Error('請先在第 1 步連線資料庫'); return createCloud(c); };
function renderCloud(message = '') {
  const c = config();
  $('cloud-repo').value = c?.repo || $('cloud-repo').value;
  $('cloud-token').value = '';
  $('cloud-token').placeholder = c ? '已儲存（要更換再貼上新的）' : 'github_pat_…';
  $('cloud-save').textContent = c ? '更新連線' : '連線';
  $('cloud-status').textContent = message || (c ? `已連線：${c.repo}` : '');
}
$('cloud-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const repo = $('cloud-repo').value.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
  const token = $('cloud-token').value.trim() || config()?.token || '';
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !token) { $('cloud-status').textContent = '請填資料庫名稱（owner/repo）和通行碼。'; return; }
  $('cloud-status').textContent = '連線中…';
  try {
    const info = await createCloud({ repo, token }).test();
    saveCloudConfig({ repo, token }, REVIEW_CLOUD_KEY);
    renderCloud(info.private ? '連線成功！' : '連線成功，但這個資料庫是公開的，建議改成私人。');
    void refreshCodes(); void refreshLetters();
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

/* ---------- 啟動 ---------- */
renderCloud();
await setKey((await loadJwk()) || null);
renderKey();
void refreshCodes();
void refreshLetters();
