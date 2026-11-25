// 記憶檔案縮圖（11/25）：縮圖不放存檔、舊存檔自動搬家、搬完照樣看得到、200 張照片存檔也很小、存不進去會提醒
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(400);
// 一張真的小 JPEG 當縮圖，假裝 200 份舊記憶都帶著 ~12KB 的 base64 縮圖
const jpg=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=220;const x=c.getContext('2d');for(let i=0;i<400;i++){x.fillStyle=`hsl(${i*37%360} 70% ${30+i%50}%)`;x.fillRect(Math.random()*220,Math.random()*220,22,22);}return c.toDataURL('image/jpeg',.9);});
assert.ok(jpg.length>8000,'縮圖夠大 '+jpg.length);
await p.evaluate(([k,jpg])=>{const s=JSON.parse(localStorage.getItem(k));s.tutorial=null;s.dex={'001':{at:'2026-11-10T00:00:00Z'},'014':{at:'2026-11-10T00:00:00Z'}};
  s.memories=Array.from({length:200},(_,i)=>({id:`p-${i}`,kind:'postcard',title:'照片 '+i,text:'',note:'',at:new Date(Date.UTC(2026,10,1)+i*60e3).toISOString(),thumb:jpg,photo:`postcards/${i}.jpg`,postcard:String(i)}));
  s.memories.push({id:'d-ABCDEF',kind:'date',title:'約會',note:'',at:'2026-11-20T00:00:00Z',character:'014'});
  s.missions={list:[],status:{},pending:{snack:{sid:'abc123',thumb:jpg,at:'2026-11-24T00:00:00Z'}},notes:{}};
  localStorage.setItem(k,JSON.stringify(s));},[key,jpg]);
const before=(await p.evaluate(k=>localStorage.getItem(k).length,key));assert.ok(before>1.9e6,'舊存檔超過備份上限 '+before);
await p.reload();
await p.waitForFunction(k=>!JSON.parse(localStorage.getItem(k)).memories.some(m=>m.thumb),key,{timeout:15000});
const s=await save();const after=JSON.stringify(s).length;
assert.equal(s.memories.length,201,'記憶一份都沒少');assert.equal(s.missions.pending.snack.thumb,undefined,'委託縮圖也搬走');assert.equal(s.missions.pending.snack.sid,'abc123');
assert.ok(after<200e3,`搬完存檔變小：${before} → ${after}`);
const stored=await p.evaluate(()=>import('/js/thumbs.js').then(async m=>[await m.getThumb('postcards/0.jpg'),await m.getThumb('postcards/199.jpg'),await m.getThumb('submissions/snack/abc123.jpg')]));
assert.deepEqual(stored,[jpg,jpg,jpg],'縮圖在倉庫裡');
// 搬家只做一次，重開不會出錯
await p.reload();await p.waitForTimeout(800);assert.equal((await save()).memories.length,201);
// 記憶檔案照樣看得到縮圖；約會紀念用角色立繪
await p.click('#open-center');await p.click('#open-memories');
await p.waitForFunction(()=>[...document.querySelectorAll('#memories-grid .memory--postcard img')].slice(0,5).every(i=>i.src.startsWith('data:image/jpeg')));
assert.match(await p.getAttribute('#memories-grid .memory--date img','src'),/014/);
await p.locator('#memories-grid .memory--postcard').first().click();await p.locator('#memory-view[open]').waitFor();
await p.waitForFunction(()=>document.querySelector('#memory-view-img').src.startsWith('data:image/jpeg'));
await p.click('#close-memory-view');await p.click('#close-memories');

// 換手機還原（倉庫是空的）：從雲端抓原圖重做縮圖、收回倉庫；同一張只抓一次
const re=await p.evaluate(async jpg=>{const m=await import('/js/thumbs.js');const bytes=Uint8Array.from(atob(jpg.split(',')[1]),ch=>ch.charCodeAt(0));let calls=0;
  const cloud={getBytes:async path=>{calls++;return path==='postcards/restore.jpg'?bytes:null;}};const img=new Image();const img2=new Image();
  const [how,how2]=await Promise.all([m.showThumb(img,{key:'postcards/restore.jpg',cloud}),m.showThumb(img2,{key:'postcards/restore.jpg',cloud})]);
  let fb=false;const miss=await m.showThumb(new Image(),{key:'postcards/404.jpg',cloud,fallback:()=>{fb=true;}});
  return {how,how2,calls,src:img.src.slice(0,23),again:(await m.getThumb('postcards/restore.jpg')||'').slice(0,23),miss,fb};},jpg);
assert.deepEqual(re,{how:'cloud',how2:'cloud',calls:2,src:'data:image/jpeg;base64,',again:'data:image/jpeg;base64,',miss:'fallback',fb:true},JSON.stringify(re));
// 存不進去：要跳提醒；空間回來後再存一次，提醒自己收起來
assert.equal(await p.isVisible('#save-warning'),false);
await p.evaluate(()=>{const real=Storage.prototype.setItem;window.__realSet=real;Storage.prototype.setItem=function(k,v){if(k==='siang-collector:v1'){const e=new Error('QuotaExceededError');e.name='QuotaExceededError';throw e;}return real.call(this,k,v);};});
await p.evaluate(()=>import('/js/state.js').then(m=>m.updateState(s=>{s.energy=(s.energy||0)+1;})));
await p.locator('#save-warning').waitFor({state:'visible'});assert.match(await p.textContent('#save-warning'),/儲存空間滿了/);
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT});
await p.evaluate(()=>{Storage.prototype.setItem=window.__realSet;});
await p.evaluate(()=>import('/js/state.js').then(m=>m.updateState(s=>{s.energy=(s.energy||0)+1;})));
await p.locator('#save-warning').waitFor({state:'hidden'});
assert.deepEqual(errs,[]);
console.log(`photo-thumbs: 200 舊縮圖搬進倉庫（${before} → ${after} 字）、記憶照樣顯示、存不進去會提醒、恢復後收起 PASS`);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
