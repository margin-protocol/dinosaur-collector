// 隱藏配方第二彈 076–081：角色登錄、不進蛋池、夜晚配方（凌晨算前一晚、白天不算、同晚只記一次）、一般配方、研究室八則筆記、台詞
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{
 const E=await import('/js/eggs.js'),R=await import('/js/recipes.js'),L=(await import('/js/recipe-lines.js')).RECIPE_LINES,B=await import('/js/bond-copy.js'),I=await import('/js/intros.js');
 const ids=['076','077','078','079','080','081'];
 const inPool=ids.filter(n=>Object.values(E.EGGS).some(e=>e.pool?.[n]));
 const reg=ids.every(n=>E.CHARACTERS[n]?.series==='recipe'&&E.CHARACTERS[n].special&&R.RECIPES.some(x=>x.target===n)&&L[n]?.hatch&&B.BOND_LINES[n]?.[4]&&B.BOND_STORIES[n]&&I.INTROS[n]&&I.MYSTERY_INTROS[n]);
 const imgs=await Promise.all(ids.map(n=>fetch(`/assets/characters/${E.CHARACTERS[n].image}.webp`).then(x=>x.ok)));
 const nk=[R.nightKey(new Date('2026-11-19T21:00:00')),R.nightKey(new Date('2026-11-20T02:00:00')),R.nightKey(new Date('2026-11-20T12:00:00'))];
 const s={gifts:{eggs:[]}};const res=['006','004'];
 const day=R.tickRecipes(s,{residents:res,raining:false,today:'2026-11-20',night:null});
 const n1=R.tickRecipes(s,{residents:res,raining:false,today:'2026-11-19',night:'2026-11-19'});
 const n1b=R.tickRecipes(s,{residents:res,raining:false,today:'2026-11-20',night:'2026-11-19'});
 R.tickRecipes(s,{residents:res,raining:false,today:'2026-11-20',night:'2026-11-20'});
 const due=R.recipeDue(s,{residents:res,raining:false,today:'2026-11-21',night:'2026-11-21'});
 const n3=R.tickRecipes(s,{residents:res,raining:false,today:'2026-11-21',night:'2026-11-21'});
 const cat={gifts:{eggs:[]}};R.tickRecipes(cat,{residents:['044','005'],raining:false,today:'2026-11-20'});const c2=R.tickRecipes(cat,{residents:['044','005'],raining:false,today:'2026-11-21'});
 return {inPool,reg,imgs,nk,day:day.progressed.map(x=>x.id),n1:n1.progressed.map(x=>x.id),n1b:n1b.progressed.length,due,n3:n3.completed.map(x=>x.id),egg:s.gifts.eggs[0],cat:c2.completed.map(x=>x.id),catEgg:cat.gifts.eggs[0]?.character};
});
assert.deepEqual(r.inPool,[]);assert(r.reg);assert(r.imgs.every(Boolean));
assert.deepEqual(r.nk,['2026-11-19','2026-11-19',null]);
assert.deepEqual(r.day,[]);assert.deepEqual(r.n1,['moonlit-garden']);assert.equal(r.n1b,0,'同一晚凌晨再開不重複');
assert.equal(r.due,true);assert.deepEqual(r.n3,['moonlit-garden']);assert.equal(r.egg.character,'080');assert.equal(r.egg.egg,'keepsake');
assert.deepEqual(r.cat,['cat-cafe']);assert.equal(r.catEgg,'078');
// 研究室：八則筆記，切到第 3 則顯示新筆記
await p.locator('#intro-ok').click();
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=4;s.dex={'001':{at:'x'},'007':{at:'x'},'010':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.evaluate(()=>location.hash='research');await p.waitForTimeout(500);
assert.equal(await p.locator('[data-note]').count(),8);
await p.locator('[data-note="2"]').click();assert.match(await p.locator('#research-note-title').textContent(),/書頁裡的星光/);
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT,fullPage:true});
assert.equal(errs.length,0,errs.join('\n'));console.log('recipe Siangs 076–081: registered off-pool, night recipes dedupe by night, day recipes, keepsake eggs, eight research notes PASS');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
