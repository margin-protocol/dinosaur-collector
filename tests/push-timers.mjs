// 回家／討伐提醒（湘 11/25）：不用邀請碼、整份換掉、時間到才推、key 對不上不能改、410 清掉、測試服以外的格式擋掉。
import http from 'node:http';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import worker, { runTimers, cleanTimerSubs, TIMER_MAX } from '../server/worker.js';

const sqlite = new DatabaseSync(':memory:');
const toSql = (v) => (v instanceof ArrayBuffer ? new Uint8Array(v) : v);
const fix = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v instanceof Uint8Array ? [...v] : v]));
function prepare(sql) { let args = []; const st = { bind(...a) { args = a.map(toSql); return st; }, async first() { const r = sqlite.prepare(sql).get(...args); return r ? fix(r) : null; }, async all() { return { results: sqlite.prepare(sql).all(...args).map(fix) }; }, async run() { const r = sqlite.prepare(sql).run(...args); return { meta: { changes: Number(r.changes) } }; } }; return st; }
const DB = { prepare, async batch(l) { return Promise.all(l.map((s) => s.run())); } };

// VAPID 金鑰（測試用，每次重新產生）
const vapid = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const env = { DB, TIMER_ALLOW_LOCAL: '1', VAPID_PRIVATE_JWK: JSON.stringify(vapid.privateKey.export({ format: 'jwk' })) };
const waits = []; const ctx = { waitUntil: (p) => waits.push(p) };
const call = async (method, path, { token, player, body, type = 'application/json' } = {}) => {
  const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(player ? { 'X-Player': player } : {}), ...(body !== undefined ? { 'Content-Type': type } : {}) };
  const res = await worker.fetch(new Request(`http://api.test${path}`, { method, headers, body }), env, ctx);
  await Promise.all(waits.splice(0)); return res;
};

// 假的推播服務
const got = []; let reply = 201;
const server = http.createServer(async (req, res) => { const chunks = []; for await (const c of req) chunks.push(c); got.push({ path: req.url, headers: req.headers, body: Buffer.concat(chunks) }); res.writeHead(reply); res.end(); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// 一支玩家手機的推播金鑰
const mkPhone = () => { const ecdh = crypto.createECDH('prime256v1'); ecdh.generateKeys(); return { ecdh, auth: crypto.randomBytes(16) }; };
const subOf = (phone, path) => ({ endpoint: `${base}/${path}`, keys: { p256dh: phone.ecdh.getPublicKey().toString('base64url'), auth: phone.auth.toString('base64url') } });
const hkdf = (salt, ikm, info, len) => Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, len));
function decrypt(phone, body) {
  const salt = body.subarray(0, 16); const idlen = body[20]; const asPub = body.subarray(21, 21 + idlen); const data = body.subarray(21 + idlen);
  const shared = phone.ecdh.computeSecret(asPub);
  const ikm = hkdf(phone.auth, shared, Buffer.concat([Buffer.from('WebPush: info\0'), phone.ecdh.getPublicKey(), asPub]), 32);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const d = crypto.createDecipheriv('aes-128-gcm', cek, nonce); d.setAuthTag(data.subarray(-16));
  const plain = Buffer.concat([d.update(data.subarray(0, -16)), d.final()]);
  assert.equal(plain.at(-1), 2, 'last-record padding delimiter'); return JSON.parse(plain.subarray(0, -1).toString());
}

const H = 3600e3;
const post = (path, body) => call('POST', path, { body: JSON.stringify(body) });
const KEY = 'k'.repeat(32);
const reg = (phone, path, timers, key = KEY) => post('/timers', { ...subOf(phone, path), key, timers });
try {
  const now = Date.now();
  const p1 = mkPhone(); const p2 = mkPhone();
  // 格式：只收推播服務的網址（本機測試例外）、key 要夠長、最多 8 則、最遠 30 小時
  assert.equal((await post('/timers', { ...subOf(p1, 'a'), endpoint: 'https://evil.example.com/x', key: KEY, timers: [] })).status, 400);
  delete env.TIMER_ALLOW_LOCAL; assert.equal((await reg(p1, 'a', [])).status, 400, 'local endpoint only in tests'); env.TIMER_ALLOW_LOCAL = '1';
  assert.equal((await reg(p1, 'a', [], 'short')).status, 400);
  assert.equal((await reg(p1, 'a', Array.from({ length: TIMER_MAX + 1 }, (_, i) => ({ at: now + i * H, title: 't', body: 'b' })))).status, 400);
  assert.equal((await reg(p1, 'a', [{ at: now + 31 * H, title: 't', body: 'b' }])).status, 400);
  assert.equal((await reg(p1, 'a', [{ at: now + H, title: '', body: 'b' }])).status, 400);
  // 不用邀請碼就能排
  let r = await reg(p1, 'a', [{ at: now + H, title: '草莓小湘回來囉 🍓', body: '「快來看我帶了什麼！」', tag: 'home-1' }, { at: now + 2 * H, title: '第二隊打贏了', body: '贏了！', tag: 'battle-1' }]);
  assert.equal(r.status, 200); assert.equal((await r.json()).count, 2);
  assert.equal((await reg(p2, 'b', [{ at: now + H, title: '夜貓小湘回來囉', body: '我回來了', tag: 'home-9' }], 'z'.repeat(32))).status, 200);
  // 別人拿到 endpoint 也改不了（key 不同）
  assert.equal((await reg(p1, 'a', [], 'x'.repeat(32))).status, 403);
  assert.equal((await post('/timers/off', { endpoint: `${base}/a`, key: 'x'.repeat(32) })).status, 403);
  // 還沒到時間：不推
  assert.equal(await runTimers(env, now + 30 * 60e3), 0); assert.equal(got.length, 0);
  // 一小時後：兩支手機各推一則，內容解得開
  assert.equal(await runTimers(env, now + H + 1000), 2); assert.equal(got.length, 2);
  const g1 = got.find((g) => g.path === '/a'); assert.deepEqual(decrypt(p1, g1.body), { title: '草莓小湘回來囉 🍓', body: '「快來看我帶了什麼！」', tag: 'home-1', kind: 'timer' });
  assert.equal(g1.headers.ttl, String(6 * 3600)); assert.match(g1.headers.authorization, /^vapid t=/);
  // 推過的不會再推
  assert.equal(await runTimers(env, now + H + 2000), 0);
  // 整份換掉（例如叫回來了）：原本兩小時後那則不見
  assert.equal((await reg(p1, 'a', [{ at: now + 3 * H, title: '夜市回來了', body: 'b', tag: 'home-2' }])).status, 200);
  assert.equal(await runTimers(env, now + 2 * H + 1000), 0);
  // 推播服務說不在了（410）→ 訂閱和剩下的提醒都刪掉
  reply = 410; assert.equal(await runTimers(env, now + 3 * H + 1000), 0); reply = 201;
  assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM timer_subs WHERE endpoint = ?').bind(`${base}/a`).first()).n, 0);
  // 刪掉之後同一支手機可以重新開（換一把 key 也行）
  assert.equal((await reg(p1, 'a', [{ at: now + 4 * H, title: 't', body: 'b' }], 'n'.repeat(32))).status, 200);
  // 關掉：提醒也一起取消
  assert.equal((await post('/timers/off', { endpoint: `${base}/a`, key: 'n'.repeat(32) })).status, 200);
  assert.equal(await runTimers(env, now + 5 * H), 0);
  // 一輪最多推 20 則，其餘下一分鐘
  const phones = Array.from({ length: 3 }, mkPhone);
  for (let i = 0; i < 3; i++) await reg(phones[i], `m${i}`, Array.from({ length: 8 }, (_, j) => ({ at: now + 6 * H + j, title: 't', body: 'b', tag: `h-${j}` })), `${i}`.repeat(32));
  const before = got.length;
  assert.equal(await runTimers(env, now + 7 * H), 20); assert.equal(await runTimers(env, now + 7 * H + 60e3), 4); assert.equal(got.length - before, 24);
  // 後台停太久（超過 6 小時）沒推到的不補
  await reg(p2, 'b', [{ at: now + 8 * H, title: 't', body: 'b' }], 'z'.repeat(32));
  assert.equal(await runTimers(env, now + 15 * H), 0);
  // 很久沒打開的手機從名單拿掉
  await cleanTimerSubs(env, now + 200 * 86400e3);
  assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM timer_subs').first()).n, 0);
  // 沒設定 VAPID 金鑰時不推也不出錯
  delete env.VAPID_PRIVATE_JWK; assert.equal(await runTimers(env, now), 0);
  console.log('push-timers: no invite needed, endpoint/key guards, due-only, replace list, 410 cleanup, off, batch 20, stale drop, cleanup PASS');
} finally { server.close(); }
