// 圖鑑「依稀有度」：分成 UR／SSR／SR／R／N 五區，記住選擇，手機寬度不溢出
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
for(const width of [360,430]){
const p=await b.newPage({viewport:{width,height:844},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=9;s.dex={'001':{at:'x'},'002':{at:'x'},'010':{at:'x'},'012':{at:'x'},'015':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(400);
await p.click('[data-dex-mode="rarity"]');
assert.equal(await p.getAttribute('[data-dex-mode="rarity"]','aria-pressed'),'true');
const titles=await p.locator('.dex__section-title > span').allTextContents();
assert.deepEqual(titles,['UR','SSR','SR','R','N']);
const ur=p.locator('.dex__section').first();
assert(await ur.locator('[data-dex-no="015"]').count(),'壽星小湘在 UR');
const nos=await ur.locator('.dex__card').evaluateAll(l=>l.map(e=>e.dataset.dexNo));assert.deepEqual(nos,[...nos].sort(),'同稀有度依編號排');
assert.match(await ur.locator('.dex__section-title small').textContent(),/^1 \/ \d+$/);
assert(await p.locator('.dex__section').nth(4).locator('[data-dex-no="001"]').count(),'001 在 N');
const total=await p.locator('.dex__card').count();assert.equal(total,await p.evaluate(()=>document.querySelectorAll('.dex__card').length));
const box=await p.locator('.dex__modes').boundingBox();assert(box.x>=0&&box.x+box.width<=width,`按鈕列在 ${width}px 內`);
assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'沒有橫向捲動');
await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(300);
assert.equal(await p.getAttribute('[data-dex-mode="rarity"]','aria-pressed'),'true','重開後記得');
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT.replace('.png',`-${width}.png`)});
await p.click('[data-dex-mode="all"]');assert.equal(await p.locator('.dex__section').count(),0);
assert.equal(errs.length,0,errs.join('\n'));await p.close();}
console.log('dex rarity mode: UR→N sections, counts, remembered, fits 360/430 PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
