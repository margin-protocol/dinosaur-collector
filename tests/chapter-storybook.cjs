const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.SIANG_PREVIEW_ORIGIN || 'http://127.0.0.1:8000';
const url = `${base}/docs/review/chapter-one-storybook/`;
const shots = 'docs/review/chapter-one-storybook/screenshots';
(async () => {
 const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium', args:['--no-sandbox'] });
 fs.mkdirSync(shots, { recursive:true });
 try {
  for (const [width,height] of [[360,844],[390,844],[430,844],[360,612]]) {
   const context = await browser.newContext({ viewport:{width,height}, isMobile:true, hasTouch:true, reducedMotion:'reduce', serviceWorkers:'block' });
   const page = await context.newPage(); const errors = [], failed = [];
   page.on('pageerror', error => errors.push(error.message));
   page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) failed.push(response.url()); });
   await page.addInitScript(() => { localStorage.setItem('siang-collector:v1', JSON.stringify({ energy:123, fossils:47, dex:{'001':{at:'legacy'}}, wishes:{done:['red']}, battle:{wins:1} })); sessionStorage.setItem('storybook-sentinel','unchanged'); });
   await page.goto(url); await page.locator('.cover-art').evaluate(img => img.decode());
   const save = () => page.evaluate(() => JSON.stringify([Object.entries(localStorage),Object.entries(sessionStorage)]));
   const before = await save();
   if (width === 390) await page.screenshot({ path:`${shots}/cover-390.png` });
   await page.click('#start');
   assert.equal(await page.locator('#chapters button').count(),7);
   assert.equal(await page.locator('#previous').isDisabled(),true);
   for (let scene = 0; scene < 7; scene++) {
    await page.locator('#chapters button').nth(scene).click();
    await page.locator('#scene-art .backdrop').evaluate(img => img.decode());
    await page.locator('#scene-art .actor img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
    const layout = await page.evaluate(() => {
     const r = s => document.querySelector(s).getBoundingClientRect();
     return { overflow:document.documentElement.scrollWidth > innerWidth, textBottom:r('#story-text').bottom, panelBottom:r('.reading-panel').bottom, nextBottom:r('#next').bottom, height:innerHeight, animations:document.querySelector('#scene-art').getAnimations({subtree:true}).length, stageHeight:r('#stage').height };
    });
    assert(!layout.overflow,`horizontal overflow ${width}/${height}/${scene}`);
    assert(layout.textBottom <= layout.panelBottom+1,`text clipping ${width}/${height}/${scene}`);
    assert(layout.nextBottom <= layout.height,`controls outside viewport ${width}/${height}`);
    assert(layout.stageHeight >= 170);
    assert.equal(layout.animations,0,'reduced motion uses static artwork');
    if (scene === 4 && height === 844) await page.screenshot({ path:`${shots}/feast-${width}.png` });
    if (width === 390 && scene === 1) await page.screenshot({ path:`${shots}/letters-390.png` });
    if (width === 390 && scene === 6) await page.screenshot({ path:`${shots}/bonus-390.png` });
    if (height === 612 && scene === 4) await page.screenshot({ path:`${shots}/short-360.png` });
   }
   if (height === 612) {
    await page.evaluate(() => { document.documentElement.style.setProperty('--safe-top','44px'); document.documentElement.style.setProperty('--safe-bottom','34px'); });
    assert(await page.locator('#next').evaluate(button => button.getBoundingClientRect().bottom <= innerHeight-34),'safe bottom remains clear');
    assert(await page.locator('#close').evaluate(button => button.getBoundingClientRect().top >= 44),'safe top remains clear');
    await page.evaluate(() => { document.documentElement.style.removeProperty('--safe-top'); document.documentElement.style.removeProperty('--safe-bottom'); });
   }
   // Read the complete four-line bonus, finish, replay, close; no game data changes.
   for (let beat = 0; beat < 4; beat++) await page.click('#next');
   await page.locator('#ending:not([hidden])').waitFor();
   assert.match(await page.locator('#end-title').textContent(),/下次，也一起吃吧/);
   await page.click('#replay'); assert.equal(await page.locator('#stage').getAttribute('data-scene'),'crown');
   await page.keyboard.press('Escape'); await page.locator('#cover:not([hidden])').waitFor();
   assert(await page.locator('#start').evaluate(button => document.activeElement === button));
   assert.equal(await save(),before,'all views, replay and close leave game/session storage untouched');
   assert.deepEqual(errors,[]); assert.deepEqual(failed,[]);
   await context.close();
  }
  // Normal motion: real typing, automatic advance, pause, background suspension and keyboard.
  const context = await browser.newContext({ viewport:{width:390,height:844}, reducedMotion:'no-preference' });
  const page = await context.newPage(); await page.clock.install(); await page.goto(url); await page.click('#start');
  assert((await page.locator('#next').textContent()).includes('顯示全文'));
  await page.click('#next'); assert.match(await page.locator('#story-text').textContent(),/突然變得好安靜/);
  await page.click('#auto'); await page.clock.runFor(3800);
  assert.equal(await page.locator('#stage').getAttribute('data-beat'),'1','automatic advances once');
  await page.click('#auto'); await page.clock.runFor(20000);
  assert.equal(await page.locator('#stage').getAttribute('data-beat'),'1','paused automatic stays on same line');
  await page.click('#auto');
  await page.evaluate(() => { window.__hidden = true; Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__hidden}); document.dispatchEvent(new Event('visibilitychange')); });
  await page.clock.runFor(20000); assert.equal(await page.locator('#stage').getAttribute('data-scene'),'crown','background does not advance');
  await page.evaluate(() => { window.__hidden = false; document.dispatchEvent(new Event('visibilitychange')); });
  await page.clock.runFor(7000); assert.equal(await page.locator('#stage').getAttribute('data-scene'),'letters');
  await page.click('#auto'); await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('#stage').getAttribute('data-scene'),'crown');
  await page.click('#close'); await page.clock.runFor(20000);
  assert(await page.locator('#cover').isVisible(),'closing cancels pending timers');
  await context.close();
  console.log('chapter storybook: seven scenes, full bonus/replay/close; 360/390/430 + short phone; reduced motion, typing/auto/pause/background; assets decode and saves unchanged PASS');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
