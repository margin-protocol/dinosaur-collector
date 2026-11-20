// No.099 公民小湘（115 年九合一大選）：SSR、11/20–11/27 打開遊戲領紀念蛋、11/28 起進普通蛋池、11/28 投票日提醒只跳一次
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const key='siang-collector:v1';const errs=[];
const page=async(time,init='')=>{const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',timezoneId:'Asia/Taipei'});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));if(init)await p.addInitScript(init);await p.clock.install({time:new Date(time)});await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');return {c,p,save:()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)};};
const returning=async(p)=>{await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();};
// 資料
let {c,p,save}=await page('2026-11-21T10:00:00+08:00');
const r=await p.evaluate(async()=>{const E=await import('/js/eggs.js'),H=await import('/js/holidays.js'),I=await import('/js/intros.js'),B=await import('/js/bond-copy.js'),X=(await import('/js/extra-lines.js')).EXTRA_LINES;
  const c=E.CHARACTERS['099'];const at=(d)=>new Date(d+'T12:00:00');
  return {rarity:c.rarity,series:c.series,copy:!!(I.INTROS['099']&&I.MYSTERY_INTROS['099']&&B.BOND_STORIES['099']&&B.BOND_LINES['099'][5]&&X['099'].dispatch),
    art:await fetch(`/assets/characters/${c.image}.webp`).then(x=>x.ok),
    pool:['2026-11-27','2026-11-28','2027-03-01'].map(d=>Boolean(E.activePool(E.EGGS.ordinary,at(d))['099'])),
    events:['2026-11-19','2026-11-20','2026-11-27','2026-11-28'].map(d=>H.activeEvents(at(d)).length)};});
assert.deepEqual(r,{rarity:'SSR',series:'holiday',copy:true,art:true,pool:[false,true,true],events:[0,1,1,0]});
// 活動期間：打開就收到紀念蛋，只有一次
await returning(p);await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).gifts.eggs.some(e=>e.character==='099'),key,{timeout:8000});
let s=await save();assert.equal(s.gifts.eggs.filter(e=>e.character==='099').length,1);assert.ok(s.gifts.keepsakes.includes('civic-2026'));
await p.reload();await p.waitForTimeout(1500);s=await save();assert.equal(s.gifts.eggs.filter(e=>e.character==='099').length,1,'只領一次');
// 活動期間普通蛋孵不到
const inPool=await p.evaluate(async()=>{const E=await import('/js/eggs.js');return Array.from({length:3000},()=>E.rollFor({id:'ordinary'})).includes('099');});assert.equal(inPool,false);
await c.close();
// 活動前一天：沒有
({c,p,save}=await page('2026-11-19T10:00:00+08:00'));await returning(p);await p.waitForTimeout(2500);s=await save();assert.ok(!s.gifts.eggs.some(e=>e.character==='099'));await c.close();
// 投票日：提醒跳一次、不再領紀念蛋
({c,p,save}=await page('2026-11-28T09:00:00+08:00','window.__testVoteDay=true'));await returning(p);
await p.clock.runFor(4000);await p.locator('#vote-day[open]').waitFor({timeout:8000});
const text=await p.textContent('#vote-day');assert.match(text,/你去投票了嗎？還沒的話記得要去/);assert.match(text,/下午 4 點/);assert.match(text,/自己決定/);
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT});
await p.click('#vote-day-ok');await p.waitForTimeout(300);s=await save();assert.ok(s.notices.includes('vote-2026'));assert.ok(!s.gifts.eggs.some(e=>e.character==='099'),'投票日已經不能領');
await p.reload();await p.clock.runFor(5000);await p.waitForTimeout(300);assert.equal(await p.locator('#vote-day[open]').count(),0,'只跳一次');
await c.close();
assert.equal(errs.length,0,errs.join('\n'));
console.log('No.099 civic Siang: SSR, 11/20–27 login keepsake once, ordinary pool from 11/28, vote-day reminder once PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
