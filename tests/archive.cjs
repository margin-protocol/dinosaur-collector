// 咕咕的故事檔案館：只讀存檔、不劇透、改版前通關、書評結算時保存（不重抽）、Boss 首勝優先、EX-01 咕咕在焦糖大王後解鎖
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(400);
// review priority (unit)
const kinds=await p.evaluate(async()=>{const m=await import('/js/battle.js');const E=m.ENEMIES;
return [m.reviewKind({win:true,stars:1,score:1100,weakHit:false},{...E['caramel-king']},{clears:0,best:0,tries:0}),
 m.reviewKind({win:true,stars:3,score:2000,weakHit:true},{...E['caramel-king']},{clears:0,best:0,tries:0}),
 m.reviewKind({win:true,stars:3,score:1700,weakHit:false},E.mochi,{clears:0,best:0,tries:0}),
 m.reviewKind({win:true,stars:1,score:1100,weakHit:false},E.mochi,{clears:0,best:0,tries:0}),
 m.reviewKind({win:true,stars:1,score:1100,weakHit:false},E.mochi,{clears:2,best:1500,tries:3,lastWin:false}),
 m.reviewKind({win:true,stars:2,score:1600,weakHit:false},E.mochi,{clears:2,best:1500,tries:3,lastWin:true}),
 m.reviewKind({win:false,stars:0,score:300,weakHit:false},E.mochi,{clears:2,best:1500,tries:3,lastWin:true})];});
assert.deepEqual(kinds,['firstBoss','firstBoss','threeStar','firstWin','comeback','record','defeat']);
// seed: mochi cleared now (with saved review), sock cleared before the update (no firstAt), boss cleared, 005 bond Lv.3, one travel story
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'x'},'005':{at:'x'}};s.hatched=2;s.tutorial=null;
s.battle={stages:{mochi:{stars:3,best:2400,last:2400,clears:2,tries:2,firstAt:'2026-11-17T08:00:00Z',review:{kind:'threeStar',text:'測試書評：三顆星。',at:'2026-11-17T08:00:00Z'},lastWin:true},sock:{stars:2,best:1300,last:1300,clears:1,tries:1},bento:{stars:1,best:1100,last:1100,clears:1,tries:1,firstAt:'2026-11-17T09:00:00Z'},'caramel-king':{stars:1,best:1050,last:1050,clears:1,tries:1,firstAt:'2026-11-17T10:00:00Z'}},story:{'caramel-king:after':'2026-11-17T10:00:00Z'}};
s.affection={'005':{pts:30}};s.errands={active:[],album:[{id:'a',place:'park',nos:['001','005'],at:'2026-11-17T07:00:00Z',story:{id:'origin',title:'原味帶路',text:'測試旅行故事'}}],stories:{origin:'2026-11-17T07:00:00Z'},cards:{}};
localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(500);
const before=await p.evaluate(k=>localStorage.getItem(k),key);
// EX-01 shows on the map after the boss
await p.click('#home-errand');await p.click('#tab-battle');assert.equal(await p.locator('.battle-extra .battle-stage-card').count(),1);
assert.match(await p.textContent('.battle-extra'),/書靈咕咕/);
// archive: battle tab
await p.click('#open-archive-battle');await p.locator('#archive[open]').waitFor();
const txt=await p.textContent('#archive-body');
assert.match(txt,/改版前通關/);assert.match(txt,/2026\/11\/17/);assert.match(txt,/測試書評：三顆星。/);assert.match(txt,/線索 3 \/ 3/);
assert.doesNotMatch(txt,/迷路影子|生氣蘑菇|雷雷大魔王/,'stages not yet unlocked stay hidden');assert.doesNotMatch(txt,/線索 0 \/ 0/);
assert.match(txt,/Boss 過關後/);
if(process.env.SHOT){await p.waitForTimeout(300);await p.screenshot({path:process.env.SHOT});}
// saved review is read, not rerolled
await p.click('#close-archive');await p.click('#open-archive-battle');assert.match(await p.textContent('#archive-body'),/測試書評：三顆星。/);
// bond + travel tabs
await p.click('[data-archive-tab="bond"]');const bond=await p.textContent('#archive-body');assert.match(bond,/甜點小湘 · Lv\.3/);assert.match(bond,/原味小湘：好感度 Lv\.3 解鎖/);
if(process.env.SHOT2){await p.locator('#archive-body details').first().click();await p.waitForTimeout(300);await p.screenshot({path:process.env.SHOT2});}
await p.click('[data-archive-tab="travel"]');assert.match(await p.textContent('#archive-body'),/原味帶路/);assert.match(await p.textContent('#archive-count-travel'),/1\//);
// opening the archive never writes the save
assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),before);
// settlement saves the review on the stage
const saved=await p.evaluate(async k=>{const m=await import('/js/battle.js');const s=JSON.parse(localStorage.getItem(k));s.energy=0;s.wishEgg=s.wishEgg||{stock:0};s.battle.rest={};
const r=m.startBattle(s,'gugu',['001','005'],{rand:()=>0});r.until=new Date(Date.now()-1000).toISOString();const out=m.collectBattle(s,r.id,new Date(),()=>0);return [out.review?.kind,s.battle.stages.gugu.review?.text===out.review?.text,!!s.battle.stages.gugu.firstAt];},key);
assert.equal(saved[1],true);assert.equal(saved[2],true);assert(['firstWin','threeStar'].includes(saved[0]),saved[0]);
assert.equal(errs.length,0,errs.join('\n'));// observation notes use real numbers
const notes=await p.evaluate(async()=>{const m=await import('/js/battle.js');return [m.observe('record',{score:1650,prevLast:1300},m.ENEMIES.mochi,{best:1300,tries:2,clears:2}),m.observe('comeback',{score:1200},m.ENEMIES.mochi,{tries:3,clears:1}),m.observe('defeat',{score:500,prevLast:380},m.ENEMIES.mochi,{tries:2,clears:0}),m.observe('repeat',{score:1},m.ENEMIES.mochi,{tries:1,clears:1})];});
assert.deepEqual(notes,['（上次最高 1300，這次 1650。……我有記下來。）','（之前輸了 2 次。我都看到了。）','（不過比上次多了 120 分。……只是順便提一下。）',null]);
console.log('archive: priority, EX unlock, pre-update label, no spoilers, saved reviews, bond/travel tabs, read-only PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
