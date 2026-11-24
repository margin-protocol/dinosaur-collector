// 特訓改格子（依系列／稀有度分組）＋討伐首頁顯示常用隊伍（玩家 11/24）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const width=Number(process.env.W||360);
const c=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';
await p.goto('http://127.0.0.1:8000');if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');await p.waitForTimeout(400);
await p.evaluate(async k=>{const {CHARACTERS}=await import('/js/eggs.js');const s=JSON.parse(localStorage.getItem(k));
const nos=Object.keys(CHARACTERS).filter((n,i)=>i%3!==2);s.dex={};s.affection={};nos.forEach(n=>{s.dex[n]={at:'2026-11-10T00:00:00Z',dup:0};s.affection[n]={pts:0};});
['001','002','005','003','071','074'].forEach(n=>{s.dex[n]={at:'2026-11-10T00:00:00Z',dup:0};s.affection[n]={pts:160};});s.affection['074']={pts:60};
s.hatched=nos.length;s.tutorial=null;s.battle=s.battle||{};s.battle.badges=4;s.battle.train={'010':5};s.battle.rest={'003':new Date(Date.now()+30*60e3).toISOString()};
s.teamBonds={unlocked:{dessert:'2026-11-20T00:00:00Z'},presets:[{name:'布丁三人組',nos:['001','002','005']},null,{name:'雨天隊',nos:['003','071','074']},null,null]};
localStorage.setItem(k,JSON.stringify(s));localStorage.removeItem('siang-collector:train-group:v1');},key);
await p.reload();await p.waitForTimeout(600);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.click('#home-errand');await p.click('#tab-battle');
// 常用隊伍在隱藏羈絆圖鑑上面，預設展開
const g=await p.evaluate(()=>{const host=document.querySelector('#team-presets-glance');return{before:host.nextElementSibling.id,open:host.querySelector('details').open,sum:host.querySelector('summary').textContent,rows:[...host.querySelectorAll('.team-glance__row')].map(r=>({name:r.querySelector('b').textContent,faces:r.querySelectorAll('.team-glance__face').length,away:r.querySelectorAll('.team-glance__face.is-away').length,max:r.querySelectorAll('.team-glance__face.is-max').length,bond:r.querySelector('.team-glance__bond').className+'|'+r.querySelector('.team-glance__bond').textContent}))};});
assert.equal(g.before,'team-bond-atlas');assert(g.open);assert.match(g.sum,/2 \/ 5/);
assert.deepEqual(g.rows.map(r=>r.name),['布丁三人組','雨天隊']);
assert.equal(g.rows[0].faces,3);assert.equal(g.rows[0].max,3);assert.match(g.rows[0].bond,/is-bond\|✦ 布丁保衛戰/);
assert.equal(g.rows[1].away,1);assert.equal(g.rows[1].max,2);assert.match(g.rows[1].bond,/is-wait\|還差 彩虹 Lv\.3/);
assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no h-scroll battle');
// 收合會記住
await p.click('#team-presets-glance summary');await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>localStorage.getItem('siang-collector:preset-glance:v1')),'closed');
// 特訓格子：預設依系列，系列照 SERIES 順序；組內戰力高到低
await p.click('#open-train');await p.waitForSelector('#train-list .train-tile');
const order=await p.evaluate(async()=>Object.values((await import('/js/eggs.js')).SERIES).map(s=>s.name));
const labels=await p.$$eval('#train-list .train-grid__label',ls=>ls.map(l=>l.textContent.split(' · ')[0]));
const idx=labels.map(l=>order.indexOf(l));assert(idx.every(i=>i>=0));assert.deepEqual(idx,[...idx].sort((a,b)=>a-b));
const pw=await p.$$eval('#train-list .train-grid',gs=>gs.map(g=>[...g.querySelectorAll('.train-tile__power')].map(x=>parseFloat(x.textContent.replace('戰力','')))));
for(const l of pw)assert.deepEqual(l,[...l].sort((a,b)=>b-a));
const total=await p.evaluate(async()=>{const s=JSON.parse(localStorage.getItem('siang-collector:v1'));return Object.keys(s.dex).length;});
assert.equal(await p.locator('#train-list .train-tile').count(),total);
// 滿級的按鈕停用；徽章 4 枚只能特訓 3 枚的
assert.equal(await p.locator('.train-tile[data-siang="010"] .train-tile__btn').textContent(),'滿級');
assert(await p.locator('.train-tile[data-siang="010"] .train-tile__btn').isDisabled());
assert.equal(await p.locator('.train-tile[data-siang="010"] .train-pips i.is-on').count(),5);
// 依稀有度：UR→N
await p.click('.train-groups__seg button:nth-child(2)');
const rl=await p.$$eval('#train-list .train-grid__label',ls=>ls.map(l=>l.textContent.split(' · ')[0]));
const R=['UR','SSR','SR','R','N'];assert.deepEqual(rl,R.filter(r=>rl.includes(r)));
assert.equal(await p.evaluate(()=>localStorage.getItem('siang-collector:train-group:v1')),'rarity');
assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no h-scroll train');
// 點按鈕特訓
await p.click('.train-tile[data-siang="001"] .train-tile__btn');await p.waitForFunction(()=>document.querySelectorAll('.train-tile[data-siang="001"] .train-pips i.is-on').length===1);
assert.equal(await p.locator('.train-tile[data-siang="001"] .train-pips i.is-on').count(),1);
assert.equal(await p.textContent('#battle-badges'),'1');
assert.match(await p.textContent('#train-status'),/特訓到 Lv\.1/);
assert.equal(await p.locator('.train-groups__seg button[aria-pressed="true"]').textContent(),'依稀有度');
assert.equal(errs.length,0,errs.join('\n'));console.log('train-grid: train grid by series/rarity, preset glance PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
