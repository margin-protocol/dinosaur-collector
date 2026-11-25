// 外出合照：選一位已收集的小湘 → 打開相機 → 把小湘放在畫面裡（拖曳移動、雙指或滑桿縮放、左右翻轉）→ 拍下合成照片
// 拍照前可以選濾鏡（photo-filters.js），預覽即時套用，存下來的照片也有同樣的濾鏡（署名不套）。
// 照片只在手機上合成，不上傳；拍好後可以分享或存到手機。
// 相機打不開（沒權限、沒有相機）時，可以改用拍照／相簿選一張照片當背景。
// 臉部特效（美顏磨皮、小湘頭飾，face-fx.js）：預覽畫在影片上面的 .photo-face 畫布，拍照時用同一套畫進照片（11/21）。
import { CHARACTERS, characterSources, loadWithFallback } from './eggs.js';
import { PHOTO_FILTERS, filterById, cssFilter, overlayCss, applyPhotoFilter } from './photo-filters.js';
import { HEADPIECES, normalizeFx, fxActive, coverMap, drawFaceFx, headpieceImage, faceFxSupport, rememberSlow, loadTracker } from './face-fx.js';

const FILTER_KEY = 'siang-collector:photo-filter:v1';
const FACE_FX_KEY = 'siang-collector:face-fx:v1';
const TAB_KEY = 'siang-collector:photo-tab:v1';

const RATIO = 3 / 4; // 畫面寬：高
const MAX_W = 1440;

export function createPhotoBooth({ dialog, getState, onTaken = () => {} }) {
  const $ = (sel) => dialog.querySelector(sel);
  const pick = $('.photo-pick'), cam = $('.photo-cam'), result = $('.photo-result');
  const stage = $('.photo-stage'), video = $('.photo-video'), still = $('.photo-still'), sprite = $('.photo-siang');
  const size = $('.photo-size'), status = $('.photo-status'), fileInput = $('.photo-file');
  let stream = null, facing = 'environment', no = null, blob = null, url = null, mirrored = false;
  const pos = { x: 0.5, y: 0.97, h: 0.62, flip: false };
  const fxLayer = $('.photo-fx'), fxOverlay = $('.photo-fx-overlay'), filterRow = $('.photo-filters');
  let filter = PHOTO_FILTERS[0];
  try { filter = filterById(localStorage.getItem(FILTER_KEY)); } catch { /* 無痕模式 */ }

  // 濾鏡按鈕：小圓圈用同一個濾鏡預覽一塊樣本色
  filterRow.replaceChildren(...PHOTO_FILTERS.map((f) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'photo-filter'; b.dataset.filter = f.id;
    b.setAttribute('role', 'radio');
    const sw = document.createElement('span'); sw.className = 'photo-filter__swatch'; sw.style.filter = cssFilter(f);
    const ov = document.createElement('span'); ov.className = 'photo-filter__tint'; ov.style.background = overlayCss(f);
    sw.append(ov);
    const name = document.createElement('span'); name.className = 'photo-filter__name'; name.textContent = f.name;
    b.append(sw, name); return b;
  }));
  function setFilter(f) {
    filter = f;
    fxLayer.style.filter = cssFilter(f); fxOverlay.style.background = overlayCss(f);
    filterRow.querySelectorAll('.photo-filter').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.filter === f.id)));
    try { localStorage.setItem(FILTER_KEY, f.id); } catch { /* 存不了也沒關係 */ }
  }
  setFilter(filter);

  // ---------- 臉部特效 ----------
  const face = $('.photo-face'), faceCtx = face.getContext('2d');
  const badge = $('.photo-fx-badge'), note = $('.photo-fx-note__text'), retry = $('.photo-fx-retry');
  const smoothIn = $('.photo-smooth');
  let fx = normalizeFx(null);
  try { fx = normalizeFx(JSON.parse(localStorage.getItem(FACE_FX_KEY) || 'null')); } catch { /* */ }
  let tracker = null, fxState = 'idle', faces = [], stillFaces = null, loopId = 0, lastFrame = -1, lastFaceAt = 0, perf = [];
  const chip = (cls, data, label, inner) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = `photo-chip ${cls}`; b.setAttribute('role', 'radio');
    Object.assign(b.dataset, data);
    const sw = document.createElement('span'); sw.className = 'photo-chip__swatch'; inner(sw);
    const name = document.createElement('span'); name.className = 'photo-chip__name'; name.textContent = label;
    b.append(sw, name); return b;
  };
  $('.photo-crowns').replaceChildren(...HEADPIECES.map((h) => chip('photo-crown', { crown: h.id }, h.name, (sw) => {
    if (!h.src) { sw.classList.add('is-none'); return; }
    const img = document.createElement('img'); img.alt = ''; img.src = h.src; img.decoding = 'async'; sw.append(img);
  })));
  function syncFxUi() {
    smoothIn.value = String(fx.smooth); $('.photo-smooth-val').textContent = String(fx.smooth);
    dialog.querySelectorAll('.photo-crown').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.crown === fx.crown)));
  }
  function setFx(patch) {
    fx = normalizeFx({ ...fx, ...patch }); syncFxUi();
    try { localStorage.setItem(FACE_FX_KEY, JSON.stringify(fx)); } catch { /* */ }
    if (fx.crown !== 'none') headpieceImage(fx.crown);
    ensureTracker(); updateNote(); startLoop();
  }
  function setTab(id) {
    dialog.querySelectorAll('.photo-tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === id)));
    dialog.querySelectorAll('.photo-panel').forEach((p) => { p.hidden = p.dataset.panel !== id; });
    dialog.dataset.tab = id;
    try { localStorage.setItem(TAB_KEY, id); } catch { /* */ }
    updateNote();
  }
  syncFxUi();
  { let t = 'filter'; try { t = localStorage.getItem(TAB_KEY) || 'filter'; } catch { /* */ } setTab(['filter', 'beauty', 'crown'].includes(t) ? t : 'filter'); }

  const FX_NOTES = {
    loading: '美顏準備中…第一次要下載一下下',
    old: '這支手機的瀏覽器跑不動臉部特效，濾鏡還是可以用喔。',
    slow: '這支手機跑臉部特效有點吃力，先幫你關掉了，濾鏡還是可以用。',
    error: '臉部特效載入失敗了，網路好一點再點一次試試看。',
    noface: '把臉放進畫面裡，特效就會出現 ✨',
  };
  function updateNote() {
    const onFxTab = dialog.dataset.tab !== 'filter';
    let key = '';
    if (['old', 'slow', 'error'].includes(fxState) && (onFxTab || fxActive(fx))) key = fxState;
    else if (fxState === 'loading' && fxActive(fx)) key = 'loading';
    else if (fxState === 'ready' && fxActive(fx) && onFxTab && !faces.length && performance.now() - lastFaceAt > 1500 && dialog.dataset.step === 'cam') key = 'noface';
    note.textContent = key ? FX_NOTES[key] : '';
    retry.hidden = !(key === 'slow' || key === 'error');
    badge.hidden = key !== 'loading'; badge.textContent = key === 'loading' ? '✨ 美顏準備中' : '';
    dialog.dataset.fx = fxState;
  }
  function ensureTracker() {
    if (!fxActive(fx) || tracker || fxState === 'loading' || fxState === 'old' || fxState === 'slow') return;
    const support = faceFxSupport();
    if (support !== 'ok') { fxState = support; updateNote(); return; }
    fxState = 'loading'; updateNote();
    loadTracker().then((t) => { tracker = t; fxState = 'ready'; perf = []; lastFaceAt = performance.now(); updateNote(); startLoop(); })
      .catch(() => { fxState = 'error'; updateNote(); });
  }
  function turnOffSlow() {
    fxState = 'slow'; rememberSlow(true); faces = []; stillFaces = null; clearFace(); updateNote();
  }
  function clearFace() { faceCtx.clearRect(0, 0, face.width, face.height); }
  function currentSource() {
    if (!video.hidden && video.videoWidth) return video;
    if (!still.hidden && still.naturalWidth) return still;
    return null;
  }
  function detectNow(source) {
    if (!tracker || fxState !== 'ready') return [];
    try {
      if (source === still) { if (!stillFaces || stillFaces.src !== still.src) stillFaces = { src: still.src, list: tracker.detect(still) }; return stillFaces.list; }
      return tracker.detect(source);
    } catch { return faces; }
  }
  function frame() {
    loopId = 0;
    if (!dialog.open || dialog.dataset.step !== 'cam') { clearFace(); return; }
    const source = currentSource();
    const active = fxActive(fx) && fxState === 'ready';
    if (!source || !active) { clearFace(); if (fxState === 'ready' && fxActive(fx)) loopId = requestAnimationFrame(frame); return; }
    const box = stage.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.max(1, Math.round(box.width * dpr)), ch = Math.max(1, Math.round(box.height * dpr));
    if (face.width !== cw || face.height !== ch) { face.width = cw; face.height = ch; }
    const isVideo = source === video;
    face.classList.toggle('is-mirrored', isVideo && mirrored);
    if (isVideo) {
      if (video.currentTime !== lastFrame) {
        lastFrame = video.currentTime;
        const t0 = performance.now(); faces = detectNow(video); const dt = performance.now() - t0;
        perf.push(dt);
        // 前幾張暖機不算，之後 8 張的中位數太慢（每秒不到 11 張）就關掉
        if (perf.length === 11) {
          const recent = perf.slice(3).sort((a, b) => a - b); const median = recent[recent.length >> 1];
          if (median > (globalThis.SIANG_FACE_FX_SLOW_MS || 90)) { turnOffSlow(); return; }
        }
      }
    } else faces = detectNow(still);
    if (faces.length) lastFaceAt = performance.now();
    clearFace();
    const vw = source.videoWidth || source.naturalWidth, vh = source.videoHeight || source.naturalHeight;
    drawFaceFx(faceCtx, source, faces, fx, coverMap(vw, vh, cw, ch));
    updateNote();
    loopId = requestAnimationFrame(frame);
  }
  function startLoop() { if (!loopId && dialog.open && dialog.dataset.step === 'cam') loopId = requestAnimationFrame(frame); }
  smoothIn.addEventListener('input', () => setFx({ smooth: Number(smoothIn.value) }));

  function step(name) {
    pick.hidden = name !== 'pick'; cam.hidden = name !== 'cam'; result.hidden = name !== 'result';
    dialog.dataset.step = name;
  }
  function stopStream() { stream?.getTracks().forEach((t) => t.stop()); stream = null; video.srcObject = null; }
  function place() {
    sprite.style.left = `${pos.x * 100}%`; sprite.style.top = `${pos.y * 100}%`; sprite.style.height = `${pos.h * 100}%`;
    sprite.style.transform = `translate(-50%, -100%)${pos.flip ? ' scaleX(-1)' : ''}`;
    size.value = String(Math.round(pos.h * 100));
  }

  function renderPick() {
    const s = getState();
    const owned = Object.values(CHARACTERS).filter((c) => s.dex?.[c.no]);
    $('.photo-pick-list').replaceChildren(...owned.map((c) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'photo-pick-item'; b.dataset.pick = c.no;
      const img = document.createElement('img'); img.alt = ''; loadWithFallback(img, characterSources(c.image));
      const name = document.createElement('span'); name.textContent = c.name;
      b.append(img, name); return b;
    }));
    $('.photo-pick-empty').hidden = owned.length > 0;
    step('pick');
  }

  async function startCamera() {
    stopStream(); still.hidden = true; video.hidden = false; status.textContent = '';
    if (!navigator.mediaDevices?.getUserMedia) { noCamera('這支手機的瀏覽器打不開相機。'); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
      if (!dialog.open || dialog.dataset.step !== 'cam') { stopStream(); return; }
      video.srcObject = stream; await video.play().catch(() => {});
      const settings = stream.getVideoTracks()[0]?.getSettings?.() || {};
      mirrored = (settings.facingMode || facing) === 'user';
      video.classList.toggle('is-mirrored', mirrored);
      $('.photo-flipcam').hidden = false;
      lastFrame = -1; ensureTracker(); startLoop();
    } catch (err) {
      noCamera(err?.name === 'NotAllowedError' ? '相機權限沒有打開。可以到瀏覽器設定允許相機，或改用下面的按鈕拍一張。' : '相機打不開。可以改用下面的按鈕拍一張或選相簿的照片。');
    }
  }
  function noCamera(text) {
    stopStream(); video.hidden = true; status.textContent = text; $('.photo-flipcam').hidden = true;
    $('.photo-fallback').hidden = false;
  }

  function open(startNo = null) {
    blob = null; if (url) URL.revokeObjectURL(url); url = null;
    $('.photo-fallback').hidden = true; status.textContent = '';
    if (!dialog.open) dialog.showModal();
    if (startNo && getState().dex?.[startNo]) choose(startNo); else renderPick();
  }
  function choose(n) {
    no = n; const c = CHARACTERS[n];
    sprite.alt = c.name; loadWithFallback(sprite, characterSources(c.image));
    $('.photo-who').textContent = c.name;
    Object.assign(pos, { x: 0.5, y: 0.97, h: 0.62, flip: false }); place();
    step('cam'); $('.photo-fallback').hidden = true; updateNote(); void startCamera();
  }
  function close() { stopStream(); if (dialog.open) dialog.close(); }

  // 拖曳與雙指縮放
  const pointers = new Map(); let drag = null;
  sprite.addEventListener('pointerdown', (e) => {
    e.preventDefault(); sprite.setPointerCapture?.(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const box = stage.getBoundingClientRect();
    if (pointers.size === 1) drag = { sx: e.clientX, sy: e.clientY, x: pos.x, y: pos.y, box };
    else if (pointers.size === 2) { const [a, b] = [...pointers.values()]; drag = { pinch: Math.hypot(a.x - b.x, a.y - b.y), h: pos.h, box }; }
  });
  sprite.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId) || !drag) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (drag.pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
      pos.h = Math.min(1.2, Math.max(0.15, drag.h * d / drag.pinch));
    } else if (!drag.pinch) {
      pos.x = Math.min(1, Math.max(0, drag.x + (e.clientX - drag.sx) / drag.box.width));
      pos.y = Math.min(1.25, Math.max(0.15, drag.y + (e.clientY - drag.sy) / drag.box.height));
    }
    place();
  });
  const up = (e) => { pointers.delete(e.pointerId); if (!pointers.size) drag = null; else if (pointers.size === 1) { const [p] = [...pointers.values()]; drag = { sx: p.x, sy: p.y, x: pos.x, y: pos.y, box: stage.getBoundingClientRect() }; } };
  sprite.addEventListener('pointerup', up); sprite.addEventListener('pointercancel', up);
  size.addEventListener('input', () => { pos.h = Number(size.value) / 100; place(); });

  // 合成照片
  function capture() {
    const source = !video.hidden && video.videoWidth ? video : (!still.hidden && still.naturalWidth ? still : null);
    if (!source) { status.textContent = '畫面還沒準備好，等一下再按。'; return; }
    const vw = source.videoWidth || source.naturalWidth, vh = source.videoHeight || source.naturalHeight;
    let sw = vw, sh = vh, sx = 0, sy = 0;
    if (vw / vh > RATIO) { sw = vh * RATIO; sx = (vw - sw) / 2; } else { sh = vw / RATIO; sy = (vh - sh) / 2; }
    const W = Math.round(Math.min(MAX_W, sw)), H = Math.round(W / RATIO);
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const g = canvas.getContext('2d');
    const flipBg = source === video && mirrored;
    g.save(); if (flipBg) { g.translate(W, 0); g.scale(-1, 1); }
    g.drawImage(source, sx, sy, sw, sh, 0, 0, W, H);
    if (fxActive(fx) && fxState === 'ready') {
      const list = source === video ? detectNow(video) : detectNow(still);
      try { drawFaceFx(g, source, list, fx, { vw, vh, sx, sy, sw, sh, W, H }); } catch { /* 特效畫不出來就照原圖 */ }
    }
    g.restore();
    if (sprite.naturalWidth) {
      const dh = pos.h * H, dw = dh * sprite.naturalWidth / sprite.naturalHeight;
      const cx = pos.x * W, bottom = pos.y * H;
      g.save(); g.translate(cx, bottom - dh); if (pos.flip) g.scale(-1, 1);
      g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = Math.round(W * 0.01); g.shadowOffsetY = Math.round(W * 0.004);
      g.drawImage(sprite, -dw / 2, 0, dw, dh); g.restore();
    }
    applyPhotoFilter(g, W, H, filter);
    // 小小的署名
    const fs = Math.round(W * 0.026);
    g.font = `${fs}px "Cormorant Garamond", "Noto Serif TC", serif`; g.textAlign = 'right'; g.textBaseline = 'bottom';
    g.fillStyle = 'rgba(255,255,255,.85)'; g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = fs * 0.4;
    g.fillText(`with ${CHARACTERS[no].name} · BETWEEN THE PAGES`, W - fs, H - fs * 0.8);
    canvas.toBlob((b) => {
      if (!b) { status.textContent = '照片合成失敗了，再按一次試試看。'; return; }
      blob = b; if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(b);
      $('.photo-result-img').src = url;
      stopStream(); step('result');
      onTaken(no);
    }, 'image/jpeg', 0.92);
  }

  async function save() {
    if (!blob) return;
    const d = new Date(); const p = (n) => String(n).padStart(2, '0');
    const name = `siang-photo-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.jpg`;
    const file = new File([blob], name, { type: 'image/jpeg' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: `和${CHARACTERS[no].name}的合照` }); return; } catch (err) { if (err?.name === 'AbortError') return; }
    }
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
    $('.photo-result-note').textContent = '已經下載了！如果沒看到，可以長按照片選「儲存圖片」。';
  }

  dialog.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.pick) choose(b.dataset.pick);
    else if (b.dataset.filter) setFilter(filterById(b.dataset.filter));
    else if (b.dataset.tab) setTab(b.dataset.tab);
    else if (b.dataset.crown) setFx({ crown: b.dataset.crown });
    else if (b.matches('.photo-fx-retry')) { rememberSlow(false); perf = []; fxState = tracker ? 'ready' : 'idle'; lastFaceAt = performance.now(); ensureTracker(); updateNote(); startLoop(); }
    else if (b.matches('.photo-close')) close();
    else if (b.matches('.photo-back')) { stopStream(); renderPick(); }
    else if (b.matches('.photo-shutter')) capture();
    else if (b.matches('.photo-flipcam')) { facing = facing === 'user' ? 'environment' : 'user'; void startCamera(); }
    else if (b.matches('.photo-mirror')) { pos.flip = !pos.flip; place(); }
    else if (b.matches('.photo-save')) void save();
    else if (b.matches('.photo-again')) { $('.photo-result-note').textContent = ''; step('cam'); if (still.hidden) void startCamera(); }
  });
  fileInput.addEventListener('change', () => {
    const f = fileInput.files?.[0]; if (!f) return;
    stopStream(); video.hidden = true; still.hidden = false; status.textContent = '';
    still.onload = () => { URL.revokeObjectURL(still.src); stillFaces = null; ensureTracker(); startLoop(); };
    still.src = URL.createObjectURL(f); fileInput.value = '';
  });
  dialog.addEventListener('close', stopStream);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopStream(); else if (dialog.open && dialog.dataset.step === 'cam' && still.hidden) void startCamera(); });

  return { open, close };
}
