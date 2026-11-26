// 墨痕蛋孵出 SSR／UR 時播江湖出貨演出；可跳過、存檔先寫好；非 SSR 不播
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const key='siang-collector:v1';
(async()=>{const b=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const run=async(width,rnd,{skip=true,shot=false}={})=>{const c=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();await p.locator('#intro').waitFor({state:'hidden'});
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.egg={id:'mohen',warmth:150,since:'mo-fx-fixture'};localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();
await p.locator('#enter-incubator').click();await p.evaluate(v=>{Math.random=()=>v;},rnd);await p.locator('#cultivate').click();await p.locator('#analysis').waitFor();await p.locator('#hatch-skip').click();await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).hatched===1,key);
const s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);const no=Object.keys(s.dex).find(n=>s.dex[n].story?.egg==='mohen');assert(no,'mohen hatch saved');
const rarity=await p.evaluate(async n=>(await import('./js/eggs.js')).CHARACTERS[n].rarity,no);
const fx=p.locator('.mo-fx');
if(rarity==='SSR'||rarity==='UR'){await fx.waitFor();assert(!(await p.locator('#reveal').evaluate(d=>d.open)),'reveal waits for the show');
 if(shot){await p.waitForTimeout(2600);await p.screenshot({path:`docs/review/mo-ssr-fx-${width}.png`});}
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if(skip) await p.locator('.mo-fx__skip').click(); await fx.waitFor({state:'detached',timeout:6000});}
else{await p.waitForTimeout(300);assert.equal(await fx.count(),0,'no show below SSR');}
await p.locator('#reveal').waitFor();assert.equal(errors.length,0,errors.join('\n'));await c.close();return {no,rarity};};
for(const w of [360,390,430]){const r=await run(w,.1,{shot:true});assert.match(r.rarity,/SSR|UR/);console.log(`${w}px: ${r.no} ${r.rarity} show + skip PASS`);}
const auto=await run(390,.1,{skip:false});console.log(`auto-finish ${auto.no} PASS`);
const low=await run(390,.5);assert(!/SSR|UR/.test(low.rarity));console.log(`${low.no} ${low.rarity}: no show PASS`);
await b.close();})().catch(e=>{console.error(e);process.exit(1)});
