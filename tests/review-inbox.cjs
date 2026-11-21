// 審查室收件匣（湘 11/21）：打開先停在「審核」，所有玩家的委託照片＋寄來的照片合在一起；按完只收掉那一張；勾選批次通過／退回（退回要按兩次）
const {chromium}=require('playwright'),assert=require('node:assert/strict');const {spawn}=require('node:child_process');
(async()=>{const api=spawn('node',['server/dev-server.mjs','8797'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,1200));
const API='http://127.0.0.1:8797';
try{
const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const width=Number(process.env.WIDTH||390);
const ctx=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:process.env.SHOT?2:1});await ctx.addInitScript(a=>{globalThis.SIANG_API_OVERRIDE=a;},API);
const errs=[];const r=await ctx.newPage();r.on('pageerror',e=>errs.push(e.message));
await r.goto('http://127.0.0.1:8000/review.html');
assert.equal(await r.getAttribute('#tab-setup','aria-selected'),'true','第一次使用先停在設定');
await r.locator('#rv-claim').click();await r.locator('#rv-backup:not([hidden])').waitFor();await r.locator('#rv-backup-done').click();
const invites={};
for(const name of ['男友','朋朋']){await r.locator('#player-add').click();await r.locator('#rv-new-name').fill(name);await r.locator('#rv-new button[type=submit]').click();await r.waitForFunction(n=>document.querySelector('#rv-invite-hint').textContent.includes(n),name);invites[name]=await r.locator('#rv-invite-text').inputValue();}
await r.locator('#key-generate').click();await r.waitForFunction(()=>!document.getElementById('mission-create').disabled);
await r.locator('#tab-make').click();assert(await r.locator('#make-player').isVisible());assert(!(await r.locator('#sec-cloud').isVisible()));
await r.locator('#mission-everyone').check();await r.locator('#mission-title').fill('今天晚餐吃什麼');await r.locator('#mission-create').click();
await r.waitForFunction(()=>/出題給 2 位玩家/.test(document.getElementById('mission-status').textContent));
// 玩家上傳：男友 2 張、朋朋 1 張，朋朋另外寄一張照片
await r.evaluate(async([api,inv])=>{
  const jpg=async(c1,c2)=>{const cv=document.createElement('canvas');cv.width=480;cv.height=360;const x=cv.getContext('2d');const g=x.createLinearGradient(0,0,480,360);g.addColorStop(0,c1);g.addColorStop(1,c2);x.fillStyle=g;x.fillRect(0,0,480,360);x.fillStyle='#fff8';x.beginPath();x.arc(240,190,90,0,7);x.fill();return new Promise(r=>cv.toBlob(r,'image/jpeg',.8));};
  const put=(t,p,body,type)=>fetch(`${api}/f/${p}`,{method:'PUT',headers:{Authorization:'Bearer '+t,'Content-Type':type},body});
  for(const [name,list] of [['男友',[['#f7b267','#f4845f'],['#90be6d','#43aa8b']]],['朋朋',[['#cdb4db','#ffafcc']]]]){
    const t=inv[name];const ms=await (await fetch(`${api}/ls/missions`,{headers:{Authorization:'Bearer '+t}})).json();const id=ms[0].name.slice(0,-5);
    let n=0;for(const [a,c] of list){const sid=`${(Date.now()-86400000+(n++)*60000+(name==='朋朋'?30000:0)).toString(36)}ab${n}c`.slice(0,12);await put(t,`submissions/${id}/${sid}.jpg`,await jpg(a,c),'image/jpeg');await put(t,`submissions/${id}/${sid}.json`,JSON.stringify({mission:id,sid}),'application/json');}
  }
  const pid='20261121093000-abcd';await put(inv['朋朋'],`postcards/${pid}.jpg`,await jpg('#a2d2ff','#bde0fe'),'image/jpeg');await put(inv['朋朋'],`postcards/${pid}.json`,JSON.stringify({id:pid,text:'今天看到一隻好可愛的貓',at:'2026-11-21T01:30:00Z'}),'application/json');
},[API,invites]);
// 重新打開：直接停在審核，所有玩家合在一起
await r.reload();assert.equal(await r.getAttribute('#tab-inbox','aria-selected'),'true','有印章後打開先停在審核');
await r.waitForFunction(()=>document.querySelectorAll('#inbox-list .inbox-item').length===4);
assert.equal(await r.textContent('#inbox-count'),'4');
assert.match(await r.textContent('#inbox-filter'),/委託照片 3/);assert.match(await r.textContent('#inbox-filter'),/寄來的照片 1/);
const who=await r.locator('#inbox-list .who').allTextContents();assert.deepEqual([...new Set(who)].sort(),['男友','朋朋'].sort());
await r.waitForFunction(()=>[...document.querySelectorAll('#inbox-list .review-photo')].every(i=>i.src.startsWith('blob:')&&i.complete));
assert.equal(await r.evaluate(()=>document.documentElement.scrollWidth),width,'no horizontal scroll');
if(process.env.SHOT){await r.screenshot({path:`${process.env.SHOT}-inbox.png`});}
// 篩選
await r.locator('#inbox-filter [data-filter=postcard]').click();assert.equal(await r.locator('#inbox-list .inbox-item').count(),1);
await r.locator('#inbox-filter [data-filter=all]').click();
// 勾兩張男友的 → 批次通過
assert(await r.locator('#batch-bar').isHidden());
const boxes=r.locator('#inbox-list .inbox-item',{hasText:'男友'}).locator('.pick input');assert.equal(await boxes.count(),2);
await boxes.nth(0).check();await boxes.nth(1).check();
await r.locator('#batch-bar').waitFor();assert.match(await r.textContent('#batch-count'),/已選 2 張/);
await r.locator('#inbox-list .inbox-item',{hasText:'男友'}).first().locator('textarea').fill('這張最好吃！');
await r.locator('#batch-note').fill('看起來好好吃～');
if(process.env.SHOT){await r.screenshot({path:`${process.env.SHOT}-batch.png`});}
await r.locator('#batch-approve').click();await r.waitForFunction(()=>/已通過 2 張/.test(document.getElementById('inbox-status').textContent));
assert.equal(await r.locator('#inbox-list .inbox-item').count(),2);assert(await r.locator('#batch-bar').isHidden());assert.equal(await r.textContent('#inbox-count'),'2');
const reviews=await r.evaluate(async([api,t])=>{const h={Authorization:'Bearer '+t};const ls=await (await fetch(`${api}/ls/reviews`,{headers:h})).json();return Promise.all(ls.map(async f=>(await (await fetch(`${api}/f/${f.path}`,{headers:h})).json()).payload));},[API,invites['男友']]);
assert.equal(reviews.length,2);assert(reviews.every(p=>p.approved));assert.deepEqual(reviews.map(p=>p.note).sort(),['看起來好好吃～','這張最好吃！'].sort());
// 朋朋那張批次退回：第一次只是確認
await r.locator('#inbox-list .inbox-item',{hasText:'朋朋'}).locator('.pick input').check();
await r.locator('#batch-reject').click();assert.match(await r.textContent('#batch-reject'),/確定退回 1 張/);assert.equal(await r.locator('#inbox-list .inbox-item').count(),2);
await r.locator('#batch-reject').click();await r.waitForFunction(()=>/已退回 1 張/.test(document.getElementById('inbox-status').textContent));
const rj=await r.evaluate(async([api,t])=>{const h={Authorization:'Bearer '+t};const ls=await (await fetch(`${api}/ls/reviews`,{headers:h})).json();return (await (await fetch(`${api}/f/${ls[0].path}`,{headers:h})).json()).payload;},[API,invites['朋朋']]);
assert.equal(rj.approved,false);
// 剩下明信片：沒寫字不能送，寫了就收掉
await r.locator('#inbox-list .btn',{hasText:'蓋章回覆'}).click();assert.match(await r.textContent('#inbox-status'),/先寫一句話/);
await r.locator('#inbox-list textarea').fill('好可愛！');await r.locator('#inbox-list .btn',{hasText:'蓋章回覆'}).click();
await r.waitForFunction(()=>/都審完了/.test(document.getElementById('inbox-list').textContent));assert(await r.locator('#inbox-count').isHidden());
if(process.env.SHOT){await r.locator('#tab-make').click();await r.screenshot({path:`${process.env.SHOT}-make.png`});}
assert.equal(errs.length,0,errs.join('\n'));
console.log('review inbox: opens on inbox, all players merged, filter, per-item and batch approve/reject, confirm reject, postcard reply PASS');await b.close();
}finally{api.kill();}})().catch(e=>{console.error(e);process.exit(1)});
