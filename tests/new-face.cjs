// 少一點重複：沒遇過的小湘權重 ×2；連續重複 3 次下一顆必新；指定／縣市蛋不受影響；孵化會記連續重複次數
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{const m=await import('/js/eggs.js');
  const pool=m.EGGS.ordinary.pool;const all=Object.keys(pool);
  const dexAllBut=(keep)=>Object.fromEntries(all.filter(n=>!keep.includes(n)).map(n=>[n,{at:'x'}]));
  // pity: 只剩 051 沒遇過，連續重複 3 次 → 一定 051
  const pity=Array.from({length:200},()=>m.rollFor({id:'ordinary'},[], {dex:dexAllBut(['051']),dupStreak:3}));
  // 沒到保底：051 機率約 0.35%×2，200 次大多不是 051
  const normal=Array.from({length:2000},()=>m.rollFor({id:'ordinary'},[], {dex:dexAllBut(['051']),dupStreak:0})).filter(x=>x==='051').length;
  // 新面孔 ×2：只遇過原味，原味機率下降
  const T=Object.values(pool).reduce((a,b)=>a+b);const base001=pool['001']/T;
  const n=20000;const got=Array.from({length:n},()=>m.rollFor({id:'ordinary'},[], {dex:{'001':{at:'x'}}})).filter(x=>x==='001').length/n;
  const fixed=[m.rollFor({id:'keepsake',character:'015'},[], {dex:{},dupStreak:9}),m.rollFor({id:'county',county:'臺中市'},[], {dex:{},dupStreak:9})];
  const full=m.rollFor({id:'date'},[], {dex:{'014':{},'042':{},'083':{},'084':{},'107':{}},dupStreak:5}); // 全遇過：照原本池
  const lows=Object.keys(pool).filter(n=>!['SR','SSR','UR'].includes(m.CHARACTERS[n].rarity));
  const srPity=Array.from({length:300},()=>m.rollFor({id:'ordinary'},[], {dex:{},srStreak:9})).every(n=>['SR','SSR','UR'].includes(m.CHARACTERS[n].rarity));
  const srBoth=Array.from({length:200},()=>m.rollFor({id:'ordinary'},[], {dex:dexAllBut(['051']),dupStreak:3,srStreak:9})).every(n=>n==='051');
  const srBefore=Array.from({length:500},()=>m.rollFor({id:'ordinary'},[], {dex:{},srStreak:8})).some(n=>lows.includes(n));
  return {srPity,srBoth,srBefore,pity:new Set(pity).size===1&&pity[0]==='051',normal,base001,got,fixed,full,flags:[m.isRandomEgg({id:'ordinary'}),m.isRandomEgg({id:'keepsake',character:'015'}),m.isRandomEgg({id:'county',county:'臺中市'}),m.isRandomEgg({id:'date',character:'083'})]};});
assert.ok(r.pity,'保底一定是新面孔');assert.ok(r.srPity,'第 10 顆必 SR');assert.ok(r.srBoth,'兩個保底一起：沒遇過的 SR');assert.ok(r.srBefore,'第 9 顆還不保底');assert.ok(r.normal<60,'沒保底時不會一直出新面孔 '+r.normal);
assert.ok(r.got<r.base001*0.7,`遇過的原味機率下降 ${r.got} vs ${r.base001}`);
assert.deepEqual(r.fixed,['015','023']);assert.ok(['014','042','083','084','107'].includes(r.full));assert.deepEqual(r.flags,[true,false,false,false]);
// 孵化記連續重複
const key='siang-collector:v1';await p.click('#intro-ok');
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));const m=['001','005','007','008'];s.dex=Object.fromEntries(Object.keys({'001':1,'002':1,'003':1,'004':1,'005':1,'006':1,'007':1,'008':1,'009':1,'010':1,'011':1,'012':1,'013':1}).map(n=>[n,{at:'x'}]));s.hatched=5;s.dupStreak=0;s.egg={id:'ordinary',warmth:999,since:new Date().toISOString()};localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.evaluate(()=>{location.hash='incubate';document.querySelectorAll('dialog[open]').forEach(d=>d.close());});await p.waitForTimeout(500);
await p.click('#cultivate');await p.locator('#reveal').waitFor();await p.waitForTimeout(300);
const s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.ok(Number.isInteger(s.dupStreak)&&Number.isInteger(s.srStreak),'記下連續重複與沒出 SR 次數');
// 機率表
await p.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());location.hash='incubate';});await p.waitForTimeout(300);
await p.click('#open-eggs');await p.click('[data-cat="ordinary"]');await p.click('[data-odds="ordinary"]');await p.locator('#egg-odds[open]').waitFor();
const odds=await p.textContent('#egg-odds-body');assert.match(odds,/SSR/);assert.match(odds,/原味小湘/);assert.match(odds,/？？？（No\.\d+）/);assert.match(odds,/沒出 SR 以上/);
const sum=await p.evaluate(()=>[...document.querySelectorAll('.egg-odds__rarity span')].map(s=>parseFloat(s.textContent.match(/基本 ([\d.]+)%/)[1])).reduce((a,b)=>a+b));assert.ok(Math.abs(sum-100)<1.5,'稀有度加總約 100% '+sum);
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT});
await p.click('#close-egg-odds');await p.locator('#egg-picker[open]').waitFor();assert.equal(await p.textContent('#egg-picker-title'),'普通蛋','關掉機率表回到原本的分類');
assert.equal(errs.length,0,errs.join('\n'));
console.log('new-face: ×2 for unmet Siangs, pity after 3 dupes, fixed eggs untouched, streak saved PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
