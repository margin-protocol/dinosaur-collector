// 第四章《花街無名帖》：資料、解鎖順序（接在歡笑總監後面）、圖檔與背景、三張願望紙條（線索）、Boss 故事、第四章食材掉落、地圖顯示
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const W=+process.env.W||390;
const ctx=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{const B=await import('/js/battle.js'),A=await import('/js/archive.js'),K=await import('/js/kitchen.js');
 const ids=['welcome-lantern','wild-taiko','faceless-mirror','faceless-float','nameless-book'];
 const ch=B.CHAPTERS.find(c=>c.id===4);
 const art=await Promise.all([...ids.map(id=>'/'+B.enemyArtPath(id)),'/'+ch.scene].map(u=>fetch(u).then(x=>x.ok)));
 const team=['110','111','112'];
 const mk=(stages)=>{const s={dex:Object.fromEntries(team.map(n=>[n,{at:'x',dup:1}])),affection:Object.fromEntries(team.map(n=>[n,{pts:150}])),wishEgg:{stock:0},energy:0,fossils:0,battle:{stages,train:Object.fromEntries(team.map(n=>[n,5]))}};B.ensureBattle(s);return s;};
 const before=mk({'director-giggle':{clears:0}}),after=mk({'director-giggle':{clears:1}});
 const all=Object.fromEntries(['director-giggle',...ids.slice(0,4)].map(id=>[id,{clears:1}]));const atBoss=mk(all);
 const f=B.forecast(atBoss,team,'wild-taiko');
 const t0=new Date('2026-11-22T10:00:00');const st=B.startBattle(atBoss,'wild-taiko',team,{now:t0,rand:()=>0.1});
 const drops=typeof st==='string'?st:st.report.loot.ingredients;
 const ch4ing=K.INGREDIENTS.filter(i=>i.chapter===4).map(i=>i.id);
 const notes=A.battleArchive(mk({...all,'nameless-book':{clears:1}})).chapters.find(c=>c.id===4);
 return {stages:ch.stages,name:ch.name,art,locked41:B.unlocked(before,'welcome-lantern'),open41:B.unlocked(after,'welcome-lantern'),lockedBoss:B.unlocked(after,'nameless-book'),openBoss:B.unlocked(atBoss,'nameless-book'),
  weakHit:f.weakHit,st:typeof st==='string'?st:'ok',drops,ch4ing,boss:ids.filter(id=>B.ENEMIES[id].boss),story:!!B.ENEMIES['nameless-book'].story?.after,
  clues:notes.clues.map(c=>c.stage),paper:notes.clues.filter(c=>/願望紙條/.test(c.text)).length,after:!!notes.bossStory?.after,total:K.COMBO_TOTAL};});
assert.deepEqual(r.stages,['welcome-lantern','wild-taiko','faceless-mirror','faceless-float','nameless-book']);assert.equal(r.name,'花街無名帖');
assert(r.art.every(Boolean),'五張怪物圖＋月見町背景都在');
assert.equal(r.locked41,false,'沒打倒歡笑總監前鎖住');assert.equal(r.open41,true);assert.equal(r.lockedBoss,false);assert.equal(r.openBoss,true);
assert.deepEqual(r.boss,['nameless-book']);assert(r.story,'Boss 有戰前戰後故事');
assert(r.weakHit,'月見町小湘剋制亂奏太鼓');assert.equal(r.st,'ok');
assert.equal(r.ch4ing.length,4);assert(r.drops.length&&r.drops.every(id=>r.ch4ing.includes(id)),`第四章掉第四章食材：${r.drops}`);
assert.deepEqual(r.clues,['4-1','4-2','4-3','4-4']);assert.equal(r.paper,3,'4-2～4-4 各一張願望紙條');assert(r.after);assert.equal(r.total,680);
// 地圖：第四章區塊出現、Boss 未解鎖不劇透
await p.click('#intro-ok');
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=30;s.dex={'001':{at:'x'},'002':{at:'x'},'003':{at:'x'}};s.battle={stages:{'director-giggle':{clears:1,stars:1}}};localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.waitForTimeout(400);
await p.evaluate(()=>document.getElementById('open-battle')?.click());await p.waitForTimeout(500);
const map=await p.locator('#battle-map').textContent();assert.match(map,/第 4 章 · 花街無名帖/);assert.match(map,/迎客燈籠妖/);assert.doesNotMatch(map,/無名之簿/,'Boss 還沒解鎖不劇透');
if(process.env.SHOT){await p.locator('#battle-map .battle-chapter').last().scrollIntoViewIfNeeded();await p.waitForTimeout(300);await p.screenshot({path:process.env.SHOT});}
assert.equal(errs.length,0,errs.join('\n'));console.log('chapter 4 tsukimi: data, unlock chain, art+scene, three wish notes, boss story, ch4 drops, map PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
