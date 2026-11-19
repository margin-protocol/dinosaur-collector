// 入住安排：上面三個位置＋依系列的小格子；出門／討伐中的小湘不能入住；長按出門／討伐選人的小湘會顯示她是誰
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=8;s.dex={};for(const n of ['001','002','003','004','005','006','007','008','009','010'])s.dex[n]={at:'x'};
 const until=new Date(Date.now()+3600e3).toISOString();s.errands={active:[{id:'e1',place:'park',nos:['004'],at:new Date().toISOString(),until,loot:{energy:1}}],departed:1};
 s.battle={stages:{},active:[{id:'b1',enemy:'mochi',nos:['005'],at:new Date().toISOString(),until,report:{win:true}}]};
 localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['001']));localStorage.setItem('siang-collector:theme:v1','sakura');});
await p.reload();await p.waitForTimeout(500);
await p.locator('#open-residents').click();await p.locator('#residents[open]').waitFor();
assert.equal(await p.locator('.residents-slot').count(),3);assert.equal(await p.locator('.residents-slot.is-empty').count(),2);
assert(await p.locator('[data-no="004"]').isDisabled(),'出門中不能入住');assert.match(await p.locator('[data-no="004"]').textContent(),/出門中/);
assert(await p.locator('[data-no="005"]').isDisabled(),'討伐中不能入住');assert.match(await p.locator('[data-no="005"]').textContent(),/討伐中/);
await p.locator('[data-no="003"]').click();assert.equal(await p.locator('.residents-slot.is-empty').count(),1);
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT});
await p.locator('.residents-slot[data-current="003"]').click();assert.equal(await p.locator('.residents-slot.is-empty').count(),2,'點上面的位置讓她休息');
await p.locator('#residents-done').click();
// 長按討伐選人
await p.evaluate(()=>document.getElementById('open-battle')?.click());await p.waitForTimeout(400);
await p.locator('.battle-stage-card').first().click();await p.locator('#battle-siangs .errand-siang').first().waitFor();
const btn=p.locator('#battle-siangs .errand-siang:not([disabled])').first();const no=await btn.getAttribute('data-siang');const bb=await btn.boundingBox();
await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await p.waitForTimeout(650);
assert.equal(await p.locator('.press-tip').count(),1,'長按出現名字');
const name=await p.evaluate(async n=>(await import('/js/eggs.js')).CHARACTERS[n].name,no);assert.match(await p.locator('.press-tip').textContent(),new RegExp(name));
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT.replace('.png','-press.png')});
await p.mouse.up();await p.waitForTimeout(200);assert.equal(await btn.getAttribute('aria-pressed'),'false','長按不會順便選到她');
await btn.click();assert.equal(await btn.getAttribute('aria-pressed'),'true','一般點一下照常選');
assert.equal(errs.length,0,errs.join('\n'));console.log('residents grid: slots, series tiles, away disabled, slot removal; long-press shows Siang info without selecting PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
