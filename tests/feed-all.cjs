// 一鍵餵養：一次注入「剩下需要的」或「手上全部的」能量（取少的那個），不會多扣、不會自動破殼
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(400);
const setup=async(energy,warmth)=>{await p.evaluate(([k,energy,warmth])=>{const s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'2026-11-10T00:00:00Z'}};s.hatched=1;s.tutorial=null;s.eggOffer=null;s.energy=energy;s.egg.warmth=warmth;s.passive={at:new Date().toISOString()};localStorage.setItem(k,JSON.stringify(s));},[key,energy,warmth]);
  await p.reload();await p.waitForTimeout(500);await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(400);};
const need=await p.evaluate(async k=>{const e=await import('/js/eggs.js');const s=JSON.parse(localStorage.getItem(k));return e.EGGS[s.egg.id].warmthNeeded;},key);
// 能量不夠注滿：全部倒進去
await setup(35,0);
assert.match(await p.textContent('#feed-all'),/35 能量/);
await p.click('#feed-all');await p.waitForTimeout(500);
let s=await save();assert.equal(s.energy,0);assert.equal(s.egg.warmth,35);assert(await p.locator('#feed-all').isDisabled());
// 能量很多：只倒到剛好可以破殼，按鈕藏起來，主按鈕變「迎接新夥伴」
await setup(need+500,10);
await p.click('#feed-all');await p.waitForTimeout(500);
s=await save();assert.equal(s.egg.warmth,need);assert.equal(s.energy,need+500-(need-10));assert.equal(Object.keys(s.dex).length,1,'no auto hatch');
assert(await p.locator('#feed-all').isHidden());assert.equal(await p.textContent('#cultivate-label'),'迎接新夥伴');
assert.deepEqual(errs,[]);console.log('feed all ok');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
