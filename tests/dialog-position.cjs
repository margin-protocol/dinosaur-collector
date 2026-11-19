// 所有彈窗打開時都要固定在螢幕上（position: fixed），頁面捲到下面時才不會跑出螢幕外
// 11/19 湘回報：培育室捲到下面再破殼，「孵化結果」卡片上半截跑到螢幕外
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await (await b.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,reducedMotion:'reduce'})).newPage();
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(300);
const bad=await p.evaluate(()=>[...document.querySelectorAll('dialog')].map(d=>{try{d.showModal()}catch{};const pos=getComputedStyle(d).position;d.close();return [d.id||d.className,pos];}).filter(x=>x[1]!=='fixed'));
assert.deepEqual(bad,[]);
await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(400);
await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await p.waitForTimeout(200);
const box=await p.evaluate(()=>{const r=document.getElementById('reveal');r.showModal();const b=r.getBoundingClientRect();r.close();return {top:b.top,bottom:b.bottom,scroll:scrollY};});
assert(box.scroll>0,'page should be scrolled');assert(box.top>=0&&box.bottom<=852,JSON.stringify(box));
console.log('dialog position ok');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
