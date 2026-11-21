// 外出合照臉部特效：畫圖函式（用固定的臉部點位；磨皮不碰頭髮）、分頁與選項、記住設定、MediaPipe 真的載得起來、
// 跑太慢自動關掉＋再試一次、不支援的手機只留濾鏡、拍照有帶特效、按鈕不超出畫面。
// 有真人臉的影片可以用 FACE_Y4M=xxx.y4m 再多驗一次「真的追到臉、存下的照片有頭飾」。
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const fixture=JSON.parse(fs.readFileSync(__dirname+'/fixtures/face-landmarks.json','utf8'));
(async()=>{const W=Number(process.env.W||390);
const args=['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream',...(process.env.FACE_Y4M?['--use-file-for-fake-video-capture='+process.env.FACE_Y4M]:[])];
const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args});
const key='siang-collector:v1';
async function setup(ctxOpts={},init){const ctx=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,permissions:['camera'],deviceScaleFactor:process.env.SHOT?2:1,...ctxOpts});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{globalThis.SIANG_FACE_FX_SLOW_MS=globalThis.SIANG_FACE_FX_SLOW_MS||60000;});if(init)await p.addInitScript(init);
  await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)||'{}').seenIntro,key);
  await p.evaluate(([k,t])=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));if(t)localStorage.setItem('siang-collector:theme:v1',t);},[key,process.env.THEME||'']);
  await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro[open]').count())await p.click('#intro-ok');
  return {p,errs,ctx};}
async function openCam(p){await p.locator('#open-center').click();await p.locator('#open-photo').click();await p.locator('.photo-pick-item').first().click();
  await p.waitForFunction(()=>document.querySelector('.photo-video').videoWidth>0,null,{timeout:10000});}
const fxState=p=>p.locator('#photo-dialog').getAttribute('data-fx');

// 1) 畫圖函式：同一組點位，口紅塗在嘴唇、頭飾在頭頂上方、磨皮讓臉上的雜點變少、沒選特效什麼都不畫
{const {p,errs,ctx}=await setup();
const r=await p.evaluate(async fx=>{const m=await import('./js/face-fx.js');
  const W=600,H=800;const src=document.createElement('canvas');src.width=W;src.height=H;const sg=src.getContext('2d');
  // 有雜點的灰底（模擬皮膚紋理）
  const id=sg.createImageData(W,H);let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let i=0;i<id.data.length;i+=4){const v=150+rnd()*60;id.data[i]=v+20;id.data[i+1]=v;id.data[i+2]=v-10;id.data[i+3]=255;}sg.putImageData(id,0,0);
  const lm=fx.points.map(([x,y])=>({x,y,z:0}));const map=m.coverMap(W,H,W,H);const pts=m.project(lm,map);
  const draw=(opts)=>{const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.drawImage(src,0,0);const n=m.drawFaceFx(g,src,[lm],m.normalizeFx(opts),map);return {n,d:g.getImageData(0,0,W,H).data};};
  const at=(d,p)=>{const i=(Math.round(p.y)*W+Math.round(p.x))*4;return [d[i],d[i+1],d[i+2]];};
  const base=draw({}).d;
  const cheek=pts[50];
  const pose=m.headPose(pts);
  const crown=draw({crown:'tiara'});
  let changedAbove=0;for(let y=Math.max(0,Math.round(pose.crown.y-pose.faceW*0.5));y<pose.crown.y+pose.faceW*0.05;y+=2)for(let x=Math.round(pose.crown.x-pose.faceW*0.3);x<pose.crown.x+pose.faceW*0.3;x+=2){const i=(y*W+x)*4;if(Math.abs(crown.d[i]-base[i])+Math.abs(crown.d[i+2]-base[i+2])>40)changedAbove++;}
  let changedChin=0;for(let y=Math.round(pts[152].y)+10;y<Math.min(H,pts[152].y+60);y+=2){const i=(y*W+Math.round(pts[152].x))*4;if(crown.d[i]!==base[i])changedChin++;}
  const sm=draw({smooth:100}).d;const vari=(d)=>{const c=pts[50];let s=0,s2=0,n=0;for(let y=c.y-12;y<c.y+12;y++)for(let x=c.x-12;x<c.x+12;x++){const i=(Math.round(y)*W+Math.round(x))*4;s+=d[i];s2+=d[i]*d[i];n++;}return s2/n-(s/n)**2;};
  // 沒有分界線：從臉中間往耳朵方向，磨皮的改變量要慢慢變小，不能突然斷掉（11/21 iPhone 實測有一圈硬邊）
  const prof=[];{const y=Math.round(pts[50].y),xs=Math.round((pts[1].x+pts[50].x)/2),xe=Math.round(pts[234].x-pose.faceW*0.08);
    for(let x=xs;x>xe;x-=3){let s=0,n=0;for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const i=((y+dy)*W+x+dx)*4;s+=Math.abs(sm[i]-base[i]);n++;}prof.push(s/n);}}
  const peak=Math.max(...prof);let jump=0;for(let k=1;k<prof.length;k++)jump=Math.max(jump,Math.abs(prof[k]-prof[k-1]));
  // 頭髮：在額頭和臉頰畫幾條深色髮絲，磨皮 100 時髮絲不能被抹掉，旁邊的皮膚也不能被髮色暈黑（11/21 湘實測）
  const hs=document.createElement('canvas');hs.width=W;hs.height=H;const hg=hs.getContext('2d');hg.drawImage(src,0,0);
  hg.strokeStyle='rgb(38,28,26)';hg.lineWidth=4;const strands=[[pts[10],pts[50]],[pts[109],pts[205]],[pts[338],pts[425]]];
  for(const[a,b]of strands){hg.beginPath();hg.moveTo(a.x,a.y);hg.lineTo(b.x,b.y);hg.stroke();}
  const hairBase=hg.getImageData(0,0,W,H).data;const hc=document.createElement('canvas');hc.width=W;hc.height=H;const hcg=hc.getContext('2d');hcg.drawImage(hs,0,0);
  m.drawFaceFx(hcg,hs,[lm],m.normalizeFx({smooth:100}),map);const hairSm=hcg.getImageData(0,0,W,H).data;
  let strandMax=0,nearDark=0,nearN=0;
  for(const[a,b]of strands){const len=Math.hypot(b.x-a.x,b.y-a.y),nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;
    for(let t=0.2;t<=0.8;t+=0.02){const cx=a.x+(b.x-a.x)*t,cy=a.y+(b.y-a.y)*t;const i=(Math.round(cy)*W+Math.round(cx))*4;
      strandMax=Math.max(strandMax,Math.abs(hairSm[i]-hairBase[i])+Math.abs(hairSm[i+1]-hairBase[i+1])+Math.abs(hairSm[i+2]-hairBase[i+2]));
      for(const o of[-7,-6,6,7]){const j=(Math.round(cy+ny*o)*W+Math.round(cx+nx*o))*4;nearDark+=(hairBase[j]+hairBase[j+1]+hairBase[j+2])-(hairSm[j]+hairSm[j+1]+hairSm[j+2]);nearN++;}}}
  const hair={strandMax,nearDark:nearDark/nearN/3};
  // 歪頭：把點位轉 20 度，算出來的角度也要是 20 度
  const rot=20*Math.PI/180,cx=0.5,cy=0.5;const turned=lm.map(q=>({x:cx+(q.x-cx)*Math.cos(rot)-(q.y-cy)*Math.sin(rot)*H/W,y:cy+((q.x-cx)*Math.sin(rot)*W/H+(q.y-cy)*Math.cos(rot))}));
  const angle=m.headPose(m.project(turned,map)).angle*180/Math.PI;
  return {hair,peak,jump,tail:prof[prof.length-1],none:draw({}).n,changedAbove,changedChin,varBase:vari(base),varSm:vari(sm),angle,base0:pose.angle*180/Math.PI,
    norm:m.normalizeFx({smooth:'250',lip:'xx',crown:'dino',lipAmt:-3}),active:[m.fxActive(m.normalizeFx({})),m.fxActive(m.normalizeFx({crown:'egg'}))]};
},fixture);
assert.equal(r.none,0,'沒選特效不畫');
assert(r.hair.strandMax<30,'髮絲沒被抹掉 '+JSON.stringify(r.hair));assert(r.hair.nearDark<6,'髮絲旁的皮膚沒被暈黑 '+JSON.stringify(r.hair));
assert(r.changedAbove>150,'頭頂上方有頭飾 '+r.changedAbove);assert.equal(r.changedChin,0,'下巴底下沒有頭飾');
assert(r.jump<r.peak*0.25&&r.tail<r.peak*0.15,'磨皮邊緣漸層 '+JSON.stringify([r.peak,r.jump,r.tail]));
assert(r.varSm<r.varBase*0.6,'磨皮讓雜點變少 '+JSON.stringify([r.varBase,r.varSm]));
assert(Math.abs(r.angle-r.base0-20)<2,'歪頭角度 '+JSON.stringify([r.base0,r.angle]));
assert.deepEqual(r.norm,{smooth:100,crown:'dino'});assert.deepEqual(r.active,[false,true]);
// 2) 介面：三個分頁、口紅五色、頭飾六款，都在畫面內；選了會記住
await openCam(p);
assert.equal(await p.locator('.photo-tab').count(),3);assert.equal(await p.locator('.photo-panel[data-panel="filter"]').isVisible(),true);
assert.equal(await fxState(p),'idle','沒選特效不載入');
await p.locator('.photo-tab[data-tab="beauty"]').click();
assert.equal(await p.locator('.photo-panel[data-panel="filter"]').isVisible(),false);
assert.equal(await p.locator('.photo-lip').count(),0,'口紅拿掉了');
await p.locator('.photo-smooth').fill('60');
await p.waitForFunction(()=>['loading','ready'].includes(document.querySelector('#photo-dialog').dataset.fx));
const inView=async sel=>{const rs=await p.locator(sel).evaluateAll(bs=>bs.map(x=>x.getBoundingClientRect()).map(r=>[r.left,r.right]));assert(rs.every(([l,r])=>l>=0&&r<=W),sel+JSON.stringify(rs));};
await inView('.photo-tab');await inView('.photo-fx-row');
if(process.env.SHOT)await p.locator('#photo-dialog').screenshot({path:process.env.SHOT.replace('.png','-beauty.png')});
await p.locator('.photo-tab[data-tab="crown"]').click();assert.equal(await p.locator('.photo-crown').count(),6);await inView('.photo-crown');
await p.locator('.photo-crown[data-crown="lantern"]').click();
assert.equal(await p.locator('.photo-crown[aria-checked="true"]').getAttribute('data-crown'),'lantern');
const names=await p.locator('.photo-crown .photo-chip__name').evaluateAll(es=>es.map(e=>e.scrollWidth<=e.parentElement.clientWidth+1));assert(names.every(Boolean),'頭飾名字沒有被切掉');
// 3) MediaPipe 真的載入（假鏡頭沒有臉 → 提示把臉放進畫面）
await p.waitForFunction(()=>document.querySelector('#photo-dialog').dataset.fx==='ready',null,{timeout:60000});
if(!process.env.FACE_Y4M){await p.waitForFunction(()=>/把臉放進畫面/.test(document.querySelector('.photo-fx-note').textContent),null,{timeout:8000});}
else{await p.waitForFunction(()=>document.querySelector('.photo-fx-note__text').textContent==='',null,{timeout:8000});}
if(process.env.SHOT)await p.locator('#photo-dialog').screenshot({path:process.env.SHOT});
const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:face-fx:v1')));
assert.deepEqual(saved,{smooth:60,crown:'lantern'});
// 4) 拍照：有特效時照片照樣 3:4，拍完關鏡頭
await p.locator('.photo-shutter').click();await p.locator('.photo-result:not([hidden])').waitFor();
const res=await p.locator('.photo-result-img').evaluate(i=>new Promise(r=>{const ok=()=>r({w:i.naturalWidth,h:i.naturalHeight});i.complete?ok():i.onload=ok;}));
assert(res.w>0&&Math.abs(res.w/res.h-0.75)<0.01,JSON.stringify(res));
if(process.env.FACE_Y4M){
  // 真的臉：再拍一張不戴頭飾的比對，戴了頭飾的照片在頭頂附近要不一樣
  const grab=async()=>p.locator('.photo-result-img').evaluate(i=>{const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const g=c.getContext('2d');g.drawImage(i,0,0);return Array.from(g.getImageData(0,0,c.width,Math.round(c.height*0.4)).data.filter((_,k)=>k%16===0));});
  const withFx=await grab();
  await p.locator('.photo-again').click();await p.locator('.photo-tab[data-tab="crown"]').click();await p.locator('.photo-crown[data-crown="none"]').click();
  await p.locator('.photo-tab[data-tab="beauty"]').click();await p.locator('.photo-smooth').fill('0');
  await p.waitForFunction(()=>document.querySelector('.photo-video').videoWidth>0);await p.waitForTimeout(500);
  await p.locator('.photo-shutter').click();await p.locator('.photo-result:not([hidden])').waitFor();await p.waitForTimeout(200);
  const plain=await grab();let diff=0;for(let k=0;k<plain.length;k++)if(Math.abs(plain[k]-withFx[k])>30)diff++;
  assert(diff>200,'照片有帶特效 '+diff);
}
assert.equal(errs.length,0,errs.join('\n'));await ctx.close();}

// 5) 跑太慢 → 自動關掉、記住、可以再試一次
{const {p,errs,ctx}=await setup({},()=>{globalThis.SIANG_FACE_FX_SLOW_MS=0.0001;});
await p.evaluate(()=>localStorage.setItem('siang-collector:face-fx:v1',JSON.stringify({smooth:40,crown:'dino'})));
await p.reload();await p.waitForTimeout(400);
await openCam(p);
await p.waitForFunction(()=>document.querySelector('#photo-dialog').dataset.fx==='slow',null,{timeout:60000});
assert.match(await p.locator('.photo-fx-note').textContent(),/有點吃力.*濾鏡還是可以用/);
assert.equal(await p.locator('.photo-fx-retry').isVisible(),true);
assert(await p.evaluate(()=>!!localStorage.getItem('siang-collector:face-fx-slow:v1')),'記住這支手機跑不動');
assert.equal(await p.locator('.photo-face').evaluate(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=3;i<d.length;i+=4)if(d[i])return false;return true;}),true,'關掉後畫布清空');
// 濾鏡照樣能用、照樣能拍
await p.locator('.photo-tab[data-tab="filter"]').click();await p.locator('.photo-filter[data-filter="warm"]').click();
await p.locator('.photo-shutter').click();await p.locator('.photo-result:not([hidden])').waitFor();
await p.locator('.photo-result .photo-close').click();
// 重開：直接是關掉的狀態，不再下載
await openCam(p);assert.equal(await fxState(p),'slow');
await p.locator('.photo-tab[data-tab="crown"]').click();
await p.evaluate(()=>{globalThis.SIANG_FACE_FX_SLOW_MS=60000;});
await p.locator('.photo-fx-retry').click();
await p.waitForFunction(()=>document.querySelector('#photo-dialog').dataset.fx==='ready',null,{timeout:60000});
assert(await p.evaluate(()=>!localStorage.getItem('siang-collector:face-fx-slow:v1')),'再試一次會清掉記號');
assert.equal(errs.length,0,errs.join('\n'));await ctx.close();}

// 6) 不支援的瀏覽器（沒有 WebAssembly SIMD）：只顯示說明，不載入
{const {p,errs,ctx}=await setup({},()=>{WebAssembly.validate=()=>false;});
await openCam(p);await p.locator('.photo-tab[data-tab="crown"]').click();await p.locator('.photo-crown[data-crown="egg"]').click();
assert.equal(await fxState(p),'old');assert.match(await p.locator('.photo-fx-note').textContent(),/跑不動臉部特效/);
assert.equal(await p.locator('.photo-fx-retry').isVisible(),false);
await p.locator('.photo-shutter').click();await p.locator('.photo-result:not([hidden])').waitFor();
assert.equal(errs.length,0,errs.join('\n'));await ctx.close();}

console.log('face fx: draw (crown/smooth skips hair/tilt), no lipstick, tabs & chips in view, settings saved, MediaPipe loads, capture 3:4, slow auto-off + retry, unsupported keeps filters PASS');
await b.close();})().catch(e=>{console.error(e);process.exit(1)});
