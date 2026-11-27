// 測試服（?test，湘 11/25）：存檔跟正式服分開、全滿存檔、活動上下卷不看日期、討伐 15 秒、不連後台、重新開始
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const worker=[];p.on('request',r=>{if(/workers\.dev|api\.github\.com/.test(r.url()))worker.push(r.url());});
await p.goto('http://127.0.0.1:8000');
const real=JSON.stringify({seenIntro:true,energy:7,dex:{'001':{at:'2026-11-01T00:00:00.000Z'}}});
await p.evaluate(r=>{localStorage.clear();localStorage.setItem('siang-collector:v1',r);localStorage.setItem('siang-collector:theme:v1','mint');},real);
await p.goto('http://127.0.0.1:8000/?test');worker.length=0;await p.waitForTimeout(800);
assert.equal(await p.locator('#test-server-tag .tst-pill').textContent(),'測試服');
assert.equal(await p.textContent('#energy-value'),'9999');
const s=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));
const raw=await p.evaluate(()=>Object.keys(localStorage));assert.ok(raw.includes('siang-test:siang-collector:v1'),'存在 siang-test: 底下');
for(const no of ['001','117','MO-001','MO-003','MO-008'])assert.ok(s.dex[no]?.dup===5,`圖鑑有 ${no}`);
assert.equal(s.affection['MO-001'].pts,150);assert.equal(s.battle.train['MO-001'],5);
assert.notEqual(await p.evaluate(()=>document.documentElement.dataset.theme),'mint','主題設定也分開');
// 後台擋掉
assert.match(await p.evaluate(()=>fetch('https://siang-collector-api.a2007014.workers.dev/admin/status').then(()=>'ok',e=>e.message)),/測試服不連後台/);
// 活動：上卷第一關可打、下卷要先打完上卷（不是日期）
await p.evaluate(()=>document.getElementById('open-battle').click());await p.waitForTimeout(500);
assert.equal(await p.locator('.event-hub [data-event-stage="mo-01"]').isDisabled(),false);
assert.doesNotMatch(await p.locator('.event-hub').textContent(),/後開放/,'下卷不看日期');
await p.evaluate(()=>document.querySelector('.event-hub [data-event-stage="mo-01"]').click());await p.waitForTimeout(300);
await p.evaluate(()=>[...document.querySelectorAll('#battle-siangs [data-siang]:not([disabled])')].slice(0,3).forEach(x=>x.click()));
assert.match(await p.textContent('#battle-go'),/測試服 15 秒/);
await p.evaluate(()=>document.getElementById('battle-go').click());await p.waitForTimeout(300);
const a=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')).battle.active[0]);
const ms=Date.parse(a.until)-Date.parse(a.start);assert.ok(ms===15000,`討伐 ${ms}ms`);
// 重新開始：清掉測試進度，拿回全滿存檔
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.click('.tst-pill');await p.click('.tst-reset');assert.match(await p.textContent('.tst-reset'),/確定/);await p.click('.tst-reset');await p.waitForTimeout(1000);
const s2=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));assert.equal(s2.battle.active.length,0);assert.equal(s2.energy,9999);
// 正式存檔一個字都沒變（用屬性讀，繞過測試服的 key 前綴）
assert.equal(await p.evaluate(()=>localStorage['siang-collector:v1']),real,'正式存檔沒變');
assert.equal(await p.evaluate(()=>localStorage['siang-collector:theme:v1']),'mint');
assert.deepEqual(worker,[],'測試服不連後台');
await p.goto('http://127.0.0.1:8000/');await p.waitForTimeout(300);
assert.equal(JSON.parse(await p.evaluate(()=>localStorage.getItem('siang-collector:v1'))).energy,7);
assert.equal(await p.evaluate(()=>globalThis.__SIANG_TEST__),undefined);
assert.deepEqual(worker.filter(u=>!/\/broadcast$/.test(u)),[],'正式服只會問全服信箱');
const over=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(over<=0);
assert.equal(errs.length,0,errs.join('\n'));console.log('test server: isolated save, full seed, event open, 15s battle, backend blocked, reset PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
