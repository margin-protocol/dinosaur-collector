// No.115–116 十五年友情・法律ㄊㄧ雙人組：稀有度、摯友系列、蛋池、文案都接上（不再有「熊貓」）、立繪規格、四個雙人彩蛋、成就「十五年，證據確鑿」與收藏事件、圖鑑手機排版
// SHOT=路徑前綴 會輸出 360／390／430 的圖鑑截圖與收藏事件截圖
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const NOS=['115','116'];
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const errs=[];
for(const W of (process.env.W?[Number(process.env.W)]:[360,390,430])){
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT?2:1});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
if(W===(process.env.W?Number(process.env.W):360)){
  const u=await p.evaluate(async(NOS)=>{const E=await import('/js/eggs.js'),I=await import('/js/intros.js'),B=await import('/js/bond-copy.js'),X=await import('/js/extra-lines.js'),V=await import('/js/wish-voice-late.js'),T=await import('/js/taste-profiles.js'),K=await import('/js/kitchen-lines.js'),R=await import('/js/errand-copy.js'),L=await import('/js/luck-talk.js'),A=await import('/js/achievements.js');
    const json=await fetch('/data/SIANG_KITCHEN_TASTE_PROFILES.json').then(r=>r.json());
    const out={free100:!E.CHARACTERS['100'],each:{}};
    const secrets=Object.entries(T.TASTES).map(([n,t])=>[n,[...t.secret].sort().join('+')]);
    for(const no of NOS){
      const img=new Image();img.src=`/assets/characters/${E.CHARACTERS[no].image}.webp`;await img.decode();const cv=document.createElement('canvas');cv.width=cv.height=1024;const ctx=cv.getContext('2d');ctx.drawImage(img,0,0);const d=ctx.getImageData(0,0,1024,1024).data;let top=1024,bottom=0;for(let y=0;y<1024;y++)for(let x=0;x<1024;x+=2)if(d[(y*1024+x)*4+3]>20){if(y<top)top=y;if(y>bottom)bottom=y;}
      const copy=JSON.stringify([I.INTROS[no],I.MYSTERY_INTROS[no],B.BOND_STORIES[no],B.BOND_LINES[no],X.EXTRA_LINES[no],V.WISH_VOICE_LATE[no],K.KITCHEN_LINES[no],R.CHARACTER_REPORTS[no],E.CHARACTERS[no]]);
      const mine=secrets.find(([n])=>n===no)[1];
      out.each[no]={c:E.CHARACTERS[no],pools:Object.values(E.EGGS).filter(e=>e.pool?.[no]).map(e=>e.id).sort(),w:[E.EGGS.ordinary.pool[no],E.EGGS.cipher.pool[no]],
        has:[I.INTROS[no],I.MYSTERY_INTROS[no],B.BOND_STORIES[no],B.BOND_LINES[no]?.[2],B.BOND_LINES[no]?.[4],B.BOND_LINES[no]?.[5],X.EXTRA_LINES[no]?.hatch,X.EXTRA_LINES[no]?.dispatch,X.EXTRA_LINES[no]?.victory,X.EXTRA_LINES[no]?.defeat,K.KITCHEN_LINES[no]?.[3],K.KITCHEN_LINES[no]?.[2],K.KITCHEN_LINES[no]?.[1],K.KITCHEN_LINES[no]?.[0],R.CHARACTER_REPORTS[no]?.conv?.[0],R.CHARACTER_REPORTS[no]?.park?.[0],R.CHARACTER_REPORTS[no]?.mountain?.[0],R.CHARACTER_REPORTS[no]?.faraway?.[0],V.WISH_VOICE_LATE[no]?.color?.includes('{color}'),V.WISH_VOICE_LATE[no]?.other?.includes('{wish}')].map(Boolean),
        taste:T.TASTES[no],json:json.profiles.find(p=>p.no===no),panda:(copy.match(/熊貓/g)||[]).length,ti:(copy.match(/ㄊㄧ/g)||[]).length,
        secretShared:secrets.filter(([n,s])=>n!==no&&s===mine).map(([n])=>n),art:[img.naturalWidth,img.naturalHeight,top,bottom]};
    }
    const pair=['115','116'];
    out.talks=L.talksFor('115',pair).length;out.picks=[0,.3,.6,.99].map(r=>L.talkFor('116',pair,()=>r).lines[0][1]);
    out.talkPanda=JSON.stringify(L.talksFor('115',pair)).includes('熊貓');
    out.noTalkAlone=L.talkFor('115',['115','037'])===null;
    out.tsukimiStill=Boolean(L.talkFor('110',['110','111']));
    const ach=A.ACHIEVEMENTS.find(a=>a.id==='law-ti-2');
    out.ach={title:ach?.title,one:ach?.value({dex:{'115':{}}}),two:ach?.value({dex:{'115':{},'116':{}}}),story:ach?.story,ok:ach?.storyOk};
    return out;},NOS);
  assert.ok(u.free100,'100 stays reserved');
  const rar={'115':'SR','116':'SSR'},w={'115':[2,4],'116':[0.6,1.5]};
  for(const no of NOS){const e=u.each[no];
    assert.equal(e.c.rarity,rar[no]);assert.equal(e.c.series,'friends');assert.ok(!e.c.special);
    assert.deepEqual(e.pools,['cipher','ordinary','star'],`${no} pools`);assert.deepEqual(e.w,w[no],`${no} weights like 摯友 SR／柴郡貓 SSR`);
    assert.ok(e.has.every(Boolean),`${no} all copy slots filled: ${e.has}`);
    assert.equal(e.panda,0,`${no} still says 熊貓`);assert.ok(e.ti>=20,`${no} ㄊㄧ count ${e.ti}`);
    assert.deepEqual(e.taste.secret,e.json.secret_combo);assert.equal(e.taste.like,e.json.like);assert.deepEqual(e.secretShared,[],`${no} secret combo unique`);
    assert.deepEqual(e.art.slice(0,2),[1024,1024]);assert.ok(e.art[3]>=936&&e.art[3]<=941,`${no} feet at ${e.art[3]}`);assert.ok(e.art[2]>=25,`${no} head at ${e.art[2]}`);
  }
  assert.match(u.each['115'].c.name,/律師ㄊㄧ/);assert.match(u.each['116'].c.name,/檢察官ㄊㄧ/);
  assert.equal(u.talks,4);assert.equal(new Set(u.picks).size,4,'all four easter eggs reachable');assert.ok(!u.talkPanda);assert.ok(u.noTalkAlone);assert.ok(u.tsukimiStill);
  assert.equal(u.ach.title,'十五年，證據確鑿');assert.equal(u.ach.one,1);assert.equal(u.ach.two,2);assert.equal(u.ach.ok,'繼續當朋友');
  assert.ok(u.ach.story.includes('繼續當朋友就好'));assert.ok(!u.ach.story.includes('熊貓'));
}
// 圖鑑：檢察官ㄊㄧ
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'2026-11-10T00:00:00Z'},'115':{at:'2026-11-21T00:00:00Z'},'116':{at:'2026-11-21T00:00:00Z'}};s.hatched=3;s.tutorial=null;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:theme:v1','sakura');});
await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());location.hash='dex';});
await p.locator('[data-dex-no="116"]').click();await p.locator('#dex-detail[open]').waitFor();await p.locator('#dex-detail-img').evaluate(i=>i.decode());
assert.match(await p.textContent('#dex-detail-no'),/No\.116 · SSR · 摯友/);
assert.match(await p.textContent('#dex-detail-intro'),/自己收起來/);
assert.match(await p.textContent('#dex-detail-how'),/普通蛋/);
assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal scroll');
if(process.env.SHOT)await p.screenshot({path:`${process.env.SHOT}-${W}-dex.png`});
// 成就：領取「十五年，證據確鑿」→ 收藏事件卡
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.evaluate(()=>document.getElementById('open-achievements').click());
await p.locator('#achievement-dialog[open]').waitFor();
await p.locator('[data-ach="law-ti-2"]').click();
await p.locator('#bond-up[open]').waitFor();
assert.equal(await p.textContent('#bond-up-title'),'十五年，證據確鑿');
assert.match(await p.textContent('#bond-up-unlock'),/十五年，證據確鑿/);
assert.match(await p.textContent('#bond-up-text'),/一起走過的時間/);
assert.equal(await p.textContent('#bond-up-ok'),'繼續當朋友');
assert.ok(await p.evaluate(()=>{const d=document.getElementById('bond-up').getBoundingClientRect();return d.left>=0&&d.right<=innerWidth;}),'story card fits');
if(process.env.SHOT){await p.waitForTimeout(300);await p.screenshot({path:`${process.env.SHOT}-${W}-event.png`});}
await p.click('#bond-up-ok');
assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')).achievements.claimed.includes('law-ti-2')),true);
await p.locator('[data-ach="law-ti-2"]').click();await p.locator('#bond-up[open]').waitFor();await p.click('#bond-up-ok');
await c.close();}
assert.deepEqual(errs,[]);console.log('No.115–116 法律ㄊㄧ: rarities, 摯友 pools, copy wired (no 熊貓), art spec, 4 talks, 十五年證據確鑿 achievement + story, dex on mobile PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
