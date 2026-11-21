// No.110–114 月見町花街五階：稀有度、系列、蛋池、文案都接上、「呵呵」只留少數、立繪規格、組合彩蛋、集齊成就與夜宴故事、圖鑑手機排版
// SHOT=路徑前綴 會輸出 360／390／430 的圖鑑截圖與夜宴故事截圖
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const NOS=['110','111','112','113','114'];
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const errs=[];
for(const W of (process.env.W?[Number(process.env.W)]:[360,390,430])){
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT?2:1});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
if(W===(process.env.W?Number(process.env.W):360)){
  const u=await p.evaluate(async(NOS)=>{const E=await import('/js/eggs.js'),I=await import('/js/intros.js'),B=await import('/js/bond-copy.js'),X=await import('/js/extra-lines.js'),V=await import('/js/wish-voice-late.js'),T=await import('/js/taste-profiles.js'),K=await import('/js/kitchen-lines.js'),R=await import('/js/errand-copy.js'),L=await import('/js/luck-talk.js'),A=await import('/js/achievements.js');
    const json=await fetch('/data/SIANG_KITCHEN_TASTE_PROFILES.json').then(r=>r.json());
    const out={free100:!E.CHARACTERS['100'],series:E.SERIES.tsukimi,each:{}};
    for(const no of NOS){
      const img=new Image();img.src=`/assets/characters/${E.CHARACTERS[no].image}.webp`;await img.decode();const cv=document.createElement('canvas');cv.width=cv.height=1024;const ctx=cv.getContext('2d');ctx.drawImage(img,0,0);const d=ctx.getImageData(0,0,1024,1024).data;let top=1024,bottom=0;for(let y=0;y<1024;y++)for(let x=0;x<1024;x+=2)if(d[(y*1024+x)*4+3]>20){if(y<top)top=y;if(y>bottom)bottom=y;}
      const copy=JSON.stringify([I.INTROS[no],B.BOND_STORIES[no],B.BOND_LINES[no],X.EXTRA_LINES[no],V.WISH_VOICE_LATE[no],K.KITCHEN_LINES[no],R.CHARACTER_REPORTS[no],E.CHARACTERS[no].line]);
      out.each[no]={c:E.CHARACTERS[no],pools:Object.values(E.EGGS).filter(e=>e.pool?.[no]).map(e=>e.id).sort(),
        has:[I.INTROS[no],I.MYSTERY_INTROS[no],B.BOND_STORIES[no]?.includes('{name}'),B.BOND_LINES[no]?.[2],B.BOND_LINES[no]?.[4],B.BOND_LINES[no]?.[5],X.EXTRA_LINES[no]?.hatch,X.EXTRA_LINES[no]?.dispatch,X.EXTRA_LINES[no]?.victory,X.EXTRA_LINES[no]?.defeat,K.KITCHEN_LINES[no]?.[3],K.KITCHEN_LINES[no]?.[2],K.KITCHEN_LINES[no]?.[1],K.KITCHEN_LINES[no]?.[0],R.CHARACTER_REPORTS[no]?.conv?.[0],R.CHARACTER_REPORTS[no]?.park?.[0],V.WISH_VOICE_LATE[no]?.color?.includes('{color}'),V.WISH_VOICE_LATE[no]?.other?.includes('{wish}')].map(Boolean),
        taste:T.TASTES[no],json:json.profiles.find(p=>p.no===no),hehe:(copy.match(/呵呵/g)||[]).length,heng:(copy.match(/哼/g)||[]).length,art:[img.naturalWidth,img.naturalHeight,top,bottom]};
    }
    out.talks=[['110','111'],['112','113'],['113','114']].map(pair=>Boolean(L.talkFor(pair[0],pair)));
    out.noTalkAlone=L.talkFor('110',['110','001'])===null;
    const ach=A.ACHIEVEMENTS.find(a=>a.id==='tsukimi-5');
    out.ach={title:ach?.title,four:ach?.value({dex:Object.fromEntries(NOS.slice(0,4).map(n=>[n,{}]))}),five:ach?.value({dex:Object.fromEntries(NOS.map(n=>[n,{}]))}),story:ach?.story};
    return out;},NOS);
  assert.ok(u.free100,'100 stays reserved');assert.equal(u.series.name,'月見町');
  const rar={'110':'N','111':'R','112':'SR','113':'SSR','114':'UR'};
  for(const no of NOS){const e=u.each[no];
    assert.equal(e.c.rarity,rar[no]);assert.equal(e.c.series,'tsukimi');assert.ok(!e.c.special);
    assert.deepEqual(e.pools,['SR','SSR','UR'].includes(rar[no])?['cipher','ordinary','star']:['cipher','ordinary'],`${no} pools`);
    assert.ok(e.has.every(Boolean),`${no} all copy slots filled: ${e.has}`);
    assert.deepEqual(e.taste.secret,e.json.secret_combo);assert.equal(e.taste.like,e.json.like);
    assert.deepEqual(e.art.slice(0,2),[1024,1024]);assert.ok(e.art[3]>=936&&e.art[3]<=941,`${no} feet at ${e.art[3]}`);assert.ok(e.art[2]>=30,`${no} head at ${e.art[2]}`);
  }
  assert.ok(u.each['114'].hehe<=2,`花魁 呵呵 in game copy: ${u.each['114'].hehe}`);
  assert.equal(u.each['113'].hehe,0);assert.ok(u.each['113'].heng<=1);
  assert.deepEqual(u.talks,[true,true,true]);assert.ok(u.noTalkAlone);
  assert.equal(u.ach.title,'月見町的五朵花');assert.equal(u.ach.four,4);assert.equal(u.ach.five,5);
  assert.ok(u.ach.story.includes('好好休息的那一刻'));assert.ok((u.ach.story.match(/呵呵/g)||[]).length<=1);
}
// 圖鑑：花魁小湘
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'2026-11-10T00:00:00Z'},'110':{at:'2026-11-21T00:00:00Z'},'111':{at:'2026-11-21T00:00:00Z'},'112':{at:'2026-11-21T00:00:00Z'},'113':{at:'2026-11-21T00:00:00Z'},'114':{at:'2026-11-21T00:00:00Z'}};s.hatched=6;s.tutorial=null;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:theme:v1','sakura');});
await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());location.hash='dex';});
await p.locator('[data-dex-no="114"]').click();await p.locator('#dex-detail[open]').waitFor();await p.locator('#dex-detail-img').evaluate(i=>i.decode());
assert.match(await p.textContent('#dex-detail-no'),/No\.114 · UR · 月見町/);
assert.match(await p.textContent('#dex-detail-intro'),/認真看見自己/);
assert.match(await p.textContent('#dex-detail-how'),/普通蛋/);
assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal scroll');
if(process.env.SHOT)await p.screenshot({path:`${process.env.SHOT}-${W}-dex.png`});
// 成就：領取「月見町的五朵花」→ 夜宴故事卡
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.evaluate(()=>document.getElementById('open-achievements').click());
await p.locator('#achievement-dialog[open]').waitFor();
await p.locator('[data-ach="tsukimi-5"]').click();
await p.locator('#bond-up[open]').waitFor();
assert.equal(await p.textContent('#bond-up-title'),'月見町的最後一盞燈');
assert.match(await p.textContent('#bond-up-unlock'),/月見町的五朵花/);
assert.match(await p.textContent('#bond-up-text'),/好好休息的那一刻/);
assert.ok(await p.evaluate(()=>{const d=document.getElementById('bond-up').getBoundingClientRect();return d.left>=0&&d.right<=innerWidth;}),'story card fits');
if(process.env.SHOT){await p.waitForTimeout(300);await p.screenshot({path:`${process.env.SHOT}-${W}-event.png`});}
await p.click('#bond-up-ok');
assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')).achievements.claimed.includes('tsukimi-5')),true);
// 已領取：再點一次可以重看
await p.locator('[data-ach="tsukimi-5"]').click();await p.locator('#bond-up[open]').waitFor();await p.click('#bond-up-ok');
await c.close();}
assert.deepEqual(errs,[]);console.log('No.110–114 月見町: rarities, pools, copy wired (呵呵 trimmed), art spec, talks, 五朵花 achievement + story, dex on mobile PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
