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
// 每張立繪與背景都載得到
const srcs=await p.evaluate(async()=>{const E=await import('/js/events.js');const eg=await import('/js/eggs.js');return [...Object.values(E.EVENT_DEFS.mo.stages).map(s=>s.scene),...['117','MO-001','MO-003','MO-004','MO-005','MO-006','MO-007','MO-008'].map(n=>`assets/characters/${eg.CHARACTERS[n].image}.webp`)];});
for(const s of srcs){const res=await p.request.get(`http://127.0.0.1:8000/${s}`);assert.equal(res.status(),200,s);}
assert.deepEqual(errs,[]);
console.log('event theater: 22 scripts, speakers parsed, art loads, skin B PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
