// 派小湘出門：出發、首頁暫時不在、回來收下（系列加成、兩隻一起的故事、家鄉明信片、遠行縣市蛋）、在家寫紙條與陪小恐龍
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
const shift=(h)=>p.evaluate(([k,h])=>{const s=JSON.parse(localStorage.getItem(k));for(const e of s.errands.active){e.until=new Date(Date.parse(e.until)-h*3600e3).toISOString();}localStorage.setItem(k,JSON.stringify(s));},[key,h]);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));const at='2026-11-10T00:00:00Z';s.dex={'001':{at},'005':{at},'043':{at},'016':{at},'017':{at}};s.energy=0;s.fossils=0;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['001','005']));},key);
await p.reload();await p.waitForTimeout(400);
const info=await p.evaluate(async()=>{const {CHARACTERS}=await import('/js/eggs.js');return Object.fromEntries(['001','005','043','016','017'].map(n=>[n,[CHARACTERS[n].series,CHARACTERS[n].county||null]]));});
// pair 005 + 001 to the park → story 原味帶路
await p.click('#home-errand');await p.locator('#errand-dialog[open]').waitFor();
await p.click('.errand-place:has-text("公園")');
await p.click('.errand-siang:has(img[alt="甜點小湘"])');await p.click('.errand-siang:has(img[alt="原味小湘"])');
await p.click('#errand-go');await p.waitForTimeout(300);
let s=await save();assert.equal(s.errands.active.length,1);assert.equal(s.errands.active[0].loot.story,'origin');
await p.click('#close-errands');
assert.equal(await p.locator('.resident-slot').count(),0,'both residents away from home');
// a county Siang goes far away
const county=Object.entries(info).find(([,v])=>v[0]==='county');assert(county,JSON.stringify(info));
await p.click('#home-errand');await p.click('.errand-place:has-text("遠行")');
const name=await p.evaluate(async n=>{const {CHARACTERS}=await import('/js/eggs.js');return CHARACTERS[n].name;},county[0]);
await p.click(`.errand-siang:has(img[alt="${name}"])`);await p.click('#errand-go');await p.waitForTimeout(300);
s=await save();assert.equal(s.errands.active.length,2);assert.deepEqual(s.errands.active[1].loot.cards,[county[1][1]]);
assert(await p.locator('.errand-place').first().isDisabled(),'slots full');
await p.click('#close-errands');
// time passes → back
await shift(9);await p.reload();await p.waitForTimeout(500);
assert.equal(await p.textContent('#errand-badge'),'2');assert.equal(await p.locator('.resident-slot').count(),2,'back home');
await p.click('#home-errand');await p.locator('.errand-trip.is-back').first().waitFor();
await p.locator('.errand-trip.is-back .btn').first().click();await p.locator('#errand-result[open]').waitFor();
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
assert.match(await p.textContent('#errand-story-title'),/原味帶路/);
await p.click('#errand-result-ok');
await p.locator('.errand-trip.is-back .btn').first().click();await p.locator('#errand-result[open]').waitFor();await p.click('#errand-result-ok');
s=await save();assert.equal(s.errands.active.length,0);assert.equal(s.errands.album.length,2);assert(s.errands.stories.origin);assert(s.errands.cards[county[1][1]]);
assert(s.fossils>=3+3+2,'story + card + far fossils: '+s.fossils);assert(s.energy>0);
// home tasks: note + dino (dino doubles next task)
await p.click('.errand-place:has-text("寫紙條")');await p.click('.errand-siang:has(img[alt="甜點小湘"])');await p.click('#errand-go');await p.waitForTimeout(200);
await p.click('.errand-place:has-text("陪小恐龍")');await p.click('.errand-siang:has(img[alt="原味小湘"])');await p.click('#errand-go');await p.waitForTimeout(200);
await p.click('#close-errands');assert.equal(await p.locator('.resident-slot').count(),2,'home helpers stay home');
await shift(4);await p.reload();await p.waitForTimeout(400);
await p.click('#home-errand');for(let i=0;i<2;i++){await p.locator('.errand-trip.is-back .btn').first().click();await p.locator('#errand-result[open]').waitFor();await p.click('#errand-result-ok');}
s=await save();assert(s.letters.mail.some(m=>m.title==='甜點小湘的紙條'));assert.equal(s.dino.double,true);
const doubled=await p.evaluate(async(k)=>{const {completeTask}=await import('/js/dino.js');const s=JSON.parse(localStorage.getItem(k));s.dino.task={type:'feed'};const e=s.energy;const r=completeTask(s);return [r,s.energy-e,s.dino.double];},key);
assert.equal(doubled[0],doubled[1]);assert.equal(doubled[2],undefined);
// album replay
await p.click('#errand-album button');await p.locator('#errand-result[open]').waitFor();assert.equal(await p.textContent('#errand-result-ok'),'關閉');
assert.equal(errs.length,0,errs.join('\n'));
console.log('errands: pair story, away from home, county card, slots, collect rewards, note + dino double, album PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
