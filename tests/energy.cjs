// 額外能量：每日見面禮、隨手收藏（每天 10 張）、打招呼（每位每天一次）、培養架自動保溫（最多 12 小時、不超過門檻）
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'},'002':{at:'x'}};s.egg={id:'ordinary',warmth:0,since:'2026-11-10T00:00:00Z'};s.energy=0;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['002']));},key);
await p.reload();await p.waitForTimeout(600);
// gift
assert(await p.locator('#daily-gift').isVisible());assert.equal(await p.locator('#guide').getAttribute('data-mode'),'gift');
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
await p.click('#daily-gift');await p.waitForTimeout(300);let s=await save();assert.equal(s.energy,30);
assert(await p.locator('#daily-gift').isHidden());
// greet twice → +5 once
const resident=p.locator('.resident-slot .resident-static').first();await resident.click();await p.waitForTimeout(300);await resident.click();await p.waitForTimeout(300);
s=await save();assert.equal(s.energy,35);
// snaps
await p.evaluate(()=>location.hash='wish');await p.waitForTimeout(300);
const img=path.join(__dirname,'..','assets','icons','icon-192.png');
for(let i=0;i<11;i++){await p.setInputFiles('#snap-input',img);await p.waitForTimeout(150);}
s=await save();assert.equal(s.energy,135);assert.equal(s.bonus.snaps.count,10);
assert.match(await p.textContent('#snap-count'),/10 \/ 10/);
// passive: 5 hours away → +25; 20 hours → capped +60; never past the threshold
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.bonus.passiveAt=new Date(Date.now()-5*3600e3-60e3).toISOString();localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.waitForTimeout(600);
s=await save();assert.equal(s.egg.warmth,25);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.bonus.passiveAt=new Date(Date.now()-20*3600e3).toISOString();localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.waitForTimeout(600);
s=await save();assert.equal(s.egg.warmth,85);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.egg.warmth=140;s.bonus.passiveAt=new Date(Date.now()-10*3600e3).toISOString();localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.waitForTimeout(600);
s=await save();assert.equal(s.egg.warmth,150);
await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(300);
// explore pill is visible and first press shows the explanation
await p.evaluate(()=>location.hash='home');await p.waitForTimeout(300);assert(await p.locator('#explore').isVisible());
await p.click('#explore');await p.locator('#explore-intro[open]').waitFor();await p.click('#explore-intro-later');
assert.equal(errs.length,0,errs.join('\n'));
console.log('energy: daily gift, greeting once per resident, 10 snaps/day, passive warmth with cap, explore intro PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
