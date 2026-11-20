// 月簽到：一天一次、7/14/21/28 天獎勵、28 天送星光蛋（SR 以上）、每月 1 號重來；UI 簽到
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const key='siang-collector:v1';const errs=[];
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',timezoneId:'Asia/Taipei'});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-12-05T10:00:00+08:00')});await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const u=await p.evaluate(async()=>{const C=await import('/js/checkin.js'),E=await import('/js/eggs.js');
  const s={energy:0,fossils:0,gifts:{eggs:[]}};const d=(n)=>new Date(2026,11,n,9);
  const first=C.checkIn(s,d(1));const again=C.checkIn(s,d(1));
  const log=[];for(let n=2;n<=31;n++){const r=C.checkIn(s,d(n));if(r.rewards.length)log.push([r.count,r.rewards.map(x=>x.days)]);}
  const dec={energy:s.energy,fossils:s.fossils,eggs:s.gifts.eggs.map(e=>e.egg),claimed:s.checkin.claimed};
  const jan=C.checkIn(s,new Date(2027,0,1,9));
  const sr=Array.from({length:400},()=>E.rollFor({id:'star'})).every(no=>['SR','SSR','UR'].includes(E.CHARACTERS[no].rarity));
  return {first:first.count,again,log,dec,jan:[jan.count,s.checkin.month,s.checkin.total,s.checkin.months],sr};});
assert.equal(u.first,1);assert.equal(u.again,null,'一天只能簽一次');
assert.deepEqual(u.log,[[7,[7]],[14,[14]],[21,[21]],[28,[28]]]);
assert.deepEqual(u.dec,{energy:50,fossils:3,eggs:['star'],claimed:[7,14,21,28]});
assert.deepEqual(u.jan,[1,'2027-01',32,1],'每月 1 號重來');assert.ok(u.sr,'星光蛋一定 SR 以上');
// UI
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};s.checkin={month:'2026-12',days:[1,2,3,4],claimed:[],total:4,months:0};localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(600);await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.evaluate(()=>document.getElementById('open-checkin').click());await p.locator('#checkin-dialog[open]').waitFor();
assert.match(await p.textContent('#checkin-intro'),/已經簽到 4 天，再 3 天/);assert.equal(await p.locator('.checkin-day.is-signed').count(),4);
await p.click('#checkin-sign');await p.waitForTimeout(400);
assert.match(await p.textContent('#checkin-status'),/簽到成功/);assert.equal(await p.locator('.checkin-day.is-signed').count(),5);assert.ok(await p.locator('#checkin-sign').isDisabled());
if(process.env.SHOT)await p.locator('#checkin-dialog').screenshot({path:process.env.SHOT});
const s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.deepEqual(s.checkin.days,[1,2,3,4,5]);
// 星光蛋在選蛋裡看得到
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.gifts.eggs.push({egg:'star',from:'checkin-2026-12',at:'x'});localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(500);await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());location.hash='incubate';});await p.waitForTimeout(300);
await p.click('#open-eggs');await p.click('[data-cat="star"]');await p.click('[data-egg="star"]');await p.waitForTimeout(300);
const s2=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(s2.egg.id,'star');assert.equal(s2.gifts.eggs.filter(e=>e.egg==='star').length,0);
assert.equal(errs.length,0,errs.join('\n'));
console.log('checkin: once a day, 7/14/21/28 rewards, star egg SR+, monthly reset, UI sign, star egg selectable PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
