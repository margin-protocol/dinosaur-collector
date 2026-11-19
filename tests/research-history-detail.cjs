// 研究紀錄可以點開：關鍵線索會再顯示配方筆記（標題、短詩、找到的句子）和目前同住進度；沒線索的也能看
const { chromium } = require('playwright'), assert = require('node:assert/strict');
(async()=>{
const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.tutorial=null;
 s.dex=Object.fromEntries(['001','002','005','003','006'].map(id=>[id,{at:'2026-11-01'}]));s.hatched=5;
 s.research={trials:[{key:'002:005',members:['002','005'],recipe:'strawberry-cake',kind:'recipe',at:'2026-11-18T10:00:00Z'},{key:'001:003',members:['001','003'],kind:'none',at:'2026-11-19T10:00:00Z'}]};
 s.recipes={'strawberry-cake':{days:['2026-11-18'],done:false}};localStorage.setItem(k,JSON.stringify(s));});
await p.goto('http://127.0.0.1:8000/#research');await p.reload();await p.locator('#research-root').waitFor();
const items=p.locator('.research-history-open');assert.equal(await items.count(),2);
await p.locator('.research-history-open',{hasText:'草莓小湘 × 甜點小湘'}).click();await p.locator('.research-result[open]').waitFor();
assert.equal(await p.textContent('#research-result-title'),'關鍵線索');
const copy=await p.textContent('.research-result-copy');assert.match(copy,/《甜甜的相遇》/);assert.match(copy,/目前進度：1 \/ 3/);
assert.match(await p.textContent('.research-result-eyebrow'),/草莓小湘 × 甜點小湘/);
await p.locator('[data-close-result]').click();await p.waitForFunction(()=>!document.querySelector('.research-result').open);
await p.locator('.research-history-open',{hasText:'原味小湘'}).click();await p.locator('.research-result[open]').waitFor();
assert.equal(await p.textContent('#research-result-title'),'研究紀錄');
assert.deepEqual(errs,[]);console.log('research history entries open their notes and progress PASS');await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
