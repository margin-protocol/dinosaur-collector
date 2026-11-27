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
//   POST /timers {endpoint, keys, key, timers} → 回家／討伐提醒（不用邀請碼，見下面 timerRoute）
//   POST /timers/off {endpoint, key}    → 這支手機不再收提醒
//   POST /hello                         → 新玩家 +1（不用邀請碼，見下面 helloRoute）
//   GET  /admin/new-players             → 審核員看每日新玩家數
//   GET  /broadcast                     → 全服信箱（不用邀請碼，見下面 broadcastRoute）
//   POST /broadcast/<id>/claim          → 有人領了這封信的禮物（+1，給湘看人數）
//   GET  /giftcode/<雜湊>               → 全服兌換碼（不用邀請碼）
//   POST /giftcode/<雜湊>/claim         → 兌換一次（+1；碼有設名額時，額滿就拒絕）
//   GET  /admin/claims                  → 審核員看每封信、每組碼被領了幾次
//   Cron Trigger 每分鐘（* * * * *）→ runTimers 推出到期的提醒
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
    db.prepare('CREATE TABLE IF NOT EXISTS timer_subs (endpoint TEXT PRIMARY KEY, key_hash TEXT, p256dh TEXT, auth TEXT, seen INTEGER)'),
    db.prepare('CREATE TABLE IF NOT EXISTS timers (endpoint TEXT, at INTEGER, title TEXT, body TEXT, tag TEXT)'),
    db.prepare('CREATE INDEX IF NOT EXISTS timers_at ON timers (at)'),
    db.prepare('CREATE TABLE IF NOT EXISTS new_players (day TEXT, site TEXT, n INTEGER, PRIMARY KEY (day, site))'),
    db.prepare('CREATE INDEX IF NOT EXISTS timers_endpoint ON timers (endpoint)'),
    db.prepare('CREATE TABLE IF NOT EXISTS claims (k TEXT PRIMARY KEY, n INTEGER)'),
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
export const pushNoteFor = (path) => { const n = PUSH_NOTES.find(([p]) => path.startsWith(p)); return n ? { title: '頁間居民', body: n[1], tag: n[2] } : null; };
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
// 推一則通知到一個訂閱；回傳 'ok' | 'gone'（推播服務說這個訂閱已經不在了）| 'fail'
async function pushOne(env, sub, note, ttl = 86400) {
  const jwk = JSON.parse(env.VAPID_PRIVATE_JWK);
  try {
    const res = await fetch(sub.endpoint, { method: 'POST', headers: { Authorization: await vapidHeader(sub.endpoint, jwk, env.VAPID_SUBJECT || 'https://margin-protocol.github.io/dinosaur-collector/'), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: String(ttl), Urgency: 'normal', Topic: String(note.tag || 'siang').replace(/[^\w-]/g, '').slice(0, 32) || 'siang' }, body: await encryptPush(JSON.stringify(note), sub) });
    return res.status === 404 || res.status === 410 ? 'gone' : res.ok ? 'ok' : 'fail';
  } catch { return 'fail'; }
}
export async function sendPush(db, env, player, note) {
  if (!env.VAPID_PRIVATE_JWK || !note) return 0;
  const { results } = await db.prepare('SELECT endpoint, p256dh, auth FROM push_subs WHERE player = ?').bind(player).all();
  let sent = 0;
  await Promise.all(results.map(async (sub) => {
    const r = await pushOne(env, sub, note);
    if (r === 'gone') await db.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(sub.endpoint).run();
    else if (r === 'ok') sent += 1;
  }));
  return sent;
}

/* ---------- 回家／討伐提醒（湘 11/25：所有玩家都能開，不用邀請碼） ----------
   遊戲把「什麼時候回來」整份排好（合併、晚上安靜都在遊戲裡算好）送來，後台只負責時間到了推出去。
   POST /timers {endpoint, keys:{p256dh, auth}, key, timers:[{at, title, body, tag}]} → 整份換掉（空陣列＝都取消）
   POST /timers/off {endpoint, key} → 這支手機不再收提醒
   key 是遊戲在這支手機產生的亂數，只存雜湊；同一個 endpoint 之後要帶同一把 key 才能改。 */
export const TIMER_MAX = 8;
export const TIMER_AHEAD_MS = 30 * 3600e3; // 最遠排到 30 小時後（出門最長 8 小時、晚上安靜會延到早上）
const TIMER_HOSTS = /(^|\.)(googleapis\.com|push\.apple\.com|push\.services\.mozilla\.com|notify\.windows\.com)$/;
export const timerEndpointOk = (u, env = {}) => { try { const x = new URL(u); return (x.protocol === 'https:' && TIMER_HOSTS.test(x.hostname)) || (Boolean(env.TIMER_ALLOW_LOCAL) && x.hostname === '127.0.0.1'); } catch { return false; } };
const cleanText = (t, max) => String(t ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
async function timerRoute(route, request, env) {
  const db = env.DB;
  const body = await request.json().catch(() => ({}));
  const endpoint = String(body.endpoint || '');
  if (!timerEndpointOk(endpoint, env) || endpoint.length > 1000) return fail(400, '通知設定格式不對');
  if (!/^[\w-]{20,64}$/.test(body.key || '')) return fail(400, '通知設定格式不對');
  const keyHash = await sha256(body.key);
  const row = await db.prepare('SELECT key_hash FROM timer_subs WHERE endpoint = ?').bind(endpoint).first();
  if (row && row.key_hash !== keyHash) return fail(403, '這支手機的通知設定對不上，請關掉再重新開一次');
  if (route === '/timers/off') {
    await db.batch([db.prepare('DELETE FROM timers WHERE endpoint = ?').bind(endpoint), db.prepare('DELETE FROM timer_subs WHERE endpoint = ?').bind(endpoint)]);
    return json({ ok: true });
  }
  const p256dh = body.keys?.p256dh; const auth = body.keys?.auth;
  if (!/^[\w-]{80,100}$/.test(p256dh || '') || !/^[\w-]{16,32}$/.test(auth || '')) return fail(400, '通知設定格式不對');
  const list = Array.isArray(body.timers) ? body.timers : [];
  if (list.length > TIMER_MAX) return fail(400, `一次最多排 ${TIMER_MAX} 則`);
  const now = Date.now();
  const timers = [];
  for (const t of list) {
    const at = Math.round(Number(t?.at));
    if (!Number.isFinite(at) || at > now + TIMER_AHEAD_MS) return fail(400, '時間不對');
    const title = cleanText(t.title, 40); const text = cleanText(t.body, 140);
    if (!title || !text) return fail(400, '通知內容是空的');
    if (at > now - 60e3) timers.push({ at, title, body: text, tag: cleanText(t.tag, 32).replace(/[^\w-]/g, '') || 'siang-home' });
  }
  await db.batch([
    db.prepare('INSERT INTO timer_subs (endpoint, key_hash, p256dh, auth, seen) VALUES (?, ?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, seen = excluded.seen').bind(endpoint, keyHash, p256dh, auth, now),
    db.prepare('DELETE FROM timers WHERE endpoint = ?').bind(endpoint),
    ...timers.map((t) => db.prepare('INSERT INTO timers (endpoint, at, title, body, tag) VALUES (?, ?, ?, ?, ?)').bind(endpoint, t.at, t.title, t.body, t.tag)),
  ]);
  return json({ ok: true, count: timers.length });
}
// 每分鐘跑一次（Cron Trigger）：推出到期的提醒。免費方案一次最多 50 個對外連線、10ms CPU，所以一輪最多推 TIMER_BATCH 則，其餘下一分鐘接著推。
export const TIMER_BATCH = 20;
export async function runTimers(env, now = Date.now()) {
  const db = env.DB;
  if (!schemaReady) { await ensureSchema(db); schemaReady = true; }
  if (!env.VAPID_PRIVATE_JWK) return 0;
  await db.prepare('DELETE FROM timers WHERE at < ?').bind(now - 6 * 3600e3).run(); // 後台停太久沒推到的，就不補了
  const { results } = await db.prepare('SELECT t.rowid AS id, t.endpoint, t.title, t.body, t.tag, s.p256dh, s.auth FROM timers t JOIN timer_subs s ON s.endpoint = t.endpoint WHERE t.at <= ? ORDER BY t.at LIMIT ?').bind(now, TIMER_BATCH).all();
  if (!results.length) return 0;
  await db.batch(results.map((r) => db.prepare('DELETE FROM timers WHERE rowid = ?').bind(r.id)));
  let sent = 0; const gone = new Set();
  await Promise.all(results.map(async (r) => {
    const out = await pushOne(env, r, { title: r.title, body: r.body, tag: r.tag, kind: 'timer' }, 6 * 3600);
    if (out === 'gone') gone.add(r.endpoint); else if (out === 'ok') sent += 1;
  }));
  if (gone.size) await db.batch([...gone].flatMap((e) => [db.prepare('DELETE FROM timers WHERE endpoint = ?').bind(e), db.prepare('DELETE FROM timer_subs WHERE endpoint = ?').bind(e)]));
  return sent;
}
// 很久沒打開遊戲的手機（90 天）就從提醒名單拿掉
export async function cleanTimerSubs(env, now = Date.now()) {
  await env.DB.prepare('DELETE FROM timer_subs WHERE seen < ? AND endpoint NOT IN (SELECT endpoint FROM timers)').bind(now - 90 * 86400e3).run();
}
const validEndpoint = (u) => { try { const x = new URL(u); return x.protocol === 'https:' || (x.hostname === '127.0.0.1' && x.protocol === 'http:'); } catch { return false; } };

/* ---------- 新玩家計數（湘 11/26） ---------- */
// 遊戲第一次在一支手機打開（全新存檔）時打一次 POST /hello。後台只記「哪一天（台灣時間）、哪個網址、+1」，
// 不存 IP、裝置、token 或任何玩家資料；已經在玩的玩家不會補算，測試服（?test）不會送。
export const HELLO_SITES = { 'https://margin-protocol.github.io': 'gh', 'https://betweenthepages.pages.dev': 'cf' };
const HELLO_DAILY_MAX = 3000; // 一天一個網址最多算這麼多，免得被亂打灌爆
export const taiwanDay = (ms = Date.now()) => new Date(ms + 8 * 3600e3).toISOString().slice(0, 10);
async function helloRoute(request, env) {
  const origin = request.headers.get('Origin') || '';
  let site = HELLO_SITES[origin];
  if (!site && env.HELLO_ALLOW_LOCAL && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) site = 'local';
  if (!site) return fail(403, '不是遊戲網址');
  const day = taiwanDay();
  await env.DB.prepare('INSERT INTO new_players (day, site, n) VALUES (?, ?, 1) ON CONFLICT(day, site) DO UPDATE SET n = n + 1 WHERE n < ?').bind(day, site, HELLO_DAILY_MAX).run();
  return json({ ok: true });
}
async function newPlayerStats(db) {
  const { results } = await db.prepare('SELECT day, site, n FROM new_players ORDER BY day').all();
  const byDay = new Map();
  for (const r of results) {
    const d = byDay.get(r.day) || { day: r.day, gh: 0, cf: 0, total: 0 };
    if (r.site === 'gh' || r.site === 'cf') d[r.site] += r.n;
    d.total += r.n; byDay.set(r.day, d);
  }
  const days = [...byDay.values()];
  return { today: taiwanDay(), since: days[0]?.day || null, total: days.reduce((n, d) => n + d.total, 0), days };
}

/* ---------- 全服信箱、全服兌換碼（湘 11/27） ----------
   存檔在玩家手機裡，所以「發給所有人」的獎勵要讓遊戲自己來問。大部分玩家沒有邀請碼，這兩個都不用登入就能讀。
   內容是湘在審核室蓋過章的 JSON（審核員 PUT /f/shared/broadcast/<id>.json、/f/shared/giftcodes/<雜湊>.json），
   遊戲驗章後才採用，所以後台被亂寫也發不出假獎勵。「每份存檔只能領一次」記在玩家的存檔裡；
   後台只記一個匿名的人數（claims 表），兌換碼有設名額（payload.limit）時用它擋額滿。 */
export const BROADCAST_MAX = 30;
const parseSigned = (row) => { try { return JSON.parse(new TextDecoder().decode(new Uint8Array(row.body))); } catch { return null; } };
async function claimCount(db, k) { return (await db.prepare('SELECT n FROM claims WHERE k = ?').bind(k).first())?.n || 0; }
async function addClaim(db, k, limit = 0) {
  if (limit > 0) {
    const r = await db.prepare('INSERT INTO claims (k, n) VALUES (?, 1) ON CONFLICT(k) DO UPDATE SET n = n + 1 WHERE n < ?').bind(k, limit).run();
    return r.meta?.changes ? claimCount(db, k) : -1;
  }
  await db.prepare('INSERT INTO claims (k, n) VALUES (?, 1) ON CONFLICT(k) DO UPDATE SET n = n + 1').bind(k).run();
  return claimCount(db, k);
}
async function broadcastRoute(route, request, db) {
  if (route === '/broadcast' && request.method === 'GET') {
    const { results } = await db.prepare("SELECT body FROM files WHERE key > 'shared/broadcast/' AND key < 'shared/broadcast/￿' ORDER BY key DESC LIMIT ?").bind(BROADCAST_MAX).all();
    return json({ now: new Date().toISOString(), mail: results.map(parseSigned).filter(Boolean) });
  }
  let m = route.match(/^\/broadcast\/([\w-]{6,40})\/claim$/);
  if (m && request.method === 'POST') {
    const row = await db.prepare('SELECT key FROM files WHERE key = ?').bind(`shared/broadcast/${m[1]}.json`).first();
    if (!row) return fail(404, '這封信已經收回了');
    return json({ ok: true, n: await addClaim(db, `bc:${m[1]}`) });
  }
  m = route.match(/^\/giftcode\/([0-9a-f]{64})(\/claim)?$/);
  if (!m) return null;
  const row = await db.prepare('SELECT body FROM files WHERE key = ?').bind(`shared/giftcodes/${m[1]}.json`).first();
  if (!row) return fail(404, '沒有這組兌換碼');
  const signed = parseSigned(row);
  if (!m[2] && request.method === 'GET') return json({ signed, n: await claimCount(db, `gc:${m[1]}`) });
  if (m[2] && request.method === 'POST') {
    const limit = Math.max(0, Math.floor(Number(signed?.payload?.limit) || 0));
    const n = await addClaim(db, `gc:${m[1]}`, limit);
    return n < 0 ? fail(409, '這組兌換碼已經被領完了') : json({ ok: true, n });
  }
  return fail(405, '不支援');
}

async function handle(request, env, ctx) {
  const db = env.DB;
  const url = new URL(request.url);
  const route = decodeURIComponent(url.pathname);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (route === '/' || route === '/health') return json({ ok: true, app: 'siang-collector' });
  if (!schemaReady) { await ensureSchema(db); schemaReady = true; }
  if ((route === '/timers' || route === '/timers/off') && request.method === 'POST') return timerRoute(route, request, env);
  if (route === '/hello' && request.method === 'POST') return helloRoute(request, env);
  if (route.startsWith('/broadcast') || route.startsWith('/giftcode/')) { const r = await broadcastRoute(route, request, db); if (r) return r; }

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
    if (route === '/admin/new-players' && request.method === 'GET') return json(await newPlayerStats(db));
    if (route === '/admin/claims' && request.method === 'GET') { const { results } = await db.prepare('SELECT k, n FROM claims').all(); return json(Object.fromEntries(results.map((r) => [r.k, r.n]))); }
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
  async scheduled(event, env, ctx) {
    const now = event?.scheduledTime || Date.now();
    const job = runTimers(env, now).then(() => (new Date(now).getUTCHours() === 19 && new Date(now).getUTCMinutes() === 0 ? cleanTimerSubs(env, now) : 0));
    if (ctx?.waitUntil) ctx.waitUntil(job); else await job;
  },
};
