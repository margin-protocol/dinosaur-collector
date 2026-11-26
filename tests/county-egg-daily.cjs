// 遠行帶回縣市蛋：每天（本地日期）最多一顆（湘 11/26 從每週一顆放寬）；叫回退還當天機會；舊存檔 countyWeek 相容
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{
  const {depart,recall,ensureErrands}=await import('/js/errands.js');
  const at='2026-11-10T00:00:00Z';
  const state={dex:{'001':{at},'005':{at},'043':{at},'016':{at}},travel:{eggs:[]},errands:{countyWeek:'2026-11-23'}};
  const yes=()=>0;const out={};
  ensureErrands(state);out.migrated=state.errands.countyDay;out.oldGone=!('countyWeek' in state.errands);
  const d1=new Date(2026,10,26,9);const a=depart(state,{place:'faraway',nos:['001']},d1,yes);out.first=a.loot.county||null;
  const b2=depart(state,{place:'faraway',nos:['005']},new Date(2026,10,26,15),yes);out.sameDay=b2.loot.county||null;
  // 叫回第一趟 → 當天機會退還
  recall(state,a.id,new Date(2026,10,26,16));out.afterRecall=state.errands.countyDay;
  const c=depart(state,{place:'faraway',nos:['043']},new Date(2026,10,26,17),yes);out.afterRecallEgg=c.loot.county||null;
  state.errands.active=[];
  // 隔天（同一週）又能拿；凌晨 1 點也算新的一天（本地日期）
  const d=depart(state,{place:'faraway',nos:['016']},new Date(2026,10,27,1),yes);out.nextDay=d.loot.county||null;out.day=state.errands.countyDay;
  return out;});
assert.equal(r.migrated,'',JSON.stringify(r));assert(r.oldGone);
assert(r.first,'first trip of the day can bring a county egg');
assert.equal(r.sameDay,null,'second trip same day: no county egg');
assert.equal(r.afterRecall,'','recall refunds today');
assert(r.afterRecallEgg,'after recall, can get one again today');
assert(r.nextDay,'next day (same week) can get another');assert.equal(r.day,'2026-11-27');
assert.deepEqual(errs,[]);
console.log('county-egg-daily: one per day, recall refunds, old countyWeek ignored PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
