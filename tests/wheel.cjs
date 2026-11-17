// 小恐龍轉盤：每天 3 次、押能量、結果先存檔、轉到正確的格子、能量不夠或次數用完不能轉
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(300);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.energy=100;s.fossils=0;localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.waitForTimeout(300);
await p.evaluate(()=>document.querySelector('#function-center').showModal());await p.click('#open-wheel');await p.locator('#wheel-dialog[open]').waitFor();
assert.equal(await p.locator('#wheel path').count(),8);assert.match(await p.textContent('#wheel-left'),/還可以轉 3 次/);
// jackpot with stake 20
await p.click('.wheel-stake:has-text("20")');await p.evaluate(()=>{Math.random=()=>0.999;});
await p.click('#wheel-spin');await p.waitForTimeout(300);
let s=await save();assert.equal(s.energy,180);assert.equal(s.wheel.used,1);assert.equal(s.wheel.last.index,7);
assert.match(await p.textContent('#wheel-result'),/大獎/);
// pointer lands on the jackpot wedge
const angle=await p.evaluate(()=>{const m=document.querySelector('#wheel').style.transform.match(/rotate\(([-\d.]+)deg\)/);return Number(m[1]);});
const atTop=((360-(angle%360))%360+360)%360;assert(Math.floor(atTop/45)===7,'top angle '+atTop);
if(process.env.SHOT){await p.waitForTimeout(200);await p.screenshot({path:process.env.SHOT});}
// zero with stake 50
await p.click('.wheel-stake:has-text("50")');await p.evaluate(()=>{Math.random=()=>0;});await p.click('#wheel-spin');await p.waitForTimeout(300);
s=await save();assert.equal(s.energy,130);assert.match(await p.textContent('#wheel-result'),/槓龜/);
// fossil wedge
await p.click('.wheel-stake:has-text("10")');await p.evaluate(()=>{Math.random=()=>0.53;});await p.click('#wheel-spin');await p.waitForTimeout(300);
s=await save();assert.equal(s.fossils,2);assert.equal(s.energy,130);
// out of spins
assert(await p.locator('#wheel-spin').isDisabled());assert.match(await p.textContent('#wheel-left'),/明天再來/);
const again=await p.evaluate(async k=>{const {spin}=await import('/js/wheel.js');const s=JSON.parse(localStorage.getItem(k));return spin(s,10);},key);assert.match(again,/明天/);
// reload keeps the count; a new day resets it
await p.reload();await p.waitForTimeout(300);s=await save();assert.equal(s.wheel.used,3);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.wheel.date='2000-01-01';localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.waitForTimeout(300);
s=await save();assert.equal(s.wheel.used,0);assert.equal(s.wheel.total.spins,3);
// not enough energy
const poor=await p.evaluate(async k=>{const {spin}=await import('/js/wheel.js');const s=JSON.parse(localStorage.getItem(k));s.energy=5;return spin(s,10);},key);assert.match(poor,/能量不夠/);
assert.equal(errs.length,0,errs.join('\n'));console.log('wheel: 3 spins/day, stake & payout, lands on result, fossils, limits, daily reset PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
