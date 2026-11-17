// Decoded large portraits must not become the intrinsic width of the native travel dialog.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']});
 fs.mkdirSync('docs/review/travel-album-fix',{recursive:true});
 for(const width of [360,390,430]){
  const c=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();await p.locator('#intro').waitFor({state:'hidden'});
  const seed=async count=>p.evaluate(count=>{
   const key='siang-collector:v1',s=JSON.parse(localStorage.getItem(key));
   s.dex=Object.fromEntries(['001','002','003','037'].map(no=>[no,{at:'2026-11-17'}]));s.hatched=4;s.tutorial=null;
   s.errands.album=Array.from({length:count},(_,i)=>({id:`trip-${i}`,place:['market','park','conv','beach','mountain','faraway'][i%6],nos:i%3===0?['002','003']:i%3===1?['001']:['037','001'],at:new Date().toISOString(),line:'一起出門的旅行紀念。',gains:['+30 能量'],cards:[],story:i%2?null:{id:'weather',title:'追著天氣跑',text:'一路看雲，也記得等對方一起走。'}}));
   localStorage.setItem(key,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1','[]');localStorage.setItem('siang-collector:theme:v1','sakura');
  },count);
  async function bounds(dialog){
   const size=await p.locator(dialog).evaluate(e=>{
    const r=e.getBoundingClientRect();return {left:r.left,right:r.right,width:e.clientWidth,scroll:e.scrollWidth,window:innerWidth};
   });
   assert(size.left>=-1&&size.right<=size.window+1,`${dialog}: stays on screen ${JSON.stringify(size)}`);
   assert(size.scroll<=size.width+1,`${dialog}: no sideways scroll ${JSON.stringify(size)}`);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   for(const card of await p.locator(`${dialog} .trip-card`).all()){
    const r=await card.boundingBox();assert(r.width>0&&r.width<=size.width,`bounded photo ${JSON.stringify(r)}`);
    assert(Math.abs(r.width/r.height-4/3)<.03,'keeps 4:3 photo ratio');
   }
  }
  for(const count of [1,40]){
   await seed(count);await p.reload();
   await p.locator('#open-center').click();await p.locator('#open-errands').click();
   await p.locator('#errand-album').evaluate(e=>Promise.all([...e.querySelectorAll('img')].map(i=>i.decode().catch(()=>{}))));
   const save=await p.evaluate(()=>localStorage.getItem('siang-collector:v1'));
   await bounds('#errand-dialog');assert.equal(await p.locator('#errand-album .trip-card-btn').count(),count);
   const first=await p.locator('#errand-album .trip-card').first().boundingBox();assert(first.width<200,'album photo is a thumbnail, not a source-size portrait');
   await p.locator('#errand-album .trip-card-btn').first().scrollIntoViewIfNeeded();
   if(count===1) await p.screenshot({path:`docs/review/travel-album-fix/album-${width}.png`});
   // Replay the last photo too, after scrolling through a full 40-entry album.
   await p.locator('#errand-album .trip-card-btn').last().click();await p.locator('#errand-result[open]').waitFor();
   await p.locator('#errand-result-card').evaluate(e=>Promise.all([...e.querySelectorAll('img')].map(i=>i.decode().catch(()=>{}))));
   await bounds('#errand-result');assert.equal(await p.locator('#errand-result-ok').textContent(),'關閉');
   if(count===1)await p.screenshot({path:`docs/review/travel-album-fix/result-${width}.png`});
   await p.locator('#errand-result-ok').click();assert(await p.locator('#errand-dialog').isVisible());
   assert.equal(await p.evaluate(()=>localStorage.getItem('siang-collector:v1')),save,'replaying does not reissue rewards or change progress');
   await p.locator('#close-errands').click();
  }
  await p.setViewportSize({width,height:612});
  await p.evaluate(()=>{document.documentElement.style.setProperty('--safe-top','47px');document.documentElement.style.setProperty('--safe-bottom','34px')});
  await p.locator('#home-errand').click();await bounds('#errand-dialog');
  await p.locator('#errand-album .trip-card-btn').last().click();await bounds('#errand-result');await p.locator('#errand-result-ok').click();
  await p.locator('#close-errands').click();assert(await p.locator('#open-center').isVisible());
  assert.deepEqual(errors,[]);console.log(`${width}px: 1/40 album entries, decoded 1024/1254px portraits, result replay, close controls, short safe-area layout and unchanged progress PASS`);
  await c.close();
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
