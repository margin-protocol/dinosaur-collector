// node tests/battle-again.cjs — 戰報「再打一次」：收下後回到同一關、剛打完的隊伍在休息就不預選（湘 11/25）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:360,height:780},deviceScaleFactor:process.env.SHOT?2:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok').catch(()=>{});
await p.evaluate(async()=>{const B=await import('/js/battle.js');const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=40;s.tutorial=null;
 const team=['001','002','003','004','005','006'];s.dex=Object.fromEntries(team.map(n=>[n,{at:'x'}]));s.battle={stages:{},train:{}};
 B.ensureBattle(s);const r=B.startBattle(s,'mochi',['001','002','003']);if(typeof r==='string')throw new Error(r);
 for(const a of s.battle.active)a.until=new Date(Date.now()-1000).toISOString();localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.evaluate(()=>document.getElementById('open-battle')?.click());await p.waitForTimeout(500);
await p.locator('#battle-active .btn').first().click();await p.locator('#battle-result[open]').waitFor();
await p.locator('.battle-theater__skip').click().catch(()=>{});
assert(await p.locator('#battle-again').isVisible(),'戰報有再打一次');
if(process.env.SHOT){await p.evaluate(()=>document.getElementById('battle-again').scrollIntoView({block:'center'}));await p.waitForTimeout(200);await p.screenshot({path:process.env.SHOT+'/result-360.png'});}
await p.locator('#battle-again').click();await p.waitForTimeout(400);if(process.env.SHOT)await p.screenshot({path:process.env.SHOT+'/stage-360.png'});
assert(!(await p.locator('#battle-result[open]').count()),'戰報關掉');
assert(await p.locator('#battle-stage').isVisible(),'回到同一關');
assert.match(await p.textContent('#battle-status'),/休息/);
assert.deepEqual(errs,[]);console.log('battle again: result → same stage, resting team not preselected PASS');await b.close();})();
