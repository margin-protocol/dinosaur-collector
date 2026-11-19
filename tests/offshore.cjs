// 離島：澎湖、馬祖、金門的位置判斷；澎湖/馬祖小湘對應縣市；環島只算本島 19 縣市
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{
  const g=await import('/js/geo.js');const t=await import('/js/travel.js');const a=await import('/js/achievements.js');const e=await import('/js/eggs.js');
  const art=await Promise.all(['092-matsu','093-penghu','094-kinmen'].map(n=>fetch(`/assets/characters/siang-${n}.webp`).then(x=>x.ok)));
  const ach=(a.ACHIEVEMENTS||[]).find(x=>x.id==='travel-19');const hop=(a.ACHIEVEMENTS||[]).find(x=>x.id==='island-hop');
  const visits={'澎湖縣':{},'連江縣':{},'金門縣':{},'綠島':{},'臺中市':{}};
  return {ph:g.offshoreAt(119.58,23.57),mz:g.offshoreAt(119.93,26.15),km:g.offshoreAt(118.32,24.43),tc:g.offshoreAt(120.68,24.13),
    cc:[e.COUNTY_CHARACTER?.['澎湖縣'],e.COUNTY_CHARACTER?.['連江縣'],e.COUNTY_CHARACTER?.['金門縣']],art,main:g.MAIN_ISLAND.size,
    round:ach?.value({travel:{visits}}),hop:hop?.value({travel:{visits}}),names:[e.CHARACTERS?.['092']?.name,e.CHARACTERS?.['093']?.name,e.CHARACTERS?.['094']?.name]};
});
assert.equal(r.ph,'澎湖縣');assert.equal(r.mz,'連江縣');assert.equal(r.km,'金門縣');assert.equal(r.tc,null);
assert.deepEqual(r.cc,['093','092','094']);assert.deepEqual(r.art,[true,true,true]);assert.equal(r.main,19);
assert.equal(r.round,1,'only 臺中市 counts toward 環島');assert.equal(r.hop,3);
assert.deepEqual(r.names,['馬祖小湘','澎湖小湘','金門小湘']);
assert.equal(errs.length,0,errs.join('\n'));
console.log('offshore: penghu/matsu/kinmen boxes, county map, art, 環島 main-island only PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
