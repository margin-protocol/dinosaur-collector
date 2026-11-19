// 探索：模擬定位在臺中 → 臺中市小湘想出現、取得縣市蛋 → 選蛋 → 孵出臺中市小湘；外島與拒絕定位的訊息
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const key='siang-collector:v1';
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',geolocation:{latitude:24.1372,longitude:120.6869},permissions:['geolocation']});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();await p.evaluate(()=>localStorage.setItem('siang-collector:explore-intro:v1','1'));
assert(await p.locator('#explore').isHidden(),'explore hidden before first hatch');
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};s.egg={id:'ordinary',warmth:0,since:'2026-11-16'};localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();
// permission granted → silent auto check pops the first-visit dialog
await p.locator('#county-call[open]').waitFor({timeout:8000});
assert.match(await p.locator('#county-title').textContent(),/臺中市小湘想出現/);
if(process.env.SHOT){await p.waitForTimeout(1000);} if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
await p.locator('#county-ok').click();
let s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
assert.deepEqual(s.travel.eggs,['臺中市']);assert.ok(s.travel.visits['臺中市']);assert.equal(JSON.stringify(s).includes('120.68'),false,'no coordinates stored');
// second explore: no new egg
await p.locator('#explore').click();await p.locator('#county-call[open]').waitFor();
assert.match(await p.locator('#county-title').textContent(),/還在蛋裡等你/);await p.locator('#county-ok').click();
s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(s.travel.eggs.length,1);
// pick county egg, refund on swap, then hatch
await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(300);
await p.locator('#open-eggs').click();await p.locator('[data-cat=\"county\"]').click();await p.locator('[data-egg=\"county\"]').click();await p.waitForTimeout(300);
s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(s.egg.county,'臺中市');assert.equal(s.travel.eggs.length,0);
assert.match(await p.locator('#egg-name').textContent(),/縣市蛋 · 臺中市/);
await p.locator('#open-eggs').click();await p.locator('[data-cat=\"ordinary\"]').click();await p.locator('[data-egg=\"ordinary\"]').click();await p.waitForTimeout(300);
s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.deepEqual(s.travel.eggs,['臺中市']);
await p.locator('#open-eggs').click();await p.locator('[data-cat=\"county\"]').click();await p.locator('[data-egg=\"county\"]').click();await p.waitForTimeout(300);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.egg.warmth=150;localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();
await p.locator('#county-call[open]').waitFor({state:'detached',timeout:3000}).catch(()=>{});
await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(400);
await p.locator('#cultivate').click();await p.locator('#reveal').waitFor();await p.waitForTimeout(400);
assert.equal(await p.locator('#reveal-name').textContent(),'臺中市小湘');
s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.ok(s.dex['023']);
// Penghu → no signal
await c.setGeolocation({latitude:23.57,longitude:119.58});
// Refresh Chromium's location cache after simulated travel; production allows a 10-minute cached sample.
await p.evaluate(()=>new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(()=>resolve(),reject,{maximumAge:0})));
await p.locator('#reveal-ok').click();
await p.evaluate(()=>location.hash='home');await p.waitForTimeout(300);
await p.waitForTimeout(800);if(!(await p.locator('#county-call[open]').count()))await p.locator('#explore').click(); // 第一次來澎湖會自動跳出
await p.locator('#county-call[open]').waitFor();
assert.match(await p.locator('#county-title').textContent(),/澎湖小湘想出現/);await p.locator('#county-ok').click();
s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.ok(s.travel.eggs.includes('澎湖縣'),'penghu county egg');
// Kinmen → detected, but no Siang yet → no egg
await c.setGeolocation({latitude:24.43,longitude:118.32});
await p.evaluate(()=>new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(()=>resolve(),reject,{maximumAge:0})));
await p.locator('#explore').click();await p.locator('#county-call[open]').waitFor();
assert.match(await p.locator('#county-title').textContent(),/金門縣的訊號/);await p.locator('#county-ok').click();
s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.ok(!s.travel.eggs.includes('金門縣'));assert.ok(!s.travel.visits['金門縣']);
// Green Island is its own spot inside Taitung
await c.setGeolocation({latitude:22.66,longitude:121.49});await p.reload();await p.waitForTimeout(2500);await p.locator('#county-call[open]').waitFor({timeout:1}).catch(()=>{});if(!(await p.locator('#county-call[open]').count()))await p.locator('#explore').click();await p.locator('#county-call[open]').waitFor();
assert.match(await p.locator('#county-title').textContent(),/綠島小湘想出現/);await p.locator('#county-ok').click();
s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.ok(s.travel.eggs.includes('綠島'));
await c.close();
// denied permission
const d=await b.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const q=await d.newPage();
await q.goto('http://127.0.0.1:8000');await q.locator('#intro-ok').click();
await q.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));},key);await q.reload();
await q.locator('#explore').click();await q.locator('#explore-intro[open]').waitFor();await q.locator('#explore-intro-ok').click();await q.locator('#county-call[open]').waitFor({timeout:20000});
assert.match(await q.locator('#county-title').textContent(),/感應不到|訊號有點微弱/);
assert.equal(errs.length,0,errs.join('\n'));
console.log('explore: auto first-visit call, single county egg, refund, fixed hatch, offshore and denied PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
