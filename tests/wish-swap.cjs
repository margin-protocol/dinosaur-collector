// 換一個今日願望：每天一次、不能換已完成的、換成同類但今天沒有的、早上以外不會換到早晨天空；隔天可以再換
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{const P=await import('/js/progression.js'),W=await import('/js/wishes.js');
 const mk=()=>{const s={dex:{'001':{at:'x'}},bonus:{total:{}}};s.wishes={date:'2026-11-19',done:['bright'],stage:'young',ids:['morning','act:pet','theme:3'],base:{}};return s;};
 const s=mk();const afternoon=new Date('2026-11-19T14:00:00');
 const doneTry=P.swapTodayWish(s,1==0?0:0,afternoon); // index 0 = morning, not done
 const ids=[...s.wishes.ids];const again=P.swapTodayWish(s,1,afternoon);
 const s2=mk();s2.wishes.done=['act:pet'];const notDone=P.swapTodayWish(s2,1,afternoon);
 const fams=[];for(let i=0;i<30;i++){const x=mk();x.wishes.ids=['color:none'.replace('color:none','red'),'quiz:1','theme:'+i];const res=P.swapTodayWish(x,2,afternoon);fams.push(res.to);}
 const kinds=[];for(let i=0;i<20;i++){const x=mk();x.wishes.ids=['red','act:pet','theme:'+i];const res=P.swapTodayWish(x,0,new Date('2026-11-19T21:00:00'));kinds.push(W.wishById(res.to).kind);}
 return {first:doneTry,ids,again,notDone:notDone.ok,themes:fams.every(id=>/^theme:/.test(id)),noMorning:!kinds.includes('morning'),photo:kinds.every(k=>['color','duo','rainbow','bright','dark','night'].includes(k))};});
assert.equal(r.first.ok,true);assert.equal(r.first.from,'morning');assert.notEqual(r.ids[0],'morning');
assert.equal(r.again.ok,false,'一天只能換一次');assert.equal(r.notDone,false,'完成的不能換');assert(r.themes);assert(r.noMorning&&r.photo);
// 畫面：按鈕 → 換好 → 按鈕變成已換過
await p.click('#intro-ok');
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>location.hash='wish');await p.waitForTimeout(400);
const before=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')).wishes.ids);
const btn=p.locator('.mission:not([hidden]) .mission-swap');await btn.waitFor();assert.match(await btn.textContent(),/還能換 1 次/);
await btn.click();await p.waitForTimeout(500);
const after=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')).wishes);
assert.equal(after.swapped,true);assert.equal(before.filter((id,i)=>id!==after.ids[i]).length,1,'只換了一個');
assert(await p.locator('.mission:not([hidden]) .mission-swap').isDisabled());assert.match(await p.locator('.mission:not([hidden]) .mission-swap').textContent(),/已經換過/);
assert.equal(errs.length,0,errs.join('\n'));console.log('wish swap: once a day, not done ones, same family, no out-of-window, UI button PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
