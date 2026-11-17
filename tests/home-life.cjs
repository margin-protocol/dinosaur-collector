// 首頁生活感：紙偶走動、摸摸頭、餵點心、入住小湘對話、夜晚／雨天／節日場景
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const errs=[];const key='siang-collector:v1';
const c=await b.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Taipei'});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-12-24T22:00:00+08:00')});
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=3;s.dex={'001':{at:'x'},'044':{at:'x'},'048':{at:'x'}};s.energy=0;s.bonus.gift='2026-12-24';s.bonus.explored='2026-12-24';s.weather={date:'2026-12-24',kind:'rain',stock:0,granted:null};s.gifts.keepsakes=['christmas-2026'];localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['044','048']));},key);
await p.reload();await p.waitForTimeout(800);
// scene
const room=p.locator('#companion-room');assert.match(await room.getAttribute('class'),/is-night/);assert.match(await room.getAttribute('class'),/is-rain/);
assert.equal(await room.getAttribute('data-holiday'),'christmas');
assert(await p.locator('.amb-snow').count()>0);assert(await p.locator('.amb-rain').count()>0);assert(await p.locator('.amb-star').count()>0);
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
// dolls walk
assert.equal(await p.locator('.resident-static .doll').count(),2);
const lefts=await p.locator('.resident-static').evaluateAll(n=>n.map(e=>e.style.left));
await p.clock.runFor(30000);
const moved=await p.locator('.resident-static').evaluateAll(n=>n.map(e=>e.style.left));assert.notDeepEqual(moved,lefts,'dolls should move');
// petting (5 rewarded per day) — stop walking first so the doll stays under the finger
await p.emulateMedia({reducedMotion:'reduce'});await p.clock.runFor(12000);await p.waitForTimeout(300);
const doll=p.locator('.resident-slot[data-character="044"] .resident-static');
const pet=async()=>{const bx=await doll.boundingBox();const y=bx.y+bx.height*0.3,x=bx.x+bx.width/2;await p.mouse.move(x-50,y);await p.mouse.down();for(const dx of [50,-50,50,-50,50]){await p.mouse.move(x+dx,y,{steps:4});}await p.mouse.up();await p.waitForTimeout(250);};
for(let i=0;i<6;i++) await pet();
let s=await save();assert.equal(s.bonus.pets.count,5);assert.equal(s.energy,10);
assert(await p.locator('.resident-bubble').count()>=1);
// snack drag ×4 → 3 rewarded
const snack=p.locator('#snack');
const drag=async()=>{const a=await snack.boundingBox();const t=await doll.boundingBox();await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(t.x+t.width/2,t.y+t.height/2,{steps:8});await p.mouse.up();await p.waitForTimeout(300);if(await p.locator('#bond-up[open]').count()){await p.click('#bond-up-ok');await p.waitForTimeout(200);}};
for(let i=0;i<4;i++) await drag();
s=await save();assert.equal(s.bonus.snacks.count,3);assert.equal(s.energy,35,'snacks +15, plus Lv.2 bond reward +10');
assert.equal(await p.textContent('#snack-left'),'0');
// residents chat
await p.evaluate(()=>document.querySelectorAll('.resident-bubble').forEach(e=>e.remove()));
let seen=false;for(let i=0;i<50&&!seen;i++){await p.clock.runFor(500);seen=(await p.locator('.resident-bubble').count())>0;}assert(seen,'chat bubble');
assert.equal(errs.length,0,errs.join('\n'));
console.log('home life: night/rain/christmas scene, dolls walk, petting 5/day, snack drag 3/day, resident chats PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
