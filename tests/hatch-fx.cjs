// 孵出 SSR／UR 的出貨演出：墨痕蛋播劍光（.mo-fx），其他蛋播櫻花書頁（.hfx）；可跳過、會自己結束、存檔先寫好；SSR 以下不播
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const key='siang-collector:v1';
(async()=>{const b=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const run=async(width,rnd,egg,{skip=true,shot=''}={})=>{const c=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();await p.locator('#intro').waitFor({state:'hidden'});
await p.evaluate(([k,e])=>{const s=JSON.parse(localStorage.getItem(k));s.egg={warmth:150,since:'fx-fixture',...e};localStorage.setItem(k,JSON.stringify(s));},[key,egg]);await p.reload();
await p.locator('#enter-incubator').click();await p.evaluate(v=>{Math.random=()=>v;},rnd);await p.locator('#cultivate').click();await p.locator('#analysis').waitFor();await p.locator('#hatch-skip').click();await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).hatched===1,key);
const s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);const no=Object.keys(s.dex).find(n=>s.dex[n].story?.egg===egg.id);assert(no,'hatch saved');
const rarity=await p.evaluate(async n=>(await import('./js/eggs.js')).CHARACTERS[n].rarity,no);
const fx=p.locator(egg.id==='mohen'?'.mo-fx':'.hfx');
if(rarity==='SSR'||rarity==='UR'){await fx.waitFor();assert.equal(await fx.getAttribute('data-rarity'),rarity);assert(!(await p.locator('#reveal').evaluate(d=>d.open)),'reveal waits for the show');
 if(shot){await p.waitForTimeout(2500);await p.screenshot({path:`docs/review/${shot}-${width}.png`});}
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if(skip) await fx.locator('button').click(); await fx.waitFor({state:'detached',timeout:6000});}
else{await p.waitForTimeout(300);assert.equal(await p.locator('.mo-fx,.hfx').count(),0,'no show below SSR');}
await p.locator('#reveal').waitFor();assert.equal(errors.length,0,errors.join('\n'));await c.close();return {no,rarity};};
for(const w of [360,390,430]){
 let r=await run(w,.1,{id:'mohen'},{shot:'mo-ssr-fx'});assert.match(r.rarity,/SSR|UR/);console.log(`${w}px mohen: ${r.no} ${r.rarity} sword show + skip PASS`);
 r=await run(w,.999,{id:'ordinary'},{shot:'hatch-fx-ssr'});assert.equal(r.rarity,'SSR');console.log(`${w}px ordinary: ${r.no} SSR sakura show + skip PASS`);
 r=await run(w,.5,{id:'ordinary',character:'109'},{shot:'hatch-fx-ur'});assert.equal(r.rarity,'UR');console.log(`${w}px fixed egg: ${r.no} UR show PASS`);}
const auto=await run(390,.1,{id:'mohen'},{skip:false});console.log(`mohen auto-finish ${auto.no} PASS`);
const auto2=await run(390,.999,{id:'ordinary'},{skip:false});console.log(`ordinary auto-finish ${auto2.no} PASS`);
const low=await run(390,.5,{id:'mohen'});assert(!/SSR|UR/.test(low.rarity));console.log(`${low.no} ${low.rarity}: no show PASS`);
const low2=await run(390,.5,{id:'ordinary'});assert(!/SSR|UR/.test(low2.rarity));console.log(`${low2.no} ${low2.rarity}: no show PASS`);
await b.close();})().catch(e=>{console.error(e);process.exit(1)});
