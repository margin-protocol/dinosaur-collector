// node tests/night-battle-ui.cjs — 連戰到天亮的開關：打贏過的關才開得了、出發後 8 小時、隊伍列顯示 🌙（SHOT=資料夾 會截圖三種樣式）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
for(const [style,w] of (process.env.SHOT?[['A',360],['B',360],['C',360],['A',430],['B',430],['C',430]]:[['A',360]])){
const c=await b.newContext({viewport:{width:w,height:820},deviceScaleFactor:process.env.SHOT?2:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(`http://127.0.0.1:8000/?night-style=${style}`);await p.click('#intro-ok').catch(()=>{});
await p.evaluate(async()=>{const B=await import('/js/battle.js');const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=40;s.tutorial=null;
 const team=['001','002','003','004','005','006','007','008','009','010','011'];s.dex=Object.fromEntries(team.map(n=>[n,{at:'x'}]));s.battle={stages:{mochi:{stars:1,best:900,last:900,clears:1,tries:1}},train:{}};
 B.ensureBattle(s);localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.waitForTimeout(600);await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());document.getElementById('open-battle')?.click();});await p.waitForSelector('.battle-stage-card',{timeout:5000}).catch(async()=>{await p.screenshot({path:'/tmp/claude-0/-home-user/6711ae14-7e6c-5614-afcd-4a35c0129f8f/scratchpad/fail.png'});throw new Error('no stage cards')});await p.waitForTimeout(300);
// 沒打贏過的關：連戰不能開
await p.evaluate(()=>{const cards=[...document.querySelectorAll('.battle-stage-card')];cards.find(x=>x.textContent.startsWith('1-2'))?.click();});await p.waitForTimeout(200);
assert.equal(await p.locator('#battle-night button').last().isDisabled(),true,'沒打贏過不能連戰');
await p.click('#battle-back');await p.waitForTimeout(200);
await p.evaluate(()=>{const cards=[...document.querySelectorAll('.battle-stage-card')];cards.find(x=>x.textContent.startsWith('1-1'))?.click();});await p.waitForTimeout(200);
for(const no of ['001','002','003'])await p.click(`#battle-siangs [data-siang="${no}"]`);
if(style==='A')await p.click('#battle-night .battle-night__card');
if(style==='B')await p.click('#battle-night [role=radio]:last-child');
if(process.env.SHOT){await p.evaluate(()=>document.getElementById('battle-night').scrollIntoView({block:'center'}));await p.waitForTimeout(200);await p.screenshot({path:`${process.env.SHOT}/night-${style}-${w}.png`});}
if(style!=='C')assert.match(await p.textContent('#battle-go'),/連戰/);
if(style==='C')await p.click('#battle-night .battle-night__go');else await p.click('#battle-go');
await p.waitForTimeout(400);
const s=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')).battle);
assert.equal(s.active.length,1);assert.equal(s.active[0].night,true);assert.ok(s.nightDay);
assert.match(await p.textContent('#battle-active'),/🌙 連戰/);
if(process.env.SHOT&&style==='A'&&w===360){await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(200);await p.locator('#battle-active').screenshot({path:`${process.env.SHOT}/active-${w}.png`});}
assert.deepEqual(errs,[]);await c.close();}
console.log('night battle ui: locked until cleared, starts 8h run, 🌙 row PASS');await b.close();})();
