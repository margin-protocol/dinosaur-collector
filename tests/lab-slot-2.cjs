// 第二個研究欄位（湘 11/25：玩家許願，500 化石，樣式 A 上下兩張卡）：花化石開第二格後可以同時調配兩組配方
const { chromium } = require('playwright'), assert = require('node:assert/strict');
(async()=>{
const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await (await b.newContext({viewport:{width:360,height:800},isMobile:true,hasTouch:true,reducedMotion:'reduce'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();
// 純邏輯
const u=await p.evaluate(async()=>{const L=await import('/js/lab.js'),F=await import('/js/fossils.js'),E=await import('/js/errands.js');
  const t0=Date.parse('2026-11-27T10:00:00Z');
  const s={dex:Object.fromEntries(['002','005','006','003','007','010','044'].map(n=>[n,{}])),recipes:{},gifts:{eggs:[]},errands:{active:[]},fossils:499,wishEgg:{stock:0}};
  const one=L.startBrew(s,'strawberry-cake',{now:t0});const full=L.startBrew(s,'rain-garden',{now:t0});
  const poor=L.buyLabSlot(s);const offerShown=!!F.offersFor(s).find(o=>o.id==='lab');
  s.fossils=520;const ex=F.exchange(s,'lab');const left=s.fossils;const offerGone=!F.offersFor(s).find(o=>o.id==='lab');
  const again=L.buyLabSlot(s);
  const dup=L.startBrew(s,'strawberry-cake',{now:t0});const share=L.startBrew(s,'cat-cafe',{now:t0}); // 005 在第一格
  const two=L.startBrew(s,'rain-garden',{now:t0});const third=L.startBrew(s,'starry-library',{now:t0});
  const busy=[...E.busyNos(s)].sort();const nos=L.labNos(s).sort();
  const mid=L.finishBrews(s,t0+2*864e5).map(r=>r.id);const st=L.labStatuses(s,t0+2*864e5).map(x=>x&&x.recipe.id);
  const fin=L.finishBrews(s,t0+3*864e5).map(r=>r.id);
  const c=L.startBrew(s,'starry-library',{now:t0});const cancel=L.cancelBrew(s,1);
  return {one:one.slot,full,poor,offerShown,ex:ex&&ex.cost,left,offerGone,again,dup,share,two:two.slot,third,busy,nos,mid,st,fin,eggs:s.gifts.eggs.map(e=>e.character).sort(),c:c.slot,cancel,lab2:s.lab2,lab:s.lab};});
assert.equal(u.one,0);assert.match(u.full,/正在調配另一組/);assert.match(u.poor,/還不夠/);assert.equal(u.offerShown,true);
assert.equal(u.ex,500);assert.equal(u.left,20);assert.equal(u.offerGone,true);assert.match(u.again,/全部開好/);
assert.match(u.dup,/已經在研究室/);assert.match(u.share,/調配另一組/);assert.equal(u.two,1);assert.match(u.third,/兩格都在調配/);
assert.deepEqual(u.busy,['002','003','005','006']);assert.deepEqual(u.nos,['002','003','005','006']);
assert.deepEqual(u.mid,['rain-garden']);assert.deepEqual(u.st,['strawberry-cake',null]);assert.deepEqual(u.fin,['strawberry-cake']);
assert.deepEqual(u.eggs,['011','012']);assert.equal(u.c,0);assert.equal(u.cancel,false);assert.equal(u.lab2,null);assert.equal(u.lab.recipe,'starry-library');
// 介面：調配中出現虛線卡，按兩次花 500 化石開第二格，再放第二組
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.tutorial=null;s.fossils=600;
 s.dex=Object.fromEntries(['001','002','005','003','006'].map(id=>[id,{at:'2026-11-01'}]));s.hatched=5;
 const now=Date.now();s.lab={recipe:'strawberry-cake',members:['002','005'],start:new Date(now-864e5).toISOString(),until:new Date(now+2*864e5).toISOString()};
 localStorage.setItem(k,JSON.stringify(s));});
await p.goto('http://127.0.0.1:8000/#research');await p.reload();await p.locator('.research-labs:not([hidden])').waitFor();
assert.match(await p.textContent('.research-labs__head'),/1 \/ 1 使用中/);
const buy=p.locator('[data-buy-lab]');assert.match(await buy.textContent(),/500 化石開放/);
await buy.click();assert.match(await buy.textContent(),/再按一次/);
let s=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));assert.equal(s.fossils,600,'first tap only asks');
await buy.click();await p.waitForFunction(()=>!document.querySelector('[data-buy-lab]'));
s=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));assert.equal(s.fossils,100);assert.equal(s.labSlots,2);
assert.match(await p.textContent('.research-labs__head'),/1 \/ 2 使用中/);assert.match(await p.textContent('.research-lab--empty'),/這一格空著/);
// 360 寬不會撐出橫向捲動
assert.ok(await p.evaluate(()=>[...document.querySelectorAll('.research-labs, .research-labs *')].every(e=>e.getBoundingClientRect().right<=360)),'lab cards fit in 360');
await p.locator('[data-slot="0"]').click();await p.locator('[data-partner="006"]').click();await p.locator('[data-slot="1"]').click();await p.locator('[data-partner="003"]').click();
await p.locator('[data-preview]').click();await p.locator('.research-result[open]').waitFor();
await p.locator('[data-brew]').click();await p.waitForFunction(()=>!document.querySelector('.research-result').open);
assert.match(await p.textContent('.research-labs__head'),/2 \/ 2 使用中/);assert.equal(await p.locator('.research-lab:not(.research-lab--empty)').count(),2);
s=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));assert.deepEqual(s.lab2.members,['006','003']);
// 中止第二格只清第二格
await p.locator('[data-cancel-brew="1"]').click();await p.locator('[data-cancel-brew="1"]').click();
await p.waitForFunction(()=>JSON.parse(localStorage.getItem('siang-collector:v1')).lab2===null);
s=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));assert.equal(s.lab.recipe,'strawberry-cake');
// 兩格同時到時間：開遊戲收到兩顆紀念蛋
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));const t=new Date(Date.now()-1000).toISOString();s.lab.until=t;
 s.lab2={recipe:'rain-garden',members:['006','003'],start:new Date(Date.now()-3*864e5).toISOString(),until:t};localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.waitForTimeout(1500);
s=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));
assert.equal(s.lab,null);assert.equal(s.lab2,null);assert.deepEqual(s.gifts.eggs.filter(e=>String(e.from).startsWith('recipe:')).map(e=>e.character).sort(),['011','012']);
// 化石交換所也看得到（還沒開的人）
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));delete s.labSlots;s.fossils=10;localStorage.setItem(k,JSON.stringify(s));});
await p.goto('http://127.0.0.1:8000/');await p.reload();await p.locator('#chip-fossil').click();
const offer=p.locator('[data-offer="lab"]');assert.match(await offer.textContent(),/第二個研究欄位.*500 化石/);assert.equal(await offer.isDisabled(),true);
assert.deepEqual(errs,[]);console.log('lab slot 2: 500 fossils, two brews at once, separate cancel, both finish PASS');await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
