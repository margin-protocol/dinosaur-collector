// 隱藏配方第二彈 076–081：角色登錄、不進蛋池、研究室實際倒數、不限制時段天氣、不重複送蛋、研究筆記、台詞
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{
 const E=await import('/js/eggs.js'),R=await import('/js/recipes.js'),Lab=await import('/js/lab.js'),L=(await import('/js/recipe-lines.js')).RECIPE_LINES,B=await import('/js/bond-copy.js'),I=await import('/js/intros.js');
 const ids=['076','077','078','079','080','081'];
 const inPool=ids.filter(n=>Object.values(E.EGGS).some(e=>e.pool?.[n]));
 const reg=ids.every(n=>E.CHARACTERS[n]?.series==='recipe'&&E.CHARACTERS[n].special&&R.RECIPES.some(x=>x.target===n)&&L[n]?.hatch&&B.BOND_LINES[n]?.[4]&&B.BOND_STORIES[n]&&I.INTROS[n]&&I.MYSTERY_INTROS[n]);
 const imgs=await Promise.all(ids.map(n=>fetch(`/assets/characters/${E.CHARACTERS[n].image}.webp`).then(x=>x.ok)));
 const now=Date.parse('2026-11-20T12:00:00Z');
 const brew=(id)=>{
   const recipe=R.RECIPES.find(r=>r.id===id);
   const s={dex:Object.fromEntries(recipe.members.map(no=>[no,{}])),gifts:{eggs:[]},recipes:{[id]:{days:['old-save-day'],done:false}}};
   const started=Lab.startBrew(s,id,{now});
   const early=Lab.finishBrew(s,now+recipe.days*Lab.DAY_MS-1);
   const done=Lab.finishBrew(s,now+recipe.days*Lab.DAY_MS);
   const repeat=Lab.finishBrew(s,now+recipe.days*Lab.DAY_MS+1);
   return {started:!!started.recipe,early,done:done?.id,repeat,eggs:s.gifts.eggs,history:s.recipes[id].days};
 };
 return {inPool,reg,imgs,moon:brew('moonlit-garden'),rain:brew('rain-garden'),cat:brew('cat-cafe')};
});
assert.deepEqual(r.inPool,[]);assert(r.reg);assert(r.imgs.every(Boolean));
for(const [key,id,target] of [['moon','moonlit-garden','080'],['rain','rain-garden','012'],['cat','cat-cafe','078']]) {
 const result=r[key];assert(result.started,'daytime/dry conditions must not block brewing');assert.equal(result.early,null);assert.equal(result.done,id);assert.equal(result.repeat,null);
 assert.equal(result.eggs.length,1,'reward only once');assert.equal(result.eggs[0].character,target);assert.equal(result.eggs[0].egg,'keepsake');assert.deepEqual(result.history,['old-save-day'],'preserve old history without granting early');
}
// 研究室：每組配方一則筆記，切到第 3 則顯示新筆記
await p.locator('#intro-ok').click();
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=4;s.dex={'001':{at:'x'},'007':{at:'x'},'010':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.evaluate(()=>location.hash='research');await p.waitForTimeout(500);
assert.equal(await p.locator('[data-note]').count(),await p.evaluate(async()=>(await import('/js/recipes.js')).RECIPES.length),'每組配方一張研究筆記');
await p.locator('[data-note="2"]').click();assert.match(await p.locator('#research-note-title').textContent(),/書頁裡的星光/);
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT,fullPage:true});
assert.equal(errs.length,0,errs.join('\n'));console.log('recipe Siangs 076–081: registered off-pool, timed lab brewing, no weather/time gates, reward once, legacy history, research notes PASS');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
