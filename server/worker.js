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

async function handle(request, env) {
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
  async fetch(request, env) {
    try { return await handle(request, env); }
    catch (err) { return fail(500, `後台出錯了：${err.message}`); }
  },
};
