// 特訓格子長按／點頭像看小湘資訊，不跳出瀏覽器「下載圖片」選單（玩家 11/28 回報）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const width=Number(process.env.W||360);
const c=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';
await p.goto('http://127.0.0.1:8000');if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');await p.waitForTimeout(400);
await p.evaluate(async k=>{const {CHARACTERS}=await import('/js/eggs.js');const s=JSON.parse(localStorage.getItem(k));
s.dex={};s.affection={};Object.keys(CHARACTERS).slice(0,12).forEach(n=>{s.dex[n]={at:'2026-11-10T00:00:00Z',dup:0};s.affection[n]={pts:0};});
s.dex['001']={at:'2026-11-10T00:00:00Z',dup:2};s.tutorial=null;s.battle=s.battle||{};s.battle.badges=30;s.battle.train={'001':3};
localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(600);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.click('#home-errand');await p.click('#tab-battle');await p.click('#open-train');await p.waitForSelector('#train-list .train-tile');
const name=await p.evaluate(async()=>(await import('/js/eggs.js')).CHARACTERS['001'].name);
const tile=p.locator('.train-tile[data-siang="001"]');
// 系統選單被擋：contextmenu 被取消、圖片不能長按
const cm=await p.evaluate(()=>{const img=document.querySelector('.train-tile[data-siang="001"] img');const ev=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});document.querySelector('.train-tile[data-siang="001"]').dispatchEvent(ev);return{prevented:ev.defaultPrevented,callout:getComputedStyle(document.querySelector('.train-tile')).webkitTouchCallout,pe:getComputedStyle(img).pointerEvents};});
assert(cm.prevented);assert.equal(cm.pe,'none');
// 長按顯示完整名稱、稀有度、系列、好感、星、特訓等級，而且不會順便特訓
const badges=await p.textContent('#battle-badges');
await tile.scrollIntoViewIfNeeded();await p.waitForTimeout(200);const box=await tile.locator('.train-tile__btn').boundingBox();
await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.waitForTimeout(600);
const tip=await p.locator('.press-tip').innerText();
assert(tip.includes(name),tip);assert.match(tip,/戰力 [\d.]+ · ♥ Lv\.1 · ★2/);assert.match(tip,/特訓 Lv\.3\/5/);
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT});
await p.mouse.up();await p.waitForTimeout(300);
assert.equal(await p.textContent('#battle-badges'),badges,'long-press must not train');
await p.waitForTimeout(1800);assert.equal(await p.locator('.press-tip').count(),0);
// 輕點頭像也顯示
await tile.locator('img').click({force:true});await p.waitForSelector('.press-tip');assert((await p.locator('.press-tip').innerText()).includes(name));
const r=await p.locator('.press-tip').boundingBox();assert(r.x>=0&&r.x+r.width<=width,'tip in screen');
// 點特訓鈕照樣特訓
await p.waitForTimeout(2500);await tile.locator('.train-tile__btn').click();
await p.waitForFunction(()=>document.querySelectorAll('.train-tile[data-siang="001"] .train-pips i.is-on').length===4);
assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no h-scroll');
assert.equal(errs.length,0,errs.join('\n'));console.log(`train-press ${width}: long-press info, no image menu PASS`);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
