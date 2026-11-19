// 小湘廚房：286 種組合固定、開煮扣料、餵食評價與好感上限、秘密最愛、料理加成只用一份、討伐撿食材；UI 開煮＋餵食
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const key='siang-collector:v1';
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();
const r=await p.evaluate(async()=>{
  const k=await import('/js/kitchen.js'),bt=await import('/js/battle.js'),ac=await import('/js/achievements.js'),eg=await import('/js/eggs.js'),tp=await import('/js/taste-profiles.js');
  const I=k.INGREDIENTS.map(i=>i.id);const combos=[];for(let a=0;a<12;a++)for(let b2=a+1;b2<12;b2++){combos.push([I[a],I[b2]]);for(let c2=b2+1;c2<12;c2++)combos.push([I[a],I[b2],I[c2]]);}
  const stable=combos.every(x=>{const d=k.dishOf(x),e=k.dishOf([...x].reverse());return d&&e&&d.id===e.id&&d.name===e.name;});
  const names=new Set(combos.map(x=>k.dishOf(x).name)).size;
  const bad=[k.dishOf(['milk']),k.dishOf(['milk','milk']),k.dishOf(['milk','star','moon','cloud'])];
  const s={dex:{'005':{at:'x'},'087':{at:'x'},'001':{at:'x'},'002':{at:'x'}},affection:{},energy:0,fossils:0,battle:{}};
  k.ensureKitchen(s);bt.ensureBattle(s);const starter={...s.kitchen.ingredients};
  s.kitchen.ingredients={caramel:4,milk:4,pudding:4,gear:2,glitch:2,strawberry:1,mushroom:1};
  const c1=k.cook(s,['pudding','milk','caramel']);const c2=k.cook(s,['milk','caramel','pudding']);const c3=k.cook(s,['gear','glitch']);const c4=k.cook(s,['strawberry','mushroom']);const no=k.cook(s,['strawberry','milk']);
  const left={...s.kitchen.ingredients};
  const f1=k.feed(s,'005','caramel+milk+pudding','2026-11-20');
  const f2=k.feed(s,'087','gear+glitch','2026-11-20');
  const f3=k.feed(s,'001','caramel+milk+pudding','2026-11-20'); // 原味討厭濃甜
  const f4=k.feed(s,'001','mushroom+strawberry','2026-11-20'); // 原味的秘密最愛＝草莓蘑菇湯（黑暗料理）
  const none=k.feed(s,'002','caramel+milk+pudding','2026-11-20');
  // cap: 原味今天已 1+7=8，再來 7 → 只加 7（上限15）；再一次只加 0
  s.kitchen.meals['mushroom+strawberry']=2;const f5=k.feed(s,'001','mushroom+strawberry','2026-11-20');const f6=k.feed(s,'001','mushroom+strawberry','2026-11-20');
  // battle: food buff applied once, power +5% for 005
  const plain=bt.forecast({...s,kitchen:{buffs:{}}},['005'],'mochi').total;const fed=bt.forecast(s,['005','087'],'mochi');
  const trip=bt.startBattle(s,'mochi',['005','087'],{now:new Date(),rand:()=>0});
  const after=s.kitchen.buffs['005'];const drops=trip.report.loot.ingredients;
  const back=bt.collectBattle(s,trip.id,new Date(Date.now()+3*3600e3),()=>0);
  ac.ensureAchievements(s);const ach=ac.achievementStatus(s,eg.CHARACTERS).filter(a=>a.group==='廚房').map(a=>[a.id,a.value]);
  const profiles=Object.keys(eg.CHARACTERS).filter(n=>!tp.TASTES[n]);const kl=await import('/js/kitchen-lines.js');const noLines=Object.keys(eg.CHARACTERS).filter(n=>!kl.KITCHEN_LINES[n]?.[3]||!kl.KITCHEN_LINES[n]?.[0]);const hateLine=f3.line;
  return {combos:combos.length,stable,names,bad,starter,c1:c1.dish.name,c2first:c2.first,c3:c3.dish.dark,c4:c4.dish.name,no,left,f1:[f1.rating,f1.points,f1.added,f1.secretFound,f1.buff],f2:[f2.rating,f2.dish.dark],f3:[f3.rating,f3.added,f3.buff?.value],f4:[f4.rating,f4.secretFound],none,f5:f5.added,f6:[f6.added,f6.capped],plain,fed:[fed.food?.no,fed.food?.kind],after,drops,gains:back.gains.join('|'),ings:s.kitchen.ingredients,ach,profiles,noLines,hateLine,dark:s.kitchen.darkFed};
});
assert.equal(r.combos,286);assert.ok(r.stable);assert.equal(r.names,286);assert.deepEqual(r.bad,[null,null,null]);
assert.deepEqual(r.starter,{strawberry:2,milk:2,caramel:2,pudding:2});
assert.equal(r.c1,'焦糖奶布丁');assert.equal(r.c2first,false);assert.ok(r.c3);assert.equal(r.c4,'草莓蘑菇湯');assert.match(r.no,/不夠/);
assert.deepEqual(r.left,{caramel:2,milk:2,pudding:2,gear:1,glitch:1});
assert.deepEqual(r.f1,[3,7,7,true,{kind:'power',value:0.05,dish:'caramel+milk+pudding'}]);
assert.deepEqual(r.f2,[3,true]);assert.deepEqual(r.f3,[0,1,undefined]);assert.deepEqual(r.f4,[3,true]);
assert.match(r.none,/吃完/);assert.equal(r.f5,2);assert.deepEqual(r.f6,[0,true]);
assert.deepEqual(r.fed,['005','power']);assert.equal(r.after,undefined,'buff used');
assert.ok(r.drops.length>=1&&r.drops.every(x=>['strawberry','milk','caramel','pudding'].includes(x)),'chapter 1 drops');
assert.match(r.gains,/食材/);
assert.deepEqual(r.profiles,[],'every Siang has a taste profile');assert.deepEqual(r.noLines,[],'every Siang has love+hate lines');assert.match(r.hateLine,/甜/);
assert.ok(r.ach.find(a=>a[0]==='cook-dark')[1]>=1);assert.equal(r.ach.find(a=>a[0]==='cook-secrets')[1],3);
// UI
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=5;for(const n of ['001','002','003','005','087'])s.dex[n]={at:'x'};s.guide={seen:['battle','errand'],unlocked:['errand','wheel','battle','archive']};delete s.kitchen;localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(600);
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.evaluate(()=>document.getElementById('open-errands').click());await p.locator('#errand-dialog[open]').waitFor();
await p.locator('#tab-kitchen').click();
assert.equal(await p.locator('#errand-title').textContent(),'小湘廚房');
assert.equal(await p.locator('.kitchen-ing').count(),12);
await p.locator('[data-ing="strawberry"]').click();await p.locator('[data-ing="milk"]').click();
assert.match(await p.locator('#kitchen-preview').textContent(),/？？？/);if(process.env.SHOT)await p.screenshot({path:process.env.SHOT.replace('.png','-a.png')});
await p.locator('#kitchen-cook').click();await p.waitForTimeout(300);
assert.match(await p.locator('#kitchen-status').textContent(),/草莓牛奶/);
assert.equal(await p.locator('#kitchen-feed').isVisible(),true);
await p.locator('#kitchen-siangs [data-siang="002"]').click();await p.waitForTimeout(300);
assert.match(await p.locator('#kitchen-result').textContent(),/草莓小湘/);
assert.match(await p.locator('#kitchen-stats').textContent(),/特色料理 1 \/ 8/);
const s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
assert.equal(s.kitchen.ingredients.strawberry,1);assert.ok(s.affection['002'].pts>=3);
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT,fullPage:false});
for(const w of [360,430]){await p.setViewportSize({width:w,height:800});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow '+w);}
assert.equal(errs.length,0,errs.join('\n'));
console.log('kitchen: 286 stable dishes, cook/feed/cap/secret, one food buff per team, chapter drops, achievements, UI cook+feed PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
