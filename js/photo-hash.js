// 照片指紋：縮成 9×8 灰階算差異雜湊，再加上平均顏色，判斷兩張照片是不是幾乎一樣。照片本身不保存。
async function bitmap(file) {
  if (globalThis.createImageBitmap) return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try { const img = new Image(); img.src = url; await img.decode(); return img; } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
export async function photoHash(file) {
  const img = await bitmap(file);
  const c = document.createElement('canvas'); c.width = 9; c.height = 8;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, 9, 8);
  img.close?.();
  const d = ctx.getImageData(0, 0, 9, 8).data;
  let bits = ''; let r = 0; let g = 0; let b = 0;
  const lum = (i) => d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
  for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) { const i = (y * 9 + x) * 4; bits += lum(i) > lum(i + 4) ? '1' : '0'; }
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4;
  const hex = bits.match(/.{4}/g).map((q) => parseInt(q, 2).toString(16)).join('');
  return `${hex}-${[r, g, b].map((v) => Math.floor(v / n / 32)).join('')}`;
}
export function similarPhoto(a, b) {
  const [ha, ca] = a.split('-'); const [hb, cb] = b.split('-');
  if (ca !== cb || !ha || ha.length !== hb.length) return false;
  let diff = 0;
  for (let i = 0; i < ha.length; i += 1) { let x = parseInt(ha[i], 16) ^ parseInt(hb[i], 16); while (x) { diff += x & 1; x >>= 1; } }
  return diff <= 5;
}
