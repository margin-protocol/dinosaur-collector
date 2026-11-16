// 隨手收藏的鼓勵與重複照片提醒、成就達成／領取
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=10;s.energy=0;s.dex={'001':{at:'x'},'051':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.waitForTimeout(500);
// snaps: cheer + duplicate
await p.evaluate(()=>location.hash='wish');await p.waitForTimeout(300);
const pic=(seed)=>p.evaluate((i)=>{const cv=document.createElement('canvas');cv.width=cv.height=36;const x=cv.getContext('2d');for(let k=0;k<12;k++){x.fillStyle=`hsl(${(i*37+k*53)%360},70%,${30+((i*k)%5)*10}%)`;x.fillRect((k*7+i*5)%30,(k*11+i*3)%30,8,8);}return cv.toDataURL('image/png').split(',')[1];},seed);
const a=await pic(1),bb=await pic(2);
await p.setInputFiles('#snap-input',{name:'a.png',mimeType:'image/png',buffer:Buffer.from(a,'base64')});await p.waitForTimeout(300);
assert.match(await p.textContent('#toast'),/第一張收藏/);
await p.setInputFiles('#snap-input',{name:'a2.png',mimeType:'image/png',buffer:Buffer.from(a,'base64')});await p.waitForTimeout(300);
assert.match(await p.textContent('#toast'),/拍過了/);
await p.setInputFiles('#snap-input',{name:'b.png',mimeType:'image/png',buffer:Buffer.from(bb,'base64')});await p.waitForTimeout(300);
assert.match(await p.textContent('#toast'),/眼光真好/);
let s=await save();assert.equal(s.bonus.snaps.count,2);assert.equal(s.energy,20);assert.equal(JSON.stringify(s).includes('base64'),false);
// achievements: hatch-1, hatch-10, ssr ready
await p.click('#open-center');await p.click('#open-achievements');await p.locator('#achievement-dialog[open]').waitFor();
assert.equal(await p.locator('.ach-tile.is-ready').count(),3);
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
await p.locator('.ach-tile.is-ready[data-ach="hatch-1"]').click();await p.waitForTimeout(300);
s=await save();assert.deepEqual(s.achievements.claimed,['hatch-1']);assert.equal(s.energy,40);
assert.equal(await p.locator('.ach-tile.is-ready').count(),2);await p.locator('.ach-tile[data-ach="hatch-30"]').click();assert.match(await p.textContent('#achievement-info'),/孵化 30/);
assert.equal(errs.length,0,errs.join('\n'));
console.log('achievements: snap cheers, duplicate photo reminder, achievement claim PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
