// 料理小書：記錄每道做過幾次、第一次的日期、誰吃過；分類分頁、一頁 6 道、舊存檔至少算 1 次；手機不爆版
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const key='siang-collector:v1';
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT_DIR?2:1});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();
const r=await p.evaluate(async()=>{
  const k=await import('/js/kitchen.js');
  // 舊存檔：known 有、made 沒有 → 至少 1 次
  const old={dex:{'001':{at:'x'}},kitchen:{ingredients:{milk:5,strawberry:5,caramel:2},known:{'milk+strawberry':'2026-11-20T01:00:00.000Z'},meals:{}}};
  k.ensureKitchen(old);const before=old.kitchen.made['milk+strawberry'];
  k.cook(old,['milk','strawberry']);k.cook(old,['strawberry','milk']);k.cook(old,['caramel','milk'],new Date('2026-11-21T02:00:00Z'));
  k.feed(old,'001','milk+strawberry','2026-11-21');
  k.ensureKitchen(old); // 重新整理後不能掉
  const book=k.cookbook(old);
  return {before,made:old.kitchen.made,book:book.map(e=>[e.dish.id,e.no,e.times,e.kind,e.eaters.map(x=>x.no).join(),e.left])};
});
assert.equal(r.before,1);
assert.deepEqual(r.made,{'milk+strawberry':3,'caramel+milk':1});
assert.deepEqual(r.book,[['caramel+milk',2,1,'home','',1],['milk+strawberry',1,3,'recipe','001',1]],'newest first, counts, eaters');
// UI：13 道 → 3 頁（全部），黑暗分頁
await p.evaluate(([k,theme])=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=5;for(const n of ['001','002','003','005','087'])s.dex[n]={at:'x'};s.guide={seen:['battle','errand'],unlocked:['errand','wheel','battle','archive']};
  const ids=['milk+strawberry','caramel+milk+pudding','mushroom+strawberry','glitch+lightning+star','caramel+milk','milk+pudding','caramel+pudding','caramel+strawberry','pudding+strawberry','milk+moon','cloud+milk','cloud+moon','lightning+moon'];
  s.kitchen={ingredients:{milk:3},known:Object.fromEntries(ids.map((id,i)=>[id,new Date(Date.UTC(2026,10,10+i)).toISOString()])),made:{'milk+strawberry':4},meals:{'cloud+milk':2},tasted:{'001':{'milk+strawberry':3,'cloud+milk':1},'002':{'milk+strawberry':2},'003':{'milk+strawberry':0},'005':{'milk+strawberry':2},'087':{'milk+strawberry':1}}};
  localStorage.setItem(k,JSON.stringify(s));if(theme)localStorage.setItem('siang-collector:theme:v1',theme);},[key,process.env.THEME||'']);
await p.reload();await p.waitForTimeout(600);
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.evaluate(()=>document.getElementById('open-errands').click());await p.locator('#errand-dialog[open]').waitFor();
await p.locator('#tab-kitchen').click();
assert.equal(await p.locator('.cookbook-page').count(),6);
assert.match(await p.locator('#cookbook-page').textContent(),/1 \/ 3/);
assert.match(await p.locator('.cookbook-page').first().textContent(),/No\.013/);
assert.match(await p.locator('[data-dish="cloud+milk"]').textContent(),/手上還有 2 份/);
await p.locator('#cookbook-tabs [data-tab="recipe"]').click();
assert.equal(await p.locator('#cookbook-nav').isVisible(),false);
const straw=p.locator('[data-dish="milk+strawberry"]');
assert.match(await straw.textContent(),/做過 4 次/);assert.equal(await straw.locator('.cookbook-eater').count(),4);assert.match(await straw.textContent(),/\+1/);
const shot=process.env.SHOT_DIR;
await p.locator('#cookbook-tabs [data-tab="all"]').click();
for(const w of [360,390,430]){await p.setViewportSize({width:w,height:844});await p.waitForTimeout(150);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow '+w);
  const over=await p.evaluate(()=>[...document.querySelectorAll('.cookbook-page *')].filter(el=>{const r=el.getBoundingClientRect(),c=el.closest('.cookbook-page').getBoundingClientRect();return r.width>0&&(r.right>c.right+1||r.left<c.left-1);}).map(el=>el.className||el.tagName));
  assert.deepEqual(over,[],'cookbook pages fit '+w);
  if(shot){await p.locator('#kitchen-cookbook').scrollIntoViewIfNeeded();await p.locator('#kitchen-cookbook').screenshot({path:`${shot}/cookbook-${w}.png`});}
}
await p.locator('#cookbook-next').click();assert.match(await p.locator('#cookbook-page').textContent(),/2 \/ 3/);
await p.locator('#cookbook-tabs [data-tab="dark"]').click();assert.equal(await p.locator('.cookbook-page.is-dark').count(),await p.locator('.cookbook-page').count());
// 長按吃過的小湘頭像 → 顯示名字和評價；+N 顯示其他人
await p.locator('#cookbook-tabs [data-tab="recipe"]').click();
const face=p.locator('[data-dish="milk+strawberry"] .cookbook-eater').first();
const box=await face.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.waitForTimeout(600);
assert.match(await p.textContent('.press-tip'),/小湘.*吃過，覺得/);
if(shot){await p.locator('#errand-dialog').screenshot({path:`${shot}/eater-press.png`});}
await p.mouse.up();await p.waitForTimeout(100);
assert.equal(await p.locator('.press-tip').count(),1,'tip stays after release');
await p.waitForTimeout(1800);assert.equal(await p.locator('.press-tip').count(),0);
await p.locator('[data-dish="milk+strawberry"] .cookbook-eater-more').click();
assert.match(await p.textContent('.press-tip'),/也吃過/);
await p.waitForTimeout(1900);await p.locator('#cookbook-tabs [data-tab="all"]').click();
// 整本收合：預設打開；點封面收起，重新整理後記得
assert.equal(await p.getAttribute('#cookbook-toggle','aria-expanded'),'true');
await p.locator('#cookbook-toggle').click();
assert.equal(await p.getAttribute('#cookbook-toggle','aria-expanded'),'false');assert.equal(await p.locator('#cookbook-body').isVisible(),false);
assert.match(await p.textContent('#cookbook-caret'),/打開/);assert.match(await p.textContent('#kitchen-stats'),/做過/);
if(shot){await p.setViewportSize({width:360,height:844});await p.locator('#kitchen-cookbook').screenshot({path:`${shot}/cookbook-closed-360.png`});}
await p.reload();await p.waitForTimeout(500);await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.evaluate(()=>document.getElementById('open-errands').click());await p.locator('#errand-dialog[open]').waitFor();await p.locator('#tab-kitchen').click();
assert.equal(await p.locator('#cookbook-body').isVisible(),false,'remembered closed');
await p.locator('#cookbook-toggle').click();assert.equal(await p.locator('.cookbook-page').first().isVisible(),true);
assert.equal(errs.length,0,errs.join('\n'));
console.log('kitchen-cookbook: made counts, old saves ≥1, newest first, eaters, tabs+pages, 360–430 fit PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
