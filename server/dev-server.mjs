// 本機測試用：用 Node 內建的 SQLite 模擬 Cloudflare D1，跑同一份 worker.js
// node server/dev-server.mjs [port]
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import worker from './worker.js';

const sqlite = new DatabaseSync(':memory:');
const toSql = (v) => (v instanceof ArrayBuffer ? new Uint8Array(v) : v);
function prepare(sql) {
  let args = [];
  const stmt = {
    bind(...a) { args = a.map(toSql); return stmt; },
    async first() { const r = sqlite.prepare(sql).get(...args); return r ? fix(r) : null; },
    async all() { return { results: sqlite.prepare(sql).all(...args).map(fix) }; },
    async run() { const r = sqlite.prepare(sql).run(...args); return { meta: { changes: Number(r.changes) } }; },
  };
  return stmt;
}
const fix = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v instanceof Uint8Array ? [...v] : v]));
const DB = { prepare, async batch(list) { return Promise.all(list.map((s) => s.run())); } };

const port = Number(process.argv[2] || 8787);
http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const request = new Request(`http://127.0.0.1:${port}${req.url}`, { method: req.method, headers: req.headers, body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : body });
  const r = await worker.fetch(request, { DB });
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(port, () => console.log(`siang api dev on ${port}`));
