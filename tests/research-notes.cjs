// 研究筆記核心規則：角色門檻、排序去重、隱藏配方、資源不變
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({args:['--no-sandbox']});
 const p=await b.newPage();await p.goto('http://127.0.0.1:8000');
 const r=await p.evaluate(async()=>{
 const {studyPair}=await import('/js/research-notes.js');
 const make=ids=>({dex:Object.fromEntries(ids.map(no=>[no,{at:'x'}])),energy:99,fossils:10,hatched:4,gifts:{eggs:[]},recipes:{},egg:{id:'ordinary',warmth:20}});
 const s=make(['001','002','005','003','006']);
 const no=studyPair(s,'002','999');
 const a=studyPair(s,'005','002','2026-11-19T00:00:00.000Z');
 const b=studyPair(s,'002','005','2026-11-19T00:01:00.000Z');
 const c=studyPair(s,'003','006');
 const d=studyPair(s,'001','002');
 const e=studyPair(s,'001','006');
 const f=studyPair(s,'001','001');
 const locked=studyPair(make(['001','002']),'001','002');
 return {no,a,b,c,d,e,f,locked,state:s};
 });
 assert.equal(r.no.ok,false);assert.equal(r.locked.ok,false);assert.equal(r.f.ok,false);
 assert.equal(r.a.record.recipe,'strawberry-cake');assert.equal(r.b.repeat,true);
 assert.equal(r.c.record.recipe,'rain-garden');
 assert.equal(r.d.record.kind,'near');assert.equal(r.e.record.kind,'near');
 assert.equal(r.state.research.trials.length,4);
 assert.equal(r.state.energy,99);assert.equal(r.state.fossils,10);assert.equal(r.state.hatched,4);
 assert.deepEqual(r.state.gifts.eggs,[]);
 await b.close();console.log('research-notes rules PASS');
})().catch(e=>{console.error(e);process.exit(1)});
