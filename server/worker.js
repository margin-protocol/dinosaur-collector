// 小湘收集器雲端後台（Cloudflare Worker + D1）
// 取代「每位玩家一個 GitHub 私人 repo」：所有玩家共用一個後台，各自只看得到自己的資料，審核員（湘）看得到全部。
//
// 權限
// - 玩家：Authorization: Bearer <邀請碼>。只能讀寫自己的空間 p/<玩家>/…；讀 codes/ 找不到時，會再找「給所有玩家」的 shared/codes/。
// - 審核員：Authorization: Bearer <審核員通行碼>。帶 X-Player: <玩家 id> 操作那位玩家的空間；不帶時只能操作 shared/…。
// - 審核員通行碼由湘第一次打開審核室時在她的手機產生（POST /admin/claim），後台只存雜湊，誰都看不到原文。
// 邀請碼與通行碼都只存 SHA-256 雜湊。遊戲內容（暗號、紙條、委託…）另外有湘的數位印章保護，後台被改也偽造不了。
//
// API
//   GET  /me                         → { role, player, name }
//   POST /admin/claim {hash}          → 第一次設定審核員通行碼（已設定過就拒絕）
//   GET  /admin/players               → [{ id, name, created, seen, revoked }]
//   POST /admin/players {name}        → { id, name, invite }（邀請碼只回傳這一次）
//   POST /admin/players/<id>/reset    → { invite }（換新邀請碼，舊的立刻失效）
//   POST /admin/players/<id>/revoke   → 停用這位玩家
//   GET|PUT|DELETE /f/<path>          → 檔案；PUT 預設只建立新檔，?overwrite=1 才覆蓋
//   GET  /ls/<dir>                    → [{ name, path, type: 'file'|'dir' }]
//   POST /push/subscribe {endpoint, keys:{p256dh, auth}} → 玩家這支手機開啟通知
//   POST /push/unsubscribe {endpoint}  → 關掉
//
// 手機通知（Web Push，湘 11/21）：審核員把審核結果、紙條、照片回覆、新委託寫進某位玩家的空間時，
// 後台用 VAPID 金鑰（Worker secret VAPID_PRIVATE_JWK，不在 repo 裡）推一則通知到那位玩家開過通知的手機。
// 通知內容只有固定的一句話（例如「湘審完你的委託照片了！」），不含照片或批註。

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type,X-Player',
  'Access-Control-Max-Age': '86400',
};
const MAX_BYTES = 1_900_000; // D1 一列最多約 2MB；遊戲上傳的照片壓到 1280px，遠小於這個
const SHARED_READ = ['codes/'];
let schemaReady = false;

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const fail = (status, message) => json({ error: message }, status);

async function sha256(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function randomToken(bytes = 24) {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const randomId = () => randomToken(6).replace(/[-_]/g, 'x').toLowerCase();
const validPath = (p) => typeof p === 'string' && p.length > 0 && p.length < 400 && !p.split('/').some((s) => !s || s === '.' || s === '..');

export async function ensureSchema(db) {
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)'),
    db.prepare('CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, name TEXT, token_hash TEXT UNIQUE, created TEXT, seen TEXT, revoked INTEGER DEFAULT 0)'),
    db.prepare('CREATE TABLE IF NOT EXISTS files (key TEXT PRIMARY KEY, body BLOB, type TEXT, size INTEGER, updated TEXT)'),
    db.prepare('CREATE TABLE IF NOT EXISTS push_subs (endpoint TEXT PRIMARY KEY, player TEXT, p256dh TEXT, auth TEXT, created TEXT)'),
  ]);
}

async function whoIs(request, db) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const hash = await sha256(token);
  const admin = await db.prepare('SELECT v FROM meta WHERE k = ?').bind('admin_hash').first();
  if (admin && admin.v === hash) return { role: 'admin' };
  const p = await db.prepare('SELECT id, name, seen FROM players WHERE token_hash = ? AND revoked = 0').bind(hash).first();
  if (!p) return null;
  const today = new Date().toISOString().slice(0, 10);
  if (!p.seen || p.seen.slice(0, 10) !== today) await db.prepare('UPDATE players SET seen = ? WHERE id = ?').bind(new Date().toISOString(), p.id).run();
  return { role: 'player', player: p.id, name: p.name };
}

// 把請求的路徑換成資料庫裡的 key
function scopeKey(who, request, path) {
  if (who.role === 'player') return `p/${who.player}/${path}`;
  const player = request.headers.get('X-Player');
  if (player) return /^[a-z0-9]{4,16}$/.test(player) ? `p/${player}/${path}` : null;
  return path.startsWith('shared/') ? path : null;
}

/* ---------- Web Push（RFC 8291 aes128gcm 加密 ＋ RFC 8292 VAPID） ---------- */
const PUSH_NOTES = [
  ['reviews/', '湘審完你的委託照片了！', 'review'],
  ['letters/', '湘寄來一張新紙條 ✉️', 'letter'],
  ['postcard-replies/', '湘回覆了你寄的照片', 'postcard'],
  ['missions/', '湘出了一個新的照片委託', 'mission'],
];
export const pushNoteFor = (path) => { const n = PUSH_NOTES.find(([p]) => path.startsWith(p)); return n ? { title: '小湘收集器', body: n[1], tag: n[2] } : null; };
const b64u = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(s).length + 3) % 4)), (c) => c.charCodeAt(0));
const cat = (...parts) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };
const utf8 = (t) => new TextEncoder().encode(t);
async function hkdf(salt, ikm, info, length) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8));
}
// 把 payload 加密給一個訂閱（瀏覽器給的 p256dh 公鑰、auth 密鑰）
export async function encryptPush(payload, sub, { salt = crypto.getRandomValues(new Uint8Array(16)), local } = {}) {
  const uaPublic = unb64u(sub.p256dh); const authSecret = unb64u(sub.auth);
  const eph = local || await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', eph.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, eph.privateKey, 256));
  const ikm = await hkdf(authSecret, shared, cat(utf8('WebPush: info\0'), uaPublic, asPublic), 32);
  const cek = await hkdf(salt, ikm, utf8('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, utf8('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, cat(utf8(payload), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]); // record size 4096
  return cat(salt, rs, new Uint8Array([asPublic.length]), asPublic, cipher);
}
async function vapidHeader(endpoint, jwk, subject) {
  const { origin } = new URL(endpoint);
  const head = b64u(utf8(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(utf8(JSON.stringify({ aud: origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })));
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, utf8(`${head}.${body}`));
  const pub = b64u(cat(new Uint8Array([4]), unb64u(jwk.x), unb64u(jwk.y)));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${pub}`;
}
export async function sendPush(db, env, player, note) {
  if (!env.VAPID_PRIVATE_JWK || !note) return 0;
  const jwk = JSON.parse(env.VAPID_PRIVATE_JWK);
  const { results } = await db.prepare('SELECT endpoint, p256dh, auth FROM push_subs WHERE player = ?').bind(player).all();
  let sent = 0;
  await Promise.all(results.map(async (sub) => {
    try {
      const res = await fetch(sub.endpoint, { method: 'POST', headers: { Authorization: await vapidHeader(sub.endpoint, jwk, env.VAPID_SUBJECT || 'https://margin-protocol.github.io/dinosaur-collector/'), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: 'normal', Topic: note.tag }, body: await encryptPush(JSON.stringify(note), sub) });
      if (res.status === 404 || res.status === 410) await db.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(sub.endpoint).run();
      else if (res.ok) sent += 1;
    } catch {}
  }));
  return sent;
}
const validEndpoint = (u) => { try { const x = new URL(u); return x.protocol === 'https:' || (x.hostname === '127.0.0.1' && x.protocol === 'http:'); } catch { return false; } };

async function handle(request, env, ctx) {
  const db = env.DB;
  const url = new URL(request.url);
  const route = decodeURIComponent(url.pathname);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (route === '/' || route === '/health') return json({ ok: true, app: 'siang-collector' });
  if (!schemaReady) { await ensureSchema(db); schemaReady = true; }

  if (route === '/admin/claim' && request.method === 'POST') {
    const body = await request.json().catch(() => ({}));
    if (!/^[0-9a-f]{64}$/.test(body.hash || '')) return fail(400, '格式不對');
    const r = await db.prepare('INSERT OR IGNORE INTO meta (k, v) VALUES (?, ?)').bind('admin_hash', body.hash).run();
    return r.meta?.changes ? json({ ok: true }) : fail(409, '審核員通行碼已經設定過了');
  }
  if (route === '/admin/status') {
    const admin = await db.prepare('SELECT v FROM meta WHERE k = ?').bind('admin_hash').first();
    return json({ claimed: Boolean(admin) });
  }

  const who = await whoIs(request, db);
  if (!who) return fail(401, '邀請碼或通行碼不對，或已經被停用');
  if (route === '/me') return json(who);

  if (route === '/push/subscribe' && request.method === 'POST') {
    if (who.role !== 'player') return fail(403, '只有玩家的手機可以開通知');
    const body = await request.json().catch(() => ({}));
    const p256dh = body.keys?.p256dh; const auth = body.keys?.auth;
    if (!validEndpoint(body.endpoint) || String(body.endpoint).length > 1000 || !/^[\w-]{80,100}$/.test(p256dh || '') || !/^[\w-]{16,32}$/.test(auth || '')) return fail(400, '通知設定格式不對');
    const { results } = await db.prepare('SELECT COUNT(*) AS n FROM push_subs WHERE player = ?').bind(who.player).all();
    if ((results[0]?.n || 0) >= 10) await db.prepare('DELETE FROM push_subs WHERE endpoint IN (SELECT endpoint FROM push_subs WHERE player = ? ORDER BY created LIMIT 1)').bind(who.player).run();
    await db.prepare('INSERT INTO push_subs (endpoint, player, p256dh, auth, created) VALUES (?, ?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET player = excluded.player, p256dh = excluded.p256dh, auth = excluded.auth').bind(body.endpoint, who.player, p256dh, auth, new Date().toISOString()).run();
    return json({ ok: true });
  }
  if (route === '/push/unsubscribe' && request.method === 'POST') {
    if (who.role !== 'player') return fail(403, '只有玩家的手機可以關通知');
    const body = await request.json().catch(() => ({}));
    await db.prepare('DELETE FROM push_subs WHERE endpoint = ? AND player = ?').bind(String(body.endpoint || ''), who.player).run();
    return json({ ok: true });
  }

  if (route.startsWith('/admin/')) {
    if (who.role !== 'admin') return fail(403, '只有審核員可以');
    if (route === '/admin/players' && request.method === 'GET') {
      const { results } = await db.prepare('SELECT id, name, created, seen, revoked FROM players ORDER BY created').all();
      return json(results.map((r) => ({ ...r, revoked: Boolean(r.revoked) })));
    }
    if (route === '/admin/players' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const name = String(body.name || '').trim().slice(0, 20) || '新玩家';
      const id = randomId(); const invite = `SIANG-${randomToken()}`;
      await db.prepare('INSERT INTO players (id, name, token_hash, created, revoked) VALUES (?, ?, ?, ?, 0)').bind(id, name, await sha256(invite), new Date().toISOString()).run();
      return json({ id, name, invite });
    }
    const m = route.match(/^\/admin\/players\/([a-z0-9]{4,16})\/(reset|revoke|restore|rename)$/);
    if (m && request.method === 'POST') {
      const [, id, action] = m;
      const p = await db.prepare('SELECT id FROM players WHERE id = ?').bind(id).first();
      if (!p) return fail(404, '找不到這位玩家');
      if (action === 'reset') { const invite = `SIANG-${randomToken()}`; await db.prepare('UPDATE players SET token_hash = ?, revoked = 0 WHERE id = ?').bind(await sha256(invite), id).run(); return json({ id, invite }); }
      if (action === 'revoke') { await db.prepare('UPDATE players SET revoked = 1 WHERE id = ?').bind(id).run(); return json({ ok: true }); }
      if (action === 'restore') { await db.prepare('UPDATE players SET revoked = 0 WHERE id = ?').bind(id).run(); return json({ ok: true }); }
      const body = await request.json().catch(() => ({}));
      await db.prepare('UPDATE players SET name = ? WHERE id = ?').bind(String(body.name || '').trim().slice(0, 20) || '玩家', id).run();
      return json({ ok: true });
    }
    return fail(404, '沒有這個功能');
  }

  if (route.startsWith('/f/')) {
    const path = route.slice(3);
    if (!validPath(path)) return fail(400, '路徑不對');
    const key = scopeKey(who, request, path);
    if (!key) return fail(403, '要先選一位玩家');
    if (request.method === 'GET') {
      let row = await db.prepare('SELECT body, type FROM files WHERE key = ?').bind(key).first();
      if (!row && who.role === 'player' && SHARED_READ.some((d) => path.startsWith(d))) row = await db.prepare('SELECT body, type FROM files WHERE key = ?').bind(`shared/${path}`).first();
      if (!row) return fail(404, '沒有這個檔案');
      return new Response(new Uint8Array(row.body), { headers: { ...CORS, 'Content-Type': row.type || 'application/octet-stream', 'Cache-Control': 'no-store' } });
    }
    if (request.method === 'PUT') {
      const bytes = await request.arrayBuffer(); // D1 的 BLOB 要用 ArrayBuffer 綁定
      if (bytes.byteLength > MAX_BYTES) return fail(413, '檔案太大了');
      const type = request.headers.get('Content-Type') || 'application/octet-stream';
      const now = new Date().toISOString();
      if (url.searchParams.get('overwrite') === '1') {
        await db.prepare('INSERT INTO files (key, body, type, size, updated) VALUES (?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET body = excluded.body, type = excluded.type, size = excluded.size, updated = excluded.updated').bind(key, bytes, type, bytes.byteLength, now).run();
        return json({ ok: true });
      }
      const r = await db.prepare('INSERT OR IGNORE INTO files (key, body, type, size, updated) VALUES (?, ?, ?, ?, ?)').bind(key, bytes, type, bytes.byteLength, now).run();
      if (r.meta?.changes && who.role === 'admin' && key.startsWith('p/') && path.endsWith('.json')) {
        const job = sendPush(db, env, key.split('/')[1], pushNoteFor(path)).catch(() => 0);
        if (ctx?.waitUntil) ctx.waitUntil(job); else await job;
      }
      return r.meta?.changes ? json({ ok: true }, 201) : fail(409, '檔案已經存在');
    }
    if (request.method === 'DELETE') {
      await db.prepare('DELETE FROM files WHERE key = ?').bind(key).run();
      return json({ ok: true });
    }
  }

  if (route.startsWith('/ls/') && request.method === 'GET') {
    const dir = route.slice(4).replace(/\/+$/, '');
    if (!validPath(dir)) return fail(400, '路徑不對');
    const key = scopeKey(who, request, dir);
    if (!key) return fail(403, '要先選一位玩家');
    const prefix = `${key}/`;
    const { results } = await db.prepare('SELECT key FROM files WHERE key > ? AND key < ? ORDER BY key').bind(prefix, `${prefix}￿`).all();
    const seen = new Map();
    for (const { key: k } of results) {
      const rest = k.slice(prefix.length); const name = rest.split('/')[0];
      if (!seen.has(name)) seen.set(name, { name, path: `${dir}/${name}`, type: rest.includes('/') ? 'dir' : 'file' });
    }
    return json([...seen.values()]);
  }
  return fail(404, '沒有這個功能');
}

export default {
  async fetch(request, env, ctx) {
    try { return await handle(request, env, ctx); }
    catch (err) { return fail(500, `後台出錯了：${err.message}`); }
  },
};
