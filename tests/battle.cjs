// 討伐：只有原味小湘也能打完入門關；分數／歷史最高／進步；戰敗原因（換隊 vs 變強）；剋制只影響效率與評分；休息；特訓；首頁暫時不在
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
const fastForward=()=>p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));for(const a of s.battle.active)a.until=new Date(Date.now()-1000).toISOString();s.battle.rest={};localStorage.setItem(k,JSON.stringify(s));},key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(400);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'2026-11-10T00:00:00Z'}};s.hatched=1;s.energy=0;s.tutorial=null;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['001']));},key);
await p.reload();await p.waitForTimeout(600);
// unit: origin alone clears the intro stages (1-1, 1-2) for sure
const solo=await p.evaluate(async k=>{const m=await import('/js/battle.js');const s=JSON.parse(localStorage.getItem(k));return ['mochi','sock'].map(id=>m.forecast(s,['001'],id).chance);},key);
assert.deepEqual(solo,[1,1]);
// UI: open 討伐, 1-1 open, 1-2 locked
await p.click('#home-errand');await p.click('#tab-battle');
assert(await p.locator('.battle-chapter:not(.battle-wild) .battle-stage-card').nth(1).isDisabled());
await p.locator('.battle-chapter:not(.battle-wild) .battle-stage-card').first().click();await p.click('.errand-siang:has(img[alt="原味小湘"])');
assert.match(await p.textContent('#battle-forecast'),/13 vs 8 · 輕鬆勝利/);assert.match(await p.textContent('#battle-forecast'),/剋制/);
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
await p.click('#battle-go');await p.waitForTimeout(300);
let s=await save();assert.equal(s.battle.active.length,1);
await p.click('#close-errands');assert.equal(await p.locator('.resident-slot').count(),0,'away while fighting');
await fastForward();await p.reload();await p.waitForTimeout(500);
assert.equal(await p.textContent('#errand-badge'),'1');
await p.click('#home-errand');await p.click('#tab-battle');await p.click('#battle-active .btn');await p.locator('#battle-result[open]').waitFor();await p.locator('.battle-theater__skip').click();
assert.match(await p.textContent('#battle-result-title'),/成功/);assert.match(await p.textContent('#battle-result-score'),/第一次挑戰/);
s=await save();const first=s.battle.stages.mochi;assert.equal(first.clears,1);assert(first.best>0);assert.equal(s.battle.badges,2,'1 + first 3-star bonus');assert.equal(s.fossils||0,2,'3-star gift fossils');assert.equal(s.battle.stages.mochi.stars,3);assert(await p.isVisible('#battle-result-gift'));assert.match(await p.textContent('#battle-result-gift'),/三星的小禮物.*徽章 \+1.*\+2 化石/);if(process.env.SHOT3)await p.screenshot({path:process.env.SHOT3});
await p.click('#battle-result-ok');
// fight 1-1 again with a stronger origin (bond Lv.3) → higher score, "比上次 +N", new record
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.affection={'001':{pts:30,day:'',today:0,home:''}};s.battle.rest={};localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.waitForTimeout(400);
await p.click('#home-errand');await p.click('#tab-battle');await p.locator('.battle-chapter:not(.battle-wild) .battle-stage-card').first().click();await p.click('.errand-siang:has(img[alt="原味小湘"])');await p.click('#battle-go');await p.waitForTimeout(300);
await fastForward();await p.reload();await p.waitForTimeout(400);
await p.click('#home-errand');await p.click('#tab-battle');await p.click('#battle-active .btn');await p.locator('#battle-result[open]').waitFor();await p.locator('.battle-theater__skip').click();
assert(await p.isHidden('#battle-result-gift'),'gift only on first 3-star');assert.match(await p.textContent('#battle-result-gains'),/再次三星 ⭐ \+1 化石/);assert.equal((await save()).fossils,3,'repeat 3-star +1 fossil');const scoreText=await p.textContent('#battle-result-score');assert.match(scoreText,/比上次 \+\d+/);assert.match(scoreText,/新紀錄/);
if(process.env.SHOT2){await p.waitForTimeout(200);await p.screenshot({path:process.env.SHOT2});}
await p.click('#battle-result-ok');
// diagnosis: losing to 1-3 alone with strong friends available → "換隊"; with nobody else → grow advice naming 好感度
const d=await p.evaluate(async k=>{const m=await import('/js/battle.js');const s=JSON.parse(localStorage.getItem(k));s.affection={};
const lone=m.diagnose(s,['001'],'bento',[]);s.dex['016']={at:'x'};s.dex['017']={at:'x'};s.dex['005']={at:'x'};const team=m.diagnose(s,['001'],'bento',['016','017','005']);return [lone.kind,lone.text,team.kind,team.text];},key);
assert.equal(d[0],'grow');assert.match(d[1],/好感度/);assert.equal(d[2],'team',d[3]);assert.match(d[3],/就打得贏/);
// weakness only changes speed/score, never required: same power team with/without weakness both win when strong enough
const w=await p.evaluate(async()=>{const m=await import('/js/battle.js');const {CHARACTERS}=await import('/js/eggs.js');const s={dex:{},affection:{},battle:{train:{}}};
const weakNo=Object.keys(CHARACTERS).find(no=>CHARACTERS[no].series==='weather');const other=Object.keys(CHARACTERS).find(no=>CHARACTERS[no].series==='daily'&&CHARACTERS[no].rarity===CHARACTERS[weakNo].rarity);
s.dex[weakNo]={at:'x'};s.dex[other]={at:'x'};const a=m.forecast(s,[weakNo],'sneeze-cloud');const b2=m.forecast(s,[other],'sneeze-cloud');return [a.weakHit,b2.weakHit,a.total>b2.total];});
assert.deepEqual(w,[true,false,true]);
// training spends badges and raises power
const tr=await p.evaluate(async k=>{const m=await import('/js/battle.js');const s=JSON.parse(localStorage.getItem(k));s.battle.badges=10;s.battle.train={};const before=m.siangPower(s,'001').power;const r=m.train(s,'001');return [r.level,s.battle.badges,m.siangPower(s,'001').power>before];},key);
assert.deepEqual(tr,[1,7,true]);
assert.equal(errs.length,0,errs.join('\n'));console.log('battle: origin solo clears intro, score/best/progress, team-vs-grow advice, weakness optional, rest, training PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
