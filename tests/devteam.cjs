// 開發團隊 086–088：里程碑送紀念蛋（不重複）、第三位同住＋三願望累積 3 天、圖鑑進度、成就、茶水間彩蛋、德寶小鴨
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{const D=await import('/js/devteam.js'),E=await import('/js/eggs.js');
 const art=await Promise.all(['086','087'].map(n=>fetch(`/assets/characters/${E.CHARACTERS[n].image}.webp`).then(x=>x.ok)));
 const pools=['086','087','088'].filter(n=>Object.values(E.EGGS).some(e=>e.pool?.[n]));
 const dex={};Object.keys(E.CHARACTERS).filter(n=>E.CHARACTERS[n].series!=='devteam').slice(0,19).forEach(n=>dex[n]={at:'x'});
 const s={dex,gifts:{eggs:[]},player:{stats:{photos:5,wishes:0}},battle:{wins:0}};D.ensureDevteam(s);
 const ctx={residents:[],today:'2026-11-20'};
 const a1=D.devteamDue(s,ctx);dex['050']={at:'x'};const a2=D.devteamDue(s,ctx);const t1=D.tickDevteam(s,ctx);const again=D.tickDevteam(s,ctx);
 s.dex['086']={at:'x'};s.player.stats.wishes=30;s.battle.wins=9;const b1=D.devteamDue(s,ctx);s.battle.wins=10;const t2=D.tickDevteam(s,ctx);
 s.dex['087']={at:'x'};
 const wish=(day,all)=>{s.wishes={date:day,ids:['a','b','c'],done:all?['a','b','c']:['a']};};
 const res={residents:['086','087'],today:''};
 wish('2026-11-21',false);const c0=D.tickDevteam(s,{...res,today:'2026-11-21'});
 wish('2026-11-21',true);const c1=D.tickDevteam(s,{...res,today:'2026-11-21'});const c1b=D.tickDevteam(s,{...res,today:'2026-11-21'});
 wish('2026-11-23',true);D.tickDevteam(s,{residents:['086'],today:'2026-11-23'});const notBoth=s.devteam.days.length;
 D.tickDevteam(s,{...res,today:'2026-11-23'});wish('2026-11-25',true);const c3=D.tickDevteam(s,{...res,today:'2026-11-25'});
 const eggs=s.gifts.eggs.map(e=>e.character+':'+e.egg);
 s.dex['088']={at:'x'};const all=['086','087','088'];
 const evNo=D.eventDue(s,{residents:['086','087'],today:'2026-11-26'});const ev=D.eventDue(s,{residents:all,today:'2026-11-26'});
 const r1=D.rollEvent(s,'2026-11-26',()=>0.99);const ev2=D.eventDue(s,{residents:all,today:'2026-11-26'});const r2=D.rollEvent(s,'2026-11-27',()=>0.99);const r3=D.rollEvent(s,'2026-11-28',()=>0.1);
 return {art,pools,a1,a2,t1:t1.eggs,again:again.eggs,b1,t2:t2.eggs,c0:c0.day,c1:c1.day,c1b:c1b.day,notBoth,c3,eggs,evNo,ev,r1,ev2,r2,r3,ur:E.CHARACTERS['088'].rarity};});
assert(r.art.every(Boolean));assert.deepEqual(r.pools,[]);
assert.equal(r.a1,false);assert.equal(r.a2,true);assert.deepEqual(r.t1,['086']);assert.deepEqual(r.again,[],'只送一次');
assert.equal(r.b1,false,'勝場不夠不送');assert.deepEqual(r.t2,['087']);
assert.equal(r.c0,null,'三個願望沒做完不算');assert.equal(r.c1,1);assert.equal(r.c1b,null,'同一天只算一次');assert.equal(r.notBoth,1,'沒有兩位都入住不算');
assert.deepEqual(r.c3,{eggs:['088'],day:3});assert.deepEqual(r.eggs,['086:keepsake','087:keepsake','088:keepsake']);
assert.equal(r.evNo,false);assert.equal(r.ev,true);assert.equal(r.r1,true,'第一次一定出現');assert.equal(r.ev2,false,'同一天只擲一次');assert.equal(r.r2,false);assert.equal(r.r3,true);assert.equal(r.ur,'UR');
// 實際畫面：三寶入住 → 茶水間彩蛋；圖鑑顯示進度；狂戳德寶小鴨掉下來
await p.click('#intro-ok');
// 先離開遊戲頁再改存檔（11/21）：遊戲頁還開著的話，它下一次存檔會讀到改好的存檔，
// 在 reload 前就先把「今天的茶水間彩蛋」擲掉了，重開後就等不到。改到同網域的空白頁改，遊戲程式不會跑。
await p.waitForFunction(()=>JSON.parse(localStorage.getItem('siang-collector:v1'))?.seenIntro===true);
await p.goto('http://127.0.0.1:8000/tests/__blank__');
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=10;s.dex={'001':{at:'x'},'086':{at:'x'},'087':{at:'x'},'088':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['086','087','088']));});
await p.goto('http://127.0.0.1:8000');await p.locator('#devteam-event[open]').waitFor({timeout:8000});
for(let i=0;i<30&&await p.locator('#devteam-event[open]').count();i++)await p.locator('#devteam-event-next').click();
assert.equal(await p.locator('#devteam-event[open]').count(),0);
let s=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));assert.equal(s.devteam.eventSeen,true);
const doll=p.locator('.resident-slot[data-character="087"] .resident-static');
// 小湘們會在房間裡走動，用座標點有時會點到疊在上面的皮寶；直接對德寶本人送 click（11/21）
for(let i=0;i<5;i++){await doll.dispatchEvent('click');await p.waitForTimeout(150);}
await p.waitForTimeout(200);assert.equal(await p.locator('.room-duck').count(),1,'小鴨掉下來');
assert.match((await p.locator('.resident-bubble').allTextContents()).join('|'),/排到下一個版本/);
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT});
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));delete s.dex['087'];delete s.dex['088'];s.player.stats.wishes=12;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['001']));});
await p.reload();await p.waitForTimeout(500);await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(300);
await p.locator('[data-dex-no="087"]').click();await p.locator('#dex-detail[open]').waitFor();
assert.match(await p.locator('#dex-detail').textContent(),/完成今日願望 12 \/ 30/);
assert.equal(errs.length,0,errs.join('\n'));console.log('dev team 086–088: milestones, one-time keepsake eggs, cohabit+3 wishes ×3 days, event once a day, duck drop, dex progress PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
