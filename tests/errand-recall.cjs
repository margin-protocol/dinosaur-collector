// 叫回出門中的小湘：按「叫回來」要二次確認，確認後這趟取消、沒有獎勵，小湘馬上可再出門／討伐（出勤狀態同步）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const W=Number(process.env.W||390);
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT?2:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(([k,theme])=>{const s=JSON.parse(localStorage.getItem(k));const at='2026-11-10T00:00:00Z';s.dex={'001':{at},'005':{at},'043':{at}};s.energy=0;s.fossils=0;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['001','005']));localStorage.setItem('siang-collector:battle-roster:v1','open');if(theme)localStorage.setItem('siang-collector:theme:v1',theme);},[key,process.env.THEME||'']);
await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.click('#home-errand');await p.locator('#errand-dialog[open]').waitFor();
await p.click('.errand-place:has-text("公園")');
await p.click('.errand-siang:has(img[alt="甜點小湘"])');await p.click('.errand-siang:has(img[alt="原味小湘"])');
await p.click('#errand-go');await p.waitForTimeout(300);
await p.click('.errand-place:has-text("寫紙條")');await p.click('.errand-siang:not([disabled]) >> nth=0');await p.click('#errand-go');await p.waitForTimeout(300);
let s=await save();assert.equal(s.errands.active.length,2);const energy=s.energy,fossils=s.fossils;
const trip=p.locator('.errand-trip').first();
assert.equal(await trip.locator('.errand-trip__recall').textContent(),'叫回來');
assert.equal(await p.locator('.errand-trip').nth(1).locator('.errand-trip__recall').textContent(),'先不做了');
if(process.env.SHOT) await p.locator('#errand-active').screenshot({path:process.env.SHOT+'-list.png'});
// 第一次按只會問，不會取消
await trip.locator('.errand-trip__recall').click();
assert.equal((await save()).errands.active.length,2,'first tap only asks');
assert.match(await p.textContent('.errand-recall p'),/叫甜點小湘和原味小湘回來嗎/);
if(process.env.SHOT) await p.locator('#errand-active').screenshot({path:process.env.SHOT+'-ask.png'});
// 再等等 → 取消詢問
await p.click('.errand-recall__no');assert.equal(await p.locator('.errand-recall').count(),0);
assert.equal((await save()).errands.active.length,2);
// 確認叫回
await trip.locator('.errand-trip__recall').click();await p.click('.errand-recall__yes');await p.waitForTimeout(300);
s=await save();assert.equal(s.errands.active.length,1,'trip removed');assert.equal(s.errands.album.length,0,'no album entry');
assert.equal(s.energy,energy);assert.equal(s.fossils,fossils);assert(!s.errands.stories.origin,'no story');
assert.match(await p.textContent('#errand-status'),/從半路回來了/);
if(process.env.SHOT) await p.locator('#errand-pane').screenshot({path:process.env.SHOT+'-done.png'});
// 回到首頁、可以再出門
assert.equal(await p.locator('.errand-place').first().isDisabled(),false);
await p.click('.errand-place:has-text("公園")');
assert.equal(await p.locator('.errand-siang:has(img[alt="甜點小湘"])').isDisabled(),false,'can depart again');
// 討伐頁的出勤狀態同步
await p.click('#tab-battle');await p.locator('#siang-roster').waitFor();
const roster=await p.textContent('#siang-roster');assert.match(roster,/可出戰 2/,roster);
// 已回來的不能叫回（直接用函式檢查）
const r=await p.evaluate(async()=>{const {recall}=await import('/js/errands.js');const s={dex:{'001':{}},errands:{active:[{id:'x',place:'park',nos:['001'],start:'2026-01-01T00:00:00Z',until:'2026-01-01T01:00:00Z',loot:{}}]}};return [recall(s,'x'),s.errands.active.length,recall(s,'nope')];});
assert.deepEqual(r,[null,1,null]);
await p.click('#close-errands');assert.equal(await p.locator('.resident-slot').count(),2,'back home');
assert.equal(errs.length,0,errs.join('\n'));
console.log('errand-recall: ask twice, cancel, recall, no rewards, free again, roster synced PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
