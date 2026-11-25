// 頁間居民 2.0（湘 11/25）：改名不動存檔；圖鑑分「創始｜異世」兩層；MO 編號；海棠新娘小湘（存檔 117）顯示 MO-002；聞止水居民檔案與待機台詞
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
for(const width of [360,430]){
const p=await b.newPage({viewport:{width,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
assert.equal(await p.title(),'頁間居民｜Between the Pages');
// 2.0 以前的舊存檔：同一個 key，進度原封不動
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=30;s.dex={'001':{at:'2026-11-01T00:00:00Z',dup:2},'002':{at:'2026-11-02T00:00:00Z'},'117':{at:'2026-11-25T00:00:00Z'},'MO-001':{at:'2026-11-25T01:00:00Z'}};s.affection={'MO-001':{pts:150,day:'',today:0,home:''}};s.tutorial=null;localStorage.setItem(k,JSON.stringify(s));localStorage.removeItem('siang-collector:dex-world:v1');});
await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
const kept=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')).dex);
assert.deepEqual(Object.keys(kept).sort(),['001','002','117','MO-001'],'舊存檔的圖鑑沒被清掉');assert.equal(kept['001'].dup,2);
assert.match(await p.textContent('.topbar__brand'),/頁間居民/);
const m=await p.evaluate(async()=>{const e=await import('/js/eggs.js'),r=await import('/js/resident-lines.js');const keys=Object.keys(e.CHARACTERS);
  return {label117:e.noLabel('117'),label001:e.noLabel('001'),labelMo:e.noLabel('MO-001'),w117:e.worldOf(e.CHARACTERS['117']),wMo:e.worldOf(e.CHARACTERS['MO-001']),w001:e.worldOf(e.CHARACTERS['001']),
  moLast:keys.at(-1)==='MO-001',same:e.sameOrigin('wen-zhishui').map(c=>c.no),pool:Object.values(e.EGGS).some(g=>g.pool?.['MO-001']),
  lineBride:r.residentLine('MO-001',{residents:['117']},()=>0.1),lineLong:r.residentLine('MO-001',{idleMs:r.LONG_IDLE_MS},()=>0.9),lineMax:r.residentLine('MO-001',{level:5},()=>0.999),none:r.residentLine('001')};});
assert.deepEqual([m.label117,m.label001,m.labelMo],['MO-002','No.001','MO-001']);assert.deepEqual([m.w117,m.wMo,m.w001],['mo','mo','origin']);
assert(m.moLast,'異世排在最後');assert.deepEqual(m.same,['MO-001']);assert(!m.pool,'聞止水不在任何蛋池（活動卡池另外做）');
assert.match(m.lineBride,/嫁衣|海棠|夫人/);assert.match(m.lineLong,/睡著|守著/);assert.equal(m.lineMax,'「今日不做護衛。做你的妻子。」');assert.equal(m.none,null);
// 圖鑑：預設創始，只列創始居民
await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());location.hash='dex';});await p.waitForTimeout(300);
assert.equal(await p.locator('.dex-realm').count(),2);assert.equal(await p.locator('.dex-realm[aria-selected="true"]').textContent(),'創始2/115');
assert.equal(await p.locator('#dex-worlds').isVisible(),false);assert.equal(await p.locator('[data-dex-no="117"]').count(),0);assert.match(await p.textContent('#dex-count'),/2 \/ 115/);
// 異世 → 墨痕江湖：MO-001、MO-002 照顯示編號排
await p.locator('.dex-realm').nth(1).click();await p.waitForTimeout(200);
assert.equal(await p.locator('.dex-world[aria-selected="true"]').getAttribute('data-dex-world'),'mo');
assert.deepEqual(await p.locator('.dex__card .dex__no').allTextContents(),['MO-001','MO-002']);
for(const mode of ['series','rarity','power']){await p.click(`[data-dex-mode="${mode}"]`);await p.waitForTimeout(100);assert.equal(await p.locator('.dex__card').count(),2,mode);}
await p.click('[data-dex-mode="all"]');
assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'沒有橫向捲動');
// 記得上次選的世界
await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());location.hash='dex';});await p.waitForTimeout(300);
assert.equal(await p.locator('.dex-realm[aria-selected="true"]').textContent(),'異世2/2');
// 居民檔案
await p.locator('[data-dex-no="MO-001"]').click();await p.locator('#dex-detail[open]').waitFor();
assert.match(await p.textContent('#dex-detail-no'),/MO-001 · SSR · 異世・墨痕江湖/);
assert(await p.locator('#dex-detail-origin').isVisible());assert.equal(await p.textContent('#dex-origin-world'),'棲川市');assert.equal(await p.textContent('#dex-origin-role'),'紀實攝影師');assert.equal(await p.textContent('#dex-origin-now'),'墨衣護衛');
assert.match(await p.textContent('#dex-detail-intro'),/私事/);
await p.keyboard.press('Escape');await p.locator('[data-dex-no="117"]').click();await p.locator('#dex-detail[open]').waitFor();
assert.match(await p.textContent('#dex-detail-no'),/MO-002 · SSR · 異世・墨痕江湖/);assert(!(await p.locator('#dex-detail-origin').isVisible()),'沒有原典資料就不顯示檔案卡');
assert.deepEqual(errs,[]);await p.close();}
await b.close();console.log('between-pages 2.0: rename keeps save, 創始｜異世 dex, MO-002 label, resident file, idle lines PASS');})().catch(e=>{console.error(e);process.exit(1);});
