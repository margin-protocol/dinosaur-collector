// node tests/gugu-shelf-ui.cjs — 書靈咕咕（測試服）：關卡卡片寫層數、關卡頁寫里程碑和禁書、打贏爬一層、檔案館顯示《咕咕禁書》（SHOT=資料夾 截圖）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const K='siang-test:siang-collector:v1';
for(const w of (process.env.SHOT?[360,430]:[360])){
const c=await b.newContext({viewport:{width:w,height:820},deviceScaleFactor:process.env.SHOT?2:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000/?test');await p.waitForTimeout(800);
await p.evaluate(K=>{const s=JSON.parse(localStorage.getItem(K));s.battle.gugu={floor:4,dry:0};s.battle.pages=['b1-01','b1-02','b1-08'];localStorage.setItem(K,JSON.stringify(s));localStorage.setItem('siang-test:siang-collector:theme:v1','sakura');},K);
await p.reload();await p.waitForTimeout(800);
await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());document.getElementById('open-battle')?.click();});await p.waitForSelector('.battle-stage-card.is-extra');
const card=p.locator('.battle-stage-card.is-extra');
assert.match(await card.textContent(),/書架第 5 層/);assert.match(await card.textContent(),/禁書 3 \/ 8/);
// 特殊關卡可能收合著
await p.evaluate(()=>{const sec=document.querySelector('.battle-extra');const h=sec.querySelector('h3');if(sec.querySelector('.battle-stages')?.hidden)h.click();});
if(process.env.SHOT){await card.scrollIntoViewIfNeeded();await p.waitForTimeout(200);await p.screenshot({path:`${process.env.SHOT}/card-${w}.png`});}
await card.click();await p.waitForTimeout(300);
assert.match(await p.textContent('#battle-enemy-stage'),/書架第 5 層/);assert.match(await p.textContent('#battle-gift-hint'),/里程碑/);assert.match(await p.textContent('#battle-enemy-meta'),/戰力 96/);
if(process.env.SHOT){await p.evaluate(()=>document.getElementById('battle-gift-hint').scrollIntoView({block:'center'}));await p.waitForTimeout(200);await p.screenshot({path:`${process.env.SHOT}/stage-${w}.png`});}
assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
const picks=await p.$$eval('#battle-siangs [data-siang]:not([disabled])',xs=>xs.slice(0,3).map(x=>x.dataset.siang));for(const no of picks)await p.click(`#battle-siangs [data-siang="${no}"]`);
await p.click('#battle-go');await p.waitForTimeout(16500);
await p.reload();await p.waitForTimeout(1000);await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());document.getElementById('open-battle')?.click();});await p.waitForSelector('.errand-trip.is-back .btn');await p.click('.errand-trip.is-back .btn');await p.waitForTimeout(800);
assert.ok(await p.locator('#battle-result[open]').count(),'戰報打開');
const gains=await p.textContent('#battle-result-gains');assert.match(gains,/第 5 層/);assert.match(gains,/里程碑/);
if(process.env.SHOT){await p.evaluate(()=>document.getElementById('battle-result-gains').scrollIntoView({block:'center'}));await p.waitForTimeout(200);await p.screenshot({path:`${process.env.SHOT}/result-${w}.png`});}
await p.evaluate(()=>document.getElementById('battle-result-ok').click());await p.waitForTimeout(300);
const s=await p.evaluate(K=>JSON.parse(localStorage.getItem(K)).battle,K);assert.equal(s.gugu.floor,5);
await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());document.getElementById('open-archive-battle')?.click()||document.getElementById('open-archive')?.click();});await p.waitForTimeout(500);
await p.evaluate(()=>{const a=document.getElementById('archive');if(!a.open)a.showModal?.();});
const arch=await p.textContent('#archive');assert.match(arch,/咕咕禁書/);assert.match(arch,/護衛的額外勤務/);
if(process.env.SHOT){await p.evaluate(()=>[...document.querySelectorAll('#archive .archive-section__title')].find(h=>/咕咕禁書/.test(h.textContent)).scrollIntoView({block:'start'}));await p.waitForTimeout(200);await p.screenshot({path:`${process.env.SHOT}/archive-${w}.png`});}
assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
assert.deepEqual(errs,[]);await c.close();}
console.log('gugu shelf ui: floor card, milestone hint, climb, archive book PASS');await b.close();})();
