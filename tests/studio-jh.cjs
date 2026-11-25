// 頁邊江湖三寶（湘 11/26）：討伐頁茶肆卡、墨點、修門、劇場自動播；SHOT=dir W=360 出截圖
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const W=+process.env.W||390,SHOT=process.env.SHOT;
const ctx=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:SHOT?2:1});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const KEY='siang-collector:v1';
async function setup(fn,{open='open'}={}){
  await p.evaluate(({fn,open})=>{const s=JSON.parse(localStorage.getItem('siang-collector:v1'));s.hatched=30;
    const team=['001','002','003','004','005','006'];s.dex=Object.fromEntries(team.map(n=>[n,{at:'x',dup:5}]));s.battle={stages:{},train:{}};s.clock={offset:0,seen:Date.now()};
    s.events={mo:{stages:Object.fromEntries(['mo-01','mo-02','mo-03','mo-04','mo-05'].map(id=>[id,{clears:1,stars:3,best:1500}])),tokens:0,story:{'mo-06:before':'x'}}};
    (new Function('s',fn))(s);localStorage.setItem('siang-collector:v1',JSON.stringify(s));
    localStorage.setItem('siang-collector:event-start-test',new Date(Date.now()-80*3600e3).toISOString());localStorage.setItem('siang-collector:test-studio-open',open);},{fn,open});
  await p.reload();await p.waitForTimeout(300);
  await p.evaluate(async()=>{const E=await import('/js/events.js');E.EVENT_DEFS.mo.start=localStorage.getItem('siang-collector:event-start-test');});
  await p.evaluate(()=>document.getElementById('open-battle')?.click());await p.waitForTimeout(600);
}
const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
const shot=async(name,sel)=>{if(!SHOT)return;await p.evaluate(s=>document.querySelector(s)?.scrollIntoView({block:'center'}),sel);await p.waitForTimeout(300);await p.screenshot({path:`${SHOT}/${name}-${W}.png`});};
// 還沒開放：沒有茶肆、沒有墨點
await setup('',{open:'closed'});
assert.equal(await p.locator('.studio-card').count(),0);assert.equal(await p.locator('.studio-ink').count(),0);
// 開放
await setup('');
assert.equal(await p.locator('.event-hub .studio-card').count(),1,'茶肆卡');
assert.equal(await p.locator('.event-hub .studio-ink').count(),4,'活動頁四滴（墨玉閣另一滴）');
assert.equal(await p.locator('[data-event-stage="mo-06"] .studio-ink').count(),1);
await shot('card','.studio-card');
// 點關卡卡片上的墨點不會進關卡
await p.locator('[data-event-stage="mo-06"] .studio-ink').click();await p.waitForTimeout(500);
assert.match(await p.locator('.studio-bubble').textContent(),/桃源村的山魈/);assert.match(await p.locator('.studio-bubble small').textContent(),/？？？ · 江湖傳聞 1 \/ 5/);
assert.equal(await p.locator('.studio-bubble.is-unknown').count(),1,'還沒遇見＝剪影');
console.log('bubble',await p.locator('.studio-bubble').boundingBox(),await p.evaluate(()=>getComputedStyle(document.querySelector('.studio-bubble')).position));await shot('rumor','.studio-card');
assert.equal(await p.locator('.event-hub').count(),1,'還在活動列表');
for(const id of ['banner','keepsake','door']){await p.locator(`.studio-ink--${id}`).click();await p.waitForTimeout(500);}
assert.equal(await p.locator('.studio-ink').count(),0);
assert.match(await p.locator('.studio-card__book').textContent(),/江湖傳聞 4 \/ 5/);
await p.click('.event-banner__shop');await p.waitForTimeout(300);
await p.locator('.studio-ink--shop').click();await p.waitForTimeout(500);
assert.match(await p.locator('.studio-bubble').textContent(),/潤飾了一下事實/);
let s=await save();assert.ok(s.gifts.eggs.some(e=>e.character==='MO-009'&&e.from==='studio:MO-009'),'送皮寶蛋');
// 修門：扶一把 → 明天再來
await setup('');
await p.click('.studio-card__act');await p.waitForTimeout(500);
assert.match(await p.locator('.studio-bubble').textContent(),/門別推/);
assert.match(await p.locator('.studio-card__act').textContent(),/明天再來/);
await shot('door-1','.studio-card');
s=await save();assert.equal(s.studioJh.door.length,1);
// 三天都扶過＋破廟打過 → 裝上門板 → 德寶蛋
await setup("s.studioJh={door:['2026-11-29','2026-11-30','2026-12-01']}");
assert.match(await p.locator('.studio-card__act').textContent(),/裝上門板/);
await p.click('.studio-card__act');await p.waitForTimeout(500);
assert.match(await p.locator('.studio-bubble').textContent(),/技術債/);
s=await save();assert.ok(s.gifts.eggs.some(e=>e.character==='MO-010'),'送德寶蛋');
// 兩寶都到手 → 自動播〈江湖開業第一日〉，之後有提示與重看
await setup("s.dex['MO-009']={at:'x'};s.dex['MO-010']={at:'x'};s.studioJh={door:['a','b','c'],granted:{'MO-009':'x','MO-010':'x'}}");
await p.waitForTimeout(500);
assert.equal(await p.locator('#chapter-epilogue[open]').count(),1,'開業第一日');
await p.evaluate(()=>document.getElementById('chapter-epilogue').close());await p.waitForTimeout(400);
assert.match(await p.locator('.studio-card__hint').textContent(),/合在一起/);
assert.match(await p.locator('.studio-card__replay').textContent(),/江湖開業第一日/);
await shot('done','.studio-card');
// 湘寶到手 → 〈不祥的金光〉
await setup("s.dex['MO-009']={at:'x'};s.dex['MO-010']={at:'x'};s.dex['MO-011']={at:'x'};s.studioJh={door:['a','b','c'],granted:{'MO-009':'x','MO-010':'x'},seen:{opening:'x'}}");
await p.waitForTimeout(500);
assert.equal(await p.locator('#chapter-epilogue[open]').count(),1,'不祥的金光');
await p.evaluate(()=>document.getElementById('chapter-epilogue').close());await p.waitForTimeout(400);
s=await save();assert.ok(s.studioJh.seen.merge);assert.equal(await p.locator('.studio-card__hint').count(),0);
assert.deepEqual(errs,[]);console.log('studio-jh.cjs: PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
