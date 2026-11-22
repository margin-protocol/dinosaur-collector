// 副架換蛋（湘 11/22）：點副架哪一格就換那一格的蛋，主架不動；也能跟主架互換、跟暫放架互換
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const W=+(process.env.W||390),SHOT=process.env.SHOT;
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:SHOT?2:1,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.stack));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(k=>{localStorage.setItem('siang-collector:theme:v1','sakura');const s=JSON.parse(localStorage.getItem(k));s.hatched=3;s.dex['001']=s.dex['001']||{count:1};s.cradle={slots:3};
s.egg={id:'county',county:'新北市',warmth:0,since:new Date().toISOString()};
s.shelf=[{id:'county',county:'臺中市',warmth:10,since:new Date(Date.now()-86400e3).toISOString()},{id:'ordinary',warmth:100,since:new Date(Date.now()-2*86400e3).toISOString()}];
s.wishEgg={...(s.wishEgg||{}),stock:1,stamps:0};
localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();
await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(600);
await p.locator('#side-cradles').scrollIntoViewIfNeeded();if(SHOT)await p.screenshot({path:SHOT+'-cradles.png'});
// 1) tap slot 0 → picker for slot 0 → wish egg
await p.locator('[data-side-shelf="0"]').tap();await p.locator('#egg-picker[open]').waitFor();
assert.match(await p.textContent('#egg-picker-title'),/副架第 1 格/);
if(SHOT)await p.screenshot({path:SHOT+'-picker.png'});
await p.locator('[data-cat="wish"]').tap();await p.waitForTimeout(200);if(SHOT)await p.screenshot({path:SHOT+'-wish.png'});
await p.locator('#egg-choices [data-egg="wish"]').tap();await p.waitForTimeout(500);
let s=await save();assert.equal(s.egg.county,'新北市');assert.deepEqual(s.shelf.map(e=>[e.id,e.county||'',e.warmth]),[['wish','',0],['ordinary','',100],['county','臺中市',10]]);assert.equal(s.wishEgg.stock,0);
if(SHOT){await p.locator('#side-cradles').scrollIntoViewIfNeeded();await p.screenshot({path:SHOT+'-after.png'});}
// 2) tap slot 0 again → shelf card 臺中市 swaps back; wish (0%, stocked) goes to index 2
await p.locator('[data-side-shelf="0"]').tap();await p.locator('#egg-picker[open]').waitFor();await p.locator('[data-cat="county"]').tap();await p.waitForTimeout(200);
await p.locator('#egg-choices [data-shelf="2"]').tap();await p.waitForTimeout(500);s=await save();
assert.deepEqual(s.shelf.map(e=>[e.id,e.county||'',e.warmth]),[['county','臺中市',10],['ordinary','',100],['wish','',0]]);
// 3) slot 1 → swap with main
await p.locator('[data-side-shelf="1"]').tap();await p.locator('#egg-picker[open]').waitFor();await p.locator('[data-side-main]').tap();await p.waitForTimeout(500);s=await save();
assert.equal(s.egg.id,'ordinary');assert.equal(s.egg.warmth,100);assert.equal(s.shelf[1].county,'新北市');
// 4) normal picker still swaps main
await p.click('#open-eggs');await p.locator('#egg-picker[open]').waitFor();assert.match(await p.textContent('#egg-picker-title'),/選擇培育的蛋/);await p.click('#close-eggs');
assert.equal(errs.length,0,errs.join('\n'));console.log('side picker PASS',W);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
