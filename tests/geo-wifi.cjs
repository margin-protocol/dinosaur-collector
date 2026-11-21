// 連 WiFi 定位失敗（11/21 湘回報）：低精確度失敗會改用 GPS 再試；都失敗時顯示提示與「再試一次」
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const key='siang-collector:v1';const W=Number(process.env.W||390);
const c=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
if(process.env.THEME)await c.addInitScript(t=>{try{localStorage.setItem('siang-collector:theme:v1',t)}catch{}},process.env.THEME);
// 假定位：mode=wifi-bad → 低精確度回 code 2、GPS 成功（臺中）；mode=all-bad → 都逾時
await c.addInitScript(()=>{window.__geoCalls=[];const geo={getCurrentPosition(ok,fail,opt){window.__geoCalls.push(opt);const mode=localStorage.getItem('geo-mode');setTimeout(()=>{if(mode==='all-bad'||!opt.enableHighAccuracy)fail({code:mode==='all-bad'?3:2,message:'x'});else ok({coords:{latitude:24.1372,longitude:120.6869}});},20);}};Object.defineProperty(navigator,'geolocation',{value:geo,configurable:true});});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/open-meteo\.com/,r=>r.abort());
await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();
await p.evaluate(k=>{localStorage.setItem('siang-collector:explore-intro:v1','1');localStorage.setItem('geo-mode','wifi-bad');const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};s.egg={id:'ordinary',warmth:0,since:'2026-11-16'};localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();if(await p.locator('#intro-ok').isVisible())await p.locator('#intro-ok').click();
await p.locator('#explore').click();await p.locator('#county-call[open]').waitFor({timeout:8000});
assert.match(await p.locator('#county-title').textContent(),/臺中市小湘想出現/);
const calls=await p.evaluate(()=>window.__geoCalls);assert.equal(calls.length,2);assert.equal(calls[0].enableHighAccuracy,false);assert.equal(calls[1].enableHighAccuracy,true);
assert(await p.locator('#county-retry').isHidden());await p.locator('#county-ok').click();
// 都失敗 → 提示＋再試一次
await p.evaluate(()=>{localStorage.setItem('geo-mode','all-bad');window.__geoCalls=[];});
await p.locator('#explore').click();await p.locator('#county-call[open]').waitFor();
assert.match(await p.locator('#county-title').textContent(),/訊號有點微弱/);
assert.match(await p.locator('#county-note').textContent(),/關掉 WiFi/);assert(await p.locator('#county-retry').isVisible());
if(process.env.SHOT){await p.waitForTimeout(400);await p.screenshot({path:process.env.SHOT});}
await p.evaluate(()=>localStorage.setItem('geo-mode','wifi-bad'));
await p.locator('#county-retry').click();await p.waitForTimeout(600);await p.locator('#county-call[open]').waitFor();
assert.doesNotMatch(await p.locator('#county-title').textContent(),/訊號有點微弱/);assert(await p.locator('#county-retry').isHidden());
assert.equal(errs.length,0,errs.join('\n'));console.log('geo wifi: GPS fallback, tips + retry PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
