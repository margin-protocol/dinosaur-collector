// 異世活動（墨痕江湖）討伐頁入口：沒排日期不顯示；開跑後上卷可打、下卷倒數；打完上卷＋72h 開下卷；墨玉閣兌換聞止水專屬蛋
// 預覽：LOOK=a|b|c THEME=sakura W=360 SHOT=dir 會輸出 hub / down / shop 三張
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const W=+process.env.W||390;
const ctx=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:process.env.SHOT?2:1});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const H=3600e3;
async function setup({hoursIn,cleared=[],tokens=0}){
  await p.evaluate(({hoursIn,cleared,tokens,look,theme})=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=30;
    const team=['001','002','003','004','005','006'];s.dex=Object.fromEntries(team.map(n=>[n,{at:'x',dup:5}]));s.battle={stages:{},train:Object.fromEntries(team.map(n=>[n,5]))};
    const now=Date.now();s.clock={offset:0,seen:now};
    s.events={mo:{stages:Object.fromEntries(cleared.map(id=>[id,{clears:1,stars:3,best:1500}])),tokens}};
    localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:event-start-test',new Date(now-hoursIn*3600e3).toISOString());
    if(theme)localStorage.setItem('siang-collector:theme:v1',theme);},{hoursIn,cleared,tokens,look:process.env.LOOK||'',theme:process.env.THEME||''});
  await p.reload();await p.waitForTimeout(300);
  await p.evaluate(async()=>{const E=await import('/js/events.js');E.EVENT_DEFS.mo.start=localStorage.getItem('siang-collector:event-start-test');});
  await p.evaluate(()=>document.getElementById('open-battle')?.click());await p.waitForTimeout(500);
}
const shot=async(name,sel)=>{if(!process.env.SHOT)return;const l=p.locator(sel).first();await l.scrollIntoViewIfNeeded();await p.evaluate(s=>document.querySelector(s).scrollIntoView({block:'start'}),sel);await p.waitForTimeout(250);await p.screenshot({path:`${process.env.SHOT}/${name}-${process.env.LOOK||'a'}-${W}.png`});};
// 沒排日期：不顯示
await p.evaluate(()=>document.getElementById('open-battle')?.click());await p.waitForTimeout(400);
assert.equal(await p.locator('.event-hub').count(),0,'start:null 不顯示');
await p.keyboard.press('Escape');
// 開跑 1 小時
await setup({hoursIn:1});
const hub=p.locator('.event-hub');assert.equal(await hub.count(),1);
const txt=await hub.textContent();assert.match(txt,/十萬兩紅妝/);assert.match(txt,/墨玉 0/);assert.match(txt,/下卷・江湖不嫁 · .*後開放/);
assert.equal(await hub.locator('[data-event-stage="mo-01"]').isDisabled(),false);
assert.equal(await hub.locator('[data-event-stage="mo-02"]').isDisabled(),true);
assert.equal(await hub.locator('[data-event-stage="mo-06"]').isDisabled(),true);
await shot('hub','.event-hub');
// 打一場 MO-01，收戰報拿墨玉
await hub.locator('[data-event-stage="mo-01"]').click();await p.waitForTimeout(200);
for(const no of ['001','002','003'])await p.click(`#battle-siangs [data-siang="${no}"]`);
await p.click('#battle-go');await p.waitForTimeout(300);
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));for(const a of s.battle.active)a.until=new Date(Date.now()-1000).toISOString();localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.waitForTimeout(300);await p.evaluate(async()=>{const E=await import('/js/events.js');E.EVENT_DEFS.mo.start=localStorage.getItem('siang-collector:event-start-test');});
await p.evaluate(()=>document.getElementById('open-battle')?.click());await p.waitForTimeout(400);
await p.click('#battle-active .btn');await p.waitForTimeout(600);
assert.match(await p.locator('#battle-result-gains').textContent(),/墨玉 \+36/);
const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));
assert.equal(saved.events.mo.stages['mo-01'].clears,1);assert.equal(saved.battle.stages['event:mo:mo-01'],undefined);
await p.evaluate(()=>document.getElementById('battle-result').close());
// 上卷打完、過 72 小時：下卷開
await setup({hoursIn:73,cleared:['mo-01','mo-02','mo-03','mo-04','mo-05'],tokens:520});
assert.equal(await p.locator('.event-hub [data-event-stage="mo-06"]').isDisabled(),false);
assert.equal(await p.locator('.event-hub [data-event-stage="mo-07"]').isDisabled(),true);
await shot('down','.event-hub .event-phase:nth-of-type(2)');
// 墨玉閣
await p.click('.event-banner__shop');await p.waitForTimeout(200);
assert.equal(await p.locator('.event-shop').count(),1);
await shot('shop','.event-shop');
const wen=p.locator('.event-shop__item',{hasText:'聞止水'});await wen.locator('button').click();await p.waitForTimeout(400);
assert.match(await p.locator('#event-shop-status').textContent(),/聞止水/);
const s2=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));
assert.equal(s2.events.mo.tokens,20);assert.ok(s2.gifts.eggs.some(e=>e.character==='MO-001'));
assert.match(await wen.textContent(),/換完了/);
// 版面不超出手機寬
const over=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert.ok(over<=0,`horizontal overflow ${over}`);
assert.equal(errs.length,0,errs.join('\n'));console.log('event hub: hidden until scheduled, 上卷 open/下卷 countdown, 墨玉 drop, 72h unlock, 墨玉閣 Wen egg PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
