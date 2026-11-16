// 化石交換所：能量、願望蛋、暗號蛋、指定小湘（只能選還沒遇見、一般蛋池裡的）、化石不足
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=3;s.dex={'001':{at:'x'},'002':{at:'x'}};s.fossils=53;s.energy=0;localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.waitForTimeout(400);
await p.click('#chip-fossil');await p.locator('#fossil-dialog[open]').waitFor();
await p.click('[data-offer="energy"]');await p.waitForTimeout(300);let s=await save();assert.equal(s.fossils,50);assert.equal(s.energy,30);
await p.click('[data-offer="wish"]');await p.waitForTimeout(300);s=await save();assert.equal(s.fossils,40);assert.equal(s.wishEgg.stock,1);
await p.click('[data-offer="cipher"]');await p.waitForTimeout(300);s=await save();assert.equal(s.fossils,25);assert.equal(s.gifts.eggs.length,1);
await p.click('[data-offer="pick"]');await p.locator('#fossil-pick').waitFor();
const opts=await p.locator('[data-pick]').evaluateAll(n=>n.map(e=>e.dataset.pick));assert(!opts.includes('001')&&!opts.includes('002')&&!opts.includes('023')&&!opts.includes('042')&&opts.includes('051'));
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
await p.click('[data-pick="051"]');await p.waitForTimeout(300);s=await save();assert.equal(s.fossils,0);assert.equal(s.gifts.eggs[1].character,'051');
assert(await p.locator('[data-offer="energy"]').isDisabled());
const bad=await p.evaluate(async(k)=>{const {exchange}=await import('/js/fossils.js');const {EGGS,CHARACTERS}=await import('/js/eggs.js');const s=JSON.parse(localStorage.getItem(k));s.fossils=99;return [exchange(s,'pick',{eggs:EGGS,chars:CHARACTERS,no:'042'}),exchange(s,'pick',{eggs:EGGS,chars:CHARACTERS,no:'001'})];},key);assert.deepEqual(bad,[null,null]);
assert.equal(errs.length,0,errs.join('\n'));
console.log('fossils: energy, wish egg, cipher egg, pick an unmet pool Siang, guards PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
