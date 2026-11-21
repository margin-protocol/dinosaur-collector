// 許願「今天想和誰一起」：目前陪伴卡、頭像格子、搜尋、系列篩選、最近陪伴；換人不改存檔
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
for(const W of (process.env.W?[Number(process.env.W)]:[360,390,430])){
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT?2:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const owned=await p.evaluate(async([k,theme])=>{const {CHARACTERS}=await import('/js/eggs.js');const s=JSON.parse(localStorage.getItem(k));const at='2026-11-10T00:00:00Z';s.dex={};for(const no of Object.keys(CHARACTERS))if(no!=='100')s.dex[no]={at};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:wish-character:v1','002');localStorage.removeItem('siang-collector:wish-character-recent:v1');if(theme)localStorage.setItem('siang-collector:theme:v1',theme);return Object.keys(s.dex).length;},[key,process.env.THEME||'']);
await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.click('#home-wishes');await p.locator('#wish-portrait[data-presenter]').waitFor({state:'attached'});
const before=await save();
const shot=async n=>{if(!process.env.SHOT)return;await p.evaluate(()=>document.activeElement?.blur());await p.waitForTimeout(250);await p.screenshot({path:`${process.env.SHOT}-${W}-${n}.png`});};
await p.click('#open-presenter');await p.locator('#presenter[open]').waitFor();
assert.match(await p.textContent('#presenter-now'),/草莓小湘/);
assert.equal(await p.locator('.presenter-choice').count(),owned,'each owned siang once');
assert.equal(await p.locator('.presenter-choice[aria-pressed="true"]').count(),1);
assert.equal(await p.locator('.presenter-filter[data-filter="recent"]').count(),0,'no recent chip yet');
// 框不超出螢幕、沒有左右捲動
const box=await p.locator('#presenter').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=W&&box.y>=0&&box.y+box.height<=844,'dialog fits');
assert.ok(await p.evaluate(()=>{const g=document.querySelector('#presenter-list');return g.scrollWidth<=g.clientWidth+1&&g.scrollHeight>g.clientHeight;}),'list scrolls vertically only');
assert.ok(await p.locator('#presenter-search').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=16),'no iOS zoom');
await shot('open');
// 搜尋
await p.fill('#presenter-search','雨傘');assert.equal(await p.locator('.presenter-choice').count(),1);
await p.fill('#presenter-search','107');assert.equal(await p.locator('.presenter-choice[data-presenter="107"]').count(),1);
await p.fill('#presenter-search','找不到的名字');assert.match(await p.textContent('#presenter-list'),/找不到/);await shot('empty');
await p.fill('#presenter-search','');
// 系列篩選
await p.click('.presenter-filter[data-filter="weather"]');
const weather=await p.evaluate(async()=>{const {CHARACTERS}=await import('/js/eggs.js');return Object.values(CHARACTERS).filter(c=>c.series==='weather').length;});
assert.equal(await p.locator('.presenter-choice').count(),weather);await shot('filter');
// 選人 → 關閉、換人、存檔不變
await p.click('.presenter-choice[data-presenter="003"]');await p.locator('#presenter').waitFor({state:'hidden'});
assert.equal(await p.locator('#wish-portrait').getAttribute('data-presenter'),'003');
assert.deepEqual(await save(),before,'switching must not touch save');
// 最近陪伴出現在上方（草莓），篩選記住在系列
await p.click('#open-presenter');
assert.equal(await p.locator('.presenter-filter[data-filter="weather"]').getAttribute('aria-pressed'),'true');
await p.click('.presenter-filter[data-filter="all"]');
assert.equal(await p.locator('.presenter-grid--recent [data-presenter="002"]').count(),1);
assert.equal(await p.locator('.presenter-choice').count(),owned,'recent row not counted twice');
await shot('recent');
await p.click('.presenter-grid--recent [data-presenter="002"]');await p.locator('#presenter').waitFor({state:'hidden'});
assert.equal(await p.locator('#wish-portrait').getAttribute('data-presenter'),'002');
await p.click('#open-presenter');await p.click('.presenter-filter[data-filter="recent"]');
assert.deepEqual(await p.locator('.presenter-choice').evaluateAll(l=>l.map(e=>e.dataset.presenter)),['003']);
assert.equal(errs.length,0,errs.join('\n'));console.log(`${W}px presenter picker PASS`);await c.close();}
await b.close();})().catch(e=>{console.error(e);process.exit(1);});
