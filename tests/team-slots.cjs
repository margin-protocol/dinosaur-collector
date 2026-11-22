// 討伐隊伍數、出門趟數照收集數解鎖（湘 11/22）：討伐 10/25/50/80 位開第 2～5 隊，出門 30 位開第 3 趟；4 隊以上進行中列表改精簡
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const W=Number(process.env.W||390);
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT?2:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
// 純函式
const r=await p.evaluate(async()=>{const bt=await import('/js/battle.js');const er=await import('/js/errands.js');const {CHARACTERS}=await import('/js/eggs.js');const ids=Object.keys(CHARACTERS);
const st=n=>({dex:Object.fromEntries(ids.slice(0,n).map(no=>[no,{}]))});
return {team:[0,9,10,24,25,49,50,79,80].map(n=>bt.teamSlots(st(n))),next:[bt.nextTeamSlot(st(30)),bt.nextTeamSlot(st(80))],errand:[29,30].map(n=>er.errandSlots(st(n))),hint:[er.errandSlotHint(st(29)),er.errandSlotHint(st(30))]};});
assert.deepEqual(r.team,[1,1,2,2,3,3,4,4,5]);assert.deepEqual(r.next[0],{slots:4,need:50,left:20});assert.equal(r.next[1],null);
assert.deepEqual(r.errand,[2,3]);assert.match(r.hint[0],/30 位/);assert.equal(r.hint[1],'');
// 畫面：80 位、5 隊在打、3 趟出門
const N=Number(process.env.DEX||80),T=Number(process.env.TEAMS||5);
await p.evaluate(async([N,T,theme])=>{const {CHARACTERS}=await import('/js/eggs.js');const ids=Object.keys(CHARACTERS).filter(no=>no!=='100');const k='siang-collector:v1';const s=JSON.parse(localStorage.getItem(k));const at='2026-11-10T00:00:00Z';
s.dex=Object.fromEntries(ids.slice(0,N).map(no=>[no,{at}]));const until=new Date(Date.now()+3*3600e3).toISOString();const start=new Date().toISOString();
const foes=['mochi','sock','bento','sneeze-cloud','welcome-lantern'];s.battle={...(s.battle||{}),active:foes.slice(0,T).map((e,i)=>({id:'t'+i,enemy:e,nos:ids.slice(i*3,i*3+3),start,until,report:{win:true,loot:{badges:1,energy:5,fossils:0}}}))};
s.errands={...(s.errands||{}),active:[0,1].map(i=>({id:'e'+i,place:'park',nos:[ids[20+i]],start,until,loot:{energy:10}}))};
localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:battle-roster:v1','closed');if(theme)localStorage.setItem('siang-collector:theme:v1',theme);},[N,T,process.env.THEME||'']);
await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.click('#home-errand');await p.locator('#errand-dialog[open]').waitFor();
// 出門：30 位以上可以派第 3 趟
assert.equal(await p.locator('.errand-place').first().isDisabled(),N<30);
await p.click('.errand-place:has-text("便利商店")');await p.click('.errand-siang:not([disabled]) >> nth=0');await p.click('#errand-go');await p.waitForTimeout(300);
let s=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));assert.equal(s.errands.active.length,3,'third errand');
assert.equal(await p.locator('.errand-place').first().isDisabled(),true,'full at 3');
if(process.env.SHOT){await p.evaluate(()=>document.querySelector('#errand-dialog').scrollTo(0,0));await p.waitForTimeout(200);await p.screenshot({path:process.env.SHOT+'-errand.png'});}
await p.click('#tab-battle');await p.waitForTimeout(300);
assert.equal(await p.textContent('#battle-slots'),`隊伍 ${T} / 5`);
assert.equal(await p.locator('#battle-active.is-compact').count(),T>=4?1:0);
assert.equal(await p.locator('#battle-active .errand-trip').count(),T);
// 精簡列不能超出畫面寬
const over=await p.evaluate(()=>[...document.querySelectorAll('#battle-active .errand-trip')].some(el=>el.scrollWidth>el.clientWidth+1||el.getBoundingClientRect().right>innerWidth));assert.equal(over,false,'rows fit');
assert.equal(await p.locator('#battle-slot-hint').isVisible(),false,'all 5 open, no hint');
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT+'-battle.png'});
// 收集 30 位、3 隊滿：提示第 4 隊條件
await p.evaluate(async()=>{const {CHARACTERS}=await import('/js/eggs.js');const ids=Object.keys(CHARACTERS);const k='siang-collector:v1';const s=JSON.parse(localStorage.getItem(k));s.dex=Object.fromEntries(ids.slice(0,30).map(no=>[no,{at:'2026-11-10T00:00:00Z'}]));s.battle.active=s.battle.active.slice(0,3);localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.click('#home-errand');await p.locator('#errand-dialog[open]').waitFor();await p.click('#tab-battle');await p.waitForFunction(()=>document.querySelector('#battle-slots')?.textContent==='隊伍 3 / 3');
assert.equal(await p.textContent('#battle-slots'),'隊伍 3 / 3');assert.match(await p.textContent('#battle-slot-hint'),/收集 50 位小湘可以開第 4 隊（還差 20 位）/);
assert.equal(errs.length,0,errs.join('\n'));
console.log('team-slots: 1-5 teams by dex, 3rd errand at 30, compact list, unlock hint PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
