// 首頁小湘說話的對話框不能被「今天的事」按鈕蓋住，也不能超出螢幕（11/19 湘回報：後排膠卷小湘的話被蓋住）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
for(const [w,h] of [[393,852],[360,740],[430,932]]){
const p=await (await b.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true,reducedMotion:'reduce'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(300);
await p.evaluate(()=>{const k='siang-collector:v1';const s=JSON.parse(localStorage.getItem(k));s.tutorial=null;s.hatched=3;s.dex={'001':{at:'2026-11-10T00:00:00Z'},'009':{at:'2026-11-10T00:00:00Z'},'051':{at:'2026-11-10T00:00:00Z'}};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['001','009']));localStorage.setItem('siang-collector:theme:v1','sakura');});
await p.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent=':root{--safe-top:59px !important;--safe-bottom:34px !important}';document.head.append(st);}));
await p.reload();await p.waitForTimeout(900);
let seen=0;
for(const [no,name] of [['001','原味小湘'],['009','膠卷小湘'],['051','恐龍小湘']]){
  const el=p.locator(`[aria-label^="與${name}"]`).first();
  if(!(await el.count())) continue;
  const bx=await el.boundingBox();const cx=bx.x+bx.width/2,cy=bx.y+bx.height*0.35;
  await p.mouse.move(cx,cy);await p.mouse.down();for(let i=0;i<14;i++){await p.mouse.move(cx+(i%2?40:-40),cy,{steps:4});}await p.mouse.up();await p.waitForTimeout(200);
  const r=await p.evaluate(()=>{const b=document.querySelector('.resident-bubble');if(!b)return null;const x=b.getBoundingClientRect();
    const hit=['today-pill','explore'].map(id=>document.getElementById(id)).filter(e=>e&&!e.hidden).map(e=>e.getBoundingClientRect()).filter(o=>o.width&&o.right>x.left&&o.left<x.right&&o.bottom>x.top&&o.top<x.bottom).length;
    return {top:x.top,left:x.left,right:x.right,hit,pill:0,vw:document.documentElement.clientWidth};});
  if(!r) continue; seen++;
  assert.equal(r.hit,0,`${w}px ${no}: bubble covered by a button (top ${r.top})`);assert(r.left>=0&&r.right<=r.vw,`${w}px ${no}: off screen`);
  await p.waitForTimeout(3300);
}
assert(seen>=1,`${w}px only saw ${seen} bubbles`);assert.deepEqual(errs,[]);await p.context().close();}
console.log('resident bubbles stay visible PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
