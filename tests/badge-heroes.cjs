// 勇者小隊（No.062–064）：徽章兌換指定蛋，培育後才加入隊伍、勇者要兩章 Boss、圖鑑剪影與取得方式、出戰台詞與三人連攜
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
p.setDefaultTimeout(12000);
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(400);
// unit: never in any egg pool; BADGE_HEROES wired
const unit=await p.evaluate(async()=>{const e=await import('/js/eggs.js');const bt=await import('/js/battle.js');
  const inPool=Object.values(e.EGGS).some(egg=>['062','063','064'].some(no=>egg.pool?.[no]));
  return {inPool,heroes:bt.BADGE_HEROES,series:['062','063','064'].map(no=>e.CHARACTERS[no].series)};});
assert.equal(unit.inPool,false);assert.deepEqual(unit.heroes,{knight:'062',mage:'063',hero:'064'});assert.deepEqual(unit.series,['hero','hero','hero']);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'2026-11-10T00:00:00Z'}};s.hatched=1;s.energy=100;s.tutorial=null;s.battle={badges:25,stages:{}};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['001']));},key);
await p.reload();await p.waitForTimeout(600);
// 圖鑑：未取得是黑影，取得方式寫徽章
await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(300);
const card=p.locator('[data-dex-no="064"]');assert.match(await card.locator('img').getAttribute('class'),/is-locked/);
await card.click();await p.locator('#dex-detail[open]').waitFor();
assert.match(await p.textContent('#dex-detail-how'),/40 枚討伐徽章兌換專屬蛋.*Boss/);await p.click('#close-dex-detail');
await p.evaluate(()=>location.hash='');await p.waitForTimeout(300);
// 兌換：騎士可換（25 ≥ 20），勇者鎖住
await p.click('#home-errand');await p.click('#tab-battle');await p.click('#open-train');
const rows=p.locator('#hero-shop .train-row');assert.equal(await rows.count(),3);
assert.match(await rows.nth(2).textContent(),/🔒 先打倒第 1 章和第 2 章的 Boss/);assert(await rows.nth(2).locator('button').isDisabled());
assert(!(await rows.nth(0).locator('button').isDisabled()));
await rows.nth(0).locator('button').click();await p.waitForTimeout(300);
let s=await save();assert(!s.dex['062'],'redemption must not directly unlock character');assert.equal(s.gifts.eggs.filter(e=>e.character==='062').length,1);assert.equal(s.gifts.eggs.find(e=>e.character==='062').egg,'keepsake');assert.equal(s.battle.badges,5);
assert.match(await p.textContent('#hero-status'),/獲得騎士小湘專屬蛋/);assert.match(await rows.nth(0).textContent(),/待孵化/);assert(await rows.nth(0).locator('button').isDisabled());
assert(await rows.nth(1).locator('button').isDisabled(),'only 5 badges left');
// Select the exact egg, inject energy, hatch using the real transaction.
await p.locator('#close-errands').click();await p.evaluate(()=>location.hash='incubate');
await p.locator('#open-eggs').click();await p.locator('[data-cat="keepsake"]').click();
const egg=p.locator('[data-egg="keepsake"][data-character="062"]');assert.match(await egg.textContent(),/騎士小湘專屬蛋/);
for(const width of [360,390,430]){await p.setViewportSize({width,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}await p.setViewportSize({width:390,height:844});
if(process.env.SHOT){await egg.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode().catch(()=>{}))));await p.waitForTimeout(400);await p.screenshot({path:process.env.SHOT});}
await egg.click();await p.locator('#egg-picker').waitFor({state:'hidden'});s=await save();assert.equal(s.egg.character,'062');assert(!s.dex['062']);
const pending=await p.evaluate(async k=>{const bt=await import('/js/battle.js');const s=JSON.parse(localStorage.getItem(k));s.battle.badges=100;const a=bt.redeemHero(s,'062');s.shelf.push(s.egg);s.egg={id:'ordinary',warmth:0,since:new Date().toISOString()};const b=bt.redeemHero(s,'062');return {a,b,badges:s.battle.badges};},key);assert.match(pending.a,/已兌換/);assert.match(pending.b,/已兌換/);assert.equal(pending.badges,100);
await p.locator('#feed-all').click();await p.waitForTimeout(1000);await p.locator('#cultivate').click();await p.waitForFunction(()=>Boolean(JSON.parse(localStorage.getItem('siang-collector:v1')).dex['062']));s=await save();assert.equal(s.hatched,2);assert.equal(s.energy,0);assert.equal(s.dex['062'].story.from,'badge:062');
// 單元：勇者條件、連攜戰報、出戰台詞
const r=await p.evaluate(async k=>{const bt=await import('/js/battle.js');const s=JSON.parse(localStorage.getItem(k));
  s.battle.badges=100;const locked=bt.redeemHero(s,'064');
  s.battle.stages={'caramel-king':{clears:1},'thunder-king':{clears:1}};const ok=bt.redeemHero(s,'064');const again=bt.redeemHero(s,'064');bt.redeemHero(s,'063');const beforeHatch=Boolean(s.dex['064']);const {rollFor}=await import('/js/eggs.js');const fixed=s.gifts.eggs.map(g=>[g.character,rollFor({id:g.egg,character:g.character})]);for(const [no,hatched] of fixed){s.dex[hatched]={at:'test'};}const ownedAgain=bt.redeemHero(s,'064');
  s.battle.stages.mochi={clears:1};s.battle.active=[];s.battle.rest={};
  const btl=bt.startBattle(s,'mochi',['062','063','064'],{rand:()=>0});
  return {fixed,beforeHatch,ownedAgain,locked,ok:ok&&ok.cost,again,badges:s.battle.badges,party:btl.report.heroParty,log:btl.report.log};},key);
assert.match(r.locked,/還不能兌換/);assert.equal(r.ok,40);assert.equal(r.beforeHatch,false);assert.deepEqual(r.fixed,[['064','064'],['063','063']]);assert.match(r.again,/已兌換/);assert.match(r.ownedAgain,/已經在隊伍/);assert.equal(r.badges,40);
assert.equal(r.party,true);assert(r.log.some(l=>l.includes('妳倒是負責打魔王啊')));assert(r.log.some(l=>l.startsWith('騎士小湘：「騎士小湘，奉命出征')));
assert(r.log.some(l=>l.startsWith('勇者小湘：「咦？結束了？')),'SSR hero speaks the victory line');
assert.deepEqual(errs,[]);console.log('badge heroes ok');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
