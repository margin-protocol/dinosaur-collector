// 更新通知：檔案版本標記改變 → 跳「更新了」；點了重新整理 → 顯示沒看過的更新內容；新玩家與沒更新時不顯示
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
let bump=false;await c.addInitScript(()=>{window.__testWhatsNew=true;});
await p.route('**/changelog.json*',async route=>{if(route.request().method()!=='HEAD'||!bump) return route.continue();await route.fulfill({status:200,headers:{'last-modified':'Tue, 17 Nov 2026 00:00:00 GMT'},body:''});});
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(2500);
assert(!(await p.locator('#whats-new').evaluate(d=>d.open)),'new player: no changelog');
const seen=await p.evaluate(()=>localStorage.getItem('siang-collector:seen-version'));assert.equal(seen,'2026.11.16');
await p.evaluate(()=>window.__checkUpdates());await p.waitForTimeout(300);assert(await p.locator('#update-pill').isHidden(),'no update, no pill');
bump=true;await p.evaluate(()=>window.__checkUpdates());await p.locator('#update-pill:not([hidden])').waitFor();
await p.waitForTimeout(700);if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
await p.evaluate(()=>localStorage.setItem('siang-collector:seen-version','2026.11.01'));
await Promise.all([p.waitForNavigation(),p.click('#update-pill')]);
await p.locator('#whats-new[open]').waitFor({timeout:8000});assert.match(await p.textContent('#whats-new-list'),/派小湘出門/);
await p.waitForTimeout(700);if(process.env.SHOT2) await p.screenshot({path:process.env.SHOT2});
await p.click('#whats-new-ok');assert.equal(await p.evaluate(()=>localStorage.getItem('siang-collector:seen-version')),'2026.11.16');
await p.reload();await p.waitForTimeout(2500);assert(!(await p.locator('#whats-new').evaluate(d=>d.open)),'seen: not shown again');
// returning player with no record sees the latest entry once
await p.evaluate(()=>{localStorage.removeItem('siang-collector:seen-version');const k='siang-collector:v1';const s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'x'}};s.hatched=1;localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.locator('#whats-new[open]').waitFor({timeout:8000});await p.click('#whats-new-ok');
assert.equal(errs.length,0,errs.join('\n'));console.log('updates: silent when unchanged, pill on change, reload → whats-new once PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
