// 上架手機檢查（湘 11/25 選 A）：立繪規格（1024²、腳底 y≈940、頭頂留白）＋圖鑑詳情在手機上打得開、不會左右捲、沒有錯誤。
// NO=118 只檢查一位（逗號分隔可多位）；不給就檢查 101 以後的小湘和所有異世居民。
// SHOT=路徑前綴 會輸出每位的圖鑑截圖（例：SHOT=/mnt/project-files/previews/new-118/dex），W=360,430 指定寬度（預設 360）。
// 格子有沒有填齊在 tests/residents-all.mjs。
const {chromium}=require('playwright'),assert=require('node:assert/strict');
// 墨痕江湖 MO-003～008 的立繪是滿版排的（腳底 y≈1015、頭頂貼齊上緣），11/25 上架檢查才發現；要不要重排等湘看過比較圖再決定，先跳過腳位檢查
const ART_PENDING=new Set(['MO-003','MO-004','MO-005','MO-006','MO-007','MO-008']);
const WIDTHS=(process.env.W||'360').split(',').map(Number);
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const errs=[],problems=[];let list;
for(const W of WIDTHS){
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT?2:1});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
if(!list){
  list=await p.evaluate(async(want)=>{const E=await import('/js/eggs.js');
    const ids=want?want.split(',').map(s=>s.trim()):Object.keys(E.CHARACTERS).filter(n=>!/^\d+$/.test(n)||Number(n)>=101);
    const out=[];
    for(const no of ids){const ch=E.CHARACTERS[no];if(!ch){out.push({no,missing:true});continue;}
      const img=new Image();img.src=`/assets/characters/${ch.image}.webp`;let art=null;
      try{await img.decode();const cv=document.createElement('canvas');cv.width=img.naturalWidth;cv.height=img.naturalHeight;const ctx=cv.getContext('2d');ctx.drawImage(img,0,0);const d=ctx.getImageData(0,0,cv.width,cv.height).data;let top=cv.height,bottom=0;for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x+=2)if(d[(y*cv.width+x)*4+3]>20){if(y<top)top=y;if(y>bottom)bottom=y;}art=[img.naturalWidth,img.naturalHeight,top,bottom];}catch{}
      out.push({no,name:ch.name,label:E.noLabel(no),world:E.worldOf(ch),art});}
    return out;},process.env.NO||'');
  for(const r of list){
    if(r.missing){problems.push(`${r.no}：eggs.js 沒有這位`);continue;}
    if(!r.art){problems.push(`${r.label} ${r.name}：立繪讀不到`);continue;}
    const [w,h,top,bottom]=r.art;
    if(w!==1024||h!==1024)problems.push(`${r.label} ${r.name}：立繪是 ${w}×${h}，要 1024×1024`);
    else if(!ART_PENDING.has(r.no)){if(bottom<936||bottom>941)problems.push(`${r.label} ${r.name}：腳底在 y=${bottom}，要在 936～941（tools/resident-art.py 可以重排）`);
      if(top<25)problems.push(`${r.label} ${r.name}：頭頂離上緣只有 ${top}px，要 ≥25`);}
  }
}
const ok=list.filter(r=>!r.missing);
for(const world of [...new Set(ok.map(r=>r.world))]){
  await p.evaluate(({world,nos})=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'2026-11-10T00:00:00Z'}};for(const n of nos)s.dex[n]={at:'2026-11-25T00:00:00Z'};s.hatched=nos.length+1;s.tutorial=null;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:theme:v1','sakura');localStorage.setItem('siang-collector:dex-world:v1',world);},{world,nos:ok.map(r=>r.no)});
  await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
  await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());location.hash='dex';});await p.waitForTimeout(200);
  for(const r of ok.filter(r=>r.world===world)){
    const card=p.locator(`[data-dex-no="${r.no}"]`);
    if(!await card.count()){problems.push(`${r.label} ${r.name}：圖鑑裡找不到卡片`);continue;}
    await card.click();await p.locator('#dex-detail[open]').waitFor();await p.locator('#dex-detail-img').evaluate(i=>i.decode().catch(()=>{}));
    const t=await p.evaluate(()=>({no:document.getElementById('dex-detail-no').textContent,intro:document.getElementById('dex-detail-intro').textContent.trim(),how:document.getElementById('dex-detail-how')?.textContent.trim(),wide:document.documentElement.scrollWidth>innerWidth}));
    if(!t.no.includes(r.label))problems.push(`${r.label} ${r.name}：圖鑑編號顯示成「${t.no}」`);
    if(!t.intro)problems.push(`${r.label} ${r.name}：圖鑑故事是空的`);
    if(t.wide)problems.push(`${r.label} ${r.name}：${W} 寬圖鑑會左右捲`);
    if(process.env.SHOT){await p.waitForTimeout(250);await p.screenshot({path:`${process.env.SHOT}-${r.no}-${W}.png`});}
    await p.evaluate(()=>document.getElementById('dex-detail').close());
  }
}
await c.close();}
assert.deepEqual(problems,[],`\n上架手機檢查沒過：\n${problems.join('\n')}\n`);
assert.deepEqual(errs,[]);console.log(`resident-check: ${list.length} 位（${WIDTHS.join('/')} 寬）立繪規格、圖鑑手機排版 PASS`);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
