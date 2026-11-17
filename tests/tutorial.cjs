const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8000';
const KEY = 'siang-collector:v1';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] });
  fs.mkdirSync('docs/review/tutorial', { recursive: true });
  for (const width of [360, 390, 430]) {
    const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }); await ctx.addInitScript(()=>{globalThis.SIANG_CLASSIC_WISHES=true;});
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    const read = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
    const resume = async () => {
      await page.locator('#tutorial-resume').click();
      await page.locator('#tutorial-guide').waitFor({ state: 'hidden' });
      await page.locator('#tutorial-coach').waitFor({ state: 'visible' });
    };
    const shot = async name => {
      await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
      await page.screenshot({ path: `docs/review/tutorial/${name}-${width}.png`, fullPage: true });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: no horizontal overflow`);
      assert.doesNotMatch(await page.locator('#tutorial-coach').innerText(), /undefined|NaN/);
    };
    await page.goto(BASE); await page.locator('#intro-ok').click();
    await page.waitForFunction(() => document.querySelector('#tutorial-coach').dataset.step === 'egg');
    await shot('01-welcome');
    await page.locator('#tutorial-action').click();
    await page.waitForFunction(() => document.querySelector('#tutorial-coach').dataset.step === 'gift');
    assert.equal(await page.locator('body').getAttribute('data-view'), 'incubate');
    await page.locator('#tutorial-action').click();
    await page.waitForFunction(() => document.querySelector('#tutorial-coach').dataset.step === 'wish');
    assert.equal((await read()).energy, 30);
    await page.reload(); assert.equal((await read()).energy, 30); assert.equal((await read()).tutorial.visitedEgg, true);
    await page.locator('#tutorial-action').click();
    await page.locator('#tutorial-coach').scrollIntoViewIfNeeded(); await shot('02-wishes');
    // A failed photo must leave both resources and the guided step untouched.
    const image = async color => Buffer.from(await page.evaluate(color => { const c = document.createElement('canvas'); c.width = c.height = 48; const g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, 48, 48); return c.toDataURL().split(',')[1]; }, color), 'base64');
    const wishes = await page.evaluate(async () => { const w = await import('./js/wishes.js'); return w.wishesFor(w.todayKey()).map(x => ({ id: x.id, swatch: x.swatch })); });
    await page.locator(`.mission[data-wish="${wishes[0].id}"] input`).setInputFiles({ name: 'dark.png', mimeType: 'image/png', buffer: await image('#000') });
    await page.locator('#photo[open]').waitFor(); assert.equal((await read()).energy, 30); await page.locator('#photo-ok').click();
    async function wish(index) {
      const w = wishes[index];
      if (index) await page.locator('#book-gems button').nth(index).click();
      await page.locator(`.mission[data-wish="${w.id}"] input`).setInputFiles({ name: `colour-${index}.png`, mimeType: 'image/png', buffer: await image(w.swatch) });
      await page.waitForFunction(id => JSON.parse(localStorage.getItem('siang-collector:v1')).wishes.done.includes(id), w.id);
      await page.waitForFunction(() => document.querySelector('#tutorial-coach').dataset.step === 'feed');
    }
    await wish(0); assert.equal((await read()).energy, 65);
    await page.locator('#tutorial-action').click();
    await page.locator('#cultivate').click();
    await page.waitForFunction(() => !document.querySelector('#cultivate').disabled);
    assert.equal((await read()).energy, 55); assert.equal((await read()).egg.warmth, 10);
    await page.reload(); assert.equal((await read()).egg.warmth, 10);
    await page.locator('#incubate-wishes').click(); await wish(1);
    assert.equal((await read()).energy, 90);
    await page.locator('#tutorial-action').click();
    await page.locator('#tutorial-coach').scrollIntoViewIfNeeded(); await shot('03-cultivate');
    for (let n = 0; n < 9; n++) {
      await page.locator('#cultivate').click();
      await page.waitForFunction(w => JSON.parse(localStorage.getItem('siang-collector:v1')).egg.warmth >= w && !document.querySelector('#cultivate').disabled, 20 + n * 10);
    }
    assert.equal((await read()).energy, 0); assert.equal((await read()).egg.warmth, 100);
    await page.locator('#cultivate').click(); await page.locator('#reveal[open]').waitFor();
    assert.equal((await read()).hatched, 1); assert.equal((await read()).player.xp, 20);
    await page.locator('#reveal-ok').click();
    assert.equal(await page.locator('.resident-static').count(), 1);
    await page.locator('#tutorial-coach').scrollIntoViewIfNeeded(); await shot('04-home');
    await page.locator('#tutorial-action').click(); await page.waitForFunction(() => JSON.parse(localStorage.getItem('siang-collector:v1')).tutorial.status === 'complete');
    assert(await page.locator('#tutorial-coach').isHidden());
    const beforeReplay = await read();
    await page.locator('#open-center').click(); await page.locator('#open-tutorial').click(); await shot('05-guide');
    await resume();
    assert.equal(await page.locator('#tutorial-coach').getAttribute('data-step'), 'home');
    await page.locator('#tutorial-pause').click(); await page.waitForFunction(() => JSON.parse(localStorage.getItem('siang-collector:v1')).tutorial.status === 'paused'); await page.reload();
    assert.equal((await read()).tutorial.status, 'paused'); assert(await page.locator('#tutorial-coach').isHidden());
    const afterReplay = await read();
    for (const field of ['energy', 'hatched', 'fossils', 'dex', 'player', 'egg', 'wishes']) assert.deepEqual(afterReplay[field], beforeReplay[field], `replay preserves ${field}`);
    // Legacy players receive no automatic onboarding or resource changes.
    await page.evaluate(k => { const s = JSON.parse(localStorage.getItem(k)); delete s.tutorial; localStorage.setItem(k, JSON.stringify(s)); }, KEY);
    await page.reload(); assert(await page.locator('#tutorial-coach').isHidden());
    assert.equal((await read()).hatched, 1); assert.equal((await read()).energy, 0);
    // A completed resident arrangement can be revisited without forcing onboarding.
    await page.locator('#open-center').click(); await page.locator('#open-tutorial').click(); await resume();
    // Empty resident preferences are respected: explicitly arrange rather than silently overwrite.
    await page.evaluate(() => localStorage.setItem('siang-collector:residents:v1', '[]'));
    await page.reload(); await page.locator('#tutorial-action').click();
    await page.locator('#residents[open]').waitFor();
    await page.locator('#residents-list [data-no="001"]').click(); await page.locator('#residents-done').click();
    await page.waitForFunction(() => document.querySelector('#tutorial-action').textContent === '開始我們的日常');
    // Shared save locking and storage events keep a second tab's pause in sync.
    const second = await ctx.newPage(); await second.goto(BASE);
    await second.locator('#tutorial-pause').click();
    await page.waitForFunction(() => document.querySelector('#tutorial-coach').hidden);
    assert.equal((await read()).energy, 0); assert.equal((await read()).hatched, 1);
    await second.close();
    await page.locator('#open-center').click(); await page.locator('#open-tutorial').click(); await resume();
    await page.setViewportSize({ width, height: 612 });
    await shot('06-short');
    assert(await page.evaluate(() => document.querySelector('.game-footer').getBoundingClientRect().top >= document.querySelector('.home-actions').getBoundingClientRect().bottom), 'footer never covers controls');
    assert.deepEqual(errors, []);
    console.log(`${width}px: onboarding, real photo failure/success, gift, 100 energy feed, hatch, refresh, replay, legacy save PASS`);
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
