// 外出合照濾鏡：畫布逐點算的結果要和瀏覽器 CSS filter 一樣；選濾鏡會記住、拍出來的照片有濾鏡（黑白 → 灰階）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const W=Number(process.env.W||390);
const ctx=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,permissions:['camera'],deviceScaleFactor:process.env.SHOT?2:1});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
// 1) 和 Chromium 的 ctx.filter 比對
const diffs=await p.evaluate(async()=>{const m=await import('./js/photo-filters.js');const out={};
  const W=96,H=64;const base=document.createElement('canvas');base.width=W;base.height=H;const g=base.getContext('2d');
  for(let x=0;x<W;x++)for(let y=0;y<H;y++){g.fillStyle=`hsl(${x/W*360} ${30+y/H*70}% ${15+y/H*70}%)`;g.fillRect(x,y,1,1);}
  for(const f of m.PHOTO_FILTERS){const a=document.createElement('canvas');a.width=W;a.height=H;const ga=a.getContext('2d');ga.filter=m.cssFilter(f);ga.drawImage(base,0,0);
    const ref=ga.getImageData(0,0,W,H).data;const mine=m.applyToPixels(g.getImageData(0,0,W,H).data,f);
    let s=0,mx=0;for(let i=0;i<ref.length;i+=4)for(let c=0;c<3;c++){const d=Math.abs(ref[i+c]-mine[i+c]);s+=d;mx=Math.max(mx,d);}out[f.id]={avg:s/(W*H*3),max:mx};}
  return out;});
for(const[id,d]of Object.entries(diffs))assert(d.avg<1.5&&d.max<12,`${id} ${JSON.stringify(d)}`);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));},key);
if(process.env.THEME)await p.evaluate(t=>localStorage.setItem('siang-collector:theme:v1',t),process.env.THEME);
await p.reload();await p.waitForTimeout(500);if(await p.locator('#intro[open]').count())await p.click('#intro-ok');
await p.locator('#open-center').click();await p.locator('#open-photo').click();await p.locator('.photo-pick-item').first().click();
await p.waitForFunction(()=>document.querySelector('.photo-video').videoWidth>0,null,{timeout:10000});
assert.equal(await p.locator('.photo-filter').count(),7);
assert.equal(await p.locator('.photo-filter[aria-checked="true"]').getAttribute('data-filter'),'none');
// 按鈕不能超出畫面
const rows=await p.locator('.photo-filter').evaluateAll(bs=>bs.map(x=>x.getBoundingClientRect()).map(r=>[r.left,r.right]));
assert(rows.every(([l,r])=>l>=0&&r<=W),JSON.stringify(rows));
await p.locator('.photo-filter[data-filter="sakura"]').click();
assert.match(await p.locator('.photo-fx').evaluate(e=>e.style.filter),/hue-rotate/);
if(process.env.SHOT)await p.locator('#photo-dialog').screenshot({path:process.env.SHOT});
await p.locator('.photo-filter[data-filter="mono"]').click();
assert.equal(await p.evaluate(()=>localStorage.getItem('siang-collector:photo-filter:v1')),'mono');
await p.locator('.photo-shutter').click();await p.locator('.photo-result:not([hidden])').waitFor();
const gray=await p.locator('.photo-result-img').evaluate(async i=>{await i.decode();const c=document.createElement('canvas');c.width=120;c.height=120;const g=c.getContext('2d');g.drawImage(i,0,0,i.naturalWidth,i.naturalHeight*0.8,0,0,120,120);const d=g.getImageData(0,0,120,120).data;let mx=0;for(let k=0;k<d.length;k+=4)mx=Math.max(mx,Math.abs(d[k]-d[k+1]),Math.abs(d[k+1]-d[k+2]));return mx;});
assert(gray<=8,'黑白照片應該是灰階：'+gray);
// 重新打開還記得黑白
await p.locator('.photo-result .photo-close').click();await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro[open]').count())await p.click('#intro-ok');
await p.locator('#open-center').click();await p.locator('#open-photo').click();await p.locator('.photo-pick-item').first().click();
assert.equal(await p.locator('.photo-filter[aria-checked="true"]').getAttribute('data-filter'),'mono');
assert.equal(errs.length,0,errs.join('\n'));console.log('photo filters: canvas matches CSS filter',JSON.stringify(Object.fromEntries(Object.entries(diffs).map(([k,v])=>[k,+v.avg.toFixed(2)]))),'; remembered; mono capture is gray PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
