// 天氣小湘的委託：11/20 起每 4 天一則、11 位都會輪到、遇見過才由本人開口；圖鑑約會取得方式不再寫開發中
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{const w=await import('/js/wishes.js');const pr=await import('/js/wish-presenter.js');
  const owners=new Set();let before=0;
  for(let i=-30;i<60;i++){const d=new Date(Date.UTC(2026,10,20+i)).toISOString().slice(0,10);const t=w.wishesFor(d)[2];if(t.owner){if(d<'2026-11-20')before++;else owners.add(t.owner);}}
  const t=w.wishById('theme:c1');
  return {before,owners:[...owners].sort(),kind:t.kind,met:pr.presenterCopy(t,'2026-11-23','young','001',{'066':{}}),unmet:pr.presenterCopy(t,'2026-11-23','young','001',{})};});
assert.equal(r.before,0);assert.equal(r.owners.length,11);assert.equal(r.kind,'theme');
assert.equal(r.met.speaker,'陰天小湘');assert.match(r.met.line,/舒服的小角落/);
assert.notEqual(r.unmet.speaker,'陰天小湘');assert.doesNotMatch(r.unmet.line,/今天的委託/);
await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(300);await p.click('[data-dex-no="014"]');await p.locator('#dex-detail[open]').waitFor();
assert.doesNotMatch(await p.textContent('#dex-detail-how'),/開發中/);
assert.deepEqual(errs,[]);console.log('weather commissions ok');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
