// 外出合照：選小湘 → 相機（假鏡頭）→ 拖曳／縮放 → 拍照合成 → 好感 +3（每天一次）；從圖鑑直接合照；沒相機時改用照片；狂戳小湘會抗議
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,permissions:['camera']});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=3;s.dex={'001':{at:'x'},'005':{at:'x'},'071':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['001','005']));},key);
await p.reload();await p.waitForTimeout(500);
await p.locator('#open-center').click();await p.locator('#open-photo').click();await p.locator('#photo-dialog[open]').waitFor();
assert.equal(await p.locator('.photo-pick-item').count(),3);
await p.locator('.photo-pick-item[data-pick="071"]').click();
await p.waitForFunction(()=>document.querySelector('.photo-video').videoWidth>0,null,{timeout:10000});
// 拖曳小湘往左上、用滑桿調小
const box=await p.locator('.photo-siang').boundingBox();
await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(box.x+box.width/2-60,box.y+box.height/2-80,{steps:5});await p.mouse.up();
await p.locator('.photo-size').fill('40');
const st=await p.locator('.photo-siang').evaluate(e=>({l:parseFloat(e.style.left),h:parseFloat(e.style.height)}));assert(st.l<50&&st.h===40,JSON.stringify(st));
await p.locator('.photo-mirror').click();
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT});
await p.locator('.photo-shutter').click();await p.locator('.photo-result:not([hidden])').waitFor();
const res=await p.locator('.photo-result-img').evaluate(i=>new Promise(r=>{const ok=()=>r({w:i.naturalWidth,h:i.naturalHeight});i.complete?ok():i.onload=ok;}));
assert(res.w>0&&Math.abs(res.w/res.h-0.75)<0.01,JSON.stringify(res));
assert.equal(await p.evaluate(()=>!!document.querySelector('.photo-video').srcObject),false,'拍完關掉相機');
await p.waitForTimeout(300);let s=await save();assert.equal(s.affection['071'].pts,4);assert.equal(s.affection['071'].photo.length,10);
await p.locator('.photo-again').click();await p.waitForFunction(()=>document.querySelector('.photo-video').videoWidth>0);await p.locator('.photo-shutter').click();await p.locator('.photo-result:not([hidden])').waitFor();
await p.waitForTimeout(300);s=await save();assert.equal(s.affection['071'].pts,4,'同一天同一位只加一次');assert.equal(s.player.stats.photos,2,'合照次數每張都算');
await p.locator('.photo-result .photo-close').click();assert.equal(await p.locator('#photo-dialog[open]').count(),0);
// 從圖鑑直接合照
await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(300);
await p.locator('[data-dex-no="005"]').click();await p.locator('#dex-detail[open]').waitFor();
await p.locator('#dex-photo').click();await p.locator('.photo-cam:not([hidden])').waitFor();assert.match(await p.locator('.photo-who').textContent(),/甜點/);
await p.locator('.photo-cam .photo-back').click();await p.locator('.photo-pick:not([hidden])').waitFor();await p.locator('.photo-dialog .drawer-heading .photo-close').click();
// 沒有相機：改用照片
const ctx2=await b.newContext({viewport:{width:390,height:844}});const q=await ctx2.newPage();
await q.addInitScript(()=>{navigator.mediaDevices.getUserMedia=()=>Promise.reject(Object.assign(new Error('no'),{name:'NotAllowedError'}));});
await q.goto('http://127.0.0.1:8000');await q.click('#intro-ok');
await q.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));},key);await q.reload();await q.waitForTimeout(400);
await q.locator('#open-center').click();await q.locator('#open-photo').click();await q.locator('.photo-pick-item').first().click();
await q.locator('.photo-fallback:not([hidden])').waitFor();assert.match(await q.locator('.photo-status').textContent(),/權限/);
await q.locator('.photo-file').setInputFiles('assets/characters/siang-001-hd/idle-open.webp');
await q.waitForFunction(()=>document.querySelector('.photo-still').naturalWidth>0);
await q.locator('.photo-shutter').click();await q.locator('.photo-result:not([hidden])').waitFor();
// 狂戳
await p.evaluate(()=>{location.hash='';});await p.waitForTimeout(300);
const doll=p.locator('.resident-slot[data-character="005"] .resident-static');
const before=(await save()).bonus.total.taps||0;
for(let i=0;i<7;i++){await doll.click({force:true});await p.waitForTimeout(60);}
await p.waitForTimeout(400);
assert.match(await p.locator('.resident-bubble').allTextContents().then(t=>t.join('|')),/不要戳啦！！！小湘要扁掉了/);
const after=(await save()).bonus.total.taps||0;assert.equal(after-before,4,'第 5 下開始不算數');
assert.equal(errs.length,0,errs.join('\n'));console.log('photo booth: pick, camera, drag/size/mirror, capture 3:4, bond once a day, dex shortcut, no-camera fallback; poke spam protest PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
