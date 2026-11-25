// 研究室調配（湘 11/19）：找到配方 → 放進研究室，依配方天數調配；一次一組；調配中的兩位不在首頁、不能出門；時間到送紀念蛋
const { chromium } = require('playwright'), assert = require('node:assert/strict');
(async()=>{
const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();
// 純邏輯
const u=await p.evaluate(async()=>{const L=await import('/js/lab.js'),E=await import('/js/errands.js');
  const s={dex:{'002':{},'005':{},'006':{},'003':{}},recipes:{},gifts:{eggs:[]},errands:{active:[]}};const t0=Date.parse('2026-11-20T10:00:00Z');
  const busy=L.startBrew(s,'strawberry-cake',{now:t0,busy:new Set(['002'])});
  const ok=L.startBrew(s,'strawberry-cake',{now:t0});const second=L.startBrew(s,'rain-garden',{now:t0});
  const lab=[...E.busyNos(s)],away=[...E.awayNos(s,t0)];
  const early=L.finishBrew(s,t0+2*864e5);const done=L.finishBrew(s,t0+3*864e5);
  return {busy,ok:!!ok.recipe,second,lab,away,early,done:done?.target,egg:s.gifts.eggs[0]?.character,cleared:s.lab===null,flag:s.recipes['strawberry-cake'].done,
    rain:(()=>{const r={dex:{'006':{},'003':{}},recipes:{},gifts:{eggs:[]}};L.startBrew(r,'rain-garden',{now:t0});return Date.parse(r.lab.until)-t0;})()};});
assert.match(u.busy,/出門或討伐/);assert.equal(u.ok,true);assert.match(u.second,/正在調配另一組/);
assert.deepEqual(u.lab.sort(),['002','005']);assert.deepEqual(u.away.sort(),['002','005']);
assert.equal(u.early,null);assert.equal(u.done,'011');assert.equal(u.egg,'011');assert.equal(u.cleared,true);assert.equal(u.flag,true);
assert.equal(u.rain,2*864e5,'rain recipe uses its own days, no weather needed');
// 介面：研究結果按「放進研究室」
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.tutorial=null;
 s.dex=Object.fromEntries(['001','002','005','003','006'].map(id=>[id,{at:'2026-11-01'}]));s.hatched=5;localStorage.setItem(k,JSON.stringify(s));
 localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['002','005','001']));});
await p.goto('http://127.0.0.1:8000/#research');await p.reload();await p.locator('#research-root').waitFor();
await p.locator('[data-slot="0"]').click();await p.locator('[data-partner="002"]').click();await p.locator('[data-slot="1"]').click();await p.locator('[data-partner="005"]').click();
await p.locator('[data-preview]').click();await p.locator('.research-result[open]').waitFor();
assert.match(await p.textContent('.research-result-copy'),/放進研究室調配 3 天/);
await p.locator('[data-brew]').click();await p.waitForFunction(()=>!document.querySelector('.research-result').open);
await p.locator('.research-labs:not([hidden])').waitFor();
assert.match(await p.textContent('.research-lab'),/《甜甜的相遇》/);assert.match(await p.textContent('.research-lab'),/第 1 \/ 3 天/);
let s=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));assert.deepEqual(s.lab.members,['002','005']);
// 首頁看不到她們
await p.evaluate(()=>location.hash='');await p.waitForTimeout(500);
assert.equal(await p.locator('[aria-label^="與草莓小湘"]').count(),0,'strawberry is in the lab, not home');
// 時間到：開遊戲收到紀念蛋
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.lab.until=new Date(Date.now()-1000).toISOString();localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.waitForTimeout(1500);
s=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));
assert.equal(s.lab,null);assert(s.gifts.eggs.some(e=>e.character==='011'&&e.egg==='keepsake'));assert.equal(s.recipes['strawberry-cake'].done,true);
assert.deepEqual(errs,[]);console.log('research lab brewing: one at a time, recipe days, siangs away, keepsake egg PASS');await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
