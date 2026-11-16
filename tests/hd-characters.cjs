const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
  for (const width of [360,390,430]) {
    const context = await browser.newContext({viewport:{width,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    const page = await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8000');await page.locator('#intro-ok').click();await page.locator('#intro').waitFor({state:'hidden'});
    await page.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.dex['001']={at:'2026-11-01'};s.hatched=1;localStorage.setItem(k,JSON.stringify(s));});await page.reload();
    await page.locator('.actor').waitFor();
    const before=await page.evaluate(()=>localStorage.getItem('siang-collector:v1'));
    const sources=await page.evaluate(async()=>{
      const {SIANG_ANIMS,prepareSiangFrames}=await import('./js/siang-hd.js');await prepareSiangFrames();
      const sources=[...new Set(Object.values(SIANG_ANIMS).flatMap(a=>a.frames.map(f=>f.src)))];
      for(const source of sources){const image=new Image();image.src=source;await image.decode();if(image.naturalWidth!==1254||image.naturalHeight!==1254)throw Error('Wrong frame resolution');}
      return sources;
    });assert.equal(sources.length,13);
    await page.waitForTimeout(300);assert.match(await page.locator('.actor__layer:not([hidden])').getAttribute('style'),/siang-001-hd/);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`docs/review/home-hd-${width}.png`,fullPage:true});
    await page.locator('#home-wishes').click();assert.match(await page.locator('#wish-portrait').getAttribute('src'),/siang-001-hd/);
    assert.equal(await page.evaluate(()=>localStorage.getItem('siang-collector:v1')),before,'art changes never alter gameplay progress');
    await page.goto('http://127.0.0.1:8000/review/siang-hd/');await page.waitForFunction(()=>document.querySelector('#note').textContent.includes('1254px'));
    for(const action of ['idle','walk','sit']){await page.locator(`[data-action="${action}"]`).click();await page.locator('#preview-frame').evaluate(i=>i.decode());await page.screenshot({path:`docs/review/siang-hd-${action}-${width}.png`,fullPage:true});}
    await page.setViewportSize({width,height:612});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(errors.length,0,errors.join('\n'));
    console.log(`${width}px @3x: 13 native HD frames, home/wish art, saved progress and all preview actions PASS`);await context.close();
  }
  // Observe actual home state transitions, including authored lowering/rising frames.
  const context=await browser.newContext();const p=await context.newPage();await p.addInitScript(()=>Math.random=()=>.8);
  await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();await p.locator('#intro').waitFor({state:'hidden'});
  await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.dex['001']={at:'2026-11-01'};localStorage.setItem(k,JSON.stringify(s))});await p.reload();await p.locator('.actor').waitFor();
  await p.evaluate(()=>{window.actions=new Set();window.framesSeen=new Set();new MutationObserver(()=>{const l=document.querySelector('.actor__layer:not([hidden])');if(l?.dataset.animation){window.actions.add(l.dataset.animation);window.framesSeen.add(l.dataset.animation+':'+l.dataset.frame)}}).observe(document.querySelector('.actor'),{subtree:true,attributes:true})});
  await p.waitForFunction(()=>document.querySelector('.actor__layer:not([hidden])')?.dataset.animation==='sit',{},{timeout:12000});
  await p.waitForFunction(()=>window.actions.has('rise'),{},{timeout:14000});assert(await p.evaluate(()=>['lower','sit','rise'].every(a=>window.actions.has(a))));assert(await p.evaluate(()=>window.framesSeen.has('sit:1')),'seated eyes close during rest');
  console.log('Natural home rest: lowering → seated blink → rising PASS');await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
