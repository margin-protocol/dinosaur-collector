// 數位簽章：審核員（湘）的私鑰只存在她的手機；公鑰寫在 js/reviewer-key.js，公開無妨。
// 遊戲只接受用公鑰驗證通過的審核結果、暗號、約會碼，玩家改得動檔案，也偽造不了湘的章。
const ALG = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGN = { name: 'ECDSA', hash: 'SHA-256' };

// 鍵依字母排序的 JSON，簽章與驗證時內容一致
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
const toB64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

export const generateKeys = () => crypto.subtle.generateKey(ALG, true, ['sign', 'verify']);
export const exportJwk = (key) => crypto.subtle.exportKey('jwk', key);
export const importPrivate = (jwk) => crypto.subtle.importKey('jwk', jwk, ALG, true, ['sign']);
export const importPublic = (jwk) => crypto.subtle.importKey('jwk', { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }, ALG, true, ['verify']);
export function publicFromPrivate(jwk) { return { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }; }

export async function signPayload(privateKey, payload) {
  const sig = await crypto.subtle.sign(SIGN, privateKey, new TextEncoder().encode(canonical(payload)));
  return { payload, sig: toB64url(sig) };
}

export async function verifySigned(publicJwk, signed) {
  if (Array.isArray(publicJwk)) {
    for (const jwk of publicJwk) if (await verifySigned(jwk, signed)) return true;
    return false;
  }
  if (!publicJwk || !signed?.payload || typeof signed.sig !== 'string') return false;
  try {
    const key = await importPublic(publicJwk);
    return await crypto.subtle.verify(SIGN, key, fromB64url(signed.sig), new TextEncoder().encode(canonical(signed.payload)));
  } catch { return false; }
}

// 暗號正規化：忽略空白、標點、全形半形、大小寫
export function normalizeCode(text) {
  return String(text || '').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
}
export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
