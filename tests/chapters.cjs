// 成長願望：一章三項領完 → 直接升級＋章節獎勵；改版前已完成的章節開遊戲時補發
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(300);
// retroactive: chapters 1–2 all claimed under the old rules, XP stuck at 160 (Lv.2)
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.player.xp=160;s.player.claimed=['growth:1:1','growth:1:2','growth:1:3','growth:2:1','growth:2:2','growth:2:3'];s.player.energyClaimed=[...s.player.claimed];s.fossils=0;localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(500);
let s=await save();assert.deepEqual(s.player.chapters,['1','2']);assert.equal(Math.floor(s.player.xp/100)+1,3,'jumped to chapter 3');assert.equal(s.wishEgg.stock,1,'chapter 2 wish egg');
// chapter 3: meet the goals, claim all three
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.errands.total=1;s.bonus.total.explores=1;s.hatched=3;localStorage.setItem(k,JSON.stringify(s));},key);
await p.goto('http://127.0.0.1:8000/#wish');await p.reload();await p.click('#tab-growth');await p.waitForTimeout(300);
assert.match(await p.textContent('#chapter-title'),/走出門看看/);assert.match(await p.textContent('#chapter-reward'),/5 化石/);
for(let i=1;i<=3;i++){await p.click(`[data-goal="growth:3:${i}"]`);await p.waitForTimeout(350);}
s=await save();assert.equal(Math.floor(s.player.xp/100)+1,4);assert.equal(s.fossils,5);assert.deepEqual(s.player.chapters,['1','2','3']);
assert.match(await p.textContent('#growth-feedback'),/第 3 章「走出門看看」完成/);assert.match(await p.textContent('#chapter-title'),/收藏世界的顏色/);
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
// chapter 5 reward: cradle slot
const r=await p.evaluate(async()=>{const {claimGrowth,growthGoals}=await import('/js/progression.js');const s={dex:{},hatched:0,energy:0,fossils:0,player:{xp:400,claimed:['growth:5:1','growth:5:2'],energyClaimed:[],stats:{wishes:0,fed:0,colors:[],days:['a','b','c','d','e']}},bonus:{total:{pets:20}},errands:{total:5,stories:{},cards:{}},travel:{visits:{}},wishEgg:{stock:0},weather:{stock:0}};const out=claimGrowth(s,5,'growth:5:3');return [out.chapter?.level,s.cradle?.slots,s.player.xp];});
assert.deepEqual(r,[5,2,500]);
assert.equal(errs.length,0,errs.join('\n'));console.log('chapters: retroactive catch-up, claim three → level up + reward, slot reward PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
