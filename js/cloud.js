// 雲端連線，兩種模式，對外介面完全一樣（test／exists／getJSON／getBytes／list／putBytes／putJSON／remove）：
// 1. 小湘雲端（Cloudflare 後台，server/worker.js）：玩家貼湘給的邀請碼 SIANG-…；審核員用自己的通行碼，帶 player 選玩家。
// 2. 舊版 GitHub 私人 repo：owner/repo ＋ fine-grained token（還沒換邀請碼的玩家繼續能用）。
// 邀請碼與 token 只存在這支手機的瀏覽器，不寫進程式碼、不放進遊戲存檔。
export const CLOUD_KEY = 'siang-collector:cloud:v1';
const API = 'https://api.github.com';
export const SIANG_API = 'https://siang-collector-api.a2007014.workers.dev';
const apiBase = () => globalThis.SIANG_API_OVERRIDE || SIANG_API; // 測試時換成本機後台
export const isInvite = (text) => /^SIANG-[\w-]{16,}$/.test(String(text || '').trim());

export function cloudConfig(key = CLOUD_KEY) {
  try {
    const c = JSON.parse(localStorage.getItem(key) || 'null');
    if (c && c.kind === 'siang' && typeof c.token === 'string' && c.token) return c;
    if (c && /^[\w.-]+\/[\w.-]+$/.test(c.repo) && typeof c.token === 'string' && c.token) return c;
  } catch {}
  return null;
}
export function saveCloudConfig(config, key = CLOUD_KEY) {
  if (!config) { localStorage.removeItem(key); return; }
  if (config.kind === 'siang') { localStorage.setItem(key, JSON.stringify({ kind: 'siang', token: config.token.trim(), ...(config.player ? { player: config.player } : {}), ...(config.name ? { name: config.name } : {}) })); return; }
  localStorage.setItem(key, JSON.stringify({ repo: config.repo.trim(), token: config.token.trim() }));
}

const b64encode = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
const b64decode = (b64) => Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0));
const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');

export class CloudError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

// 小湘雲端（Cloudflare Worker）
function createSiangCloud(config) {
  const base = apiBase();
  const headers = { Authorization: `Bearer ${config.token}`, ...(config.player ? { 'X-Player': config.player } : {}) };
  const enc = (path) => path.split('/').map(encodeURIComponent).join('/');
  async function call(method, route, { body, type, ok404 = false } = {}) {
    let res;
    try { res = await fetch(`${base}${route}`, { method, headers: body !== undefined ? { ...headers, 'Content-Type': type || 'application/json' } : headers, body, cache: 'no-store' }); }
    catch { throw new CloudError('連不上小湘雲端，請確認網路', 0); }
    if (res.status === 404 && ok404) return null;
    if (!res.ok) {
      const msg = await res.json().then((j) => j.error).catch(() => '');
      throw new CloudError(res.status === 401 ? '邀請碼不對、過期，或已經被停用' : msg || `小湘雲端回應 ${res.status}`, res.status);
    }
    return res;
  }
  const typeOf = (path) => (path.endsWith('.json') ? 'application/json' : path.endsWith('.jpg') ? 'image/jpeg' : 'application/octet-stream');
  return {
    repo: '小湘雲端', kind: 'siang',
    async test() { const me = await (await call('GET', '/me')).json(); return { private: true, ...me }; },
    async exists(path) { return Boolean(await call('GET', `/f/${enc(path)}`, { ok404: true })); },
    async getBytes(path) { const r = await call('GET', `/f/${enc(path)}`, { ok404: true }); return r ? new Uint8Array(await r.arrayBuffer()) : null; },
    async getJSON(path) { const r = await call('GET', `/f/${enc(path)}`, { ok404: true }); return r ? { sha: null, data: await r.json() } : null; },
    async list(dir) { const r = await call('GET', `/ls/${enc(dir.replace(/\/+$/, ''))}`, { ok404: true }); return r ? (await r.json()).map((d) => ({ ...d, sha: null })) : []; },
    async putBytes(path, bytes, _message, { overwrite = false } = {}) {
      await call('PUT', `/f/${enc(path)}${overwrite ? '?overwrite=1' : ''}`, { body: bytes, type: typeOf(path) });
      return {};
    },
    async putJSON(path, data, message, options) { return this.putBytes(path, new TextEncoder().encode(JSON.stringify(data, null, 2)), message, options); },
    async remove(path) { await call('DELETE', `/f/${enc(path)}`); },
    // 審核員專用
    async players() { return (await call('GET', '/admin/players')).json(); },
    async newPlayers() { return (await call('GET', '/admin/new-players')).json(); },
    async addPlayer(name) { return (await call('POST', '/admin/players', { body: JSON.stringify({ name }) })).json(); },
    async playerAction(id, action, body = {}) { return (await call('POST', `/admin/players/${id}/${action}`, { body: JSON.stringify(body) })).json(); },
  };
}

// 審核員第一次設定：在這支手機產生通行碼，只把雜湊交給後台
export async function claimReviewer() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const token = `REVIEW-${btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const hash = [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const res = await fetch(`${apiBase()}/admin/claim`, { method: 'POST', body: JSON.stringify({ hash }), headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new CloudError(res.status === 409 ? '審核員通行碼已經設定過了，請貼上妳存起來的那組' : `小湘雲端回應 ${res.status}`, res.status);
  return token;
}
export async function reviewerClaimed() {
  const res = await fetch(`${apiBase()}/admin/status`, { cache: 'no-store' });
  return res.ok ? (await res.json()).claimed : null;
}

export function createCloud(config) {
  if (config?.kind === 'siang') return createSiangCloud(config);
  const headers = { Authorization: `Bearer ${config.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  const url = (path) => `${API}/repos/${config.repo}/contents/${encodePath(path)}`;

  async function request(method, path, body) {
    const res = await fetch(url(path) + (method === 'GET' ? `?t=${Date.now()}` : ''), { method, headers: body ? { ...headers, 'Content-Type': 'application/json' } : headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) throw new CloudError(res.status === 401 || res.status === 403 ? 'token 無效、過期，或沒有這個 repo 的權限' : `GitHub 回應 ${res.status}`, res.status);
    return res.status === 204 ? {} : res.json();
  }

  async function getFile(path) {
    const data = await request('GET', path);
    if (!data || Array.isArray(data)) return null;
    return { sha: data.sha, bytes: b64decode(data.content || '') };
  }

  return {
    repo: config.repo,
    async test() {
      const res = await fetch(`${API}/repos/${config.repo}`, { headers, cache: 'no-store' });
      if (!res.ok) throw new CloudError(res.status === 404 ? '找不到這個 repo（名稱錯誤，或 token 沒有它的權限）' : res.status === 401 ? 'token 無效或已過期' : `GitHub 回應 ${res.status}`, res.status);
      const repo = await res.json();
      return { private: repo.private };
    },
    async exists(path) { return Boolean(await request('GET', path)); },
    async getJSON(path) {
      const file = await getFile(path);
      return file ? { sha: file.sha, data: JSON.parse(new TextDecoder().decode(file.bytes)) } : null;
    },
    async getBytes(path) { return (await getFile(path))?.bytes || null; },
    async list(dir) {
      const data = await request('GET', dir);
      return Array.isArray(data) ? data.map((d) => ({ name: d.name, path: d.path, type: d.type, sha: d.sha })) : [];
    },
    // 新檔案直接寫；要覆蓋既有檔案時帶 overwrite，會先取得 sha
    async putBytes(path, bytes, message, { overwrite = false } = {}) {
      let sha;
      if (overwrite) sha = (await request('GET', path))?.sha;
      return request('PUT', path, { message, content: b64encode(bytes), ...(sha ? { sha } : {}) });
    },
    async putJSON(path, data, message, options) {
      return this.putBytes(path, new TextEncoder().encode(JSON.stringify(data, null, 2)), message, options);
    },
    async remove(path, message) {
      const sha = (await request('GET', path))?.sha;
      if (sha) await request('DELETE', path, { message, sha });
    },
  };
}
