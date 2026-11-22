// 挑蛋三選一、閃亮的蛋、調皮的蛋（摸 5 下、拍顏色）、蛋架擴充（副架保溫）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
// hatch the origin egg → offer appears
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.egg.warmth=999;localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();
await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(400);await p.click('#cultivate');await p.locator('#reveal').waitFor();await p.waitForTimeout(300);await p.click('#reveal-ok');
let s=await save();assert.equal(s.eggOffer.length,3);assert.equal(s.egg.id,'ordinary');
await p.evaluate(()=>location.hash='incubate');await p.locator('#egg-offer[open]').waitFor();assert.equal(await p.locator('.offer-egg').count(),3);
// feeding is blocked until picked
// force a known offer: shiny, naughty, warm
await p.evaluate(()=>document.querySelector('#egg-offer').close());
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.eggOffer=[{flavor:'warm',shiny:true},{flavor:'pattern',naughty:true},{flavor:'moving'}];s.energy=200;localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.evaluate(()=>location.hash='incubate');await p.locator('#egg-offer[open]').waitFor();
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
assert.match(await p.locator('.offer-egg.is-shiny').textContent(),/閃亮/);
await p.click('.offer-egg.is-naughty');await p.waitForTimeout(300);
s=await save();assert.equal(s.eggOffer,null);assert.equal(s.egg.naughty,true);assert.equal(s.egg.flavor,'pattern');
assert.match(await p.textContent('#egg-name'),/調皮的有花紋蛋/);
// feed to 1/3 → pet request
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.egg.warmth=40;localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(300);
await p.click('#cultivate');await p.waitForTimeout(500);s=await save();assert.equal(s.egg.warmth,50);
await p.locator('#egg-request:not([hidden])').waitFor();assert.match(await p.textContent('#egg-request-text'),/摸摸/);
const w0=(await save()).egg.warmth;for(let i=0;i<5;i++){await p.locator('.incubator').click({position:{x:150,y:120}});await p.waitForTimeout(120);}await p.waitForTimeout(300);
s=await save();assert.deepEqual(s.egg.asks,[1]);assert(s.egg.warmth>=w0+20+40,String(s.egg.warmth));
// to 2/3 → color request; send a matching colour
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.egg.warmth=101;localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(400);
const req=await p.evaluate(async(k)=>{const {naughtyRequest}=await import('/js/egg-traits.js');const {WISH_POOL}=await import('/js/wishes.js');const s=JSON.parse(localStorage.getItem(k));return naughtyRequest(s.egg,150,WISH_POOL);},key);
assert.equal(req.type,'color');
const img=await p.evaluate(async(id)=>{const {WISH_POOL}=await import('/js/wishes.js');const w=WISH_POOL.find(x=>x.id===id);const cv=document.createElement('canvas');cv.width=cv.height=40;const x=cv.getContext('2d');x.fillStyle=w.swatch||w.hex||'#e33';x.fillRect(0,0,40,40);return cv.toDataURL('image/png').split(',')[1];},req.color.id);
await p.setInputFiles('#egg-request-input',{name:'c.png',mimeType:'image/png',buffer:Buffer.from(img,'base64')});await p.waitForTimeout(600);
s=await save();assert.deepEqual(s.egg.asks,[1,2]);
// shiny boosts rarity
const r=await p.evaluate(async()=>{const {rollFor,CHARACTERS}=await import('/js/eggs.js');let a=0,b2=0;for(let i=0;i<20000;i++){if(['SR','SSR'].includes(CHARACTERS[rollFor({id:'ordinary'})].rarity))a++;if(['SR','SSR'].includes(CHARACTERS[rollFor({id:'ordinary',shiny:true})].rarity))b2++;}return [a,b2];});assert(r[1]>r[0]*1.6,JSON.stringify(r));
// cradle slot: buy with fossils, shelved egg warms passively
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.fossils=20;s.shelf=[{id:'wish',warmth:10,since:'2026-11-10T00:00:00Z'}];s.bonus.passiveAt=new Date(Date.now()-3*3600e3-60e3).toISOString();localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(500);s=await save();assert.equal(s.shelf[0].warmth,10,'no side slot yet');
await p.click('#chip-fossil');await p.click('[data-offer="slot"]');await p.waitForTimeout(300);s=await save();assert.equal(s.cradle.slots,2);assert.equal(s.fossils,0);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.bonus.passiveAt=new Date(Date.now()-3*3600e3-60e3).toISOString();localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.waitForTimeout(500);
s=await save();assert.equal(s.shelf[0].warmth,25);
await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(300);
assert(await p.locator('#side-cradles').isVisible(),'培育室看得到副架');assert.match(await p.textContent('#side-cradles'),/副架 · 1 格/);assert.match(await p.textContent('#side-cradles'),/保溫中 \d+%/);
if(process.env.SHOT)await p.locator('#side-cradles').scrollIntoViewIfNeeded().then(()=>p.screenshot({path:process.env.SHOT}));
// 點副架上的蛋：打開「換這一格的蛋」選單（主架不動）；選「跟主架互換」才和主架交換
const mainBefore=(await save()).egg;await p.locator('[data-side-shelf="0"]').click();await p.locator('#egg-picker[open]').waitFor();assert.match(await p.textContent('#egg-picker-title'),/換副架第 1 格的蛋/);assert.deepEqual((await save()).egg,mainBefore);
await p.locator('[data-side-main]').click();await p.waitForTimeout(400);s=await save();
assert.equal(s.egg.id,'wish');if(mainBefore.warmth>0)assert.equal(s.shelf[0].since,mainBefore.since);
assert.equal(errs.length,0,errs.join('\n'));
console.log('egg traits: offer after hatch, pick naughty, pet+colour requests, shiny boost, cradle slot warms shelf PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
