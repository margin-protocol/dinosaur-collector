// 首頁活動鍵：活動開跑後才出現，名字用活動名「墨痕江湖」，點了直接到討伐頁的活動區
// 預覽：LOOK=a|b|c THEME=sakura W=360 SHOT=dir
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const W=+process.env.W||390;
const ctx=await b.newContext({viewport:{width:W,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:process.env.SHOT?2:1});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const setup=async(hoursIn)=>{await p.evaluate(({hoursIn,look,theme})=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=30;
  s.dex=Object.fromEntries(['001','002','003','004','005'].map(n=>[n,{at:'x'}]));s.guide={...(s.guide||{}),unlocked:['errand','wheel','battle','archive']};
  localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:test-event-start:mo',new Date(Date.now()-hoursIn*3600e3).toISOString());
  if(theme)localStorage.setItem('siang-collector:theme:v1',theme);},{hoursIn,look:process.env.LOOK||'',theme:process.env.THEME||''});
  await p.reload();await p.waitForTimeout(300);
};
// 開跑前：沒有
await setup(-5);
assert.equal(await p.locator('.home-event').count(),0,'開跑前不顯示');
await setup(1);await p.waitForSelector('.home-event',{timeout:8000}).catch(()=>{});
const btn=p.locator('.home-event');assert.equal(await btn.count(),1,'開跑後出現');
assert.match(await btn.textContent(),/墨痕江湖/);
if(process.env.SHOT){await p.evaluate(()=>{const t=document.getElementById('tutorial-pause');if(t&&t.offsetParent)t.click();});await p.waitForTimeout(300);await p.evaluate(()=>{const b=document.querySelector('.home-event');if(b.classList.contains('home-event--c'))b.scrollIntoView({block:'center'});else window.scrollTo(0,0);});await p.waitForTimeout(300);await p.screenshot({path:`${process.env.SHOT}/home-${process.env.LOOK||'a'}-${W}.png`});}
await btn.click();await p.waitForTimeout(700);
assert.ok(await p.locator('#errand-dialog').evaluate(d=>d.open),'開了討伐');
assert.ok(await p.locator('.event-hub').isVisible(),'看得到活動區');
const over=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert.ok(over<=0,`overflow ${over}`);
assert.equal(errs.length,0,errs.join('\n'));console.log('home event button: hidden before start, 墨痕江湖 after, opens event hub PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
