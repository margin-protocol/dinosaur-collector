// 隱藏配方（一起入住累積天數、雨天條件）與每週賓果（週初起點、連線領獎、換週重置）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',timezoneId:'Asia/Taipei'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.clock.install({time:new Date('2026-11-17T10:00:00+08:00')});
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=5;s.dex={'001':{at:'x'},'002':{at:'x'},'005':{at:'x'},'003':{at:'x'},'006':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['002','005','006']));},key);
const day=async(d,rain)=>{await p.clock.setFixedTime(new Date(`${d}T10:00:00+08:00`));if(rain!==undefined)await p.evaluate(([k,d,rain])=>{const s=JSON.parse(localStorage.getItem(k));s.weather={date:d,kind:rain?'rain':'clear',stock:0,granted:null};localStorage.setItem(k,JSON.stringify(s));},[key,d,rain]);await p.reload();await p.waitForTimeout(700);};
await day('2026-11-17');let s=await save();assert.deepEqual(s.recipes['strawberry-cake'].days,['2026-11-17']);
await day('2026-11-17');s=await save();assert.equal(s.recipes['strawberry-cake'].days.length,1);
await day('2026-11-18');await day('2026-11-19');s=await save();assert.equal(s.recipes['strawberry-cake'].done,true);
assert.equal(s.gifts.eggs.filter(e=>e.character==='011').length,1);
// rain garden needs 006+003 and rain
await p.evaluate(()=>localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['006','003'])));
await day('2026-11-20',false);s=await save();assert.equal(s.recipes['rain-garden'].days.length,0);
await day('2026-11-21',true);await day('2026-11-22',true);s=await save();assert.equal(s.recipes['rain-garden'].done,true);assert.ok(s.gifts.eggs.some(e=>e.character==='012'));
// bingo: new week starts 11/23 (Mon)
await day('2026-11-23');s=await save();assert.equal(s.bingo.week,'2026-11-23');assert.equal(s.bingo.cells.length,9);
// complete the first row by bumping metrics
await p.evaluate(async(k)=>{const {BINGO_POOL}=await import('/js/bingo.js');const s=JSON.parse(localStorage.getItem(k));
 const bump={hatch:x=>s.hatched+=x,wish:x=>s.player.stats.wishes+=x,fulldays:x=>{for(let i=0;i<x;i++)s.wishEgg.days.push('z'+i)},snap:x=>s.bonus.total.snaps+=x,pet:x=>s.bonus.total.pets+=x,snack:x=>s.bonus.total.snacks+=x,greet:x=>s.bonus.total.greets+=x,task:x=>s.bonus.total.tasks+=x,explore:x=>s.bonus.total.explores+=x,fed:x=>s.player.stats.fed+=x,gift:x=>s.bonus.total.gifts+=x,dex:x=>{for(let i=0;i<x;i++)s.dex['04'+(4+i)]={at:'x'}}};
 for(const cell of s.bingo.cells.slice(0,3)) bump[cell.id](BINGO_POOL.find(c=>c.id===cell.id).goal);localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(500);
assert.equal(await p.textContent('#bingo-badge'),'1');
await p.click('#open-center');await p.click('#open-bingo');await p.locator('#bingo-dialog[open]').waitFor();
assert.equal(await p.locator('.bingo-cell.is-line').count(),3);
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
const before=(await save()).wishEgg.stock;await p.click('#bingo-claim');await p.waitForTimeout(400);
s=await save();assert.equal(s.wishEgg.stock,before+1);assert.deepEqual(s.bingo.claimed,['line-0']);assert(await p.locator('#bingo-claim').isHidden());
// next week resets
await p.click('#close-bingo');await day('2026-11-30');s=await save();assert.equal(s.bingo.week,'2026-11-30');assert.deepEqual(s.bingo.claimed,[]);
assert.equal(errs.length,0,errs.join('\n'));
console.log('recipes and bingo: pair days, rain condition, recipe eggs, weekly board, line claim, weekly reset PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
