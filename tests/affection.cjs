// 小湘好感度：點／摸／布丁加好感（每天上限）、住首頁每天 +2、升級視窗與獎勵、圖鑑顯示解鎖、出門與重複孵化加好感、滿級閃亮卡
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(400);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'2026-11-10T00:00:00Z'},'005':{at:'2026-11-11T00:00:00Z'}};s.hatched=2;s.energy=0;s.tutorial=null;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['005']));},key);
await p.reload();await p.waitForTimeout(1800);
let s=await save();assert.equal(s.affection['005'].pts,3,'home presence +3');
// tap 12 times → 15 pts → Lv.2 popup with +10 energy
const slot=p.locator('.resident-slot[data-character="005"] .resident-static');
for(let i=0;i<12;i++){await slot.click();await p.waitForTimeout(800);} // 慢慢點：太快會被「不要戳啦」擋下
await p.locator('#bond-up[open]').waitFor({timeout:5000});assert.match(await p.textContent('#bond-up-title'),/Lv\.2/);assert.match(await p.textContent('#bond-up-reward'),/10 能量/);
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
await p.click('#bond-up-ok');
s=await save();assert.equal(s.affection['005'].pts,15);assert.equal(s.affection['005'].today,12);
// cap: 15 per day from home interaction
for(let i=0;i<10;i++){await slot.click();await p.waitForTimeout(800);}
s=await save();assert.equal(s.affection['005'].today,15);assert.equal(s.affection['005'].pts,18);
// dex detail shows level and unlocked line
await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(300);await p.click('[data-dex-no="005"]');await p.locator('#dex-detail[open]').waitFor();
assert.match(await p.textContent('#bond-level'),/Lv\.2 · 18 \/ 45/);assert.match(await p.textContent('#bond-today'),/滿了/);
assert.equal(await p.locator('#bond-unlocks li.is-open').count(),1);
await p.locator('#dex-detail-bond').scrollIntoViewIfNeeded();if(process.env.SHOT2){await p.waitForTimeout(200);await p.screenshot({path:process.env.SHOT2});}
await p.click('#close-dex-detail');
// unit: errand +4, duplicate +10, Lv.5 rewards and shiny
const u=await p.evaluate(async()=>{const m=await import('/js/affection.js');const s={dex:{'001':{at:'x'}},energy:0,fossils:0};m.ensureAffection(s);
const e=m.gain(s,'001','errand','2026-11-17');const d=m.gain(s,'001','duplicate','2026-11-17');const big=m.gain(s,'001','duplicate','2026-11-17',9);
return [e.added,d.added,s.affection['001'].pts,m.bondInfo(s,'001','2026-11-17').max,big.up.map(x=>x.level),s.energy,s.fossils,m.gain(s,'999','tap','x').added];});
assert.deepEqual(u,[6,15,156,true,[3,4,5],30,13,0]);
// 11/20 級距 ×1.5：舊存檔點數換算一次，等級不掉；料理另外算每天 10 點
const mig=await p.evaluate(async()=>{const m=await import('/js/affection.js');const s={dex:{'001':{at:'x'},'002':{at:'x'}},affection:{'001':{pts:30},'002':{pts:100}}};m.ensureAffection(s);const once=[s.affection['001'].pts,s.affection['002'].pts,m.levelOf(s.affection['001'].pts),m.levelOf(s.affection['002'].pts)];m.ensureAffection(s);
const c=[m.gain(s,'001','tap','d',15).added,m.gain(s,'001','cook','d',7).added,m.gain(s,'001','cook','d',7).added,m.gain(s,'001','cook','d',7).added,m.cookLeft(s,'001','d')];return [...once,s.affection['001'].pts,...c];});
assert.deepEqual(mig,[45,150,3,5,70,15,7,3,0,0]);
assert.equal(errs.length,0,errs.join('\n'));console.log('affection: home +2, taps, level-up popup & reward, daily cap, dex section, errand/duplicate, max level PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
