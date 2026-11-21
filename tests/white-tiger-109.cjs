// No.109 白虎小湘：UR、摯友系列、普通＋暗號＋星光蛋、文案都接上、「哼」只留少數、立繪規格、圖鑑手機排版
// SHOT=路徑前綴 會輸出 360／390／430 的圖鑑截圖
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const errs=[];
for(const W of (process.env.W?[Number(process.env.W)]:[360,390,430])){
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT?2:1});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
if(W===(process.env.W?Number(process.env.W):360)){
  const u=await p.evaluate(async()=>{const E=await import('/js/eggs.js'),I=await import('/js/intros.js'),B=await import('/js/bond-copy.js'),X=await import('/js/extra-lines.js'),V=await import('/js/wish-voice-late.js'),T=await import('/js/taste-profiles.js'),K=await import('/js/kitchen-lines.js'),R=await import('/js/errand-copy.js');
    const json=await fetch('/data/SIANG_KITCHEN_TASTE_PROFILES.json').then(r=>r.json());
    const img=new Image();img.src='/assets/characters/siang-109-white-tiger.webp';await img.decode();const cv=document.createElement('canvas');cv.width=cv.height=1024;const ctx=cv.getContext('2d');ctx.drawImage(img,0,0);const d=ctx.getImageData(0,0,1024,1024).data;let top=1024,bottom=0;for(let y=0;y<1024;y++)for(let x=0;x<1024;x+=2)if(d[(y*1024+x)*4+3]>20){if(y<top)top=y;if(y>bottom)bottom=y;}
    const copy=JSON.stringify([I.INTROS['109'],B.BOND_STORIES['109'],B.BOND_LINES['109'],X.EXTRA_LINES['109'],V.WISH_VOICE_LATE['109'],K.KITCHEN_LINES['109'],R.CHARACTER_REPORTS['109'],E.CHARACTERS['109'].line]);
    return {c:E.CHARACTERS['109'],pools:Object.values(E.EGGS).filter(e=>e.pool?.['109']).map(e=>e.id),free100:!E.CHARACTERS['100'],
      has:[I.INTROS['109'],I.MYSTERY_INTROS['109'],B.BOND_STORIES['109'],B.BOND_LINES['109']?.[2],B.BOND_LINES['109']?.[4],B.BOND_LINES['109']?.[5],X.EXTRA_LINES['109']?.hatch,X.EXTRA_LINES['109']?.dispatch,X.EXTRA_LINES['109']?.victory,X.EXTRA_LINES['109']?.defeat,K.KITCHEN_LINES['109']?.[3],K.KITCHEN_LINES['109']?.[0],R.CHARACTER_REPORTS['109']?.conv?.[0],V.WISH_VOICE_LATE['109']?.color,V.WISH_VOICE_LATE['109']?.other].map(Boolean),
      taste:T.TASTES['109'],json:json.profiles.find(p=>p.no==='109'),heng:(copy.match(/哼/g)||[]).length,art:[img.naturalWidth,img.naturalHeight,top,bottom]};});
  assert.equal(u.c.rarity,'UR');assert.equal(u.c.series,'friends');assert.ok(!u.c.special);assert.ok(u.free100,'100 stays reserved');
  assert.deepEqual(u.pools.sort(),['cipher','ordinary','star']);
  assert.ok(u.has.every(Boolean),'all copy slots filled');
  assert.deepEqual(u.taste.secret,u.json.secret_combo);assert.equal(u.taste.like,u.json.like);
  assert.ok(u.heng<=2,`哼 in game copy: ${u.heng}`);
  assert.deepEqual(u.art.slice(0,2),[1024,1024]);assert.ok(u.art[3]>=936&&u.art[3]<=941,`feet at ${u.art[3]}`);assert.ok(u.art[2]>=30,`head at ${u.art[2]}`);
}
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'2026-11-10T00:00:00Z'},'109':{at:'2026-11-21T00:00:00Z'}};s.hatched=2;s.tutorial=null;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:theme:v1','sakura');});
await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());location.hash='dex';});
await p.locator('[data-dex-no="109"]').click();await p.locator('#dex-detail[open]').waitFor();await p.locator('#dex-detail-img').evaluate(i=>i.decode());
assert.match(await p.textContent('#dex-detail-no'),/No\.109 · UR · 摯友系列/);
assert.match(await p.textContent('#dex-detail-intro'),/便不會真正退場/);
assert.match(await p.textContent('#dex-detail-how'),/普通蛋/);
assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal scroll');
if(process.env.SHOT)await p.screenshot({path:`${process.env.SHOT}-${W}-dex.png`});
await c.close();}
assert.deepEqual(errs,[]);console.log('No.109 白虎小湘: UR friends, pools, copy wired (哼 ≤2), art spec, dex on mobile PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
