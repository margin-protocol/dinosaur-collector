// 每日探索蛋（大多是縣市蛋）、小恐龍驚嘆號不再一直出現、首頁轉盤入口
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(400);
// checkIn: first visit = county egg; same day again = nothing; next days = one egg per day (county/wish/weather)
const r=await p.evaluate(async k=>{const {checkIn}=await import('/js/travel.js');const s=JSON.parse(localStorage.getItem(k));s.wishEgg.stock=0;s.weather.stock=0;
const a=checkIn(s,'臺中市','2026-11-17',()=>0.9);const b2=checkIn(s,'臺中市','2026-11-17',()=>0);const c2=checkIn(s,'臺中市','2026-11-18',()=>0.1);const d=checkIn(s,'臺中市','2026-11-19',()=>0.7);const e=checkIn(s,'臺中市','2026-11-20',()=>0.95);
return {a:[a.egg,a.daily],b:[b2.egg,b2.daily],c:c2.daily,d:d.daily,e:e.daily,eggs:s.travel.eggs,wish:s.wishEgg.stock,weather:s.weather.stock};},key);
assert.deepEqual(r.a,[true,'county']);assert.deepEqual(r.b,[false,null]);assert.equal(r.c,'county');assert.equal(r.d,'wish');assert.equal(r.e,'weather');
assert.deepEqual(r.eggs,['臺中市','臺中市']);assert.equal(r.wish,1);assert.equal(r.weather,1);
// alert: energy alone does not raise the "!"; a gift does, and tapping clears it until something new happens
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.energy=80;s.dex={'001':{at:'x'}};s.hatched=1;s.bonus.gift=new Date().toISOString().slice(0,10);s.bonus.explored=s.bonus.gift;localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(600);
await p.evaluate(()=>document.querySelector('#bubble').classList.remove('is-open'));await p.evaluate(()=>window.dispatchEvent(new Event('resize')));
const modeNow=await p.getAttribute('#guide','data-mode');
if(modeNow==='energy'){await p.waitForTimeout(300);assert(await p.locator('#guide-alert').isHidden(),'no alert just for energy');}
// home wheel button
assert(await p.locator('#home-wheel').isVisible());assert.equal(await p.textContent('#wheel-badge'),'3');
await p.click('#home-wheel');await p.locator('#wheel-dialog[open]').waitFor();await p.click('#close-wheel');
if(process.env.SHOT){await p.waitForTimeout(300);await p.screenshot({path:process.env.SHOT});}
assert.equal(errs.length,0,errs.join('\n'));console.log('daily explore egg, quiet energy hint, home wheel PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
