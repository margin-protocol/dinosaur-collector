// 動物小湘、探索完縮小、小恐龍閒聊與委託（顏色照片、打招呼、注入能量、放棄）
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const today=await p.evaluate(async()=>(await import('/js/wishes.js')).todayKey());
await p.evaluate(({k,today})=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'},'044':{at:'x'}};s.egg={id:'ordinary',warmth:0,since:'2026-11-10T00:00:00Z'};s.energy=0;s.bonus.gift=today;s.bonus.explored=today;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['044']));},{k:key,today});
await p.reload();await p.waitForTimeout(500);
// explored today → compact pill
assert.match(await p.getAttribute('#explore','class'),/is-compact/);
// chatter works
const line=await p.evaluate(async()=>{const {chatterLine}=await import('/js/dino.js');const {CHARACTERS}=await import('/js/eggs.js');return chatterLine({dex:{'001':1},weather:{date:'x'},travel:{visits:{}}},CHARACTERS,{today:'x',residents:['044']});});assert.ok(line.length>2);
// greet task
const mk=async(task)=>{await p.evaluate(({k,task,today})=>{const s=JSON.parse(localStorage.getItem(k));s.dino={date:today,count:0,task};localStorage.setItem(k,JSON.stringify(s));},{k:key,task,today});await p.reload();await p.waitForTimeout(500);};
await mk({type:'greet',target:'044',text:'去跟貓咪小湘打個招呼吧',goal:1});
assert(await p.locator('#dino-task').isVisible());assert.match(await p.getAttribute('#dino-task','class'),/is-mini/,'舊存檔的委託＝已接下，縮成小圓鈕');
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
await p.locator('.resident-slot .resident-static').first().click();await p.waitForTimeout(600);
let s=await save();assert.equal(s.dino.task,null);assert.equal(s.dino.count,1);assert.equal(s.energy,5+25+2,'greet task + tap also pets (+2)');
// color task: blue photo passes, red photo fails
const blue=await p.evaluate(async()=>{const cv=document.createElement('canvas');cv.width=cv.height=40;const x=cv.getContext('2d');x.fillStyle='#2f6fe0';x.fillRect(0,0,40,40);return cv.toDataURL('image/png').split(',')[1];});
const red=await p.evaluate(async()=>{const cv=document.createElement('canvas');cv.width=cv.height=40;const x=cv.getContext('2d');x.fillStyle='#d2203f';x.fillRect(0,0,40,40);return cv.toDataURL('image/png').split(',')[1];});
await mk({type:'color',target:'blue',text:'幫我找一個藍色的東西',goal:1});assert(!(await p.locator('#dino-task-photo').isVisible()));await p.click('#dino-task-toggle');assert(await p.locator('#dino-task-photo').isVisible());
await p.setInputFiles('#dino-task-input',{name:'r.png',mimeType:'image/png',buffer:Buffer.from(red,'base64')});await p.waitForTimeout(500);s=await save();assert.ok(s.dino.task);
await p.setInputFiles('#dino-task-input',{name:'b.png',mimeType:'image/png',buffer:Buffer.from(blue,'base64')});await p.waitForTimeout(600);s=await save();assert.equal(s.dino.task,null);assert.equal(s.dino.count,1);
// feed task auto-completes on progress
await p.evaluate(({k,today})=>{const s=JSON.parse(localStorage.getItem(k));s.dino.count=2;s.dino.task={type:'feed',target:30,base:s.player.stats.fed,text:'注入 30',goal:30};s.energy=40;localStorage.setItem(k,JSON.stringify(s));},{k:key,today});await p.reload();
await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(300);
for(let i=0;i<3;i++){await p.click('#cultivate');await p.waitForTimeout(450);}
await p.waitForTimeout(500);s=await save();assert.equal(s.dino.task,null);assert.equal(s.dino.count,3);
// daily cap: no offer accepted after 3
const offered=await p.evaluate(async(k)=>{const {canOffer}=await import('/js/dino.js');const s=JSON.parse(localStorage.getItem(k));return canOffer(s,s.dino.date);},key);assert.equal(offered,false);
// accept via dino tap on a fresh day, then skip
await p.evaluate(({k,today})=>{const s=JSON.parse(localStorage.getItem(k));s.dino={date:today,count:0,task:null};localStorage.setItem(k,JSON.stringify(s));},{k:key,today});await p.reload();await p.evaluate(()=>location.hash='home');await p.waitForTimeout(400);
await p.evaluate(()=>{document.querySelector('#guide').dataset.mode='task-offer';});await p.click('#bubble');await p.waitForTimeout(500);
s=await save();assert.equal(s.dino.task.accepted,false);assert(await p.locator('#dino-task-accept').isVisible());assert(!(await p.locator('#dino-task-skip').isVisible()));
await p.click('#dino-task-decline');await p.waitForTimeout(300);s=await save();assert.equal(s.dino.task,null,'先不要＝不接');assert.equal(s.dino.count,0);
await p.evaluate(()=>{document.querySelector('#guide').dataset.mode='task-offer';});await p.click('#bubble');await p.waitForTimeout(500);
await p.click('#dino-task-accept');await p.waitForTimeout(300);s=await save();assert.equal(s.dino.task.accepted,true);assert.match(await p.getAttribute('#dino-task','class'),/is-mini/);
const box=await p.locator('#dino-task').boundingBox();assert.ok(box.width<80,'縮小後不擋畫面 '+box.width);
await p.click('#dino-task-toggle');assert(await p.locator('#dino-task-skip').isVisible());
await p.click('#dino-task-skip');await p.waitForTimeout(300);s=await save();assert.equal(s.dino.task,null);
// animals in dex
const n=await p.evaluate(async()=>{const {CHARACTERS}=await import('/js/eggs.js');return Object.values(CHARACTERS).filter(c=>c.series==='animals').length;});assert.equal(n,14,'12 動物裝扮小湘＋Koda 小湘、爬爬小湘（11/20）');
assert.equal(errs.length,0,errs.join('\n'));
console.log('dino: compact explore, chatter, greet/color/feed tasks, cap, accept+skip, animals PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
