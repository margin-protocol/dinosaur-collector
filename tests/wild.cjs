// 野外巡邏：每天隨機 4 隻野生小怪（個性＋變色＋強度跟著隊伍），打跑就消失、記本週最高分、跨日也能收戰報
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(400);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'x'}};s.hatched=1;s.tutorial=null;delete s.battle;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['001']));},key);
await p.reload();await p.waitForTimeout(500);
let s=await save();assert.equal(s.battle.wild.list.length,4);
// unit: same day → same list; next day → new list; stronger team → stronger wilds; names combine trait + enemy
const u=await p.evaluate(async()=>{const m=await import('/js/battle.js');const mk=(dex,aff)=>{const s={dex,affection:aff};m.ensureBattle(s);return s;};
const a=mk({'001':{at:'x'}},{});const a2=mk({'001':{at:'x'}},{});const strong=mk({'001':{at:'x'}},{'001':{pts:100}});
const next={dex:{'001':{at:'x'}},affection:{}};m.ensureBattle(next);m.ensureWild(next,'2099-01-02');
const names=a.battle.wild.list.map(w=>m.wildEnemy(w).name);
return {same:JSON.stringify(a.battle.wild.list)===JSON.stringify(a2.battle.wild.list),newDay:JSON.stringify(next.battle.wild.list.map(w=>w.base+w.trait))!==JSON.stringify(a.battle.wild.list.map(w=>w.base+w.trait)),
 scaled:strong.battle.wild.list[0].power>a.battle.wild.list[0].power,names,weakest:m.forecast(a,['001'],a.battle.wild.list[0].key).chance};});
assert(u.same);assert(u.newDay);assert(u.scaled);assert(u.names.every(n=>/的/.test(n)),u.names.join());assert.equal(u.weakest,1,'the weakest wild is always beatable by your best');
// UI: patrol section, fight the weakest with origin
await p.click('#home-errand');await p.click('#tab-battle');
assert.equal(await p.locator('.battle-wild .battle-stage-card').count(),4);
if(process.env.SHOT){await p.waitForTimeout(200);await p.screenshot({path:process.env.SHOT});}
await p.locator('.battle-wild .battle-stage-card').first().click();assert.match(await p.textContent('#battle-enemy-stage'),/野外/);
await p.click('.errand-siang:has(img[alt="原味小湘"])');await p.click('#battle-go');await p.waitForTimeout(300);
// next day: list rolls over, but yesterday's battle still reports with its snapshot
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));for(const a of s.battle.active)a.until=new Date(Date.now()-1000).toISOString();s.battle.wild.date='2000-01-01';localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(500);
await p.click('#home-errand');await p.click('#tab-battle');await p.click('#battle-active .btn');await p.locator('#battle-result[open]').waitFor();await p.locator('.battle-theater__skip').click();
assert.match(await p.textContent('#battle-result-title'),/成功/);assert.match(await p.textContent('#battle-result-score'),/本週最高/);
if(process.env.SHOT2){await p.waitForTimeout(200);await p.screenshot({path:process.env.SHOT2});}
await p.click('#battle-result-ok');
s=await save();assert(s.battle.weekBest>0);assert.equal(s.battle.wildWins,1);assert(s.battle.badges>=1);
// a defeated wild today can't be fought again
const again=await p.evaluate(async k=>{const m=await import('/js/battle.js');const s=JSON.parse(localStorage.getItem(k));m.ensureBattle(s);s.battle.wild.list[0].defeated=true;s.battle.rest={};return m.startBattle(s,s.battle.wild.list[0].key,['001']);},key);
assert.match(again,/打跑/);
assert.equal(errs.length,0,errs.join('\n'));console.log('wild patrol: daily random list, scales with team, fight, rollover snapshot, weekly best, no rematch PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
