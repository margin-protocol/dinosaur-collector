// 手機通知（Web Push）：玩家開通知 → 審核員寫審核結果／紙條 → 後台把加密過的通知送到那支手機；
// 玩家寫的檔案不推、別的玩家收不到、推播服務回 410 就刪掉訂閱。用本機 SQLite 模擬 D1，本機 http 當推播服務。
import http from 'node:http';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import worker, { encryptPush, pushNoteFor } from '../server/worker.js';

const sqlite = new DatabaseSync(':memory:');
const toSql = (v) => (v instanceof ArrayBuffer ? new Uint8Array(v) : v);
const fix = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v instanceof Uint8Array ? [...v] : v]));
function prepare(sql) { let args = []; const st = { bind(...a) { args = a.map(toSql); return st; }, async first() { const r = sqlite.prepare(sql).get(...args); return r ? fix(r) : null; }, async all() { return { results: sqlite.prepare(sql).all(...args).map(fix) }; }, async run() { const r = sqlite.prepare(sql).run(...args); return { meta: { changes: Number(r.changes) } }; } }; return st; }
const DB = { prepare, async batch(l) { return Promise.all(l.map((s) => s.run())); } };

// VAPID 金鑰（測試用，每次重新產生）
const vapid = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
const env = { DB, VAPID_PRIVATE_JWK: JSON.stringify(vapid.privateKey.export({ format: 'jwk' })) };
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
function checkVapid(header, endpoint) {
  const m = /^vapid t=([\w-]+)\.([\w-]+)\.([\w-]+), k=([\w-]+)$/.exec(header); assert.ok(m, header);
  const claims = JSON.parse(Buffer.from(m[2], 'base64url')); assert.equal(claims.aud, new URL(endpoint).origin); assert.ok(claims.exp > Date.now() / 1000 && claims.exp < Date.now() / 1000 + 86400); assert.match(claims.sub, /^(https:|mailto:)/);
  assert.ok(crypto.verify('sha256', Buffer.from(`${m[1]}.${m[2]}`), { key: vapid.publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(m[3], 'base64url')), 'VAPID signature');
  const jwk = vapid.publicKey.export({ format: 'jwk' }); assert.equal(m[4], Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]).toString('base64url'));
}

try {
  // 加密本身：同一份 payload 解得回來
  const p0 = mkPhone(); assert.deepEqual(decrypt(p0, Buffer.from(await encryptPush('{"a":1}', subOf(p0, 'x').keys))), { a: 1 });
  assert.equal(pushNoteFor('reviews/m__s.json').tag, 'review'); assert.equal(pushNoteFor('submissions/m/s.json'), null);

  const reviewer = 'REVIEW-test-token-0123456789';
  assert.equal((await call('POST', '/admin/claim', { body: JSON.stringify({ hash: crypto.createHash('sha256').update(reviewer).digest('hex') }) })).status, 200);
  const a = await (await call('POST', '/admin/players', { token: reviewer, body: JSON.stringify({ name: '男友' }) })).json();
  const b = await (await call('POST', '/admin/players', { token: reviewer, body: JSON.stringify({ name: '朋友' }) })).json();
  const phoneA = mkPhone(); const phoneB = mkPhone();
  // 審核員不能代替玩家開通知；格式不對擋掉
  assert.equal((await call('POST', '/push/subscribe', { token: reviewer, body: JSON.stringify(subOf(phoneA, 'a')) })).status, 403);
  assert.equal((await call('POST', '/push/subscribe', { token: a.invite, body: JSON.stringify({ endpoint: 'javascript:alert(1)', keys: subOf(phoneA, 'a').keys }) })).status, 400);
  assert.equal((await call('POST', '/push/subscribe', { token: a.invite, body: JSON.stringify(subOf(phoneA, 'a')) })).status, 200);
  assert.equal((await call('POST', '/push/subscribe', { token: b.invite, body: JSON.stringify(subOf(phoneB, 'b')) })).status, 200);

  // 玩家自己上傳照片：不推
  await call('PUT', '/f/submissions/m1/s1.json', { token: a.invite, body: '{}' }); assert.equal(got.length, 0);
  // 審核員寫審核結果給男友：只推到男友的手機
  await call('PUT', '/f/reviews/m1__s1.json', { token: reviewer, player: a.id, body: '{"payload":{}}' });
  assert.equal(got.length, 1); assert.equal(got[0].path, '/a');
  assert.equal(got[0].headers['content-encoding'], 'aes128gcm'); assert.equal(got[0].headers.ttl, '86400');
  checkVapid(got[0].headers.authorization, `${base}/a`);
  assert.deepEqual(decrypt(phoneA, got[0].body), { title: '頁間居民', body: '湘審完你的委託照片了！', tag: 'review' });
  // 照片（.jpg）不推；同一個檔案再寫一次（已存在）也不推
  await call('PUT', '/f/reviews/m1__s1.json', { token: reviewer, player: a.id, body: '{}' }); assert.equal(got.length, 1);
  // 紙條給朋友
  await call('PUT', '/f/letters/l1.json', { token: reviewer, player: b.id, body: '{}' });
  assert.equal(got.length, 2); assert.equal(got[1].path, '/b'); assert.equal(decrypt(phoneB, got[1].body).tag, 'letter');
  // 推播服務說這支手機不在了（410）→ 刪掉，下次不再送
  reply = 410; await call('PUT', '/f/postcard-replies/p1.json', { token: reviewer, player: b.id, body: '{}' }); assert.equal(got.length, 3);
  reply = 201; await call('PUT', '/f/missions/x1.json', { token: reviewer, player: b.id, body: '{}' }); assert.equal(got.length, 3, 'gone subscription removed');
  // 關通知
  assert.equal((await call('POST', '/push/unsubscribe', { token: a.invite, body: JSON.stringify({ endpoint: `${base}/a` }) })).status, 200);
  await call('PUT', '/f/letters/l2.json', { token: reviewer, player: a.id, body: '{}' }); assert.equal(got.length, 3);
  // 沒設定 VAPID 金鑰時照常寫檔、不推
  const saved = env.VAPID_PRIVATE_JWK; delete env.VAPID_PRIVATE_JWK;
  assert.equal((await call('POST', '/push/subscribe', { token: a.invite, body: JSON.stringify(subOf(phoneA, 'a')) })).status, 200);
  assert.equal((await call('PUT', '/f/letters/l3.json', { token: reviewer, player: a.id, body: '{}' })).status, 201); assert.equal(got.length, 3);
  env.VAPID_PRIVATE_JWK = saved;
  console.log('push: subscribe guard, admin writes push encrypted note to that player only, VAPID JWT, no push for player/dup/jpg, 410 cleanup, unsubscribe PASS');
} finally { server.close(); }
