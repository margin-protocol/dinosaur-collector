const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
for(const eggId of (process.env.EGG_IDS || 'ordinary,wish,county').split(',')) for(const width of [360,390,430]){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000');await page.locator('#intro-ok').click();await page.locator('#intro').waitFor({state:'hidden'});await page.locator('#enter-incubator').click();
 const needed=await page.evaluate(async id=>(await import('./js/eggs.js')).EGGS[id].warmthNeeded,eggId);
 for(const [phase,warmth] of [['rest',0],['cracking',Math.round(needed*2/3)],['ready',needed]]){
  await page.evaluate(({warmth,eggId})=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.dex['001']={at:'2026-11-01'};s.hatched=1;s.energy=35;s.egg={id:eggId,warmth,since:'2026-11-16',...(eggId==='county'?{county:'臺中市'}:{})};s.wishEgg={stamps:1,stock:0,days:[]};localStorage.setItem(k,JSON.stringify(s))},{warmth,eggId});await page.reload();
  const images=page.locator('.incubator .egg__layer');await images.evaluateAll(async nodes=>{await Promise.all(nodes.map(i=>i.decode()))});
  assert.equal(await images.count(),3);for(const image of await images.all()){assert.match(await image.getAttribute('src'),new RegExp(`assets/eggs/${eggId}/(shell|glow|cracks)\\.webp$`));assert.deepEqual(await image.evaluate(i=>[i.naturalWidth,i.naturalHeight]),[1024,1024]);}
  assert.equal(await page.locator('.incubator .egg__body').evaluate(el=>getComputedStyle(el).filter),'none');await page.waitForTimeout(350);
  const opacity=await page.locator('.incubator .egg__layer--cracks').evaluate(el=>parseFloat(getComputedStyle(el).opacity));assert(phase==='rest'?opacity===0:opacity>0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`docs/review/${eggId}-art-${phase}-${width}.png`,fullPage:true});
 }
 const result=await page.evaluate(async eggId=>{const images=await Promise.all(['shell','glow','cracks'].map(async name=>{const i=new Image();i.src=`assets/eggs/${eggId}/${name}.webp`;await i.decode();const c=document.createElement('canvas');c.width=c.height=1024;const x=c.getContext('2d');x.drawImage(i,0,0);return x.getImageData(0,0,1024,1024).data}));const count=a=>{let n=0;for(let i=3;i<a.length;i+=4)if(a[i]>32)n++;return n};let escaped=0;for(let i=3;i<images[0].length;i+=4)if(images[1][i]>images[0][i]+1||images[2][i]>images[0][i]+1)escaped++;return{counts:images.map(count),escaped}},eggId);
 assert(result.counts[0]>50000&&result.counts[0]<300000,'shell has transparent margins');assert(result.counts[2]<result.counts[0]*.15,'cracks are a sparse overlay, not a copy of the shell');assert.equal(result.escaped,0,'effects stay within shell silhouette');
 await page.setViewportSize({width,height:612});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.equal(errors.length,0,errors.join('\n'));console.log(eggId+' '+width+'px: native layers, no tint/fallback, crack stages, transparent overlays and layout PASS');await context.close();
}await browser.close()})().catch(error=>{console.error(error);process.exit(1)});
