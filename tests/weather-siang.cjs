// 天氣小湘 065–075：天氣分類、每天一顆天氣蛋、雨後彩虹、黃昏、觀測師、天氣蛋加成
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{
 const W=await import('/js/weather.js'),E=await import('/js/eggs.js');
 const kinds=[[0,0,0],[3,0,0],[45,0,0],[61,1,0],[95,1,0],[96,1,0],[73,0,0],[1,0,40]].map(a=>W.kindOf(...a));
 const s={};const day1=W.recordWeather(s,'clear','2026-11-20');const again=W.recordWeather(s,'rain','2026-11-20');const bow=W.recordWeather(s,'clear','2026-11-20');
 const boosts=W.weatherBoosts(s,'2026-11-20',new Date('2026-11-20T17:00:00')).map(x=>x.no);
 s.weather.seen=['rain','clear','fog','windy'];const obs=W.weatherBoosts(s,'2026-11-21',new Date('2026-11-21T10:00:00')).map(x=>x.no);
 const ids=['065','066','067','068','069','070','071','072','073','074','075'];
 const missing=ids.filter(n=>!E.CHARACTERS[n]||E.CHARACTERS[n].series!=='weather'||!E.EGGS.weather.pool[n]);
 let plain=0,boosted=0;for(let i=0;i<20000;i++){if(E.rollFor({id:'weather'})==='072')plain++;if(E.rollFor({id:'weather'},[{no:'072',times:4}])==='072')boosted++;}
 const imgs=await Promise.all(ids.map(n=>fetch(`/assets/characters/${E.CHARACTERS[n].image}.webp`).then(x=>x.ok)));
 return {kinds,day1,again,bow,boosts,obs,missing,plain,boosted,imgs,weather:s.weather};
});
assert.deepEqual(r.kinds,['clear','cloudy','fog','rain','thunder','hail','snow','windy']);
assert.equal(r.day1.egg,true,'晴天也送一顆天氣蛋');assert.equal(r.again.egg,false,'同一天只送一顆');
assert.equal(r.bow.rainbow,true);assert.equal(r.weather.rained,'2026-11-20');
assert.deepEqual(r.boosts,['068','074','075']);assert.deepEqual(r.obs,['065']);
assert.deepEqual(r.missing,[]);assert(r.boosted>r.plain*2.5,JSON.stringify(r));assert(r.imgs.every(Boolean));
// 圖鑑：天氣系列看得到新成員的剪影與線索
await p.locator('#intro-ok').click();
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=3;s.dex={'001':{at:'x'},'071':{at:'x'},'074':{at:'x'}};s.weather={date:null,kind:null,stock:1,granted:null,rained:null,seen:[]};localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(500);
const body=await p.locator('body').textContent();assert.match(body,/下雨小湘|彩虹小湘/);
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT,fullPage:true});
assert.equal(errs.length,0,errs.join('\n'));console.log('weather Siangs 065–075: kinds, daily egg, rainbow, sunset, observer, pool boosts, art, dex PASS');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
