// No.117 海棠新娘小湘：SSR、花嫁系列、普通＋暗號（＋星光）蛋池、所有文案欄位接上、「嘿嘿」只留 3 處、隱藏最愛海棠同心酥（齒輪＋櫻花＋草莓、不重複）、立繪規格、圖鑑手機排版
// SHOT=路徑前綴 會輸出 360／390／430 的圖鑑截圖；W=寬度 只跑一種
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const NO='117';
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const errs=[];
for(const W of (process.env.W?[Number(process.env.W)]:[360,390,430])){
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT?2:1});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
if(W===(process.env.W?Number(process.env.W):360)){
  const u=await p.evaluate(async(no)=>{const E=await import('/js/eggs.js'),I=await import('/js/intros.js'),B=await import('/js/bond-copy.js'),X=await import('/js/extra-lines.js'),V=await import('/js/wish-voice-late.js'),T=await import('/js/taste-profiles.js'),K=await import('/js/kitchen-lines.js'),R=await import('/js/errand-copy.js'),KI=await import('/js/kitchen.js');
    const json=await fetch('/data/SIANG_KITCHEN_TASTE_PROFILES.json').then(r=>r.json());
    const secrets=Object.entries(T.TASTES).map(([n,t])=>[n,[...t.secret].sort().join('+')]);
    const img=new Image();img.src=`/assets/characters/${E.CHARACTERS[no].image}.webp`;await img.decode();const cv=document.createElement('canvas');cv.width=cv.height=1024;const ctx=cv.getContext('2d');ctx.drawImage(img,0,0);const d=ctx.getImageData(0,0,1024,1024).data;let top=1024,bottom=0;for(let y=0;y<1024;y++)for(let x=0;x<1024;x+=2)if(d[(y*1024+x)*4+3]>20){if(y<top)top=y;if(y>bottom)bottom=y;}
    const copy=JSON.stringify([I.INTROS[no],I.MYSTERY_INTROS[no],B.BOND_STORIES[no],B.BOND_LINES[no],X.EXTRA_LINES[no],V.WISH_VOICE_LATE[no],K.KITCHEN_LINES[no],R.CHARACTER_REPORTS[no],E.CHARACTERS[no].line]);
    const mine=secrets.find(([n])=>n===no)[1];
    const dish=KI.dishById(mine);
    return {free100:!E.CHARACTERS['100'],c:E.CHARACTERS[no],series:E.SERIES.bride,lastKey:Object.keys(E.CHARACTERS).filter(k=>/^\d+$/.test(k)).at(-1),
      pools:Object.values(E.EGGS).filter(e=>e.pool?.[no]).map(e=>e.id).sort(),w:[E.EGGS.ordinary.pool[no],E.EGGS.cipher.pool[no],E.EGGS.star.pool[no]],
      has:[I.INTROS[no],I.MYSTERY_INTROS[no],B.BOND_STORIES[no],B.BOND_LINES[no]?.[2],B.BOND_LINES[no]?.[4],B.BOND_LINES[no]?.[5],X.EXTRA_LINES[no]?.hatch,X.EXTRA_LINES[no]?.dispatch,X.EXTRA_LINES[no]?.victory,X.EXTRA_LINES[no]?.defeat,K.KITCHEN_LINES[no]?.[3],K.KITCHEN_LINES[no]?.[2],K.KITCHEN_LINES[no]?.[1],K.KITCHEN_LINES[no]?.[0],R.CHARACTER_REPORTS[no]?.conv?.[0],R.CHARACTER_REPORTS[no]?.park?.[0],R.CHARACTER_REPORTS[no]?.market?.[0],R.CHARACTER_REPORTS[no]?.mountain?.[0],R.CHARACTER_REPORTS[no]?.faraway?.[0],V.WISH_VOICE_LATE[no]?.color?.includes('{color}'),V.WISH_VOICE_LATE[no]?.other?.includes('{wish}')].map(Boolean),
      hehe:(copy.match(/嘿嘿/g)||[]).length,heheAt:[X.EXTRA_LINES[no].hatch,B.BOND_LINES[no][5],K.KITCHEN_LINES[no][3]].map(s=>s.includes('嘿嘿')),
      stars:(copy.match(/\*\*/g)||[]).length,oiran:/花魁|遊廓/.test(copy),
      taste:T.TASTES[no],json:json.profiles.find(p=>p.no===no),ings:mine.split('+').map(i=>Boolean(KI.ING[i])),isSecret:KI.isSecret(no,dish),
      secretShared:secrets.filter(([n,s])=>n!==no&&s===mine).map(([n])=>n),art:[img.naturalWidth,img.naturalHeight,top,bottom]};
  },NO);
  assert.ok(u.free100,'100 stays reserved');
  assert.equal(u.c.rarity,'SSR');assert.equal(u.c.series,'bride');assert.ok(!u.c.special);assert.equal(u.c.name,'海棠新娘小湘');
  assert.equal(u.series.name,'花嫁系列');assert.equal(u.lastKey,'117','117 lists after 116');
  assert.deepEqual(u.pools,[],'湘 11/25：移到墨痕江湖活動卡池，一般蛋池都沒有');
  assert.ok(u.has.every(Boolean),`all copy slots filled: ${u.has}`);
  assert.equal(u.hehe,3,`嘿嘿 only 3 times, got ${u.hehe}`);assert.deepEqual(u.heheAt,[true,true,true],'嘿嘿 in hatch, Lv.5, secret dish');
  assert.equal(u.stars,0,'no markdown bold');assert.ok(!u.oiran,'no 花魁 elements');
  assert.deepEqual([...u.taste.secret].sort(),['gear','sakura','strawberry']);assert.deepEqual(u.taste.secret,u.json.secret_combo);assert.equal(u.taste.like,u.json.like);assert.equal(u.taste.dislike,u.json.dislike);
  assert.ok(u.ings.every(Boolean),'secret uses real ingredients');assert.ok(u.isSecret);assert.deepEqual(u.secretShared,[],'secret combo unique');
  assert.deepEqual(u.art.slice(0,2),[1024,1024]);assert.ok(u.art[3]>=936&&u.art[3]<=941,`feet at ${u.art[3]}`);assert.ok(u.art[2]>=25,`head at ${u.art[2]}`);
}
await p.evaluate((theme)=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'2026-11-10T00:00:00Z'},'117':{at:'2026-11-25T00:00:00Z'}};s.hatched=2;s.tutorial=null;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:theme:v1',theme);localStorage.setItem('siang-collector:dex-world:v1','mo');},process.env.THEME||'sakura');
await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());location.hash='dex';});
await p.locator('[data-dex-no="117"]').click();await p.locator('#dex-detail[open]').waitFor();await p.locator('#dex-detail-img').evaluate(i=>i.decode());
assert.match(await p.textContent('#dex-detail-no'),/MO-002 · SSR · 異世・墨痕江湖/);
assert.match(await p.textContent('#dex-detail-intro'),/海棠鎮/);
assert.match(await p.textContent('#dex-detail-how'),/墨痕江湖/);
assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal scroll');
if(process.env.SHOT){await p.waitForTimeout(300);await p.screenshot({path:`${process.env.SHOT}-${W}-dex.png`});}
await c.close();}
assert.deepEqual(errs,[]);console.log('No.117 海棠新娘: SSR 花嫁, pools, copy wired, 嘿嘿×3, 海棠同心酥 unique, art spec, dex on mobile PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
