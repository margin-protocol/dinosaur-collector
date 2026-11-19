// 研究者手記「更新紀錄」：隨時看全部更新、新的標 NEW、看過後 NEW 消失
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const total=(await (await p.request.get('http://127.0.0.1:8000/changelog.json')).json()).length;
await p.evaluate(()=>{const k='siang-collector:v1';const s=JSON.parse(localStorage.getItem(k));s.hatched=3;s.dex={'001':{at:'x'},'002':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:seen-version','2026.11.19');});
await p.reload();await p.waitForTimeout(400);
await p.locator('#open-center').click();await p.locator('#open-updates').click();await p.locator('#whats-new[open]').waitFor();
assert.equal(await p.locator('#whats-new-title').textContent(),'更新紀錄');
assert.equal(await p.locator('.whats-new__entry').count(),total,'全部更新都列出來');
assert(await p.locator('.whats-new__entry.is-new').count()>=1,'比上次看過還新的標 NEW');
assert.equal(await p.locator('.whats-new__entry').nth(total-1).locator('.is-new').count(),0);
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT});
for(const width of [360,390,430]){await p.setViewportSize({width,height:844});await p.locator('#whats-new').evaluate(e=>e.scrollTop=e.scrollHeight);assert(await p.locator('#close-whats-new').evaluate(e=>{const r=e.getBoundingClientRect(),d=e.closest('dialog').getBoundingClientRect();return r.top>=d.top&&r.bottom<=d.bottom;}),'top close stays visible while scrolling');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
await p.locator('#close-whats-new').click();assert(await p.locator('#whats-new').isHidden());
const seen=await p.evaluate(()=>localStorage.getItem('siang-collector:seen-version'));
const latest=(await (await p.request.get('http://127.0.0.1:8000/changelog.json')).json())[0].version;assert.equal(seen,latest);
await p.locator('#open-center').click();await p.locator('#open-updates').click();await p.locator('#whats-new[open]').waitFor();
assert.equal(await p.locator('.whats-new__entry.is-new').count(),0,'看過就不再標 NEW');
assert.equal(errs.length,0,errs.join('\n'));console.log('update log: full history from menu, NEW marks, marks seen PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
