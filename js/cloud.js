// 私人 repo 連線（GitHub REST API）。玩家與審核員各自貼上自己的 fine-grained token，
// token 只存在這支手機的瀏覽器，不寫進程式碼、不放進遊戲存檔。
export const CLOUD_KEY = 'siang-collector:cloud:v1';
const API = 'https://api.github.com';

export function cloudConfig(key = CLOUD_KEY) {
  try {
    const c = JSON.parse(localStorage.getItem(key) || 'null');
    if (c && /^[\w.-]+\/[\w.-]+$/.test(c.repo) && typeof c.token === 'string' && c.token) return c;
  } catch {}
  return null;
}
export function saveCloudConfig(config, key = CLOUD_KEY) {
  if (!config) { localStorage.removeItem(key); return; }
  localStorage.setItem(key, JSON.stringify({ repo: config.repo.trim(), token: config.token.trim() }));
}

const b64encode = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
const b64decode = (b64) => Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0));
const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');

export class CloudError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export function createCloud(config) {
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
