const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}), args:['--no-sandbox'] });
  const context = await browser.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, ...(process.env.RECORD_VIDEO ? {recordVideo:{dir:'/tmp/siang-motion-video',size:{width:390,height:844}}} : {}) });
  const page = await context.newPage();
  await page.addInitScript(() => { Math.random = () => .35; });
  await page.goto('http://127.0.0.1:8000');
  await page.locator('#intro-ok').click(); await page.locator('#intro').waitFor({state:'hidden'});
  await page.evaluate(() => { const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k)); s.dex['001']={at:'2026-11-01'}; localStorage.setItem(k,JSON.stringify(s)); });
  await page.reload();
  await page.waitForFunction(() => document.querySelector('.actor')?.dataset.state==='walk');
  const samples = await page.locator('.actor').evaluate(async actor => {
    const frames = new Set(); const duration = parseFloat(actor.style.transitionDuration);
    const started = performance.now();
    while (actor.dataset.state === 'walk' && performance.now()-started < 2000) {
      frames.add(actor.querySelector('.actor__layer:not([hidden])').style.backgroundImage);
      await new Promise(resolve=>requestAnimationFrame(resolve));
    }
    return {duration,frames:frames.size,state:actor.dataset.state};
  });
  assert(samples.duration>=1.12,'compact lanes still play a full walking cycle');
  assert(samples.frames>=7,'walk visits the full sequence instead of cutting off mid-step');
  assert.equal(samples.state,'idle');
  await page.locator('#open-residents').click();
  const paused=await page.locator('.actor__layer:not([hidden])').getAttribute('style');
  await page.waitForTimeout(400);
  assert.equal(await page.locator('.actor__layer:not([hidden])').getAttribute('style'),paused);
  await page.locator('#close-residents').click();
  await page.waitForFunction(()=>document.querySelector('#resident-lanes').dataset.active==='true');
  await page.waitForTimeout(1800);
  await page.locator('#home-wishes').click();
  const stopped=await page.locator('.actor__layer:not([hidden])').getAttribute('style');
  await page.waitForTimeout(400);
  assert.equal(await page.locator('.actor__layer:not([hidden])').getAttribute('style'),stopped);
  await context.close();
  if (process.env.RECORD_VIDEO) await page.video().saveAs('docs/review/home-motion-390.webm');
  const reduced=await browser.newContext({reducedMotion:'reduce'});
  const p=await reduced.newPage(); await p.goto('http://127.0.0.1:8000'); await p.locator('#intro-ok').click();await p.locator('#intro').waitFor({state:'hidden'});
  await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.dex['001']={at:'2026-11-01'};localStorage.setItem(k,JSON.stringify(s))});await p.reload();
  const still=await p.locator('.actor__layer:not([hidden])').getAttribute('style');await p.waitForTimeout(1000);assert.equal(await p.locator('.actor__layer:not([hidden])').getAttribute('style'),still);
  await browser.close();
  console.log('Full compact-lane walking cycle, frame sequence, modal/navigation pause and reduced motion PASS');
})().catch(error=>{console.error(error);process.exit(1)});
