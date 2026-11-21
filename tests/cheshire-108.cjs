// No.108 柴郡貓小湘：資料都接上、「呵呵」只留少數、立繪規格、圖鑑與許願畫面的隱身效果（純視覺）
// SHOT=路徑前綴 會輸出 360／390／430 的手機截圖（隱身到一半＋完整）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const errs=[];
for(const W of (process.env.W?[Number(process.env.W)]:[360,390,430])){
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:process.env.SHOT?2:1});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
if(W===(process.env.W?Number(process.env.W):360)){
  const u=await p.evaluate(async()=>{const E=await import('/js/eggs.js'),I=await import('/js/intros.js'),B=await import('/js/bond-copy.js'),X=await import('/js/extra-lines.js'),V=await import('/js/wish-voice-late.js'),T=await import('/js/taste-profiles.js'),K=await import('/js/kitchen-lines.js'),R=await import('/js/errand-copy.js');
    const json=await fetch('/data/SIANG_KITCHEN_TASTE_PROFILES.json').then(r=>r.json());
    const img=new Image();img.src='/assets/characters/siang-108-cheshire.webp';await img.decode();const cv=document.createElement('canvas');cv.width=cv.height=1024;const ctx=cv.getContext('2d');ctx.drawImage(img,0,0);const d=ctx.getImageData(0,0,1024,1024).data;let top=1024,bottom=0;for(let y=0;y<1024;y++)for(let x=0;x<1024;x+=2)if(d[(y*1024+x)*4+3]>20){if(y<top)top=y;if(y>bottom)bottom=y;}
    const copy=JSON.stringify([I.INTROS['108'],I.MYSTERY_INTROS['108'],B.BOND_STORIES['108'],B.BOND_LINES['108'],X.EXTRA_LINES['108'],V.WISH_VOICE_LATE?.['108']??null,K.KITCHEN_LINES['108'],R.CHARACTER_REPORTS['108'],E.CHARACTERS['108'].line]);
    return {c:E.CHARACTERS['108'],series:E.SERIES.friends,pools:Object.values(E.EGGS).filter(e=>e.pool?.['108']).map(e=>e.id),free100:!E.CHARACTERS['100'],
      has:[I.INTROS['108'],I.MYSTERY_INTROS['108'],B.BOND_STORIES['108'],B.BOND_LINES['108']?.[2],B.BOND_LINES['108']?.[4],B.BOND_LINES['108']?.[5],X.EXTRA_LINES['108']?.hatch,X.EXTRA_LINES['108']?.dispatch,X.EXTRA_LINES['108']?.victory,X.EXTRA_LINES['108']?.defeat,K.KITCHEN_LINES['108']?.[3],K.KITCHEN_LINES['108']?.[0],R.CHARACTER_REPORTS['108']?.conv?.[0]].map(Boolean),
      voice:Object.values(V).some(o=>o&&o['108']?.color&&o['108']?.other),taste:T.TASTES['108'],json:json.profiles.find(p=>p.no==='108'),
      hehe:(copy.match(/呵呵/g)||[]).length,art:[img.naturalWidth,img.naturalHeight,top,bottom]};});
  assert.equal(u.c.rarity,'SSR');assert.equal(u.c.series,'friends');assert.equal(u.series.name,'摯友系列');assert.ok(u.c.cheshire);assert.ok(u.free100,'100 stays reserved');
  assert.deepEqual(u.pools.sort(),['cipher','ordinary','star']);
  assert.ok(u.has.every(Boolean),'all copy slots filled');assert.ok(u.voice,'wish voice');
  assert.deepEqual(u.taste.secret,u.json.secret_combo);assert.equal(u.taste.like,u.json.like);
  assert.ok(u.hehe<=2,`呵呵 in game copy: ${u.hehe}`);
  assert.deepEqual(u.art.slice(0,2),[1024,1024]);assert.ok(u.art[3]>=936&&u.art[3]<=941,`feet at ${u.art[3]}`);assert.ok(u.art[2]>=30,`head at ${u.art[2]}`);
}
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'2026-11-10T00:00:00Z'},'108':{at:'2026-11-21T00:00:00Z'}};s.hatched=2;s.tutorial=null;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:theme:v1','sakura');localStorage.setItem('siang-collector:wish-character:v1','108');});
await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
// 許願畫面：陪伴的柴郡貓會隱身
await p.click('#home-wishes');await p.locator('#wish-portrait[data-presenter="108"]').waitFor({state:'attached'});
assert.ok(await p.locator('#wish-portrait').evaluate(e=>e.classList.contains('is-cheshire')&&getComputedStyle(e).animationName==='cheshire-vanish'));
const freeze=(sel,t)=>p.locator(sel).evaluate((e,t)=>{e.style.animationDelay=`-${t}s`;e.style.animationPlayState='paused';},t);
if(process.env.SHOT){await freeze('#wish-portrait',7.5);await p.waitForTimeout(300);await p.locator('.wish-character-scene').scrollIntoViewIfNeeded();await p.screenshot({path:`${process.env.SHOT}-${W}-wish-vanish.png`});}
// 圖鑑
await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());location.hash='dex';});
await p.locator('[data-dex-no="108"]').click();await p.locator('#dex-detail[open]').waitFor();await p.locator('#dex-detail-img').evaluate(i=>i.decode());
assert.match(await p.textContent('#dex-detail-no'),/No\.108 · SSR · 摯友系列/);
assert.match(await p.textContent('#dex-detail-intro'),/最擅長的事情是消失/);
assert.match(await p.textContent('#dex-detail-how'),/普通蛋/);
assert.ok(await p.locator('#dex-detail-img').evaluate(e=>e.classList.contains('is-cheshire')));
assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal scroll');
if(process.env.SHOT){await p.screenshot({path:`${process.env.SHOT}-${W}-dex.png`});await freeze('#dex-detail-img',7.5);await p.waitForTimeout(300);await p.screenshot({path:`${process.env.SHOT}-${W}-dex-vanish.png`});}
// 沒拿到時是剪影、不隱身
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));delete s.dex['108'];localStorage.setItem(k,JSON.stringify(s));});await p.reload();await p.waitForTimeout(300);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());location.hash='dex';});
const locked=p.locator('[data-dex-no="108"]');if(await locked.count()){await locked.click();await p.locator('#dex-detail[open]').waitFor();assert.ok(!(await p.locator('#dex-detail-img').evaluate(e=>e.classList.contains('is-cheshire'))));assert.match(await p.textContent('#dex-detail-intro'),/紫色的尾巴/);}
await c.close();}
// 減少動態效果：不播
{const c=await b.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const p=await c.newPage();await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
 await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'x'},'108':{at:'x'}};s.tutorial=null;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:wish-character:v1','108');});
 await p.reload();await p.waitForTimeout(300);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');await p.click('#home-wishes');await p.locator('#wish-portrait[data-presenter="108"]').waitFor({state:'attached'});
 assert.equal(await p.locator('#wish-portrait').evaluate(e=>getComputedStyle(e).animationName),'none');await c.close();}
assert.deepEqual(errs,[]);console.log('No.108 柴郡貓小湘: copy wired (呵呵 ≤2), pools, art spec, dex + wish vanish effect, reduced-motion off PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
