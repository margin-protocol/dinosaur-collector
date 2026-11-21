// 外出合照的臉部特效：美顏磨皮、口紅、小湘頭飾（11/21）
// 臉部追蹤用 MediaPipe Face Landmarker，程式和模型都放在 vendor/mediapipe/，在手機上跑，畫面不會上傳。
// 第一次選特效時才載入（約 13 MB，之後有快取）；舊手機跑不動（太慢、不支援）就自動關掉，只留一般濾鏡。
// 這個檔案的畫圖函式不碰 DOM 以外的東西，預覽（疊在影片上的畫布）和存檔（合成畫布）用同一套。

export const LIP_COLORS = [
  { id: 'none', name: '不擦' },
  { id: 'sakura', name: '櫻花粉', color: '#c46a7c' },
  { id: 'peach', name: '蜜桃', color: '#c97866' },
  { id: 'maple', name: '楓紅', color: '#9a3542' },
  { id: 'rosewood', name: '豆沙', color: '#a0636a' },
];

// 頭飾：place 'crown' 以頭頂為準，'side' 以頭頂往旁邊移；dx/dy 以臉寬為單位（dx 往畫面右、dy 往下）
// w = 寬度（臉寬的幾倍），ax/ay = 圖上對準定位點的位置（0–1），rot = 額外轉的角度
export const HEADPIECES = [
  { id: 'none', name: '不戴' },
  { id: 'sakura', name: '櫻花髮夾', src: 'assets/photo-fx/sakura-clip.svg', dx: 0.5, dy: 0.15, w: 0.56, ax: 0.5, ay: 0.5, rot: 24 },
  { id: 'dino', name: '恐龍角', src: 'assets/photo-fx/dino-horns.svg', dx: 0, dy: 0.08, w: 1.2, ax: 0.5, ay: 0.86, rot: 0 },
  { id: 'lantern', name: '府城燈籠', src: 'assets/photo-fx/lantern.svg', dx: -0.58, dy: 0.13, w: 0.44, ax: 0.5, ay: 0.08, rot: -14 },
  { id: 'egg', name: '蛋殼帽', src: 'assets/photo-fx/egg-shell.svg', dx: 0.03, dy: 0.07, w: 0.95, ax: 0.5, ay: 0.82, rot: -8 },
  { id: 'tiara', name: '星光皇冠', src: 'assets/photo-fx/star-tiara.svg', dx: 0, dy: 0.12, w: 0.8, ax: 0.5, ay: 0.9, rot: 0 },
];
export const lipById = (id) => LIP_COLORS.find((c) => c.id === id) || LIP_COLORS[0];
export const headpieceById = (id) => HEADPIECES.find((h) => h.id === id) || HEADPIECES[0];

export const DEFAULT_FX = { smooth: 0, lip: 'none', lipAmt: 55, crown: 'none' };
export function normalizeFx(raw) {
  const o = { ...DEFAULT_FX, ...(raw && typeof raw === 'object' ? raw : {}) };
  const num = (v, d) => (Number.isFinite(Number(v)) ? Math.min(100, Math.max(0, Math.round(Number(v)))) : d);
  return { smooth: num(o.smooth, 0), lip: lipById(o.lip).id, lipAmt: num(o.lipAmt, 55), crown: headpieceById(o.crown).id };
}
export const fxActive = (fx) => fx.smooth > 0 || fx.lip !== 'none' || fx.crown !== 'none';

// Face Mesh 的點位編號
const OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
const EYE_R = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7];
const EYE_L = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249];
const BROW_R = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
const BROW_L = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];
const LIP_OUT = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146];
const LIP_IN = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95];

// 來源（影片或照片）裁成 W×H 的對應：和 photo-booth 的 capture 一樣是置中裁切
export function coverMap(vw, vh, W, H) {
  const r = W / H; let sw = vw, sh = vh, sx = 0, sy = 0;
  if (vw / vh > r) { sw = vh * r; sx = (vw - sw) / 2; } else { sh = vw / r; sy = (vh - sh) / 2; }
  return { vw, vh, sx, sy, sw, sh, W, H };
}
// 正規化座標（0–1，相對整個來源）→ 畫布座標
export function project(lm, m) {
  const kx = m.W / m.sw, ky = m.H / m.sh;
  return lm.map((p) => ({ x: (p.x * m.vw - m.sx) * kx, y: (p.y * m.vh - m.sy) * ky }));
}

// 頭的姿勢：歪頭角度、臉寬、頭頂位置、左右轉頭的程度（-1 ~ 1）
export function headPose(pts) {
  const L = pts[234], R = pts[454], top = pts[10], chin = pts[152], nose = pts[1];
  const rx = R.x - L.x, ry = R.y - L.y; const faceW = Math.hypot(rx, ry) || 1;
  const ux = top.x - chin.x, uy = top.y - chin.y; const faceH = Math.hypot(ux, uy) || 1;
  const right = { x: rx / faceW, y: ry / faceW }; const up = { x: ux / faceH, y: uy / faceH };
  const mid = { x: (L.x + R.x) / 2, y: (L.y + R.y) / 2 };
  const yaw = Math.max(-1, Math.min(1, ((nose.x - mid.x) * right.x + (nose.y - mid.y) * right.y) / (faceW / 2)));
  const crown = { x: top.x + up.x * faceH * 0.24, y: top.y + up.y * faceH * 0.24 };
  return { angle: Math.atan2(ry, rx), faceW, faceH, right, up, crown, yaw };
}

function bbox(pts, idx, pad = 0) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const i of idx) { const p = pts[i]; if (p.x < x0) x0 = p.x; if (p.y < y0) y0 = p.y; if (p.x > x1) x1 = p.x; if (p.y > y1) y1 = p.y; }
  const w = x1 - x0, h = y1 - y0;
  return { x: x0 - w * pad, y: y0 - h * pad, w: w * (1 + 2 * pad), h: h * (1 + 2 * pad) };
}
function polygon(g, pts, idx, ox, oy, k, grow = 1) {
  let cx = 0, cy = 0; for (const i of idx) { cx += pts[i].x; cy += pts[i].y; } cx /= idx.length; cy /= idx.length;
  idx.forEach((i, n) => {
    const x = ((cx + (pts[i].x - cx) * grow) - ox) * k, y = ((cy + (pts[i].y - cy) * grow) - oy) * k;
    n ? g.lineTo(x, y) : g.moveTo(x, y);
  });
  g.closePath();
}

const pool = new Map();
function scratch(name, w, h) {
  let c = pool.get(name);
  if (!c) { c = document.createElement('canvas'); pool.set(name, c); }
  w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } else c.getContext('2d').clearRect(0, 0, w, h);
  return c;
}

// 磨皮：把臉的區域縮小再放大（＝模糊，Safari 的畫布不支援 ctx.filter），只留在臉上、避開眼睛眉毛嘴巴，邊緣柔柔的
function smoothSkin(g, source, pts, m, amount, pose) {
  const box = bbox(pts, OVAL, 0.06);
  const x0 = Math.max(0, box.x), y0 = Math.max(0, box.y);
  const x1 = Math.min(m.W, box.x + box.w), y1 = Math.min(m.H, box.y + box.h);
  if (x1 - x0 < 8 || y1 - y0 < 8) return;
  const bw = x1 - x0, bh = y1 - y0;
  // 模糊半徑跟臉的大小走（臉越大、縮得越小）；調輕一點，100 也只是柔焦，不會糊成一片（11/21 湘 iPhone 實測後）
  const cell = Math.max(2, pose.faceW / (60 - amount * 0.24));
  const sw = bw / cell, sh = bh / cell;
  // 先半半縮小，避免一次縮太多出現鋸齒
  const srcX = m.sx + x0 * m.sw / m.W, srcY = m.sy + y0 * m.sh / m.H, srcW = bw * m.sw / m.W, srcH = bh * m.sh / m.H;
  let w = bw, h = bh, cur = null, flip = 0;
  while (w / 2 > sw) {
    w /= 2; h /= 2;
    const c = scratch(`down${flip}`, w, h), cg = c.getContext('2d'); cg.imageSmoothingEnabled = true; cg.imageSmoothingQuality = 'high';
    if (cur) cg.drawImage(cur, 0, 0, cur.width, cur.height, 0, 0, c.width, c.height); else cg.drawImage(source, srcX, srcY, srcW, srcH, 0, 0, c.width, c.height);
    cur = c; flip ^= 1;
  }
  const small = scratch('small', sw, sh), sg = small.getContext('2d'); sg.imageSmoothingEnabled = true; sg.imageSmoothingQuality = 'high';
  if (cur) sg.drawImage(cur, 0, 0, cur.width, cur.height, 0, 0, small.width, small.height); else sg.drawImage(source, srcX, srcY, srcW, srcH, 0, 0, small.width, small.height);
  // 遮罩要漸層，不能有分界線：臉從中間往外一圈一圈淡掉（到髮際、下巴前就沒了），
  // 眼睛眉毛嘴巴也是一圈一圈挖掉，所以五官清楚、周圍慢慢過渡。不靠瀏覽器放大來柔邊（iPhone 放大很銳利）。
  const mk = Math.min(1, 160 / Math.max(bw, bh));
  const mask = scratch('mask', bw * mk, bh * mk), mg = mask.getContext('2d');
  const rings = (idx, from, to, n, alpha) => { for (let i = 0; i < n; i++) { mg.globalAlpha = alpha; mg.beginPath(); polygon(mg, pts, idx, x0, y0, mk, from + (to - from) * i / (n - 1)); mg.fill(); } };
  mg.fillStyle = '#000';
  rings(OVAL, 0.9, 0.5, 10, 0.2);
  mg.globalCompositeOperation = 'destination-out';
  for (const eye of [EYE_R, EYE_L]) rings(eye, 2.6, 1.2, 7, 0.3);
  for (const brow of [BROW_R, BROW_L]) rings(brow, 1.7, 1.0, 6, 0.3);
  rings(LIP_OUT, 1.5, 1.0, 6, 0.3);
  mg.globalCompositeOperation = 'source-over'; mg.globalAlpha = 1;
  const layer = scratch('layer', bw, bh), lg = layer.getContext('2d'); lg.imageSmoothingEnabled = true; lg.imageSmoothingQuality = 'high';
  lg.drawImage(small, 0, 0, small.width, small.height, 0, 0, bw, bh);
  lg.globalCompositeOperation = 'source-atop'; lg.fillStyle = `rgba(255,238,236,${amount / 100 * 0.04})`; lg.fillRect(0, 0, bw, bh);
  lg.globalCompositeOperation = 'destination-in'; lg.drawImage(mask, 0, 0, mask.width, mask.height, 0, 0, bw, bh);
  lg.globalCompositeOperation = 'source-over';
  g.save(); g.globalAlpha = 0.1 + amount / 100 * 0.55; g.drawImage(layer, 0, 0, bw, bh, x0, y0, bw, bh); g.restore();
}

// 口紅（霧面）：逐點算顏色，保留原本嘴唇的明暗和唇紋（只換色相、飽和度），邊緣一圈圈淡出（11/21 湘 iPhone 實測：舊版是一塊平平的貼紙）
// 預覽畫在透明畫布上，multiply 之類的混色沒有底圖可以混，所以這裡自己把嘴唇那塊的原圖讀進來算。
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
function paintLips(g, source, pts, m, color, amount) {
  const box = bbox(pts, LIP_OUT, 0.12);
  if (box.w < 6 || box.h < 3) return;
  const k = Math.min(1, 220 / box.w);
  const w = Math.max(2, Math.round(box.w * k)), h = Math.max(2, Math.round(box.h * k));
  const work = scratch('lip', w, h), wg = work.getContext('2d', { willReadFrequently: true });
  wg.drawImage(source, m.sx + box.x * m.sw / m.W, m.sy + box.y * m.sh / m.H, box.w * m.sw / m.W, box.h * m.sh / m.H, 0, 0, w, h);
  const mask = scratch('lipmask', w, h), mg = mask.getContext('2d', { willReadFrequently: true });
  const rings = (idx, from, to, n, alpha) => { for (let i = 0; i < n; i++) { mg.globalAlpha = alpha; mg.beginPath(); polygon(mg, pts, idx, box.x, box.y, k, from + (to - from) * i / (n - 1)); mg.fill(); } };
  mg.fillStyle = '#000'; rings(LIP_OUT, 1.0, 0.86, 6, 0.32);
  mg.globalCompositeOperation = 'destination-out'; rings(LIP_IN, 1.22, 1.0, 5, 0.4);
  mg.globalCompositeOperation = 'source-over'; mg.globalAlpha = 1;
  let img, mk;
  try { img = wg.getImageData(0, 0, w, h); mk = mg.getImageData(0, 0, w, h).data; } catch { return; }
  const d = img.data, [cr, cg, cb] = hex(color), cl = Math.max(1, lum(cr, cg, cb));
  // 嘴唇本身的平均亮度當基準：比平均亮的地方（反光）保持亮、暗的地方（唇紋、嘴角）保持暗
  let sum = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) if (mk[i + 3] > 200) { sum += lum(d[i], d[i + 1], d[i + 2]); n++; }
  const avg = n ? sum / n : 128, a = 0.12 + amount / 100 * 0.56;
  // 霧面（11/21 湘：太亮了要霧一點）：不比原本唇色亮、反光壓平、顏色帶一點原本的灰
  const tone = Math.min(1, Math.max(0.74, avg / cl));
  for (let i = 0; i < d.length; i += 4) {
    const t = mk[i + 3] / 255 * a; if (!t) { d[i + 3] = 0; continue; }
    const L = lum(d[i], d[i + 1], d[i + 2]);
    const r = L / avg, f = (r > 1 ? 1 + (r - 1) * 0.2 : Math.pow(r, 0.85)) * tone;
    // 顏色直接換成口紅色（帶原本明暗），透明度 = 遮罩 × 濃淡：疊在原圖上就是兩者混合，邊緣自然淡出
    const gray = L * 0.85;
    d[i] = Math.min(255, cr * f * 0.92 + gray * 0.08); d[i + 1] = Math.min(255, cg * f * 0.92 + gray * 0.08); d[i + 2] = Math.min(255, cb * f * 0.92 + gray * 0.08);
    d[i + 3] = Math.round(t * 255);
  }
  wg.putImageData(img, 0, 0);
  g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(work, 0, 0, w, h, box.x, box.y, box.w, box.h); g.restore();
}

// 頭飾：跟著頭轉、歪頭，轉頭時往那邊偏一點、寬度稍微收
function drawHeadpiece(g, img, h, pose) {
  if (!img?.naturalWidth) return;
  const w = pose.faceW * h.w, hh = w * img.naturalHeight / img.naturalWidth;
  const { crown, right, faceW, yaw } = pose; const down = { x: -pose.up.x, y: -pose.up.y };
  const shift = h.place === 'side' ? 0 : yaw * 0.12;
  const px = crown.x + (right.x * (h.dx + shift) + down.x * h.dy) * faceW;
  const py = crown.y + (right.y * (h.dx + shift) + down.y * h.dy) * faceW;
  g.save(); g.translate(px, py); g.rotate(pose.angle + (h.rot || 0) * Math.PI / 180);
  g.scale(1 - Math.abs(yaw) * (h.dx ? 0.1 : 0.22), 1);
  g.shadowColor = 'rgba(0,0,0,.22)'; g.shadowBlur = Math.max(2, faceW * 0.03); g.shadowOffsetY = faceW * 0.012;
  g.drawImage(img, -w * h.ax, -hh * h.ay, w, hh); g.restore();
}

const imgs = new Map();
export function headpieceImage(id) {
  const h = headpieceById(id); if (!h.src) return null;
  let img = imgs.get(id);
  if (!img) { img = new Image(); img.decoding = 'async'; img.src = h.src; imgs.set(id, img); }
  return img;
}

// 在 g 上（座標 = m.W × m.H 的裁切畫面）畫所有臉的特效
export function drawFaceFx(g, source, faces, fx, m) {
  if (!faces?.length || !fxActive(fx)) return 0;
  const lip = lipById(fx.lip), hp = headpieceById(fx.crown), img = headpieceImage(hp.id);
  let n = 0;
  for (const lm of faces) {
    if (!lm || lm.length < 468) continue;
    const pts = project(lm, m); const pose = headPose(pts);
    if (pose.faceW < 12) continue;
    if (fx.smooth > 0) smoothSkin(g, source, pts, m, fx.smooth, pose);
    if (lip.color && fx.lipAmt > 0) paintLips(g, source, pts, m, lip.color, fx.lipAmt);
    if (img) drawHeadpiece(g, img, { place: hp.dx ? 'side' : 'crown', ...hp }, pose);
    n += 1;
  }
  return n;
}

// ---------- 臉部追蹤器 ----------
const SLOW_KEY = 'siang-collector:face-fx-slow:v1';
const BASE = new URL('../vendor/mediapipe/', import.meta.url).href;

// 一開始就看得出跑不動的手機：不支援 WebAssembly SIMD、沒有 WebGL、記憶體很小
export function faceFxSupport() {
  try {
    if (typeof WebAssembly !== 'object') return 'old';
    // (module (func (result v128) i32.const 0 i8x16.splat))
    const simd = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);
    if (!WebAssembly.validate(simd)) return 'old';
    if (navigator.deviceMemory && navigator.deviceMemory < 2) return 'old';
    const c = document.createElement('canvas');
    if (!(c.getContext('webgl2') || c.getContext('webgl'))) return 'old';
    if (localStorage.getItem(SLOW_KEY)) return 'slow';
  } catch { /* 無痕模式讀不到 localStorage 也沒關係 */ }
  return 'ok';
}
export function rememberSlow(on) { try { on ? localStorage.setItem(SLOW_KEY, String(Date.now())) : localStorage.removeItem(SLOW_KEY); } catch { /* */ } }

let loading = null;
export function loadTracker() {
  if (!loading) loading = (async () => {
    const vision = await import(`${BASE}vision_bundle.mjs`);
    const fileset = { wasmLoaderPath: `${BASE}vision_wasm_internal.js`, wasmBinaryPath: `${BASE}vision_wasm_internal.wasm` };
    const make = (delegate) => vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: `${BASE}face_landmarker.task`, delegate },
      runningMode: 'VIDEO', numFaces: 3, minFaceDetectionConfidence: 0.5, minFacePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
    });
    let lm; try { lm = await make('GPU'); } catch { lm = await make('CPU'); }
    let last = 0;
    return {
      // 影片或照片都用 VIDEO 模式（時間戳要一直往前）
      detect(source) {
        const t = Math.max(last + 1, Math.round(performance.now())); last = t;
        return lm.detectForVideo(source, t)?.faceLandmarks || [];
      },
    };
  })().catch((err) => { loading = null; throw err; });
  return loading;
}
