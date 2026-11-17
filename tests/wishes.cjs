const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const key='siang-collector:v1';
const pref='siang-collector:wish-character:v1';
const launch={headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']};
const save = page => page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
async function screenshot(page,name,width){await page.evaluate(()=>document.activeElement?.blur());await page.waitForFunction(()=>[...document.images].every(i=>i.complete));await page.screenshot({path:`docs/review/wishes-${name}-${width}.png`,fullPage:true});}
async function colorFile(page,id){const value=await page.evaluate(async id=>{const {WISH_POOL}=await import('./js/wishes.js');const c=document.createElement('canvas');c.width=c.height=48;const ctx=c.getContext('2d');ctx.fillStyle=WISH_POOL.find(w=>w.id===id).swatch;ctx.fillRect(0,0,48,48);return c.toDataURL().split(',')[1]},id);return{name:'color.png',mimeType:'image/png',buffer:Buffer.from(value,'base64')};}
(async()=>{
 const browser=await chromium.launch(launch);
 for(const width of [360,390,430]){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}); await context.addInitScript(()=>{globalThis.SIANG_CLASSIC_WISHES=true;});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000');await page.locator('#intro-ok').click();await page.locator('#intro').waitFor({state:'hidden'});await page.locator('#home-wishes').click();
  assert.equal(await page.locator('#wish-portrait').getAttribute('data-presenter'),'egg');
  await screenshot(page,'egg',width);
  await page.locator('#open-presenter').click();assert.equal(await page.locator('.presenter-choice').count(),0);await page.locator('#close-presenter').click();
  await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.energy=70;s.fossils=3;s.hatched=2;s.dex=Object.fromEntries(['001','002','003','004'].map(id=>[id,{at:'2026-11-01'}]));s.egg={id:'ordinary',warmth:50,since:'2026-11-01'};s.player.xp=80;s.player.stats.wishes=4;s.player.stats.fed=50;localStorage.setItem(k,JSON.stringify(s));},key);
  await page.reload();const before=await save(page);const ids=await page.locator('.mission').evaluateAll(nodes=>nodes.map(n=>n.dataset.wish));
  assert.equal(await page.locator('#wish-portrait').getAttribute('data-presenter'),'001');
  await screenshot(page,'daily',width);
  await page.locator('#open-presenter').click();assert.equal(await page.locator('.presenter-choice').count(),4);await screenshot(page,'characters',width);
  await page.locator('.presenter-choice[data-presenter="002"]').click();
  assert.equal(await page.locator('#wish-portrait').getAttribute('data-presenter'),'002');assert.match(await page.locator('#wish-speaker').textContent(),/草莓/);
  assert.deepEqual(await save(page),before,'switching the presenter must not change resources, daily tasks or XP');
  assert.deepEqual(await page.locator('.mission').evaluateAll(nodes=>nodes.map(n=>n.dataset.wish)),ids);
  await page.reload();assert.equal(await page.locator('#wish-portrait').getAttribute('data-presenter'),'002');
  await page.locator('#open-presenter').click();await page.locator('.presenter-choice[data-presenter="001"]').click();
  await page.locator('#tab-daily').focus();await page.keyboard.press('ArrowRight');assert(await page.locator('#panel-growth').isVisible());
  assert.equal(await page.locator('.growth-goal').count(),3);await screenshot(page,'growth',width);
  await page.locator('[data-goal="growth:1:1"]').click();await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).player.xp===100,key);assert.equal((await save(page)).player.xp,100);await page.waitForFunction(()=>document.activeElement?.dataset.goalRow==='growth:1:1');assert.match(await page.locator('#player-rank').textContent(),/Lv.2/);
  assert.equal((await save(page)).energy,90);assert.equal(await page.locator('[data-goal="growth:1:1"]').count(),0);
  await page.locator('#chapter-select').selectOption('2');assert.equal(await page.locator('.growth-goal').count(),3);await screenshot(page,'level-two',width);
  await page.locator('#chapter-select').selectOption('1');assert.equal(await page.locator('[data-goal="growth:1:2"]').count(),1,'earlier unclaimed goals remain available');
  await page.reload();await page.locator('#tab-growth').click();await page.locator('#chapter-select').selectOption('1');assert.equal(await page.locator('[data-goal="growth:1:1"]').count(),0,'claimed reward remains claimed');
  if(width===390){
   const second=await context.newPage();await second.goto('http://127.0.0.1:8000/#wish');
   await page.locator('#tab-daily').click();const file=await colorFile(page,ids[0]);
   // Hold the real commit lock until both camera requests have started.
   await page.evaluate(()=>{window.testLock=navigator.locks.request('siang-game-save',()=>{window.testLockHeld=true;return new Promise(resolve=>window.releaseTestLock=resolve)});});
   await page.waitForFunction(()=>window.testLockHeld);
   await Promise.all([page.locator(`[data-wish="${ids[0]}"] input`).setInputFiles(file),second.locator(`[data-wish="${ids[0]}"] input`).setInputFiles(file)]);
   await page.evaluate(()=>window.releaseTestLock());
   await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).wishes.done.length===1,key);
   await page.waitForTimeout(250);
   const completed=await save(page);assert.equal(completed.energy,125);assert.equal(completed.player.xp,110,'parallel photo claims award only one XP reward');assert.equal(completed.player.stats.wishes,5);
   await page.locator('#tab-growth').click();await page.locator('#chapter-select').selectOption('1');
   await second.goto('http://127.0.0.1:8000/#incubate');
   await Promise.all([page.locator('[data-goal="growth:1:2"]').click(),second.locator('#cultivate').click()]);
   await page.waitForFunction(k=>{const s=JSON.parse(localStorage.getItem(k));return s.energy===135&&s.player.xp===130},key);
   const concurrent=await save(page);assert.equal(concurrent.player.xp,130);assert.equal(concurrent.egg.warmth,60);assert.equal(concurrent.player.stats.fed,60);
   await second.goto('http://127.0.0.1:8000/#wish');await second.locator('#tab-growth').click();await second.locator('#chapter-select').selectOption('1');
   const outcomes=await Promise.all([page,second].map(tab=>tab.evaluate(async()=>{const {updateState}=await import('./js/state.js');const {claimGrowth}=await import('./js/progression.js');return (await updateState(s=>claimGrowth(s,1,'growth:1:3'))).result.awarded;})));assert.equal(outcomes.filter(Boolean).length,1);assert.equal((await save(page)).energy,185,'growth energy + chapter 1 reward (30) are paid once across tabs');assert.deepEqual((await save(page)).player.chapters,['1']);
   await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).player.xp===150,key);
   await second.close();
   await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.wishes.date='2000-01-01';localStorage.setItem(k,JSON.stringify(s));},key);
   await page.reload();const rollover=await save(page);assert.equal(rollover.wishes.done.length,0);assert.equal(rollover.player.xp,150);assert(rollover.player.claimed.includes('growth:1:2'));
  }
  for(const height of [612,844]){
   await page.setViewportSize({width,height});
   for(const tab of ['daily','growth']){await page.locator(`#tab-${tab}`).click();assert(await page.evaluate(w=>innerWidth===w&&document.documentElement.scrollWidth<=w,width));await screenshot(page,`${tab}-${height}`,width);}
  }
  // Persisted unknown/unowned preferences cannot reveal a character.
  await page.evaluate(({key,pref})=>{const s=JSON.parse(localStorage.getItem(key));s.dex={'001':s.dex['001']};localStorage.setItem(key,JSON.stringify(s));localStorage.setItem(pref,'002')},{key,pref});
  await page.reload();assert.equal(await page.locator('#wish-portrait').getAttribute('data-presenter'),'001');
  assert.equal(errors.length,0,errors.join('\n'));console.log(`${width}px: presenter selection, unchanged daily progress, XP, growth claims, level history, keyboard tabs, rollover and layout PASS`);
  await context.close();
 }
 // 固定在台灣時區，跨日判定才不會受執行環境的時區影響
 const midnightContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',timezoneId:'Asia/Taipei'}); await midnightContext.addInitScript(()=>{globalThis.SIANG_CLASSIC_WISHES=true;});
 const midnight=await midnightContext.newPage();await midnight.clock.install({time:new Date('2026-11-16T23:59:00+08:00')});
 await midnight.goto('http://127.0.0.1:8000');await midnight.locator('#intro-ok').click();await midnight.locator('#home-wishes').click();
 const staleId=await midnight.locator('.mission:not([hidden])').getAttribute('data-wish');const staleFile=await colorFile(midnight,staleId);
 await midnight.clock.setSystemTime(new Date('2026-11-17T00:01:00+08:00'));await midnight.locator(`[data-wish="${staleId}"] input`).setInputFiles(staleFile);
 await midnight.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).wishes.date==='2026-11-17',key);
 const midnightSave=await save(midnight);assert.equal(midnightSave.energy,0);assert.equal(midnightSave.player.xp,0);assert.deepEqual(midnightSave.wishes.done,[]);
 console.log('Actual midnight stale camera input: no energy or XP re-award PASS');await midnightContext.close();
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
