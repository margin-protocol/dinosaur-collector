// 星光糖（湘 11/26 選 B 遞增＋合糖、A 膠囊）：重複給糖、圖鑑餵糖升星、交換所合糖／買糖（每週 3 顆）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
// 純邏輯
const unit=await p.evaluate(async()=>{const m=await import('/js/candy.js');const s={dex:{'116':{at:'x',dup:0}},fossils:1000};
 const g1=m.grantDupCandy(s,'SSR',0),g5=m.grantDupCandy(s,'SSR',5);
 const costs=[];s.candy.SSR=9;for(let i=0;i<6;i++){const r=m.feedCandy(s,{'116':{rarity:'SSR'}},'116');costs.push(r&&r.cost);}
 s.candy.N=7;const mg=m.mergeCandy(s,'N');const mgUR=m.mergeCandy(s,'UR');
 const now=new Date(2026,10,26,12);const buys=[];for(let i=0;i<4;i++)buys.push(Boolean(m.buyCandy(s,'SR',now)));
 const nextWeek=Boolean(m.buyCandy(s,'SR',new Date(2026,11,1,9)));
 return {g1,g5,costs,stars:s.dex['116'].dup,ssrLeft:s.candy.SSR,mg:Boolean(mg),mgUR,N:s.candy.N,R:s.candy.R,buys,nextWeek,fossils:s.fossils,wk:m.weekKey(now)};});
assert.equal(unit.g1,1);assert.equal(unit.g5,2,'滿星重複給 2 顆');
assert.deepEqual(unit.costs,[1,1,2,2,3,null],'升星 1/1/2/2/3，滿星不能再餵');assert.equal(unit.stars,5);assert.equal(unit.ssrLeft,0);
assert(unit.mg);assert.equal(unit.mgUR,null);assert.equal(unit.N,4);assert.equal(unit.R,1);
assert.deepEqual(unit.buys,[true,true,true,false],'每週 3 顆');assert(unit.nextWeek,'下週可以再買');assert.equal(unit.fossils,1000-75*4);assert.equal(unit.wk,'2026-11-23');
// 介面：圖鑑膠囊
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=10;s.dex={'001':{at:'2026-11-01T00:00:00Z'},'116':{at:'2026-11-20T00:00:00Z',dup:2}};s.candy={N:3,SSR:4};s.fossils=130;localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(400);
await p.click('.dex__card[data-dex-no="116"]');await p.locator('#dex-detail[open]').waitFor();
assert.match(await p.textContent('#dex-candy-have'),/SSR 糖 ×4/);assert.match(await p.textContent('#dex-candy-feed'),/餵 2 顆 → ★3/);
if(process.env.SHOT_DIR){await p.locator('#dex-detail-candy').scrollIntoViewIfNeeded();await p.screenshot({path:`${process.env.SHOT_DIR}/dex-candy-360.png`});}
await p.click('#dex-candy-feed');await p.waitForTimeout(250);
assert.match(await p.textContent('#dex-detail-stars'),/★★★☆☆/);assert.match(await p.textContent('#dex-candy-have'),/×2/);
assert.match(await p.textContent('#dex-candy-feed'),/餵 2 顆 → ★4/);
await p.click('#dex-candy-feed');await p.waitForTimeout(250);
assert(await p.locator('#dex-candy-feed').isDisabled());assert.match(await p.textContent('#dex-candy-feed'),/還差 3 顆/);
await p.click('#close-dex-detail');await p.waitForTimeout(150);
await p.click('.dex__card[data-dex-no="001"]');await p.waitForTimeout(250);
assert.match(await p.textContent('#dex-candy-have'),/N 糖 ×3/);await p.click('#close-dex-detail');
// 交換所糖罐
await p.click('#chip-fossil');await p.locator('#fossil-dialog[open]').waitFor();
assert.match(await p.textContent('#candy-jar-rows'),/N 糖持有 3 顆/);
await p.click('[data-merge="N"]');await p.waitForTimeout(250);
assert.match(await p.textContent('#fossil-status'),/合成了 1 顆 R 星光糖/);
assert(await p.locator('[data-merge="N"]').isDisabled());
await p.click('[data-buy="SSR"]');await p.waitForTimeout(250);
assert.match(await p.textContent('#fossil-status'),/買到 1 顆 SSR 星光糖！（現在 1 顆，本週還能買 2 顆）/);
assert(await p.locator('[data-buy="SSR"]').isDisabled(),'化石只剩 5，買不起 SSR');
if(process.env.SHOT_DIR){await p.locator('#candy-jar').scrollIntoViewIfNeeded();await p.screenshot({path:`${process.env.SHOT_DIR}/candy-jar-360.png`});}
const saved=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
assert.equal(saved.fossils,5);assert.equal(saved.candy.SSR,1);assert.equal(saved.candy.R,1);assert.equal(saved.dex['116'].dup,4);
// 寬度不能撐破
const over=await p.evaluate(()=>[...document.querySelectorAll('.candy-jar__row,.candy-jar__btns button')].some(r=>r.scrollWidth>r.clientWidth+1));assert(!over,'糖罐 360 寬不能被切');
assert.equal(errs.length,0,errs.join('\n'));
console.log('star-candy: dup candy, 1/1/2/2/3 feed, merge 3→1, weekly buy cap, dex capsule + candy jar PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
