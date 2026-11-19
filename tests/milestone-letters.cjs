// 第二批里程碑紙條：條件正確、id 不重複、達成後出現在紙條列表、未達成只算進「還有幾張」
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await (await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(400);
const r=await p.evaluate(async()=>{const L=await import('/js/letters.js');const E=await import('/js/eggs.js');const C=E.CHARACTERS;
  const ids=L.MILESTONE_LETTERS.map(m=>m.id);
  const base={dex:{'001':{}},player:{stats:{days:[],fed:0}},battle:{stages:{}},affection:{},hatched:1,letters:{read:[],mail:[]}};
  const on=(s)=>L.unlockedMilestones(s,C).map(m=>m.id);
  const days=n=>Array.from({length:n},(_,i)=>`2026-01-${String(i+1).padStart(2,'0')}`);
  const all=Object.fromEntries(Object.keys(C).map(no=>[no,{}]));
  const rich={dex:all,player:{stats:{days:[...days(31),...Array.from({length:70},(_,i)=>`2025-${i}`)],fed:1200}},battle:{stages:{'caramel-king':{clears:1},'thunder-king':{clears:2}}},affection:{'001':{pts:99999}},hatched:60,travel:{visits:{a:1}},weather:{rained:'x',granted:'x'},wishEgg:{days:['d']},letters:{read:[],mail:[]}};
  return {ids,dup:ids.length!==new Set(ids).size,fresh:on(base),rich:on(rich),total:ids.length,
    noBody:L.MILESTONE_LETTERS.filter(m=>!m.body||!m.hint||!m.title).map(m=>m.id),
    week:on({...base,player:{stats:{days:days(7),fed:0}}}),boss:on({...base,battle:{stages:{'caramel-king':{clears:1}}}})};});
assert.equal(r.dup,false);assert.deepEqual(r.noBody,[]);assert(r.total>=27,`total ${r.total}`);
assert.deepEqual(r.fresh,['first-hatch']);
assert.equal(r.rich.length,r.total,'everything unlocks for a completed save: '+r.ids.filter(i=>!r.rich.includes(i)));
assert(r.week.includes('one-week')&&!r.week.includes('one-month'));
assert(r.boss.includes('first-win')&&r.boss.includes('caramel-king')&&!r.boss.includes('thunder-king'));
// UI：達成 30 位後，紙條列表有「三十位小湘」
await p.evaluate(()=>{const k='siang-collector:v1';const s=JSON.parse(localStorage.getItem(k));s.tutorial=null;s.hatched=30;s.dex={};
  return import('/js/eggs.js').then(E=>{Object.keys(E.CHARACTERS).slice(0,30).forEach(no=>s.dex[no]={at:'2026-11-10T00:00:00Z'});localStorage.setItem(k,JSON.stringify(s));});});
await p.reload();await p.waitForTimeout(700);
await p.evaluate(()=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();});
await p.click('#home-letter');await p.waitForTimeout(300);
assert.match(await p.textContent('#letter-list'),/三十位小湘/);assert.match(await p.textContent('#letter-locked'),/還有 \d+ 張紙條/);
assert.deepEqual(errs,[]);console.log('milestone letters ok');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
