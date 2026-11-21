// 關卡卡片直接標「討伐中 · 剩幾分」／「戰報待收」，不用點進去才知道已經有隊伍在打（湘 11/21）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const W=Number(process.env.W||390);
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT?2:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(300);
const ids=await p.evaluate(async([k,theme])=>{const m=await import('/js/battle.js');const s=JSON.parse(localStorage.getItem(k));const at='2026-11-10T00:00:00Z';
  s.dex={'001':{at},'005':{at},'043':{at},'016':{at},'017':{at}};s.hatched=5;s.tutorial=null;m.ensureBattle?.(s);s.battle=s.battle||{};
  const [c1,c2]=m.CHAPTERS;s.battle.stages=s.battle.stages||{};for(const id of [...c1.stages,...c2.stages.slice(0,3)])s.battle.stages[id]={stars:3,best:1800,last:1800,clears:1,tries:1};
  localStorage.setItem(k,JSON.stringify(s));if(theme)localStorage.setItem('siang-collector:theme:v1',theme);return [c2.stages[1],c2.stages[3]];},[key,process.env.THEME||'']);
await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
// 兩隊出發：2-2 和 2-B
const r=await p.evaluate(async([k,ids])=>{const m=await import('/js/battle.js');const s=JSON.parse(localStorage.getItem(k));m.ensureBattle?.(s);
  const a=m.startBattle(s,ids[0],['001']);const b={...a,id:a.id+'b',enemy:ids[1],nos:['005'],until:new Date(Date.now()+25*60e3).toISOString()};s.battle.active.push(b);localStorage.setItem(k,JSON.stringify(s));return [typeof a,typeof b,a,b];},[key,ids]);
assert.deepEqual(r.slice(0,2),['object','object'],JSON.stringify(r));
await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.click('#home-errand');await p.click('#tab-battle');
const tags=p.locator('.battle-chapter:not(.battle-wild) .battle-stage-card.is-fighting');
assert.equal(await tags.count(),2);
assert.match(await tags.first().locator('.battle-stage-card__fight').textContent(),/⚔ 討伐中還要 \d+ (時 \d+ 分|分|小時)/);
const ch2=p.locator('.battle-chapter:not(.battle-wild)').nth(1);
if(process.env.SHOT){await ch2.scrollIntoViewIfNeeded();await ch2.screenshot({path:process.env.SHOT+'-fighting.png'});}
// 其中一隊打完 → 戰報待收
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.battle.active[0].until=new Date(Date.now()-1000).toISOString();localStorage.setItem(k,JSON.stringify(s));},key);
await p.click('#close-errands');await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.click('#home-errand');await p.click('#tab-battle');
assert.equal(await p.locator('.battle-stage-card__fight.is-back').count(),1);
assert.match(await p.locator('.battle-stage-card__fight.is-back').textContent(),/戰報待收/);
if(process.env.SHOT){const ch=p.locator('.battle-chapter:not(.battle-wild)').nth(1);await ch.scrollIntoViewIfNeeded();await ch.screenshot({path:process.env.SHOT+'-back.png'});}
assert.equal(errs.length,0,errs.join('\n'));
console.log('stage-fighting: cards show 討伐中 + time and 戰報待收 PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
