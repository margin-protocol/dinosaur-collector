// node tests/stage-report.cjs — 點進關卡也能收這一關的戰報（湘 11/28）（SHOT=資料夾 會截圖）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
for(const [theme,w] of (process.env.SHOT?[['sakura',360],['sakura',430],['',360]]:[['',360]])){
const c=await b.newContext({viewport:{width:w,height:820},deviceScaleFactor:process.env.SHOT?2:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://127.0.0.1:8000/`);await p.click('#intro-ok').catch(()=>{});
await p.evaluate(async(theme)=>{const B=await import('/js/battle.js');const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=40;s.tutorial=null;
 const team=['001','002','003','004','005','006','007','008','009','010','011'];s.dex=Object.fromEntries(team.map(n=>[n,{at:'x'}]));s.battle={stages:{mochi:{stars:1,best:900,last:900,clears:1,tries:1}},train:{}};
 B.ensureBattle(s);localStorage.setItem(k,JSON.stringify(s));if(theme)localStorage.setItem('siang-collector:theme:v1',theme);},theme);
const openStage=async()=>{await p.reload();await p.waitForTimeout(600);await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());document.getElementById('open-battle')?.click();});await p.waitForSelector('.battle-stage-card',{timeout:5000});await p.waitForTimeout(200);
 await p.evaluate(()=>{[...document.querySelectorAll('.battle-stage-card')].find(x=>x.textContent.startsWith('1-1'))?.click();});await p.waitForTimeout(200);};
await openStage();
assert.equal(await p.isHidden('#battle-stage-trips'),true,'沒隊伍時不顯示');
for(const no of ['001','002'])await p.click(`#battle-siangs [data-siang="${no}"]`);
await p.click('#battle-go');await p.waitForTimeout(400);
await p.evaluate(()=>{[...document.querySelectorAll('.battle-stage-card')].find(x=>x.textContent.startsWith('1-1'))?.click();});await p.waitForTimeout(200);
assert.equal(await p.isVisible('#battle-stage-trips'),true,'討伐中也看得到');
assert.equal(await p.locator('#battle-stage-trips .btn').count(),0,'還沒回來沒有戰報鈕');
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.battle.active.forEach(a=>{a.until=new Date(Date.now()-1000).toISOString();});localStorage.setItem(k,JSON.stringify(s));});
await openStage();
assert.match(await p.textContent('#battle-stage-trips'),/回來了！看戰報/);
if(process.env.SHOT){await p.evaluate(()=>document.getElementById('battle-stage').scrollIntoView({block:'start'}));await p.waitForTimeout(200);await p.screenshot({path:`${process.env.SHOT}/stage-${theme||'default'}-${w}.png`});}
await p.click('#battle-stage-trips .btn');await p.waitForTimeout(500);
assert.equal(await p.evaluate(()=>document.getElementById('battle-result').open),true,'戰報打開');
assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')).battle.active.length),0,'戰報收下');
await p.evaluate(()=>document.getElementById('battle-result').close());await p.waitForTimeout(200);
assert.equal(await p.isHidden('#battle-stage-trips'),true,'收完就不顯示');
assert.deepEqual(errs,[]);await c.close();}
console.log('stage report: in-stage trip row + 戰報 button PASS');await b.close();})();
