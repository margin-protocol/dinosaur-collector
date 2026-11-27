// 信物櫃（湘 11/27 選 B 卷軸＋劇場）：點信物攤開卷軸看故事、沒拿到給謎面、「新」標點開就消失、保底剩幾場；
// 打贏掉信物 → 收下戰報跳「拾得信物」演出 → 看故事進信物劇場
// 預覽：W=360 THEME=sakura SHOT=dir
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const W=+process.env.W||390;
const ctx=await b.newContext({viewport:{width:W,height:800},isMobile:true,hasTouch:true,deviceScaleFactor:process.env.SHOT?2:1});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const shot=async(name)=>{if(process.env.SHOT)await p.screenshot({path:`${process.env.SHOT}/${name}-${W}.png`});};
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const start=async()=>{await p.reload();await p.waitForTimeout(300);if(await p.locator('#intro-ok').isVisible().catch(()=>false))await p.click('#intro-ok');
  await p.evaluate(async()=>{const E=await import('/js/events.js');E.EVENT_DEFS.mo.start=localStorage.getItem('siang-collector:event-start-test');});
  await p.evaluate(()=>document.getElementById('open-battle')?.click());await p.waitForTimeout(500);};
await p.evaluate(({theme})=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=30;
  const team=['001','002','003','004','005','006'];s.dex=Object.fromEntries(team.map(n=>[n,{at:'x',dup:5}]));s.battle={stages:{},train:Object.fromEntries(team.map(n=>[n,30]))};
  const now=Date.now();s.clock={offset:0,seen:now};
  s.events={mo:{stages:Object.fromEntries(['mo-01','mo-02','mo-03','mo-04','mo-05'].map(id=>[id,{clears:1,stars:3,best:1500}])),tokens:0,keepsakes:{'red-contract':new Date(now-86400e3).toISOString(),'ink-tassel':new Date(now).toISOString()},keepsakeSeen:{'red-contract':'x'},keepsakeMiss:2,story:{'mo-01:before':'x'}}};
  localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:event-start-test',new Date(now-80*3600e3).toISOString());
  if(theme)localStorage.setItem('siang-collector:theme:v1',theme);},{theme:process.env.THEME||''});
await start();
const box=p.locator('.event-keepsakes');
assert.match(await box.locator('.event-keepsakes__prog').textContent(),/信物 2 \/ 5.*最多再贏 4 場/);
assert.match(await box.locator('.event-keepsakes__reward').textContent(),/50 墨玉＋稱號「紅妝不嫁」/);
assert.equal(await box.locator('[data-keepsake="ink-tassel"] .event-keepsake__new').count(),1,'新拿到的掛「新」');
assert.equal(await box.locator('[data-keepsake="red-contract"] .event-keepsake__new').count(),0,'看過的不掛');
// 點劍穗：攤開卷軸、整段小劇情、▶ 劇場
await box.locator('[data-keepsake="ink-tassel"]').click();await p.waitForTimeout(400);
const sc=box.locator('.ks-scroll');assert.equal(await sc.isVisible(),true);
assert.match(await sc.textContent(),/墨色劍穗.*聞止水出戰時戰力 \+5%.*在。沒來得及。/s);
assert.equal(await sc.locator('.ks-lines__say b').first().textContent(),'小湘');
assert.equal(await box.locator('.event-keepsake__new').count(),0,'點開就拿掉「新」');
await p.waitForTimeout(300);
assert.ok((await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')).events.mo.keepsakeSeen))['ink-tassel'],'看過有存');
await p.evaluate(()=>{const e=document.querySelector('.event-keepsakes');let s=e.parentElement;while(s&&s.scrollHeight<=s.clientHeight+2)s=s.parentElement;if(s)s.scrollTop+=e.getBoundingClientRect().top-s.getBoundingClientRect().top-12;});await p.waitForTimeout(400);await shot('scroll');
const over=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert.ok(over<=0,`horizontal overflow ${over}`);
await sc.locator('.epilogue-cta').click();await p.waitForTimeout(400);
assert.equal(await p.locator('#chapter-epilogue[open]').count(),1,'劇場開了');
assert.equal(await p.locator('#chapter-epilogue .epi__card-img').isVisible(),true,'開場卡有信物圖');
assert.match(await p.locator('#chapter-epilogue .epi__card').textContent(),/墨色劍穗/);await shot('theater-card');
await p.evaluate(()=>document.getElementById('chapter-epilogue').close());
// 沒拿到：謎面
await box.locator('[data-keepsake="broken-bangle"]').click();await p.waitForTimeout(200);
assert.match(await sc.textContent(),/？？？.*謎面：似乎屬於另一位新娘/s);assert.doesNotMatch(await sc.textContent(),/青禾/,'故事鎖著');
// 再點同一件收起
await box.locator('[data-keepsake="broken-bangle"]').click();await p.waitForTimeout(100);assert.equal(await sc.isVisible(),false);
// 打贏重複關卡（保底到）→ 拾得演出
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.events.mo.keepsakeMiss=5;localStorage.setItem(k,JSON.stringify(s));});
await start();
await p.evaluate(()=>document.querySelector('.event-hub [data-event-stage="mo-01"]').click());await p.waitForTimeout(300);
if(await p.locator('#chapter-epilogue[open]').count())await p.evaluate(()=>document.getElementById('chapter-epilogue').close());
for(const no of ['001','002','003'])await p.click(`#battle-siangs [data-siang="${no}"]`);
await p.click('#battle-go');await p.waitForTimeout(300);
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));for(const a of s.battle.active)a.until=new Date(Date.now()-1000).toISOString();localStorage.setItem(k,JSON.stringify(s));});
await start();
await p.click('#battle-active .btn');await p.waitForTimeout(600);
const got=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')).events.mo.keepsakes);
assert.equal(Object.keys(got).length,3,'保底掉一件');
assert.match(await p.locator('#battle-result-story').textContent(),/拾得信物「.+」！收下戰報後打開看看/);
await p.evaluate(()=>document.getElementById('battle-result').close());await p.waitForTimeout(900);
const rv=p.locator('#keepsake-reveal[open]');assert.equal(await rv.count(),1,'拾得演出');
assert.match(await rv.textContent(),/拾 得 信 物.*已收 3 \/ 5/s);assert.equal(await rv.locator('.ks-reveal__dots img.is-new').count(),1);await shot('reveal');
await rv.locator('.ks-reveal__go').click();await p.waitForTimeout(400);
assert.equal(await p.locator('#keepsake-reveal[open]').count(),0);assert.equal(await p.locator('#chapter-epilogue[open]').count(),1,'接信物劇場');
await p.evaluate(()=>document.getElementById('chapter-epilogue').close());
assert.equal(errs.length,0,errs.join('\n'));console.log('keepsake story: scroll + hints + 新 + pity + theater + drop reveal PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
