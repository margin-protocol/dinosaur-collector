// 口味筆記（11/22 湘選 B）：試吃後自動推理喜歡／討厭口味、不會推錯、秘密最愛另外記；圖鑑顯示、結果卡「新發現」、餵食名單「應該喜歡」
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const key='siang-collector:v1';const W=Number(process.env.W||390);
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT?2:1});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();
const u=await p.evaluate(async()=>{
  const k=await import('/js/kitchen.js'),{TASTES}=await import('/js/taste-profiles.js');
  // 每位小湘照固定順序餵所有兩種食材的組合：推理結果永遠包含正確答案，最後一定能確定
  const I=k.INGREDIENTS.map(i=>i.id);const pairs=[];for(let a=0;a<I.length;a++)for(let b2=a+1;b2<I.length;b2++)pairs.push([I[a],I[b2]]);
  let wrong=0,unsure=0;
  for(const no of Object.keys(TASTES)){const s={kitchen:{tasted:{[no]:{}}}};
    for(const x of pairs){const d=k.dishOf(x);s.kitchen.tasted[no][d.id]=k.rate(no,d);const n=k.tasteNotes(s,no);if(!n.likes.includes(TASTES[no].like)||!n.dislikes.includes(TASTES[no].dislike))wrong++;}
    const n=k.tasteNotes(s,no);if(n.like!==TASTES[no].like||n.dislike!==TASTES[no].dislike)unsure++;}
  // 甜點小湘（005）：喜歡濃甜、討厭菇香、秘密＝焦糖奶布丁
  const s={dex:{'005':{at:'x'}},affection:{},kitchen:null};k.ensureKitchen(s);
  const empty=k.tasteNotes(s,'005');
  s.kitchen.meals={'caramel+pudding':1,'mushroom+star':1,'caramel+star':1,'caramel+milk+pudding':1};
  const f1=k.feed(s,'005','caramel+pudding','d');const n1=k.tasteNotes(s,'005');
  const f2=k.feed(s,'005','mushroom+star','d');
  const f3=k.feed(s,'005','caramel+star','d');
  const g=[k.guessRating(s,'005',k.dishOf(['redbean','milk'])),k.guessRating(s,'005',k.dishOf(['mushroom','milk'])),k.guessRating({kitchen:{tasted:{}}},'005',k.dishOf(['milk','star']))];
  const f4=k.feed(s,'005','caramel+milk+pudding','d');const n4=k.tasteNotes(s,'005');
  return {wrong,unsure,empty:[empty.tries,empty.likes.length,empty.like],f1:[f1.rating,f1.learned],n1:n1.likes.sort(),f2:[f2.rating,f2.learned],f3:[f3.rating,f3.learned],g,f4:[f4.rating,f4.learned],n4:[n4.like,n4.dislike,n4.secret?.name,n4.tries]};
});
assert.equal(u.wrong,0,'推理不能排除正確答案');assert.equal(u.unsure,0,'全部吃過一定能確定');
assert.deepEqual(u.empty,[0,12,null]);
assert.deepEqual(u.f1,[2,{like:null,dislike:null}]);assert.deepEqual(u.n1,['滑順','濃甜']);
assert.equal(u.f2[0],0);
assert.deepEqual(u.f3,[2,{like:'濃甜',dislike:'菇香'}]);
assert.deepEqual(u.g[2],null);assert.equal(u.g[0],2);
assert.equal(u.f4[0],3);assert.equal(u.n4[0],'濃甜');assert.equal(u.n4[2],'焦糖奶布丁');assert.equal(u.n4[3],4);
// UI：圖鑑口味筆記
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.dex={'005':{at:'2026-11-11T00:00:00Z'},'001':{at:'2026-11-10T00:00:00Z'}};s.hatched=2;s.tutorial=null;s.guide={seen:['battle','errand'],unlocked:['errand','wheel','battle','archive']};
  s.kitchen={ingredients:{caramel:3,redbean:2,milk:2,mushroom:1,gear:1},meals:{'milk+redbean':1,'caramel+milk':1},known:{},made:{},tasted:{'005':{'caramel+pudding':2,'mushroom+star':0}},buffs:{},darkFed:0,cooked:0};localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(1500);
await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(300);await p.click('[data-dex-no="005"]');await p.locator('#dex-detail[open]').waitFor();
assert.equal(await p.locator('#dex-detail-taste').isVisible(),true);
assert.match(await p.textContent('#taste-rows'),/濃甜？.*滑順？/);assert.match(await p.textContent('#taste-tries'),/吃過 2 道/);assert.match(await p.textContent('#taste-hint'),/其中一種/);
await p.locator('#dex-detail-taste').scrollIntoViewIfNeeded();if(process.env.SHOT){await p.waitForTimeout(200);await p.screenshot({path:`${process.env.SHOT}-dex-guess.png`});}
await p.click('#close-dex-detail');await p.click('[data-dex-no="001"]');assert.match(await p.textContent('#taste-hint'),/小湘廚房/);await p.click('#close-dex-detail');
// UI：廚房餵食 → 新發現
await p.evaluate(()=>location.hash='');await p.waitForTimeout(200);
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.evaluate(()=>document.getElementById('open-errands').click());await p.locator('#errand-dialog[open]').waitFor();
await p.locator('#tab-kitchen').click();await p.waitForTimeout(300);
await p.locator('#kitchen-meals .kitchen-meal').filter({hasText:'紅豆'}).click();
const sp=p.locator('#kitchen-siangs [data-siang="005"]');assert.doesNotMatch(await sp.textContent(),/喜歡？|討厭？/,'還說不準就不提示');
await sp.click();await p.waitForTimeout(500);
assert.match(await p.textContent('#kitchen-result'),/新發現：甜點小湘喜歡「濃甜」/);
await p.locator('#kitchen-result').scrollIntoViewIfNeeded();if(process.env.SHOT){await p.waitForTimeout(200);await p.screenshot({path:`${process.env.SHOT}-result.png`});}
await p.locator('#kitchen-meals .kitchen-meal').filter({hasText:'焦糖'}).click();await p.locator('#kitchen-siangs').scrollIntoViewIfNeeded();
assert.match(await p.locator('#kitchen-siangs [data-siang="005"]').textContent(),/😋 喜歡？/);
if(process.env.SHOT){await p.waitForTimeout(200);await p.screenshot({path:`${process.env.SHOT}-feed.png`});}
// 圖鑑變成確定
await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(400);
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await p.click('[data-dex-no="005"]');
assert.match(await p.textContent('#taste-rows'),/濃甜🍯焦糖、🫘蜜紅豆/);
await p.locator('#dex-detail-taste').scrollIntoViewIfNeeded();if(process.env.SHOT){await p.waitForTimeout(200);await p.screenshot({path:`${process.env.SHOT}-dex-found.png`});}
assert.equal(errs.length,0,errs.join('\n'));console.log('taste-notes: deduction never wrong, learned on feed, dex notes, result card, feed hint PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
