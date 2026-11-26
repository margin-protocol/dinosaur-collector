// 墨痕江湖劇情劇場（湘選 B 水墨卷軸）：二十段劇本都登記、每個講話的人都有名字、立繪載得到、關卡頁按鈕＋首通自動播
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await (await b.newContext({viewport:{width:360,height:740},isMobile:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const r=await p.evaluate(async()=>{const T=await import('/js/event-theater.js');const E=await import('/js/chapter-epilogue.js');const ids=T.buildStories('b');
  const bad=[];const imgs=new Set();for(const id of ids){const ep=E.epilogueFor(id);for(const x of E.resolveBeats(ep)){if(x.kind==='card')continue;if(!x.text)bad.push([id,'empty']);for(const [k] of x.cast)imgs.add(k);}}
  const foes=[];for(let i=1;i<=10;i++){const sid='mo-'+String(i).padStart(2,'0');const bs=E.resolveBeats(E.epilogueFor('mo:'+sid+':before'));const at=bs.findIndex(x=>x.cast.some(([k])=>/^mo_foe_|^mo_(刀客|斷刃使|牙商)$/.test(k)));foes.push(at>0&&bs.at(-1).cast.some(([k,side])=>side==='R'&&/foe|刀客|斷刃使|牙商/.test(k))?'ok':sid);}
  return {foes,n:ids.length,bad,imgs:[...imgs],skin:E.epilogueFor('mo:mo-01:before').skin,line:T.parseLine('聞止水：「……這也需要救命？」'),nar:T.parseLine('（鑼鼓聲停了。）')};});
assert.equal(r.n,22,'十關×2＋頁邊江湖兩段');assert.deepEqual(r.foes,Array(10).fill('ok'),'每關小怪登場後站右邊');assert.deepEqual(r.bad,[]);assert.equal(r.skin,'b');
assert.deepEqual(r.line,{who:'mo_聞止水',text:'「……這也需要救命？」'});assert.deepEqual(r.nar,{text:'鑼鼓聲停了。'});
for(const k of ['mo_小湘','mo_聞止水','mo_刀客'])assert.ok(r.imgs.includes(k),k);
assert.ok(!r.imgs.includes('mo_莊主'),'沒立繪的不上台');
// 湘 11/26：斷刃使打完後演到一半跳「上卷・完」又接著演＝卡一下。上卷／下卷結尾只在最後收成一張字卡，「X卷・完」不會變成打字的旁白
const tail=await p.evaluate(async()=>{const E=await import('/js/chapter-epilogue.js');return ['mo-05','mo-10'].map(sid=>{const bs=E.resolveBeats(E.epilogueFor('mo:'+sid+':after'));return {mid:bs.slice(0,-1).filter(x=>x.kind==='card'&&/完/.test(x.card)).length,typed:bs.filter(x=>x.kind==='line'&&/卷・完|江湖未歇|書頁無涯/.test(x.text)).length,last:bs.at(-1).card,sub:bs.at(-1).sub};});});
assert.deepEqual(tail.map(t=>[t.mid,t.typed,t.last]),[[0,0,'上卷・完'],[0,0,'下卷・完']]);
assert.equal(tail[0].sub,'紅妝未卸，江湖未歇。\n下卷・江湖不嫁。\n這一次，她們不再逃亡。');
// 開演就先載好會上場的立繪（斷刃使半路登場不用等圖）
await p.evaluate(async()=>{const E=await import('/js/chapter-epilogue.js');const d=document.createElement('dialog');d.id='pre';document.body.append(d);E.createEpilogueTheater({dialog:d}).play('mo:mo-05:before');});
await p.waitForFunction(()=>{const i=document.querySelector('#pre .epi__actor[data-key="mo_斷刃使"] img');return i&&i.complete&&i.naturalWidth>0;},null,{timeout:8000});
// 每張立繪與背景都載得到
const srcs=await p.evaluate(async()=>{const E=await import('/js/events.js');const eg=await import('/js/eggs.js');return [...Object.values(E.EVENT_DEFS.mo.stages).map(s=>s.scene),...['117','MO-001','MO-003','MO-004','MO-005','MO-006','MO-007','MO-008'].map(n=>`assets/characters/${eg.CHARACTERS[n].image}.webp`)];});
for(const s of srcs){const res=await p.request.get(`http://127.0.0.1:8000/${s}`);assert.equal(res.status(),200,s);}
assert.deepEqual(errs,[]);
console.log('event theater: 22 scripts, speakers parsed, art loads, skin B PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
