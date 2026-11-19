// 好感 Lv5 閃光：圖鑑卡片金光掃過、詳細頁星星、首頁腳邊小閃光；沒滿的不會有
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=2;s.dex={'001':{at:'x'},'005':{at:'x'}};s.affection={'005':{pts:120,day:'',today:0,home:''},'001':{pts:20,day:'',today:0,home:''}};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['001','005']));});
await p.reload();await p.waitForTimeout(600);
assert.equal(await p.locator('.resident-slot[data-character="005"].is-maxbond .maxbond-sparks i').count(),5,'Lv5 首頁閃光');
assert.equal(await p.locator('.resident-slot[data-character="001"] .maxbond-sparks').count(),0);
if(process.env.SHOT)await p.locator('.resident-lanes').screenshot({path:process.env.SHOT.replace('.png','-home.png')});
await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(400);
const card=p.locator('[data-dex-no="005"]');assert(await card.evaluate(e=>e.classList.contains('is-shiny')&&getComputedStyle(e,'::before').animationName==='shiny-sweep'),'卡片金光');
assert(!(await p.locator('[data-dex-no="001"]').evaluate(e=>e.classList.contains('is-shiny'))));
await card.click();await p.locator('#dex-detail[open]').waitFor();await p.waitForTimeout(900);
assert(await p.locator('#dex-detail .shiny-stars').isVisible(),'詳細頁星星');
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT});
await p.keyboard.press('Escape');await p.locator('[data-dex-no="001"]').click();await p.locator('#dex-detail[open]').waitFor();
assert(!(await p.locator('#dex-detail .shiny-stars').isVisible()));
assert.equal(errs.length,0,errs.join('\n'));console.log('bond Lv5 shiny: card sweep, detail stars, home sparks; not for lower levels PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
