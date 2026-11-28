// 墨痕江湖商店 12/17 中午關門後：開遊戲時剩下的墨玉 1:1 換成能量，只換一次（重整不會再發）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const K='siang-collector:v1';
const read=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),K);
async function setSave(at,tokens){await p.evaluate(({k,at,tokens})=>{const s=JSON.parse(localStorage.getItem(k));s.energy=100;s.clock={offset:at-Date.now(),seen:at};s.events={...(s.events||{}),mo:{...(s.events?.mo||{}),tokens,leftoverAt:null}};localStorage.setItem(k,JSON.stringify(s));},{k:K,at,tokens});await p.reload();await p.waitForTimeout(800);}
// 商店還開著（12/17 11:00）：不換
await setSave(Date.parse('2026-12-17T11:00:00+08:00'),73);
let s=await read();assert.equal(s.events.mo.tokens,73,'商店開著墨玉還在');assert.equal(s.energy,100);assert.equal(s.events.mo.leftoverAt,null);
// 關門後（12/17 12:05）讀檔：73 墨玉換 73 能量
await setSave(Date.parse('2026-12-17T12:05:00+08:00'),73);
s=await read();assert.equal(s.events.mo.tokens,0,'墨玉清空');assert.equal(s.energy,173,'能量 +73');assert.ok(s.events.mo.leftoverAt,'記下換過');
await p.waitForTimeout(1000);assert.match(await p.locator('#toast').textContent(),/73 墨玉換成 \+73 能量/);
// 再重整：不會重複發
await p.reload();await p.waitForTimeout(800);s=await read();assert.equal(s.energy,173,'重整不重複發');assert.equal(s.events.mo.tokens,0);
assert.deepEqual(errs,[]);console.log('event-leftover ok');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
