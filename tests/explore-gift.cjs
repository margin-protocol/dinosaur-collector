// 每日探索禮物看得出來（11/23 湘問「隔天為什麼領不到縣市蛋」，11/25 選 C）：
// 開遊戲自動探索拿到的禮物會記在 travel.gift，首頁探索圓鈕旁邊有小標籤，再按探索會寫清楚今天收過什麼
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const W=Number(process.env.W||390);
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',timezoneId:'Asia/Taipei',permissions:['geolocation'],geolocation:{latitude:24.1372,longitude:120.6869}});
await c.addInitScript(()=>{try{localStorage.setItem('siang-collector:explore-intro:v1','1')}catch{}});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/open-meteo\.com/,r=>r.abort());
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();
// checkIn 記下今天的禮物
const unit=await p.evaluate(async()=>{const {checkIn,ensureTravel}=await import('/js/travel.js');const s={wishEgg:{stock:0},weather:{stock:0}};
checkIn(s,'臺中市','2026-11-20',()=>0.9);const first=s.travel.gift;checkIn(s,'臺中市','2026-11-21',()=>0.7);const wish=s.travel.gift;checkIn(s,'臺中市','2026-11-21',()=>0);const same=s.travel.gift;
s.travel.gift={date:'x',kind:'bad'};ensureTravel(s);return {first,wish,same,bad:s.travel.gift};});
assert.equal(unit.first.kind,'county');assert.equal(unit.first.county,'臺中市');assert.equal(unit.wish.kind,'wish');assert.equal(unit.wish.date,'2026-11-21');assert.equal(unit.same.at,unit.wish.at);assert.equal(unit.same.kind,"wish");assert.equal(unit.bad,null);
// 自動探索（定位已允許）拿到願望蛋
await p.evaluate(async k=>{const {COUNTY_CHARACTER}=await import('/js/eggs.js');const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'},[COUNTY_CHARACTER['臺中市']]:{at:'x'}};s.egg={id:'ordinary',warmth:0,since:'2026-11-16'};s.travel={visits:{'臺中市':{first:'2026-11-01',last:'2026-11-01'}},eggs:[],granted:['臺中市'],daily:'2026-11-01'};localStorage.setItem(k,JSON.stringify(s));},key);
await p.addInitScript(()=>{Math.random=()=>0.7;});
await p.reload();await p.locator('#county-call[open]').waitFor({timeout:8000});
assert.match(await p.locator('#county-eyebrow').textContent(),/自動感應/);
assert.match(await p.locator('#county-note').textContent(),/願望蛋/);
const g=(await save()).travel.gift;assert.equal(g.kind,'wish');assert.equal(g.auto,true);
await p.locator('#county-ok').click();
const skip=p.getByText('先自己逛逛');if(await skip.count())await skip.first().click();await p.waitForTimeout(300);
// 首頁：剛收到時圓鈕旁邊的小標籤
assert(await p.locator('#explore').evaluate(e=>e.classList.contains('is-compact')&&e.classList.contains('is-gifted')));
assert(await p.locator('#explore-tag').isVisible());assert.equal(await p.locator('#explore-tag').textContent(),'願望蛋 ✓');
const tag=await p.locator('#explore-tag').boundingBox();assert(tag.x+tag.width<=W,'標籤不超出畫面');
assert.match(await p.locator('#explore').getAttribute('aria-label'),/願望蛋/);
// 標籤亮 8 秒就收起，不擋畫面（湘 11/25 選 B）
await p.waitForTimeout(8500);assert(await p.locator('#explore-tag').isHidden(),'8 秒後標籤收起');
assert(await p.locator('#explore').evaluate(e=>e.classList.contains('is-gifted')&&!e.classList.contains('is-flash')));
// 再按一次：寫清楚今天收過什麼
await p.locator('#explore').click();await p.locator('#county-call[open]').waitFor();
const note=await p.locator('#county-note').textContent();
assert.match(note,/今天的探索禮物已經收過了/);assert.match(note,/自動感應/);assert.match(note,/「願望蛋」/);
assert(await p.locator('#county-note').evaluate(e=>e.classList.contains('is-gift')));
assert.doesNotMatch(await p.locator('#county-text').textContent(),/明天再來/,'不重複講明天再來');
if(process.env.SHOT){await p.waitForTimeout(300);await p.screenshot({path:process.env.SHOT});}
assert.equal((await save()).wishEgg.stock>=1,true);
assert.equal(errs.length,0,errs.join('\n'));console.log('explore gift tag + already-claimed note PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
