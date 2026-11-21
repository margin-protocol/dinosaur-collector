// 討伐列表上方的「小湘出勤狀態」：不用進關卡就看到可出戰／休息倒數／忙碌原因，可收合並記住；進關卡後可出戰的排前面
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const width=Number(process.env.W||390);
const c=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT?2:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';
await p.goto('http://127.0.0.1:8000');if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');await p.waitForTimeout(400);
if(process.env.THEME)await p.evaluate(t=>localStorage.setItem('siang-collector:theme:v1',t),process.env.THEME);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));const now=Date.now();const iso=ms=>new Date(now+ms).toISOString();
const nos=['001','002','003','004','005','006','007','008','009','010','011','012'];s.dex={};for(const n of nos)s.dex[n]={at:'2026-11-10T00:00:00Z'};s.hatched=nos.length;s.tutorial=null;
s.battle=s.battle||{};s.battle.rest={'004':iso(35*60e3),'005':iso(5*60e3)};
s.battle.active=[{id:'t1',enemy:'mochi',nos:['006','007'],start:iso(-60e3),until:iso(80*60e3),report:{win:true,score:1,stars:1,log:[]}},{id:'t2',enemy:'sock',nos:['008'],start:iso(-90e3),until:iso(-1000),report:{win:true,score:1,stars:1,log:[]}}];
s.errands=s.errands||{};s.errands.active=[{id:'e1',place:'conv',nos:['009'],start:iso(-60e3),until:iso(2*3600e3),loot:{}}];
localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(600);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
// unit
const u=await p.evaluate(async k=>{const m=await import('/js/siang-status.js');const s=JSON.parse(localStorage.getItem(k));const l=m.siangStatuses(s);return {c:m.statusCounts(l),kinds:l.map(x=>x.kind),first:l.find(x=>x.kind==='busy').label,rest:l.filter(x=>x.kind==='rest').map(x=>x.no)};},key);
assert.deepEqual(u.c,{ready:6,rest:2,busy:4});assert.equal(u.first,'戰報待收','uncollected report first');assert.deepEqual(u.rest,['005','004'],'soonest rest first');
assert.deepEqual(u.kinds,[...Array(6).fill('ready'),'rest','rest','busy','busy','busy','busy']);
await p.evaluate(()=>localStorage.removeItem('siang-collector:battle-roster:v1'));
await p.click('#home-errand');await p.click('#tab-battle');
const head=p.locator('.siang-roster__head');
assert.match(await head.textContent(),/可出戰 6.*休息 2.*忙碌 4/);assert.equal(await head.getAttribute('aria-expanded'),'false');assert.equal(await p.locator('.siang-roster__tile').count(),0,'collapsed by default');
if(process.env.SHOT)await p.screenshot({path:`${process.env.SHOT}-closed.png`});
await head.click();
assert.equal(await p.locator('.siang-roster__tile').count(),12);
assert.match(await p.textContent('.siang-roster__tile[data-siang="004"]'),/還要 35 分/);
assert.match(await p.textContent('.siang-roster__tile[data-siang="006"]'),/討伐中1 時 2\d 分/);
assert.match(await p.textContent('.siang-roster__tile[data-siang="009"]'),/出門中/);
assert.match(await p.textContent('.siang-roster__tile[data-siang="008"]'),/戰報待收/);
const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert(!overflow,'no horizontal scroll');
if(process.env.SHOT){await p.locator('#siang-roster').scrollIntoViewIfNeeded();await p.evaluate(()=>document.querySelector('#siang-roster').scrollIntoView({block:'start'}));await p.waitForTimeout(300);await p.screenshot({path:`${process.env.SHOT}-open.png`});}
// remembered after reload
await p.reload();await p.waitForTimeout(500);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');await p.click('#home-errand');await p.click('#tab-battle');
assert.equal(await p.locator('.siang-roster__tile').count(),12,'stays open');
// in a stage, free siangs come first
await p.locator('.battle-chapter:not(.battle-wild) .battle-stage-card').first().click();
const order=await p.$$eval('#battle-siangs .errand-siang',bs=>bs.map(x=>x.disabled));
assert.deepEqual(order,[...Array(6).fill(false),...Array(6).fill(true)]);
assert.equal(errs.length,0,errs.join('\n'));console.log('siang-roster: counts, rest countdown, busy reasons, collapsible+remembered, free-first in stage PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
