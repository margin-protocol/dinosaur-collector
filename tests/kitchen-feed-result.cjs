// 餵完馬上看到結果（11/28 玩家：要往上滑才看得到喜不喜歡，湘選 A）＋料理小書依類型／食材／口味篩選（湘選一排四個切換）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const width=Number(process.env.W||360);
const c=await b.newContext({viewport:{width,height:780},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';
await p.goto('http://127.0.0.1:8000');if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');await p.waitForTimeout(400);
await p.evaluate(async k=>{const {CHARACTERS}=await import('/js/eggs.js');const kt=await import('/js/kitchen.js');const s=JSON.parse(localStorage.getItem(k));
  const nos=Object.keys(CHARACTERS).filter((n,i)=>i%2===0||Number(n)>100);s.dex={};nos.forEach(n=>s.dex[n]={at:'2026-11-10T00:00:00Z'});s.hatched=nos.length;s.tutorial=null;
  s.guide={seen:['battle','errand'],unlocked:['errand','wheel','battle','archive']};
  const R02=kt.dishOf(kt.RECIPES.find(r=>r.id==='R02').ings).id,R01=kt.dishOf(['milk','strawberry']).id,R07=kt.dishOf(['mushroom','strawberry']).id,H=kt.dishOf(['cloud','moon']).id;
  s.kitchen={ingredients:{},meals:{[R02]:3,[R01]:1},known:{[R02]:'2026-11-20T00:00:00Z',[R01]:'2026-11-21T00:00:00Z',[R07]:'2026-11-22T00:00:00Z',[H]:'2026-11-23T00:00:00Z'},tasted:{},buffs:{},daily:{},darkFed:0};
  localStorage.setItem(k,JSON.stringify(s));localStorage.removeItem('siang-collector:feed-fold:v1');localStorage.removeItem('siang-collector:cookbook:v1');},key);
await p.reload();await p.waitForTimeout(600);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.evaluate(()=>document.getElementById('open-errands').click());await p.locator('#errand-dialog[open]').waitFor();await p.click('#tab-kitchen');await p.waitForTimeout(200);
// 餵名單中間的一位 → 結果出現在那一排正下方、看得到
await p.locator('.kitchen-meal').first().click();await p.waitForTimeout(200);
const tile=p.locator('#kitchen-siangs .errand-siang').nth(13);const no=await tile.getAttribute('data-siang');
await tile.scrollIntoViewIfNeeded();await tile.click();await p.waitForTimeout(500);
const res=p.locator('#kitchen-siangs .kitchen-result--inline');assert.equal(await res.count(),1,'inline result');
assert.ok(await p.locator('#kitchen-result').isHidden(),'old spot hidden');
const g=await p.evaluate(no=>{const r=document.querySelector('.kitchen-result--inline'),t=document.querySelector(`#kitchen-siangs [data-siang="${no}"]`);const rr=r.getBoundingClientRect(),tr=t.getBoundingClientRect();return {below:rr.top>=tr.bottom-1,gap:rr.top-tr.bottom,inView:rr.top>=0&&rr.bottom<=innerHeight+1,same:r.parentElement===t.parentElement,fed:t.classList.contains('is-fed')};},no);
assert.ok(g.below&&g.gap<60,'right under the row '+JSON.stringify(g));assert.ok(g.inView,'in view');assert.ok(g.same&&g.fed);
assert.match(await res.textContent(),/♡|料理好感滿了/);
// 換一道料理 → 結果收起
await p.locator('.kitchen-meal').nth(1).click();await p.waitForTimeout(150);assert.equal(await p.locator('.kitchen-result--inline').count(),0);
// 最後一份吃完、名單收起 → 結果改在原位置並捲到看得到
const one=p.locator('#kitchen-siangs .errand-siang').nth(20);await one.scrollIntoViewIfNeeded();await one.click();await p.waitForTimeout(600);
assert.ok(await p.locator('#kitchen-feed').isHidden(),'feed closed');
const vis=await p.evaluate(()=>{const r=document.getElementById('kitchen-result');const b=r.getBoundingClientRect();return !r.hidden&&b.top>=0&&b.bottom<=innerHeight+1;});assert.ok(vis,'result scrolled into view');
// 料理小書：一排四個切換
const tabs=await p.$$eval('#cookbook-tabs button',bs=>bs.map(b=>b.dataset.tab));assert.deepEqual(tabs,['all','kind','ing','tag']);
const count=()=>p.locator('.cookbook-page').count();assert.equal(await count(),4);
await p.click('#cookbook-tabs [data-tab="kind"]');await p.click('#cookbook-filter [data-pick="dark"]');assert.equal(await count(),1);
await p.click('#cookbook-tabs [data-tab="ing"]');assert.equal(await count(),4,'switch resets pick');
await p.click('#cookbook-filter [data-pick="strawberry"]');assert.equal(await count(),2);
assert.equal(await p.locator('#cookbook-filter [data-pick="pudding"] small').textContent(),'1');
await p.click('#cookbook-filter [data-pick="strawberry"]');assert.equal(await count(),4,'tap again clears');
await p.click('#cookbook-tabs [data-tab="tag"]');await p.click('#cookbook-filter [data-pick="清涼"]');assert.equal(await count(),1);
assert.equal(await p.locator('#cookbook-filter [data-pick="怪味"]').count(),0,'only tags you made');
await p.click('#cookbook-tabs [data-tab="all"]');assert.equal(await p.locator('#cookbook-filter .cookbook-chip').count(),0);
assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no horizontal scroll');
assert.equal(errs.length,0,errs.join('\n'));console.log('kitchen-feed-result: result under fed row, scroll when feed closes, cookbook all/kind/ing/tag PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
