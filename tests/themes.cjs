const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8000';
const KEY = 'siang-collector:v1';
const PREF = 'siang-collector:theme:v1';
(async () => {
 const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
 const screenshots = process.env.LIGHT_THEMES ? 'docs/review/themes-light' : 'docs/review/themes';
 fs.mkdirSync(screenshots, { recursive: true });
 for (const width of [360, 390, 430]) {
  const ctx = await b.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); const errors = []; p.on('pageerror', e => errors.push(e.message));
  await p.goto(BASE); await p.locator('#intro-ok').click(); await p.locator('#intro').waitFor({ state: 'hidden' });
  // Use an established home so previews show the character in the real game scene.
  await p.evaluate(k => { const s = JSON.parse(localStorage.getItem(k)); s.dex['001'] = { at: new Date().toISOString() }; s.hatched = 1; s.energy = 87; s.fossils = 6; s.tutorial.status = 'complete'; localStorage.setItem(k, JSON.stringify(s)); }, KEY);
  await p.reload();
  const originalSave = await p.evaluate(k => localStorage.getItem(k), KEY);
  const room = await p.evaluate(() => localStorage.getItem('siang-collector:residents:v1'));
  const palettes = process.env.LIGHT_THEMES ? ['cream', 'sakura', 'daylight'] : ['cream', 'sakura', 'daylight', 'lilac', 'mint', 'blue', 'rose'];
  const surfaces = []; const targetColors = [];
  async function shot(name) {
   await p.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
   await p.waitForFunction(() => !document.querySelector('#toast').classList.contains('is-on'));
   await p.screenshot({ path: `${screenshots}/${name}-${width}.png`, fullPage: true });
   assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} ${width}px overflow`);
  }
  async function chooser() { await p.locator('#open-center').click(); await p.locator('#open-themes').click(); }
  for (const id of palettes) {
   await chooser(); await p.locator(`[data-palette="${id}"]`).click();
   assert.equal(await p.locator('html').getAttribute('data-theme'), id);
   assert.equal(await p.locator('.theme-choice[aria-pressed="true"]').count(), 1);
   assert.equal(await p.locator(`[data-palette="${id}"]`).getAttribute('aria-pressed'), 'true');
   const meta = await p.locator('meta[name="theme-color"]').getAttribute('content');
   assert.equal(meta, { lilac: '#151722', mint: '#101e20', blue: '#111b2b', rose: '#24191f', cream: '#f9f2e6', sakura: '#fff0f3', daylight: '#eef6fc' }[id]);
   surfaces.push(await p.locator('#theme-dialog').evaluate(e => getComputedStyle(e).backgroundColor));
   if (['cream', 'sakura', 'daylight'].includes(id)) {
    const contrast = await p.evaluate(() => {
     const st = getComputedStyle(document.documentElement);
     const lum = hex => { const rgb = hex.trim().slice(1).match(/../g).map(n => parseInt(n, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722; };
     const ratio = (a,b) => { const x = lum(st.getPropertyValue(a)), y = lum(st.getPropertyValue(b)); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
     return { scheme: st.colorScheme, panel: ratio('--t-text','--t-panel'), muted: ratio('--t-muted','--t-panel'), action: ratio('--t-ink','--t-cta-end'), label: ratio('--t-text','--t-button-end') };
    });
    assert.equal(contrast.scheme, 'light');
    for (const key of ['panel','muted','action','label']) assert(contrast[key] >= 4.5, `${id}: ${key} contrast ${contrast[key]}`);
   }
   await shot(`${id}-picker`);
   await p.locator('#theme-done').click(); await shot(`${id}-home`);
   await p.locator('#home-wishes').click(); await shot(`${id}-wish`);
   await p.locator('#back-home').click(); await p.locator('#enter-incubator').click(); await shot(`${id}-incubate`);
   const filter = await p.locator('.egg__layer--shell').first().evaluate(e => getComputedStyle(e).filter);
   assert.equal(filter, 'none', 'egg artwork is not recoloured');
   targetColors.push(await p.locator('.wish-step .progress-gem').first().evaluate(e => getComputedStyle(e).color));
   await p.reload(); assert.equal(await p.locator('html').getAttribute('data-theme'), id);
   assert.equal(await p.evaluate(k => localStorage.getItem(k), KEY), originalSave, 'switching colours does not mutate the game save');
   assert.equal(await p.evaluate(() => localStorage.getItem('siang-collector:residents:v1')), room);
   await p.locator('#back-home').click();
  }
  assert.equal(new Set(surfaces).size, palettes.length, 'every palette changes the actual panel');
  assert.equal(new Set(targetColors).size, 1, 'wish target colours do not change with the theme');
  // Another tab follows theme updates; opening/closing the modal pauses/resumes the room.
  const other = await ctx.newPage(); await other.goto(BASE);
  await chooser(); await p.locator('[data-palette="mint"]').click();
  await other.waitForFunction(() => document.documentElement.dataset.theme === 'mint');
  assert.equal(await p.locator('#resident-lanes').getAttribute('data-active'), 'false');
  await p.keyboard.press('Escape'); await p.waitForFunction(() => document.querySelector('#resident-lanes').dataset.active === 'true');
  await other.close();
  await p.setViewportSize({ width, height: 612 }); await chooser(); await shot('short-picker');
  await p.locator('#theme-done').click();
  await p.evaluate(pref => localStorage.setItem(pref, 'untrusted-theme'), PREF); await p.reload();
  assert.equal(await p.locator('html').getAttribute('data-theme'), 'lilac');
  assert.equal(await p.evaluate(k => localStorage.getItem(k), KEY), originalSave);
  // Preference storage failures remain usable for the session and report that saving failed.
  await chooser();
  await p.evaluate(() => { window.originalStorageSet = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v) { if (k === 'siang-collector:theme:v1') throw new DOMException('blocked', 'QuotaExceededError'); return window.originalStorageSet.call(this, k, v); }; });
  await p.locator('[data-palette="blue"]').click();
  assert.equal(await p.locator('html').getAttribute('data-theme'), 'blue');
  assert.match(await p.locator('#theme-status').innerText(), /無法儲存/);
  await p.locator('#theme-done').click(); await chooser();
  assert.equal(await p.locator('html').getAttribute('data-theme'), 'blue', 'blocked preference remains active for the session');
  assert.deepEqual(errors, []);
  console.log(`${width}px: palettes across home/wish/incubation, instant apply, refresh, save preservation, cross-tab sync, modal activity, short screen, invalid/storage-blocked preference PASS`);
  await ctx.close();
 }
 await b.close();
})().catch(e => { console.error(e); process.exit(1); });
