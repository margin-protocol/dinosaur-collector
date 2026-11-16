// 換蛋：已注入能量的蛋放上暫放架、進度保留、可拿回來；孵化後自動接續暫放的蛋；暫放架上限
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};s.egg={id:'ordinary',warmth:80,since:'2026-11-10T00:00:00Z'};s.wishEgg={stamps:0,stock:1,days:[]};s.energy=50;localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(400);
// switch to wish egg while ordinary has 80 warmth
await p.click('#open-eggs');assert.equal(await p.locator('[data-egg="wish"]').isDisabled(),false);
await p.click('[data-egg="wish"]');await p.waitForTimeout(300);
let s=await save();assert.equal(s.egg.id,'wish');assert.equal(s.wishEgg.stock,0);assert.deepEqual(s.shelf.map(e=>[e.id,e.warmth]),[['ordinary',80]]);
// feed the wish egg a bit, then go back to the shelved ordinary
await p.click('#cultivate');await p.waitForTimeout(500);s=await save();const wishWarmth=s.egg.warmth;assert(wishWarmth>0);
await p.click('#open-eggs');await p.locator('[data-shelf="0"]').waitFor();
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
await p.click('[data-shelf="0"]');await p.waitForTimeout(300);
s=await save();assert.equal(s.egg.id,'ordinary');assert.equal(s.egg.warmth,80);assert.deepEqual(s.shelf.map(e=>[e.id,e.warmth]),[['wish',wishWarmth]]);
// fresh stocked egg swapped away is refunded, not shelved
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.weather.stock=1;localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(300);
await p.click('#open-eggs');await p.click('[data-egg="weather"]');await p.waitForTimeout(300);s=await save();assert.equal(s.shelf.length,2);
await p.click('#open-eggs');await p.click('[data-shelf="0"]');await p.waitForTimeout(300);s=await save();assert.equal(s.weather.stock,1);assert.equal(s.egg.id,'wish');assert.equal(s.shelf.length,1);
// hatch the current egg → the shelved ordinary comes back automatically
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.egg.warmth=150;localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(400);
await p.click('#cultivate');await p.locator('#reveal').waitFor();await p.waitForTimeout(300);
s=await save();assert.equal(s.egg.id,'ordinary');assert.equal(s.egg.warmth,80);assert.equal(s.shelf.length,0);
// shelf limit
await p.click('#reveal-ok');
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.shelf=Array.from({length:6},(_,i)=>({id:'ordinary',warmth:10+i,since:`2026-11-0${i+1}T00:00:00Z`}));s.wishEgg.stock=1;localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(300);
await p.click('#open-eggs');assert(await p.locator('[data-egg="wish"]').isDisabled());assert(await p.locator('[data-shelf="0"]').isDisabled());
assert.equal(errs.length,0,errs.join('\n'));
console.log('shelf: swap keeps progress, resume shelved egg, fresh stocked refund, auto-resume after hatch, shelf cap PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
