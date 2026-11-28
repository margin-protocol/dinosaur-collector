// 特訓畫面開著時，從戰報「再打一次」進關卡，特訓要收起來，不能兩個疊在一起（玩家 11/28）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:360,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';
await p.goto('http://127.0.0.1:8000');if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');await p.waitForTimeout(400);
await p.evaluate(async k=>{const {CHARACTERS}=await import('/js/eggs.js');const s=JSON.parse(localStorage.getItem(k));
const nos=Object.keys(CHARACTERS).slice(0,12);s.dex={};s.affection={};nos.forEach(n=>{s.dex[n]={at:'2026-11-10T00:00:00Z',dup:0};s.affection[n]={pts:0};});
s.hatched=nos.length;s.tutorial=null;s.battle=s.battle||{};s.battle.badges=4;localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(600);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.click('#home-errand');await p.click('#tab-battle');
const vis=()=>p.evaluate(()=>({train:!document.querySelector('#battle-train').hidden,stage:!document.querySelector('#battle-stage').hidden,map:!document.querySelector('#battle-map').hidden}));
await p.click('#open-train');await p.waitForSelector('#train-list .train-tile');
assert.deepEqual(await vis(),{train:true,stage:false,map:false});
// 討伐隊伍回來 → 戰報 →「再打一次」
const enemy=await p.evaluate(async()=>Object.keys((await import('/js/battle.js')).ENEMIES)[0]);
await p.evaluate(e=>{const btn=document.querySelector('#battle-again');btn.dataset.key=e;btn.dataset.nos='';btn.hidden=false;btn.click();},enemy);
await p.waitForTimeout(300);
assert.deepEqual(await vis(),{train:false,stage:true,map:false},'only stage after battle-again');
// 回關卡列表 → 只有地圖
await p.click('#battle-back');assert.deepEqual(await vis(),{train:false,stage:false,map:true});
// 再開特訓 → 只有特訓
await p.click('#open-train');assert.deepEqual(await vis(),{train:true,stage:false,map:false});
assert.equal(errs.length,0,errs.join('\n'));console.log('train-stage-exclusive: train and stage never overlap PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
