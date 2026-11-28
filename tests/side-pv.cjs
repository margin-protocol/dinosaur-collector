// 島嶼不歸檔 12/5 中午自動開放＋首頁預告片卡（湘 11/28）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:Number(process.env.W||390),height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT?2:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(async()=>{const {CHARACTERS}=await import('/js/eggs.js');const ids=Object.keys(CHARACTERS);const k='siang-collector:v1';const s=JSON.parse(localStorage.getItem(k));const at=new Date().toISOString();s.dex=Object.fromEntries(ids.slice(0,30).map(no=>[no,{at}]));localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.waitForTimeout(500);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
const r=await p.evaluate(async()=>{const side=await import('/js/side.js');const {CHARACTERS}=await import('/js/eggs.js');const before=side.sideOn(),weekly=side.weeklyOn();const real=side.sideNowMs();
side.setSideClock(()=>side.SIDE_OPEN_MS-1);const edge=side.sideOn();side.setSideClock(()=>side.SIDE_OPEN_MS);const at=side.sideOn();side.setSideClock(()=>real);
return {before,weekly,edge,at,has118:'118' in CHARACTERS,has119:'119' in CHARACTERS};});
assert.deepEqual(r,{before:true&&Date.now()>=Date.parse('2026-12-05T04:00:00Z'),weekly:Date.now()>=Date.parse('2026-12-13T16:00:00Z'),edge:false,at:true,has118:Date.now()>=Date.parse('2026-12-05T04:00:00Z'),has119:false});
const card=p.locator('.home-event--pv');await card.waitFor();await p.waitForTimeout(1200);await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close())); // 公告彈窗（#bc-pop）先關掉
assert.match(await card.textContent(),/島嶼不歸檔/);assert.match(await card.textContent(),/12\/5 中午 12:00 開放/);
const over=await card.evaluate(el=>el.scrollWidth>el.clientWidth+1||el.getBoundingClientRect().right>innerWidth);assert.equal(over,false);
if(process.env.SHOT){await card.scrollIntoViewIfNeeded();await card.screenshot({path:process.env.SHOT+'-card.png'});}
await card.click();await p.locator('#side-pv[open]').waitFor();assert.match(await p.getAttribute('#side-pv video','src'),/island-pv\.mp4$/);
await p.waitForTimeout(800);if(process.env.SHOT) await p.screenshot({path:process.env.SHOT+'-video.png'});
await p.click('#side-pv .close-button');await p.waitForTimeout(150);assert.equal(await p.locator('#side-pv[open]').count(),0);
assert.equal(await p.evaluate(()=>document.querySelector('#side-pv video').paused),true);
assert.deepEqual(errs,[]);await b.close();console.log('side-pv ok');})().catch(e=>{console.error(e);process.exit(1);});
