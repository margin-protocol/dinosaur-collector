// 新玩家計數（湘 11/26）：POST /hello 只收兩個遊戲網址、只記日期＋網址＋次數；審核員才看得到統計。
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import worker, { taiwanDay } from '../server/worker.js';

const sqlite = new DatabaseSync(':memory:');
const toSql = (v) => (v instanceof ArrayBuffer ? new Uint8Array(v) : v);
const fix = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v instanceof Uint8Array ? [...v] : v]));
function prepare(sql) { let args = []; const st = { bind(...a) { args = a.map(toSql); return st; }, async first() { const r = sqlite.prepare(sql).get(...args); return r ? fix(r) : null; }, async all() { return { results: sqlite.prepare(sql).all(...args).map(fix) }; }, async run() { const r = sqlite.prepare(sql).run(...args); return { meta: { changes: Number(r.changes) } }; } }; return st; }
const DB = { prepare, async batch(l) { return Promise.all(l.map((s) => s.run())); } };
const env = { DB };
const call = (method, path, { origin, token, body } = {}) => worker.fetch(new Request(`http://api.test${path}`, { method, headers: { ...(origin ? { Origin: origin } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body }), env, {});
const hello = (origin) => call('POST', '/hello', { origin });

// 台灣日期：UTC 16:00 已經是隔天
assert.equal(taiwanDay(Date.parse('2026-11-26T15:59:00Z')), '2026-11-26');
assert.equal(taiwanDay(Date.parse('2026-11-26T16:00:00Z')), '2026-11-27');

assert.equal((await hello('https://margin-protocol.github.io')).status, 200);
assert.equal((await hello('https://margin-protocol.github.io')).status, 200);
assert.equal((await hello('https://betweenthepages.pages.dev')).status, 200);
assert.equal((await hello('https://evil.example')).status, 403, '別的網站不能灌');
assert.equal((await hello()).status, 403, '沒有 Origin（例如 curl）不算');
assert.equal((await hello('http://127.0.0.1:8000')).status, 403, '本機只有測試開關打開才算');
assert.equal((await call('GET', '/hello')).status, 401, '只有 POST');
const cors = await hello('https://betweenthepages.pages.dev');
assert.equal(cors.headers.get('Access-Control-Allow-Origin'), '*');

// 只存日期、網址、次數
const cols = sqlite.prepare('PRAGMA table_info(new_players)').all().map((c) => c.name);
assert.deepEqual(cols, ['day', 'site', 'n']);

// 審核員才看得到
const token = 'REVIEW-test-token-123456';
const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))].map((b) => b.toString(16).padStart(2, '0')).join('');
assert.equal((await call('POST', '/admin/claim', { body: JSON.stringify({ hash }) })).status, 200);
assert.equal((await call('GET', '/admin/new-players')).status, 401);
const made = await (await call('POST', '/admin/players', { token, body: JSON.stringify({ name: '朋友' }) })).json();
assert.equal((await call('GET', '/admin/new-players', { token: made.invite })).status, 403, '玩家看不到');

sqlite.prepare("INSERT INTO new_players (day, site, n) VALUES ('2026-11-20', 'cf', 4)").run();
const stats = await (await call('GET', '/admin/new-players', { token })).json();
const today = taiwanDay();
assert.equal(stats.today, today);
assert.equal(stats.since, '2026-11-20');
assert.equal(stats.total, 8);
assert.deepEqual(stats.days.find((d) => d.day === today), { day: today, gh: 2, cf: 2, total: 4 });

// 一天一個網址最多 3000（被亂打也不會無限長）
sqlite.prepare("UPDATE new_players SET n = 3000 WHERE day = ? AND site = 'gh'").run(today);
await hello('https://margin-protocol.github.io');
assert.equal(sqlite.prepare("SELECT n FROM new_players WHERE day = ? AND site = 'gh'").get(today).n, 3000);

console.log('new players: hello only from game sites, TW day, counts only, admin-only stats, daily cap PASS');
