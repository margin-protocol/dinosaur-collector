// 成長願望：沒做完的舊章節在歷程選單標「未完成／可領」，目前這章上方提示還有幾章、點了跳過去（湘 11/28）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(300);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.player.xp=1200;const ids=[];for(let l=1;l<=11;l++)for(let i=1;i<=3;i++)ids.push(`growth:${l}:${i}`);s.player.claimed=ids;s.player.energyClaimed=[...ids];s.player.chapters=Array.from({length:11},(_,i)=>String(i+1));s.player.stats.days=Array.from({length:20},(_,i)=>`2026-10-${String(i+1).padStart(2,'0')}`);localStorage.setItem(k,JSON.stringify(s));},key);
await p.goto('http://127.0.0.1:8000/#wish');await p.reload();await p.waitForTimeout(400);
if(await p.isVisible('#intro-ok'))await p.click('#intro-ok');
await p.click('#tab-growth');await p.waitForTimeout(300);
assert.match(await p.textContent('#chapter-title'),/遠方的來信/);
const opts=await p.$$eval('#chapter-select option',o=>o.map(x=>x.textContent));
assert.equal(opts.length,13);assert.equal(opts[0],'Lv.1');assert.equal(opts[11],'Lv.12 · 可領');assert.equal(opts[12],'Lv.13');
assert.ok(await p.isVisible('#chapter-behind'));
assert.match(await p.textContent('#chapter-behind'),/前面還有 1 章沒完成（1 章可領）・去 Lv\.12 ⟶/);
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT});
await p.click('#chapter-behind');await p.waitForTimeout(300);
assert.match(await p.textContent('#chapter-title'),/星願研究者/);
assert.equal(await p.isVisible('#chapter-behind'),false,'hint only on the current chapter');
// 領掉「二十天」後選單改成未完成
await p.click('[data-goal="growth:12:1"]');await p.waitForTimeout(400);
assert.equal(await p.$eval('#chapter-select option:nth-child(12)',o=>o.textContent),'Lv.12 · 未完成');
assert.deepEqual(errs,[]);console.log('growth-behind ok');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
