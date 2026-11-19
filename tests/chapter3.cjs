// 第三章《故障的玩具星球》：資料、解鎖順序、圖檔、勇者小隊打 Boss、首勝願望蛋、檔案館、野外不劇透、地圖顯示
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{const B=await import('/js/battle.js'),A=await import('/js/archive.js');
 const ids=['toy-bunny','glitch-gummy','melody-guard','director-giggle'];
 const ch=B.CHAPTERS.find(c=>c.id===3);
 const art=await Promise.all(ids.map(id=>fetch('/'+B.enemyArtPath(id)).then(x=>x.ok)));
 const mk=(stages)=>{const s={dex:{'062':{at:'x'},'063':{at:'x'},'064':{at:'x'}},affection:{'062':{pts:45},'063':{pts:45},'064':{pts:45}},wishEgg:{stock:0},energy:0,fossils:0,battle:{}};B.ensureBattle(s);Object.assign(s.battle.stages,stages);return s;};
 const before=mk({'thunder-king':{clears:0}});const lockedBefore=B.unlocked(before,'toy-bunny');
 const after=mk({'thunder-king':{clears:1}});const open31=B.unlocked(after,'toy-bunny'),lockedBoss=B.unlocked(after,'director-giggle');
 const atBoss=mk({'thunder-king':{clears:1},'toy-bunny':{clears:1},'glitch-gummy':{clears:1},'melody-guard':{clears:1}});
 const f=B.forecast(atBoss,['062','063','064'],'director-giggle');
 const t0=new Date('2026-11-20T10:00:00');const st=B.startBattle(atBoss,'director-giggle',['062','063','064'],{now:t0,rand:()=>0.5});
 const res=typeof st==='string'?st:B.collectBattle(atBoss,st.id,new Date(t0.getTime()+3*3600e3),()=>0.5);
 const wins=atBoss.battle.wins;const seeded=(()=>{const x={battle:{stages:{mochi:{clears:2},sock:{clears:1}},wildWins:3}};B.ensureBattle(x);return x.battle.wins;})();
 const arch=A.battleArchive(atBoss).chapters.find(c=>c.id===3);
 const wildNew=new Set();const fresh=mk({});for(let d=1;d<60;d++){fresh.battle.wild=null;B.ensureWild(fresh,`2027-02-${d}`).list.forEach(w=>wildNew.add(w.base));}
 return {wins,seeded,stages:ch?.stages,art,lockedBefore,open31,lockedBoss,ratio:Math.round(f.ratio*100)/100,weakHit:f.weakHit,heroParty:f.heroParty,st:typeof st==='string'?st:'ok',win:res?.report?.win??res?.win,wish:atBoss.wishEgg.stock,arch:{name:arch?.name,boss:!!arch?.bossStory?.after,clues:arch?.clueTotal},wild:[...wildNew]};});
assert.equal(r.wins,1,'打贏一場 +1');assert.equal(r.seeded,6,'舊存檔用通關次數＋野外勝場補');
assert.deepEqual(r.stages,['toy-bunny','glitch-gummy','melody-guard','director-giggle']);
assert(r.art.every(Boolean),'四張圖都在');assert.equal(r.lockedBefore,false);assert.equal(r.open31,true);assert.equal(r.lockedBoss,false);
assert(r.weakHit&&r.heroParty,'勇者小隊同時吃到剋制與小隊加成');assert(r.ratio>=1,`勇者小隊（好感 3）打得贏 165：${r.ratio}`);
assert.equal(r.st,'ok');assert.equal(r.win,true);assert.equal(r.wish,1,'首次打倒 Boss 送願望蛋');
assert.deepEqual(r.arch,{name:'故障的玩具星球',boss:true,clues:3});
assert(!r.wild.some(id=>['toy-bunny','glitch-gummy','melody-guard','director-giggle'].includes(id)),'新手野外不會遇到第三章');
// 地圖：第三章區塊出現
await p.click('#intro-ok');
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=5;s.dex={'001':{at:'x'},'002':{at:'x'},'003':{at:'x'}};s.battle={stages:{'thunder-king':{clears:1,stars:1}}};localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.waitForTimeout(400);
await p.evaluate(()=>document.getElementById('open-battle')?.click());await p.waitForTimeout(500);
const map=await p.locator('#battle-map').textContent();assert.match(map,/第 3 章 · 故障的玩具星球/);assert.match(map,/發條兔/);assert.doesNotMatch(map,/歡笑總監/,'Boss 還沒解鎖不顯示名字');
if(process.env.SHOT){await p.locator('#battle-map .battle-chapter').last().scrollIntoViewIfNeeded();await p.screenshot({path:process.env.SHOT});}
assert.equal(errs.length,0,errs.join('\n'));console.log('chapter 3 toy planet: data, unlock chain, art, hero party vs boss, first-boss wish egg, archive, wild no spoiler, map PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
