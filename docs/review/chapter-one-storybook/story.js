import { ART, SCENES } from './scenes.js';
const $ = id => document.getElementById(id);
const shell = $('storybook'), stage = $('stage'), text = $('story-text');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let active = false, sceneIndex = 0, beatIndex = 0, automatic = false, typed = 0;
let typeTimer = null, advanceTimer = null, remaining = null, deadline = 0;
const currentScene = () => SCENES[sceneIndex];
const currentBeat = () => currentScene().beats[beatIndex];
const glyphs = () => [...currentBeat().text];
const complete = () => typed >= glyphs().length;
const pad = n => String(n).padStart(2, '0');
const node = (tag, className) => { const item = document.createElement(tag); item.className = className; return item; };
const image = (key, className) => { const img = node('img', className); img.src = ART[key]; img.alt = ''; img.draggable = false; img.decoding = 'async'; return img; };
function stopAdvance() {
  if (advanceTimer !== null) { clearTimeout(advanceTimer); advanceTimer = null; remaining = Math.max(0, deadline - performance.now()); }
}
function stopTyping() { clearTimeout(typeTimer); typeTimer = null; }
function scheduleAdvance() {
  stopAdvance();
  if (!active || !automatic || !complete() || document.hidden) return;
  if (remaining === null) remaining = Math.max(3200, Math.min(6500, glyphs().length * 75 + 1200));
  deadline = performance.now() + remaining;
  advanceTimer = setTimeout(() => { advanceTimer = null; remaining = null; moveForward(); }, remaining);
}
function updateControls() {
  $('previous').disabled = sceneIndex === 0 && beatIndex === 0;
  const last = sceneIndex === SCENES.length - 1 && beatIndex === currentScene().beats.length - 1;
  const label = !complete() ? '顯示全文' : last ? '故事讀完了' : beatIndex === currentScene().beats.length - 1 ? sceneIndex === 5 ? '偷偷看彩蛋' : '翻下一頁' : '下一句';
  $('next').replaceChildren(document.createTextNode(label + ' '), Object.assign(document.createElement('span'), { textContent: last ? '✓' : '→' }));
  $('next').lastChild.setAttribute('aria-hidden', 'true');
  $('auto').setAttribute('aria-pressed', String(automatic));
  $('auto').querySelector('span').textContent = automatic ? '暫停自動' : '自動播放';
}
function typeMore() {
  stopTyping();
  if (!active || document.hidden) return;
  const chars = glyphs();
  if (reduced.matches) typed = chars.length;
  else typed = Math.min(chars.length, typed + 1);
  text.textContent = chars.slice(0, typed).join('');
  if (typed < chars.length) {
    const last = chars[typed - 1];
    typeTimer = setTimeout(typeMore, /[，。！？……]/.test(last) ? 165 : 38);
  } else { updateControls(); scheduleAdvance(); }
}
function reveal() { stopTyping(); typed = glyphs().length; text.textContent = currentBeat().text; updateControls(); scheduleAdvance(); }
function renderArt() {
  const scene = currentScene(), art = node('div', 'scene-art entering'); art.id = 'scene-art';
  art.append(image(scene.background, 'backdrop'), node('div', 'room-shade'), node('div', 'lightbeam'));
  const dust = node('div', 'dust');
  for (let i = 0; i < 14; i++) {
    const particle = node('i', '');
    particle.style.cssText = `--x:${(i * 31 + 11) % 97}%;--y:${(i * 19 + 7) % 83}%;--duration:${6 + i % 6}s;--delay:-${i * .71}s`;
    dust.append(particle);
  }
  art.append(dust);
  scene.actors.forEach(key => { const actor = node('div', `actor actor--${key}`); actor.append(image(key, '')); art.append(actor); });
  if (scene.id === 'letters') {
    const chain = node('div', 'invitations');
    for (let i = 0; i < 5; i++) { const letter = node('span', 'letter'); letter.style.setProperty('--tilt', `${i % 2 ? 5 : -4}deg`); chain.append(letter); }
    art.append(chain);
  }
  if (scene.id === 'delivery') art.append(node('span', 'letter flying-letter'));
  if (scene.id === 'seat') art.append(node('span', 'letter seat-invitation'));
  if (scene.id === 'bonus') {
    const mark = node('span', 'beat-mark'); mark.textContent = '嗝。'; mark.hidden = true; art.append(mark);
    for (let i = 0; i < 3; i++) { const heart = node('i', 'heart'); heart.style.cssText = `--x:${48 + i * 10}%;--delay:${i * 1.3}s`; heart.hidden = true; art.append(heart); }
  }
  art.setAttribute('aria-hidden', 'true'); $('scene-art').replaceWith(art);
  stage.dataset.scene = scene.id;
  $('art-description').textContent = scene.description;
  stage.setAttribute('aria-label', `${scene.title}。${scene.description} 點畫面讀下一句。`);
  $('scene-title').textContent = scene.title;
  $('scene-count').textContent = sceneIndex === 6 ? '片尾彩蛋' : `${pad(sceneIndex + 1)} / 06`;
  $('stage-note').textContent = scene.id === 'waiting' ? '有一個人，等了好久。' : scene.id === 'feast' ? '幾天後。' : scene.id === 'seat' ? '這裡，留給你。' : scene.id === 'bonus' ? '宴會結束以後……' : '';
  [...$('chapters').children].forEach((button, i) => { if (i === sceneIndex) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); button.classList.toggle('is-read', i < sceneIndex); });
  // Decode the next plate while the reader enjoys this one. No game modules are loaded.
  const next = SCENES[sceneIndex + 1]; if (next) { const preload = new Image(); preload.src = ART[next.background]; }
}
function renderBeat() {
  stopAdvance(); stopTyping(); remaining = null; typed = 0;
  stage.dataset.beat = String(beatIndex);
  $('speaker').textContent = currentBeat().speaker;
  $('line-count').textContent = `${beatIndex + 1} / ${currentScene().beats.length}`;
  $('spoken-text').textContent = `${currentBeat().speaker}：${currentBeat().text}`;
  text.textContent = '';
  if (currentScene().id === 'bonus') {
    $('scene-art').querySelector('.beat-mark').hidden = beatIndex !== 2;
    $('scene-art').querySelectorAll('.heart').forEach(heart => { heart.hidden = beatIndex !== 3; });
  }
  updateControls(); typeMore();
}
function chooseScene(index) { sceneIndex = index; beatIndex = 0; renderArt(); renderBeat(); }
function moveForward() {
  if (!active) return;
  if (!complete()) { reveal(); return; }
  if (beatIndex + 1 < currentScene().beats.length) { beatIndex++; renderBeat(); }
  else if (sceneIndex + 1 < SCENES.length) chooseScene(sceneIndex + 1);
  else finish();
}
function moveBack() {
  if (!active) return;
  if (beatIndex > 0) { beatIndex--; renderBeat(); }
  else if (sceneIndex > 0) { sceneIndex--; beatIndex = currentScene().beats.length - 1; renderArt(); renderBeat(); }
}
function stop() { active = false; stopAdvance(); stopTyping(); $('scene-art').getAnimations({ subtree:true }).forEach(animation => animation.cancel()); }
function start() {
  stop(); active = true; automatic = false; $('cover').hidden = true; $('ending').hidden = true; $('reader').hidden = false;
  chooseScene(0); $('next').focus({ preventScroll:true });
}
function close() { stop(); $('reader').hidden = true; $('ending').hidden = true; $('cover').hidden = false; $('start').focus({ preventScroll:true }); }
function finish() { stop(); $('reader').hidden = true; $('ending').hidden = false; $('end-title').focus({ preventScroll:true }); }
SCENES.forEach((scene, i) => {
  const button = node('button', i === 6 ? 'is-bonus' : ''); button.type = 'button';
  button.setAttribute('aria-label', `${i === 6 ? '片尾彩蛋' : `第 ${i + 1} 幕`}：${scene.title}`);
  button.append(node('span', '')); button.onclick = () => { if (active) chooseScene(i); };
  $('chapters').append(button);
});
$('start').onclick = start; $('replay').onclick = start; $('close').onclick = close; $('return-cover').onclick = close;
$('next').onclick = moveForward; $('previous').onclick = moveBack;
$('auto').onclick = () => { stopAdvance(); automatic = !automatic; updateControls(); scheduleAdvance(); };
stage.onclick = moveForward;
stage.onkeydown = event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); moveForward(); } };
document.addEventListener('keydown', event => {
  if (!active) return;
  if (event.key === 'Escape') close();
  if (event.key === 'ArrowRight') { event.preventDefault(); moveForward(); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); moveBack(); }
});
document.addEventListener('visibilitychange', () => {
  shell.dataset.paused = String(document.hidden);
  if (document.hidden) { stopAdvance(); stopTyping(); }
  else if (active) { if (!complete()) typeMore(); else scheduleAdvance(); }
});
reduced.addEventListener('change', () => { if (active && reduced.matches) { automatic = false; stopAdvance(); reveal(); } });
window.addEventListener('pagehide', () => { stopAdvance(); stopTyping(); });
window.addEventListener('pageshow', event => { if (event.persisted && active) { if (complete()) scheduleAdvance(); else typeMore(); } });
