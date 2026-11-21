// 外出合照的臉部特效：美顏磨皮、小湘頭飾（11/21；口紅試過三版湘覺得不好看，拿掉了）
// 臉部追蹤用 MediaPipe Face Landmarker，程式和模型都放在 vendor/mediapipe/，在手機上跑，畫面不會上傳。
// 第一次選特效時才載入（約 13 MB，之後有快取）；舊手機跑不動（太慢、不支援）就自動關掉，只留一般濾鏡。
// 這個檔案的畫圖函式不碰 DOM 以外的東西，預覽（疊在影片上的畫布）和存檔（合成畫布）用同一套。

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
export const headpieceById = (id) => HEADPIECES.find((h) => h.id === id) || HEADPIECES[0];

export const DEFAULT_FX = { smooth: 0, crown: 'none' };
export function normalizeFx(raw) {
  const o = { ...DEFAULT_FX, ...(raw && typeof raw === 'object' ? raw : {}) };
  const num = (v, d) => (Number.isFinite(Number(v)) ? Math.min(100, Math.max(0, Math.round(Number(v)))) : d);
  return { smooth: num(o.smooth, 0), crown: headpieceById(o.crown).id };
}
export const fxActive = (fx) => fx.smooth > 0 || fx.crown !== 'none';

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
  // 只磨皮膚（11/21 湘：美顏會被頭髮影響）：在較小的解析度逐點算透明度
  //  1) 臉形漸層遮罩（一圈圈淡出，五官挖空）
  //  2) 像不像皮膚：跟臉頰、額頭取樣的膚色差太多（頭髮、眉毛、陰影裡的髮絲）就不磨
  //  3) 邊緣：原圖和模糊後差很多的地方（髮絲、髮際線、輪廓）就不磨，所以頭髮的顏色不會被暈進皮膚
  const pk = Math.min(1, 300 / Math.max(bw, bh));
  const pw = Math.max(2, Math.round(bw * pk)), ph = Math.max(2, Math.round(bh * pk));
  const orig = scratch('orig', pw, ph), og = orig.getContext('2d', { willReadFrequently: true });
  og.drawImage(source, srcX, srcY, srcW, srcH, 0, 0, pw, ph);
  const blur = scratch('blur', pw, ph), bg = blur.getContext('2d', { willReadFrequently: true }); bg.imageSmoothingEnabled = true; bg.imageSmoothingQuality = 'high';
  bg.drawImage(small, 0, 0, small.width, small.height, 0, 0, pw, ph);
  const mask = scratch('mask', pw, ph), mg = mask.getContext('2d', { willReadFrequently: true });
  const rings = (idx, from, to, n, alpha) => { for (let i = 0; i < n; i++) { mg.globalAlpha = alpha; mg.beginPath(); polygon(mg, pts, idx, x0, y0, pk, from + (to - from) * i / (n - 1)); mg.fill(); } };
  mg.fillStyle = '#000';
  rings(OVAL, 0.9, 0.5, 10, 0.2);
  mg.globalCompositeOperation = 'destination-out';
  for (const eye of [EYE_R, EYE_L]) rings(eye, 2.6, 1.2, 7, 0.3);
  for (const brow of [BROW_R, BROW_L]) rings(brow, 1.7, 1.0, 6, 0.3);
  rings(LIP_OUT, 1.5, 1.0, 6, 0.3);
  mg.globalCompositeOperation = 'source-over'; mg.globalAlpha = 1;
  let od, bd, md;
  try { od = og.getImageData(0, 0, pw, ph).data; bd = bg.getImageData(0, 0, pw, ph); md = mg.getImageData(0, 0, pw, ph).data; } catch { return; }
  const out = bd.data;
  // 膚色取樣：兩邊臉頰和額頭中間，各取一小塊取中位數（避開剛好有髮絲的那塊）
  const samples = [];
  for (const i of [50, 280, 151, 101, 330]) {
    const cx = Math.round((pts[i].x - x0) * pk), cy = Math.round((pts[i].y - y0) * pk), r = Math.max(1, Math.round(pose.faceW * pk * 0.03));
    let sr = 0, sg2 = 0, sb = 0, n = 0;
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      if (x < 0 || y < 0 || x >= pw || y >= ph) continue; const k = (y * pw + x) * 4; sr += od[k]; sg2 += od[k + 1]; sb += od[k + 2]; n++;
    }
    if (n) samples.push([sr / n, sg2 / n, sb / n]);
  }
  if (!samples.length) return;
  const med = (c) => samples.map((v) => v[c]).sort((p, q) => p - q)[samples.length >> 1];
  const ref = [med(0), med(1), med(2)];
  const refL = 0.299 * ref[0] + 0.587 * ref[1] + 0.114 * ref[2] || 1;
  const tint = amount / 100 * 0.04;
  for (let k = 0; k < out.length; k += 4) {
    const mv = md[k + 3]; if (!mv) { out[k + 3] = 0; continue; }
    const r = od[k], gg = od[k + 1], b = od[k + 2];
    // 膚色距離：亮度用比例看（臉上有光影），色度用差值看
    const L = 0.299 * r + 0.587 * gg + 0.114 * b, ratio = L / refL;
    const chroma = Math.hypot(r / (L || 1) - ref[0] / refL, b / (L || 1) - ref[2] / refL) * 100;
    const ws = (ratio < 0.45 || ratio > 1.8) ? 0 : Math.max(0, Math.min(1, 1 - (chroma - 14) / 22)) * Math.min(1, (ratio - 0.45) / 0.2);
    const de = Math.abs(r - out[k]) + Math.abs(gg - out[k + 1]) + Math.abs(b - out[k + 2]);
    const we = Math.max(0, Math.min(1, 1 - (de - 70) / 80));
    const t = mv / 255 * ws * we;
    out[k] = out[k] + (255 - out[k]) * tint; out[k + 1] = out[k + 1] + (238 - out[k + 1]) * tint; out[k + 2] = out[k + 2] + (236 - out[k + 2]) * tint;
    out[k + 3] = Math.round(t * 255);
  }
  bg.putImageData(bd, 0, 0);
  g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.globalAlpha = 0.15 + amount / 100 * 0.6; g.drawImage(blur, 0, 0, pw, ph, x0, y0, bw, bh); g.restore();
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
  const hp = headpieceById(fx.crown), img = headpieceImage(hp.id);
  let n = 0;
  for (const lm of faces) {
    if (!lm || lm.length < 468) continue;
    const pts = project(lm, m); const pose = headPose(pts);
    if (pose.faceW < 12) continue;
    if (fx.smooth > 0) smoothSkin(g, source, pts, m, fx.smooth, pose);
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
