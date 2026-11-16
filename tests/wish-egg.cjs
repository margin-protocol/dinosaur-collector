const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';
await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();
// module-level test of stamp logic via import in page
const r=await p.evaluate(async()=>{const {completeDaily}=await import('/js/progression.js');const {loadState}=await import('/js/state.js');const {wishesFor,todayKey}=await import('/js/wishes.js');
 const s=loadState();s.wishEgg={stamps:2,stock:0,days:[]};const d=todayKey();const out=wishesFor(d).map(w=>completeDaily(s,d,w.id).stamp);
 const again=completeDaily(s,d,wishesFor(d)[0].id);return {out,w:s.wishEgg,again};});
console.log(JSON.stringify(r));
assert.equal(r.out[0],null);assert.equal(r.out[2].egg,true);assert.equal(r.w.stock,1);assert.equal(r.w.stamps,0);
// picker flow: hatched player with ordinary egg at 0 warmth and one wish egg
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};s.egg={id:'ordinary',warmth:0,since:'2026-11-16'};s.wishEgg={stamps:1,stock:1,days:['2026-11-15']};localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(500);
await p.locator('#open-eggs').click();await p.waitForTimeout(500);

await p.locator('[data-cat=\"wish\"]').click();await p.locator('[data-egg=\"wish\"]').click();await p.waitForTimeout(400);
let s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(s.egg.id,'wish');assert.equal(s.wishEgg.stock,0);
await p.locator('#open-eggs').click();await p.waitForTimeout(300);await p.locator('[data-cat=\"ordinary\"]').click();await p.locator('[data-egg=\"ordinary\"]').click();await p.waitForTimeout(400);
s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(s.egg.id,'ordinary');assert.equal(s.wishEgg.stock,1);
await p.locator('#open-eggs').click();await p.waitForTimeout(300);await p.locator('[data-cat=\"wish\"]').click();await p.locator('[data-egg=\"wish\"]').click();await p.waitForTimeout(300);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.egg.warmth=150;localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(500);

await p.locator('#cultivate').click();await p.locator('#reveal').waitFor();await p.waitForTimeout(500);
s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(s.hatched,2);assert.equal(s.egg.id,'ordinary');assert.equal(s.wishEgg.stock,0);
console.log('wish egg flow PASS',errs);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
