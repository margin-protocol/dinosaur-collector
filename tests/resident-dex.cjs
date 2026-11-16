// 首頁點小湘：打招呼後冒出「看圖鑑」按鈕，點了打開該小湘的圖鑑詳情
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(()=>{const k='siang-collector:v1';const s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'2026-11-10T00:00:00Z'},'005':{at:'2026-11-11T00:00:00Z'}};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['001','005']));});
await p.reload();await p.waitForTimeout(600);
await p.locator('.resident-slot[data-character="005"] .resident-static').click();
const btn=p.locator('.resident-dex[data-character="005"]');await btn.waitFor();await p.waitForTimeout(350);
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
await btn.click();await p.locator('#dex-detail[open]').waitFor();
assert.match(await p.textContent('#dex-detail-no'),/005/);
assert.equal(errs.length,0,errs.join('\n'));console.log('resident tap → 看圖鑑 → dex detail PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
