// 料理加成看得到（湘 11/23 選 B）：出戰格子 🍳 小字、預估寫出多加幾點戰力、餵食前提醒會換掉原本的加成
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const width=Number(process.env.W||390);
const c=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT?2:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';
await p.goto('http://127.0.0.1:8000');if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');await p.waitForTimeout(400);
// 純函式：foodPower＝有料理減掉沒料理；replacesBuff 三種情況
const fn=await p.evaluate(async()=>{const k=await import('/js/kitchen.js'),bt=await import('/js/battle.js');
  const s={dex:{'005':{at:'x'},'087':{at:'x'}},affection:{},battle:{}};k.ensureKitchen(s);bt.ensureBattle(s);
  const plain=bt.forecast(s,['005','087'],'mochi');s.kitchen.buffs['005']={kind:'power',value:0.05,dish:'caramel+milk+pudding'};const fed=bt.forecast(s,['005','087'],'mochi');
  const R=k.RECIPES.find(r=>r.id==='R02'),dish=k.dishOf(R.ings),speed=k.dishOf(k.RECIPES.find(r=>r.id==='R03').ings),plainDish=k.dishOf(['milk','strawberry']);
  const unknown=k.replacesBuff(s,'005',dish);s.kitchen.tasted['005']={[dish.id]:3,[speed.id]:0};
  const sure=k.replacesBuff(s,'005',dish),hate=k.replacesBuff(s,'005',speed),noEff=k.replacesBuff(s,'005',plainDish),noBuff=k.replacesBuff(s,'087',dish);
  s.kitchen.meals[dish.id]=1;s.kitchen.buffs['005']={kind:'speed',value:0.04,dish:speed.id};const f=k.feed(s,'005',dish.id,'2026-11-23');
  return {plain:plain.total,fed:fed.total,fp:fed.foodPower,plainFp:plain.foodPower,unknown,sure,hate,noEff,noBuff,replaced:f.replaced,short:[k.buffShort({kind:'power',value:.04}),k.buffShort({kind:'speed',value:.05}),k.buffShort({kind:'gather',value:1})]};});
assert.equal(fn.plainFp,0);assert.ok(fn.fp>0);assert.ok(Math.abs(fn.fed-fn.plain-fn.fp)<0.11,'foodPower = with - without');
assert.deepEqual([fn.unknown,fn.sure,fn.hate,fn.noEff,fn.noBuff],[null,true,false,false,false]);
assert.deepEqual(fn.replaced,{kind:'speed',value:0.04,dish:fn.replaced.dish});
assert.deepEqual(fn.short,['🍳戰力+4%','🍳減時5%','🍳採集+1']);
// UI
if(process.env.THEME)await p.evaluate(t=>localStorage.setItem('siang-collector:theme:v1',t),process.env.THEME);
await p.evaluate(async k=>{const {CHARACTERS}=await import('/js/eggs.js');const kt=await import('/js/kitchen.js');const s=JSON.parse(localStorage.getItem(k));
  const nos=Object.keys(CHARACTERS).filter((n,i)=>i%2===0||n==='005'||n==='087');s.dex={};nos.forEach(n=>s.dex[n]={at:'2026-11-10T00:00:00Z'});s.hatched=nos.length;s.tutorial=null;
  s.guide={seen:['battle','errand'],unlocked:['errand','wheel','battle','archive']};
  const R02=kt.dishOf(kt.RECIPES.find(r=>r.id==='R02').ings).id,R03=kt.dishOf(kt.RECIPES.find(r=>r.id==='R03').ings).id;
  s.kitchen={ingredients:{},meals:{[R02]:2},known:{[R02]:1},tasted:{'005':{[R02]:3}},buffs:{'005':{kind:'power',value:0.05,dish:R02},'087':{kind:'speed',value:0.04,dish:R03},'001':{kind:'power',value:0.03,dish:R02}},daily:{},darkFed:0};
  localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(600);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.click('#home-errand');await p.click('#tab-battle');
await p.locator('.battle-stage-card:not(:disabled)').first().click();await p.waitForTimeout(300);
assert.equal(await p.locator('#battle-siangs [data-siang="005"] .errand-siang__food').textContent(),'🍳戰力+5%');
assert.equal(await p.locator('#battle-siangs [data-siang="087"] .errand-siang__food').textContent(),'🍳減時4%');
await p.locator('#battle-siangs [data-siang="005"]').click();await p.locator('#battle-siangs [data-siang="087"]').click();await p.waitForTimeout(200);
assert.match(await p.locator('#battle-forecast span').textContent(),/的料理：戰力 \+5%（\+[\d.]+）/);
const fits=await p.$$eval('#battle-siangs .errand-siang__food',ls=>ls.every(l=>l.scrollWidth<=l.clientWidth+1&&l.getBoundingClientRect().right<=l.closest('.errand-siang').getBoundingClientRect().right+0.5));assert.ok(fits,'food label fits cell');
assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no horizontal scroll battle');
if(process.env.SHOT){await p.evaluate(()=>document.querySelector('#battle-siangs').scrollIntoView({block:'start'}));await p.evaluate(()=>scrollBy(0,-120));await p.waitForTimeout(300);await p.screenshot({path:`${process.env.SHOT}-battle.png`});await p.evaluate(()=>document.querySelector('#battle-forecast').scrollIntoView({block:'center'}));await p.waitForTimeout(200);await p.screenshot({path:`${process.env.SHOT}-forecast.png`});}
// 廚房：選焦糖奶布丁 → 005 已知超喜歡「會換掉」、001 沒吃過「可能換掉」、087 沒加成的人不顯示
await p.evaluate(()=>document.querySelector('#battle-back')?.click());
await p.click('#tab-kitchen');await p.locator('.kitchen-meal').first().click();await p.waitForTimeout(200);
assert.equal(await p.locator('#kitchen-siangs [data-siang="005"] .errand-siang__food').textContent(),'會換掉\n戰力+5%');
assert.equal(await p.locator('#kitchen-siangs [data-siang="001"] .errand-siang__food').textContent(),'可能換掉\n戰力+3%');
assert.equal(await p.locator('#kitchen-siangs [data-siang="087"] .errand-siang__food').textContent(),'可能換掉\n減時4%');
const kfit=await p.$$eval('#kitchen-siangs .errand-siang__food',ls=>ls.every(l=>{const r=l.getBoundingClientRect(),g=document.querySelector('#kitchen-siangs');return l.scrollWidth<=l.clientWidth+1&&g.scrollWidth<=g.clientWidth+1;}));assert.ok(kfit,'kitchen label fits, grid not wider');
if(process.env.SHOT){await p.evaluate(()=>document.querySelector('#kitchen-siangs').scrollIntoView({block:'start'}));await p.evaluate(()=>scrollBy(0,-80));await p.waitForTimeout(200);await p.screenshot({path:`${process.env.SHOT}-kitchen.png`});}
await p.locator('#kitchen-siangs [data-siang="087"]').click();await p.waitForTimeout(300);
const res=await p.locator('#kitchen-result').textContent();
if(!/討厭/.test(res))assert.match(res,/下一次討伐：戰力 \+\d+%（換掉了原本的討伐時間 −4%）/);
if(process.env.SHOT){await p.evaluate(()=>document.querySelector('#kitchen-result').scrollIntoView({block:'center'}));await p.waitForTimeout(200);await p.screenshot({path:`${process.env.SHOT}-result.png`});}
assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no horizontal scroll kitchen');
assert.equal(errs.length,0,errs.join('\n'));console.log('food-buff-label: 🍳 label on battle cells, forecast +points, kitchen swap warning PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
