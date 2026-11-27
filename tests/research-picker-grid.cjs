// 研究室「邀請搭檔」：搜尋＋依系列分組的四欄格子、系列可收合並記住、標出跟另一側研究過的（11/28 湘選 C）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
for(const width of [360,430]){
const c=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const open=async()=>{await p.goto('http://127.0.0.1:8000/#research');await p.reload();await p.locator('#research-root').waitFor();await p.waitForTimeout(500);await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));};
await p.goto('http://127.0.0.1:8000');if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
const nos=await p.evaluate(async()=>{const {CHARACTERS}=await import('/js/eggs.js');const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));
  const nos=Object.keys(CHARACTERS).filter(n=>n!=='100');s.dex={};nos.forEach(n=>s.dex[n]={at:'2026-11-01'});s.hatched=nos.length;s.tutorial=null;
  s.research={trials:[{members:['001','003'],at:'2026-11-20'}]};localStorage.setItem(k,JSON.stringify(s));localStorage.removeItem('siang-collector:research-fold:v1');return nos;});
await open();
await p.locator('[data-slot="0"]').click();
assert.equal(await p.locator('.research-search').isVisible(),true,'search shown');
// 每位擁有的小湘剛好出現一次，都在自己的系列底下，系列照 SERIES 順序
const info=await p.evaluate(async()=>{const {CHARACTERS,SERIES}=await import('/js/eggs.js');const out=[];let cur;
  for(const n of document.querySelector('.research-partner-list').children){if(n.matches('.research-series'))out.push(cur={id:n.dataset.foldSeries,nos:[]});else for(const t of n.querySelectorAll('[data-partner]'))cur.nos.push(t.dataset.partner);}
  const order=Object.keys(SERIES);return {groups:out,bad:out.flatMap(g=>g.nos.filter(no=>CHARACTERS[no].series!==g.id)),idx:out.map(g=>order.indexOf(g.id))};});
assert(info.groups.length>=5,'several series');assert.deepEqual(info.bad,[]);assert.deepEqual(info.idx,[...info.idx].sort((a,b)=>a-b));
assert.deepEqual(info.groups.flatMap(g=>g.nos).sort(),[...nos].sort(),'every owned once');
// 四欄格子、名字不超出格子、沒有左右捲動
const cols=await p.$eval('.research-partner-grid',g=>getComputedStyle(g).gridTemplateColumns.split(' ').length);assert.equal(cols,4);
assert.ok(await p.$$eval('.research-partner',ts=>ts.every(t=>{const n=t.querySelector('.research-partner__name').getBoundingClientRect(),r=t.getBoundingClientRect();return n.left>=r.left-0.5&&n.right<=r.right+0.5;})),'names fit');
assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no horizontal scroll');
// 選 001 → 第二格：001 標另一側、003 標試過
await p.locator('[data-partner="001"]').click();await p.locator('[data-slot="1"]').click();
assert.equal(await p.locator('[data-partner="001"]').isDisabled(),true);
assert.match(await p.locator('[data-partner="001"] .research-partner__note').textContent(),/另一側/);
assert.match(await p.locator('[data-partner="003"] .research-partner__note').textContent(),/試過/);
assert.equal(await p.locator('[data-partner="002"] .research-partner__note').count(),0);
// 搜尋：名字、編號、稀有度；找不到有提示
await p.fill('.research-search','雨傘');assert.deepEqual(await p.$$eval('.research-partner-list [data-partner]',ts=>ts.map(t=>t.dataset.partner)),['003']);
await p.fill('.research-search','no.002');assert.deepEqual(await p.$$eval('.research-partner-list [data-partner]',ts=>ts.map(t=>t.dataset.partner)),['002']);
await p.fill('.research-search','ur');assert(await p.$$eval('.research-partner-list [data-partner]',ts=>ts.length>0&&ts.every(t=>t.querySelector('.research-partner__rarity').textContent==='UR')));
await p.fill('.research-search','完全沒有這個人');assert.match(await p.locator('.research-partner-list').textContent(),/找不到/);
await p.fill('.research-search','雨傘');await p.locator('[data-partner="003"]').click();
assert.match(await p.locator('[data-slot="1"] .research-slot-name').textContent(),/雨傘/);
// 收起第二個系列，重新整理後還記得；重開搜尋框是空的
await p.locator('[data-slot="1"]').click();assert.equal(await p.locator('.research-search').inputValue(),'');
const hid=info.groups[1];await p.locator(`[data-fold-series="${hid.id}"]`).click();
assert.equal(await p.locator(`[data-partner="${hid.nos[0]}"]`).count(),0,'folded');
await open();await p.locator('[data-slot="0"]').click();
assert.equal(await p.locator(`[data-partner="${hid.nos[0]}"]`).count(),0,'fold remembered');
assert.equal(await p.locator(`[data-fold-series="${hid.id}"]`).getAttribute('aria-expanded'),'false');
await p.locator(`[data-fold-series="${hid.id}"]`).click();assert.equal(await p.locator(`[data-partner="${hid.nos[0]}"]`).count(),1,'unfold');
assert.equal(errs.length,0,errs.join('\n'));await c.close();}
console.log('research-picker-grid: series grid, search, tried mark, fold remembered PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
