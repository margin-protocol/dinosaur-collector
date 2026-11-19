// 星級：重複孵到的小湘在圖鑑卡片、詳細頁、再次相遇畫面都看得到
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=9;s.dex={'001':{at:'x',dup:2},'002':{at:'x'},'003':{at:'x',dup:5}};localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(400);
assert.equal(await p.locator('[data-dex-no="001"] .dex__stars').textContent(),'★2');
assert.equal(await p.locator('[data-dex-no="002"] .dex__stars').count(),0,'沒重複就不顯示');
assert(await p.locator('[data-dex-no="003"] .dex__stars.is-full').count());
if(process.env.SHOT)await p.locator('.dex').first().screenshot({path:process.env.SHOT.replace('.png','-grid.png')}).catch(()=>{});
await p.locator('[data-dex-no="001"]').click();await p.locator('#dex-detail[open]').waitFor();
assert.match(await p.locator('#dex-detail-stars').textContent(),/★★☆☆☆.*星級 2 \/ 5.*\+20%/);
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT});
await p.keyboard.press('Escape');await p.locator('[data-dex-no="002"]').click();assert.match(await p.locator('#dex-detail-stars').textContent(),/☆☆☆☆☆.*每星討伐戰力 \+10%/);
assert.equal(errs.length,0,errs.join('\n'));console.log('duplicate stars: dex card badge, full-star style, detail stars and hint PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
