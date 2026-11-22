// 出勤狀態依系列分組（狀態內再分系列）＋圖鑑「依戰力」排序（湘 11/22）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const width=Number(process.env.W||390);
const c=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT?2:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';
await p.goto('http://127.0.0.1:8000');if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');await p.waitForTimeout(400);
if(process.env.THEME)await p.evaluate(t=>localStorage.setItem('siang-collector:theme:v1',t),process.env.THEME);
await p.evaluate(async k=>{const {CHARACTERS}=await import('/js/eggs.js');const s=JSON.parse(localStorage.getItem(k));const now=Date.now();const iso=ms=>new Date(now+ms).toISOString();
const nos=Object.keys(CHARACTERS).filter((n,i)=>i%3!==2||Number(n)>100);s.dex={};nos.forEach((n,i)=>s.dex[n]={at:'2026-11-10T00:00:00Z',dup:i%4});s.hatched=nos.length;s.tutorial=null;
s.battle=s.battle||{};s.battle.rest={'004':iso(35*60e3)};
s.battle.active=[{id:'t1',enemy:'mochi',nos:['006','007'],start:iso(-60e3),until:iso(80*60e3),report:{win:true,score:1,stars:1,log:[]}}];
localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:battle-roster:v1','open');},key);
await p.reload();await p.waitForTimeout(600);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.click('#home-errand');await p.click('#tab-battle');
// 每個狀態底下的格子都在系列標題下面，系列照 SERIES 的順序、不重複
const groups=await p.$$eval('#siang-roster .siang-roster__body > *',ns=>{const out=[];let cur;for(const n of ns){if(n.matches('.siang-roster__group'))out.push(cur={status:n.textContent,series:[]});else if(n.matches('.siang-roster__series'))cur.series.push(n.textContent.split(' · ')[0]);}return out;});
assert(groups.length>=2,'status groups');
const order=await p.evaluate(async()=>Object.values((await import('/js/eggs.js')).SERIES).map(s=>s.name));
for(const g of groups){assert(g.series.length>0,'has series '+g.status);const idx=g.series.map(n=>order.indexOf(n));assert.deepEqual(idx,[...idx].sort((a,b)=>a-b),'series order '+g.status);assert.equal(new Set(g.series).size,g.series.length);}
// 組內可出戰照戰力高到低
const pw=await p.$$eval('#siang-roster .siang-roster__grid',gs=>gs.map(g=>[...g.querySelectorAll('.is-ready .siang-roster__state')].map(x=>parseFloat(x.textContent.replace('戰力','')))));
for(const l of pw)assert.deepEqual(l,[...l].sort((a,b)=>b-a),'power desc in series');
assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no horizontal scroll');
if(process.env.SHOT){await p.evaluate(()=>document.querySelector('#siang-roster').scrollIntoView({block:'start'}));await p.waitForTimeout(300);await p.screenshot({path:`${process.env.SHOT}-roster.png`});}
// 圖鑑依戰力
await p.evaluate(()=>localStorage.setItem('siang-collector:dex-mode:v1','power'));
await p.reload();await p.waitForTimeout(600);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(300);await p.click('[data-dex-mode="power"]');
await p.waitForTimeout(300);
assert.equal(await p.getAttribute('[data-dex-mode="power"]','aria-pressed'),'true');
const cards=await p.$$eval('#dex-grid .dex__card',ls=>ls.map(l=>({owned:l.classList.contains('is-owned'),no:l.dataset.dexNo,p:l.querySelector('.dex__power')?parseFloat(l.querySelector('.dex__power').textContent.replace('戰力','')):null})));
const firstLocked=cards.findIndex(x=>!x.owned);assert(firstLocked>0);assert(cards.slice(firstLocked).every(x=>!x.owned&&x.p===null),'locked after owned');
const ps=cards.slice(0,firstLocked).map(x=>x.p);assert(ps.every(x=>typeof x==='number'));assert.deepEqual(ps,[...ps].sort((a,b)=>b-a),'dex power desc');
const locked=cards.slice(firstLocked).map(x=>x.no);assert.deepEqual(locked,[...locked].sort(),'locked by number');
const modesFit=await p.$eval('.dex__modes',m=>m.getBoundingClientRect().right<=innerWidth&&m.getBoundingClientRect().left>=0);assert(modesFit,'mode buttons fit');
assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no horizontal scroll dex');
if(process.env.SHOT){await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(300);await p.screenshot({path:`${process.env.SHOT}-dex.png`});}
assert.equal(errs.length,0,errs.join('\n'));console.log('roster-series: roster grouped by series inside status, dex power sort PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
