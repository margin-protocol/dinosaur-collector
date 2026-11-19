// 約會午睡三部曲 083–085：083/084 在約會蛋、085 只能靠配方（083＋084 研究室調配 3 天）、圖檔、文案、台詞
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{const E=await import('/js/eggs.js'),R=await import('/js/lab.js'),I=await import('/js/intros.js'),B=await import('/js/bond-copy.js'),N=(await import('/js/nap-lines.js')).NAP_LINES,FO=await import('/js/fossils.js');
 const pools=n=>Object.entries(E.EGGS).filter(([,e])=>e.pool?.[n]).map(([id])=>id);
 const art=await Promise.all(['083','084'].map(n=>fetch(`/assets/characters/${E.CHARACTERS[n].image}.webp`).then(x=>x.ok)));
 const s={dex:{'083':{},'084':{}},gifts:{eggs:[]}},now=Date.parse('2026-11-20T12:00:00Z');
 R.startBrew(s,'sleepy-together-date',{now});const early=R.finishBrew(s,now+3*R.DAY_MS-1);
 const done=[R.finishBrew(s,now+3*R.DAY_MS)?.id];R.finishBrew(s,now+4*R.DAY_MS);
 if(early!==null||s.gifts.eggs.length!==1)throw new Error('lab must deliver one egg after three full days');
 const ok=['083','084','085'].every(n=>I.INTROS[n]&&I.MYSTERY_INTROS[n]&&B.BOND_STORIES[n]&&B.BOND_LINES[n][4]&&N[n].hatch&&N[n].victory);
 const pick=FO.pickable({dex:{}},E.EGGS,E.CHARACTERS).filter(n=>['083','084','085'].includes(n));
 return {p83:pools('083'),p84:pools('084'),p85:pools('085'),series:['083','084','085'].map(n=>E.CHARACTERS[n].series),art,done,egg:s.gifts.eggs[0],ok,pick,datePool:E.EGGS.date.pool};});
assert.deepEqual(r.p83,['date']);assert.deepEqual(r.p84,['date']);assert.deepEqual(r.p85,[],'085 不在任何蛋池');
assert.deepEqual(r.series,['date','date','recipe']);assert(r.art.every(Boolean));
assert.deepEqual(r.done,['sleepy-together-date']);assert.equal(r.egg.character,'085');assert.equal(r.egg.egg,'keepsake');
assert(r.ok);assert.deepEqual(r.pick,[],'化石不能指定約會小湘');assert.equal(Object.values(r.datePool).reduce((a,b)=>a+b),100);
assert.equal(errs.length,0,errs.join('\n'));console.log('nap trilogy 083–085: date egg, recipe keepsake, copy, lines, not fossil-pickable PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
