// 請寶寶工作室喝杯茶（湘 11/25）：沒網址時正式服看不到入口；測試服看得到、按「我請過茶了」拿茶友稱號、戴上後顯示在等級旁、圖鑑多小茶杯
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const width=Number(process.env.W||360);
const c=await b.newContext({viewport:{width,height:800},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const skip=async()=>{for(let i=0;i<3;i++){if(await p.locator('#intro-ok').isVisible().catch(()=>false))await p.click('#intro-ok');await p.keyboard.press('Escape');await p.waitForTimeout(200);}};
// 正式服：TEA_URL 空的話入口全藏
await p.goto('http://127.0.0.1:8000');await p.waitForTimeout(800);await skip();
const {TEA_URL}=await p.evaluate(async()=>({TEA_URL:(await import('/js/tea.js')).TEA_URL}));
const visible=await p.$$eval('[data-tea-open]',bs=>bs.filter(b=>!b.hidden).length);
if(!TEA_URL)assert.equal(visible,0,'hidden without url');
// 隨機台詞：三寶都會出現，小湘兩隻立繪都會出現
const seen=await p.evaluate(async()=>{const t=await import('/js/tea.js');const ids=new Set(),nos=new Set();let last=null;for(let i=0;i<400;i++){const x=t.pickThanks(last);assert(x.line);ids.add(x.id);nos.add(x.no);last=x;}function assert(v){if(!v)throw new Error('empty line');}return {ids:[...ids].sort(),nos:[...nos].sort()};});
assert.deepEqual(seen.ids,['debao','pibao','siang']);assert.deepEqual(seen.nos,['025','078','086','087']);
// 測試服
await p.goto('http://127.0.0.1:8000/?test');await p.waitForTimeout(1200);await skip();
await p.click('#open-center');await p.waitForTimeout(300);
const entry=p.locator('[data-tea-open]:visible');assert.equal(await entry.count(),1,'one entry style');
await entry.click();await p.waitForTimeout(400);
assert(await p.locator('#tea-dialog[open]').count());assert((await p.textContent('#tea-line')).length>2);
assert(await p.locator('#tea-friend').isHidden());
await p.click('#tea-done');await p.waitForTimeout(600);
assert(await p.locator('#tea-friend').isVisible());assert.equal((await p.textContent('#tea-done')).trim(),'再請一杯');
await p.click('#tea-wear');await p.waitForTimeout(600);
assert.equal(await p.getAttribute('#tea-wear','aria-pressed'),'true');
assert((await p.textContent('#player-rank')).includes('｜茶友'),'title next to rank');
assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no hscroll');
await p.click('#close-tea');await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(500);
assert(await p.locator('#dex-count .dex__tea').count(),'dex cup');
// 戴活動稱號時茶友會被拿下（全遊戲只戴一個）
const one=await p.evaluate(async()=>{const ev=await import('/js/events.js');const s={events:{},studio:{teaFriend:'x',wornTitle:'tea-friend'}};ev.wearTitle(s,'mo',null);return [ev.wornTitle(s),s.studio.wornTitle??null];});
assert.deepEqual(one,[null,null]);
assert.equal(errs.length,0,errs.join('\n'));console.log('tea-support: hidden without url, test server entry, tea-friend title + dex cup PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
