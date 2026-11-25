// 劇場配樂（11/25 湘挑的古箏曲）：只在有 ep.music 的劇情播。
// 用 Web Audio 播：iPhone 的 <audio>.volume 改不了，GainNode 才能淡入淡出、調小聲。
// 手機規定要先點過才能出聲：開劇場那一下（或之後點對話框）會順便 resume。
// 開關只存在這台裝置（localStorage），不進存檔。檔案第一次要播才下載，不拖慢開遊戲。
const TRACKS = { mo: 'assets/music/mohen-guzheng.mp3' };
const KEY = 'siang-collector:theater-music:v1';
const VOLUME = 0.42; // 淡淡的，不蓋過看字的節奏
const FADE_IN = 1.6, FADE_OUT = 0.7;

let ctx = null, gain = null, source = null, current = null, want = null;
const buffers = {};

export function musicOn() { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } }
export function setMusicOn(on) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
  if (on && want) startTheaterMusic(want); else if (!on) stopSource();
}

function context() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  ctx = new AC(); gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
  return ctx;
}
function load(id) {
  return buffers[id] ||= fetch(TRACKS[id]).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
    .then((data) => new Promise((ok, fail) => context().decodeAudioData(data, ok, fail)))
    .catch((err) => { delete buffers[id]; throw err; });
}
function stopSource() {
  if (!source || !ctx) { source = null; current = null; return; }
  const s = source, t = ctx.currentTime; source = null; current = null;
  gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(gain.gain.value, t); gain.gain.linearRampToValueAtTime(0, t + FADE_OUT);
  try { s.stop(t + FADE_OUT + 0.05); } catch {}
}

// 要在點擊裡呼叫（第一次建立 AudioContext 才不會被擋）
export function startTheaterMusic(id) {
  want = id || null;
  if (!id || !TRACKS[id]) return stopSource();
  if (!musicOn()) return;
  const ac = context(); if (!ac) return;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (current === id && source) return;
  stopSource(); current = id;
  load(id).then((buffer) => {
    if (current !== id || want !== id || source) return;
    const s = ac.createBufferSource(); s.buffer = buffer; s.loop = true; s.connect(gain);
    const t = ac.currentTime + 0.05;
    gain.gain.cancelScheduledValues(t); gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(VOLUME, t + FADE_IN);
    s.start(t); source = s;
  }).catch(() => { current = null; });
}
export function stopTheaterMusic() { want = null; stopSource(); }
// 自動播劇情時可能不是在點擊裡打開的：玩家之後點一下就補 resume
export function nudgeTheaterMusic() { if (ctx && ctx.state === 'suspended' && want && musicOn()) ctx.resume().catch(() => {}); }
export function pauseForHidden(hidden) { if (!ctx) return; if (hidden) ctx.suspend().catch(() => {}); else if (want && musicOn()) ctx.resume().catch(() => {}); }
// 測試用：看現在有沒有在播
export const musicDebug = () => ({ playing: Boolean(source), want, ctx: ctx?.state || null, gain: gain ? gain.gain.value : null });
