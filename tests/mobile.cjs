const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 for(const [engine,type] of Object.entries(process.env.CHROMIUM_ONLY ? {chromium} : {chromium,webkit})) {
 const browser=await type.launch({headless:true,...(engine==='chromium'?{...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}),args:['--no-sandbox']}: {})});
 for(const width of [360,390,430]) {
 const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000'); await page.locator('#intro-ok').click();
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));
 await page.screenshot({path:`docs/review/${engine}-home-${width}.png`,fullPage:true});
 async function overflow(){assert(await page.evaluate(expected=>document.documentElement.scrollWidth<=expected && innerWidth<=expected,width),`${engine} ${width} overflow`)}
 await overflow(); await page.locator('#open-center').click();assert(await page.locator('#function-center').isVisible());
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));
 await page.screenshot({path:`docs/review/${engine}-center-${width}.png`,fullPage:true});
 await page.locator('.nav__item[data-view="wish"]').click(); assert(!(await page.locator('#function-center').isVisible()));
 assert.equal(await page.locator('.mission').count(),3); await overflow();
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));
 await page.screenshot({path:`docs/review/${engine}-wishes-${width}.png`,fullPage:true});
 const data=await page.evaluate(async()=>{const m=await import('./js/wishes.js');return m.wishesFor(m.todayKey()).map(w=>({id:w.id,swatch:w.swatch}));});
 for(const wish of data){
 const png=await page.evaluate(color=>{const c=document.createElement('canvas');c.width=c.height=48;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,48,48);return c.toDataURL().split(',')[1]},wish.swatch);
 await page.locator(`[data-wish="${wish.id}"] input`).setInputFiles({name:'color.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
 await page.waitForFunction(id=>JSON.parse(localStorage.getItem('siang-collector:v1')).wishes.done.includes(id),wish.id);
 await page.waitForTimeout(120);
 }
 await page.waitForTimeout(250);assert.equal(await page.locator('.mission.is-done').count(),3);
 assert.equal(await page.locator('#energy-value').textContent(),'105');
 await page.reload();assert.equal(await page.locator('#energy-value').textContent(),'105');
 assert.equal(await page.locator('.mission.is-done').count(),3);
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));
 await page.screenshot({path:`docs/review/${engine}-completed-${width}.png`,fullPage:true});
 await page.locator('#back-home').click();await page.locator('#enter-incubator').click();
 await page.locator('.egg__layer--shell').evaluate(image=>image.decode());
 // Allow the scene transition and decoded WebP layers to finish painting.
 await page.waitForTimeout(350);
 await page.screenshot({path:`docs/review/${engine}-incubate-${width}.png`,fullPage:true});
 await page.locator('#cultivate').click();await page.waitForTimeout(150);
 assert.equal(await page.locator('#energy-value').textContent(),'95');
 await page.reload();assert.equal(await page.locator('#energy-value').textContent(),'95');
 await page.locator('#back-home').click();
 await page.setViewportSize({width,height:612});await overflow();
 assert(await page.evaluate(()=>document.querySelector('.game-footer').getBoundingClientRect().top >= document.querySelector('.home-actions').getBoundingClientRect().bottom),'footer must not cover actions');
 await page.locator('#home-wishes').scrollIntoViewIfNeeded();await page.evaluate(()=>scrollTo(0,0));
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));
 await page.screenshot({path:`docs/review/${engine}-short-${width}.png`,fullPage:true});
 // Existing progress fixture: exercise actual hatch and unchanged animated actor.
 await page.evaluate(()=>{const key='siang-collector:v1';const s=JSON.parse(localStorage.getItem(key));s.egg.warmth=100;localStorage.setItem(key,JSON.stringify(s));});
 await page.reload();await page.locator('#enter-incubator').click();await page.locator('#cultivate').click();await page.locator('#reveal-ok').waitFor();
 assert.equal(await page.locator('#reveal-name').textContent(),'原味小湘');await page.locator('#reveal-ok').click();
 assert.equal(await page.locator('body').getAttribute('data-view'),'home');assert(await page.locator('.resident-static').isVisible());
 await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete));
 await page.screenshot({path:`docs/review/${engine}-hatched-${width}.png`,fullPage:true});
 await page.locator('#home-wishes').click();
 // A new day resets wishes without changing accumulated resources or collection.
 await page.evaluate(()=>{const k='siang-collector:v1';const s=JSON.parse(localStorage.getItem(k));s.wishes.date='2000-01-01';localStorage.setItem(k,JSON.stringify(s));});
 await page.reload();assert.equal(await page.locator('.mission.is-done').count(),0);
 const first=await page.locator('.mission').first().getAttribute('data-wish');
 const bad=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=20;c.getContext('2d').fillRect(0,0,20,20);return c.toDataURL().split(',')[1]});
 await page.locator(`[data-wish="${first}"] input`).setInputFiles({name:'black.png',mimeType:'image/png',buffer:Buffer.from(bad,'base64')});
 await page.locator('#photo[open]').waitFor();assert.equal(await page.locator('#energy-value').textContent(),'95');await page.locator('#photo-ok').click();
 
 assert.equal(errors.length,0,errors.join('\n'));
 console.log(`${engine} ${width}: navigation, layout, 3 photo rewards, persistence, cultivation PASS`);
 await context.close(); }
 await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
