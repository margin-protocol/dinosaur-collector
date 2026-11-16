// 天氣蛋與時間事件：模擬 Open-Meteo 回應（雨／晴／失敗），不連真實網路
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const key='siang-collector:v1';let weather={code:61,precip:1.2};let fail=false;
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',geolocation:{latitude:24.1372,longitude:120.6869},permissions:['geolocation'],timezoneId:'Asia/Taipei'});
await ctx.route('https://api.open-meteo.com/**',route=>fail?route.abort():route.fulfill({contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({current:{weather_code:weather.code,precipitation:weather.precip}})}));
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-11-16T14:00:00+08:00')});
await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();await p.evaluate(()=>localStorage.setItem('siang-collector:explore-intro:v1','1'));
const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
// boosts unit check
const stats=await p.evaluate(async()=>{const {rollFor}=await import('/js/eggs.js');const c={plain:0,night:0};for(let i=0;i<20000;i++){if(rollFor({id:'ordinary'})==='004')c.plain++;if(rollFor({id:'ordinary'},[{no:'004',times:4}])==='004')c.night++;}return c;});
assert(stats.night>stats.plain*2.5,`night boost ${JSON.stringify(stats)}`);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};s.egg={id:'ordinary',warmth:0,since:'2026-11-16'};s.travel={visits:{'臺中市':{first:'2026-11-01',last:'2026-11-01'}},eggs:[],granted:['臺中市']};localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(2500); // silent auto check: rain → toast, weather egg
let s=await save();assert.equal(s.weather.kind,'rain');assert.equal(s.weather.stock,1);assert.equal(s.weather.date,'2026-11-16');assert.equal(JSON.stringify(s).includes('120.68'),false);
// same day explore again: no second egg, dialog shows normal visit
await p.locator('#explore').click();await p.locator('#county-call[open]').waitFor();
s=await save();assert.equal(s.weather.stock,1);await p.locator('#county-ok').click();
// omen on incubation page while raining
await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(300);
assert.match(await p.locator('#incubation-omen').textContent(),/雨傘小湘/);
// next day still raining → second egg; third day capped at 2
for(const [day,expect] of [['2026-11-17',2],['2026-11-18',2]]){await p.clock.setFixedTime(new Date(`${day}T14:00:00+08:00`));await p.evaluate(()=>location.hash='home');await p.locator('#explore').click();await p.locator('#county-call[open]').waitFor();await p.locator('#county-ok').click();s=await save();assert.equal(s.weather.stock,expect);}
// night omen (no rain today)
weather={code:0,precip:0};await p.clock.setFixedTime(new Date('2026-11-19T23:30:00+08:00'));await p.locator('#explore').click();await p.locator('#county-call[open]').waitFor();await p.locator('#county-ok').click();
s=await save();assert.equal(s.weather.kind,'clear');assert.equal(s.weather.stock,2);
await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(300);
const omen=await p.locator('#incubation-omen').textContent();assert.match(omen,/夜貓/);assert.doesNotMatch(omen,/雨傘/);
if(process.env.SHOT){await p.screenshot({path:process.env.SHOT});}
// pick weather egg, refund, hatch
await p.locator('#open-eggs').click();await p.locator('[data-egg="weather"]').click();await p.waitForTimeout(300);
s=await save();assert.equal(s.egg.id,'weather');assert.equal(s.weather.stock,1);
await p.locator('#open-eggs').click();await p.locator('[data-egg="ordinary"]').click();await p.waitForTimeout(300);
s=await save();assert.equal(s.weather.stock,2);
await p.locator('#open-eggs').click();await p.locator('[data-egg="weather"]').click();await p.waitForTimeout(300);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.egg.warmth=150;localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.waitForTimeout(800);
await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(300);
await p.locator('#cultivate').click();await p.locator('#reveal').waitFor();
s=await save();assert.equal(s.hatched,2);assert.equal(s.egg.id,'ordinary');
// API failure: explore still works, no crash
fail=true;await p.locator('#reveal-ok').click();await p.evaluate(()=>location.hash='home');await p.waitForTimeout(300);
await p.locator('#explore').click();await p.locator('#county-call[open]').waitFor();
assert.equal(errs.length,0,errs.join('\n'));
console.log('weather: rain egg once a day, stock cap, rain/night omens, boost, pick/refund/hatch, API failure PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
