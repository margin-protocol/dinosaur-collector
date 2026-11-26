// 新玩家計數（湘 11/26）：全新手機打開遊戲 → 後台 +1（只一次）；已經有存檔的人不補算；測試服不送；審核室「新玩家」卡片顯示數字
const {chromium}=require('playwright'),assert=require('node:assert/strict');const {spawn}=require('node:child_process');
const SHOT=process.env.SHOT;
(async()=>{const api=spawn('node',['server/dev-server.mjs','8798'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,1200));
const API='http://127.0.0.1:8798';
try{
const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const errs=[];const hellos=[];
const ctxFor=async()=>{const c=await b.newContext({viewport:{width:390,height:844},...(SHOT?{deviceScaleFactor:2}:{})});await c.addInitScript(a=>{globalThis.SIANG_API_OVERRIDE=a;},API);
  c.on('request',q=>{if(q.url().endsWith('/hello'))hellos.push({url:q.url(),post:q.postData()});});return c;};
const open=async(c,path='')=>{const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://127.0.0.1:8000/'+path);return p;};
// 1. 全新手機：送一次、只送空的 POST
const c1=await ctxFor();let g=await open(c1);
await g.waitForFunction(()=>localStorage.getItem('siang-collector:hello:v1')==='done',null,{timeout:8000});
assert.equal(hellos.length,1);assert.equal(hellos[0].post,null,'不送任何內容');
await g.reload();await g.waitForTimeout(3500);assert.equal(hellos.length,1,'重新整理不再算');
// 2. 已經在玩的人（本機有存檔、還沒有 hello 記號）：不補算
const c2=await ctxFor();await c2.addInitScript(()=>{if(!localStorage.getItem('siang-collector:v1')&&!sessionStorage.getItem('seeded')){sessionStorage.setItem('seeded','1');localStorage.setItem('siang-collector:v1',JSON.stringify({seenIntro:true,hatched:3,dex:{'001':{at:'2026-11-01T00:00:00Z'}}}));}});
g=await open(c2);await g.waitForTimeout(3500);
assert.equal(await g.evaluate(()=>localStorage.getItem('siang-collector:hello:v1')),'done');assert.equal(hellos.length,1,'舊玩家不補算');
// 3. 測試服：不送
const c3=await ctxFor();g=await open(c3,'?test');await g.waitForTimeout(3500);assert.equal(hellos.length,1,'測試服不算');
// 4. 送不出去：先留著 pending，連上再送
const c4=await ctxFor();await c4.route(API+'/hello',q=>q.abort());g=await open(c4);await g.waitForTimeout(3500);
assert.equal(await g.evaluate(()=>localStorage.getItem('siang-collector:hello:v1')),'pending');
await c4.unroute(API+'/hello');await g.evaluate(()=>dispatchEvent(new Event('online')));await g.waitForFunction(()=>localStorage.getItem('siang-collector:hello:v1')==='done',null,{timeout:8000});
const expected=2;
// 5. 審核室：登入後看得到
const c5=await ctxFor();const r=await open(c5,'review.html');
await r.locator('#rv-claim').click();await r.locator('#rv-backup:not([hidden])').waitFor();await r.locator('#rv-backup-done').click();
await r.click('#tab-setup');await r.locator('#np-body:not([hidden])').waitFor();
assert.equal(await r.textContent('#np-today'),String(expected));assert.equal(await r.textContent('#np-total'),String(expected));
assert.equal(await r.locator('#np-chart .np-col').count(),14);assert.equal(await r.locator('#np-days span').count(),14);
for(const w of [360,390,430]){await r.setViewportSize({width:w,height:900});
  const over=await r.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert(over<=0,`${w} 寬不能左右捲`);
}
// 截圖（給湘看）：用假的 14 天數字
if(SHOT){await r.route(API+'/admin/new-players',q=>{const today=new Date(Date.now()+8*3600e3).toISOString().slice(0,10);const gh=[0,1,0,2,1,0,3,1,0,2,4,1,2,3],cf=[0,0,1,0,2,1,1,3,2,1,2,5,3,4];
  const days=gh.map((n,i)=>({day:new Date(Date.parse(today+'T00:00:00Z')-(13-i)*86400e3).toISOString().slice(0,10),gh:n,cf:cf[i],total:n+cf[i]}));
  q.fulfill({json:{today,since:'2026-11-26',total:days.reduce((n,d)=>n+d.total,0),days},headers:{'Access-Control-Allow-Origin':'*'}});});
  await r.click('#np-refresh');await r.waitForTimeout(300);
  for(const w of [360,430]){await r.setViewportSize({width:w,height:900});await r.locator('#sec-newbies').screenshot({path:`${SHOT}-${w}.png`});}
  await r.unroute(API+'/admin/new-players');}
assert.equal(errs.length,0,errs.join('\n'));
console.log(`new players: fresh phone counted once, old save not counted, ?test skipped, offline retried, review card shows ${expected} PASS`);
await b.close();}finally{api.kill();}})().catch(e=>{console.error(e);process.exit(1)});
