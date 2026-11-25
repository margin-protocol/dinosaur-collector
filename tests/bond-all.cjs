// 一鍵摸摸（湘 11/25）：入住的三位一次點到今天上限，照原本規則（每位每天 15 點、打招呼能量一次、摸頭能量每天 5 次）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const width=Number(process.env.W||390);
const c=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',deviceScaleFactor:process.env.SHOT?2:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');await p.waitForTimeout(400);
if(process.env.THEME)await p.evaluate(t=>localStorage.setItem('siang-collector:theme:v1',t),process.env.THEME);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'2026-11-10T00:00:00Z'},'005':{at:'2026-11-11T00:00:00Z'},'012':{at:'2026-11-12T00:00:00Z'},'020':{at:'2026-11-12T00:00:00Z'}};s.hatched=4;s.energy=0;s.tutorial=null;
  s.guide={seen:['battle','errand'],unlocked:['errand','wheel','battle','archive']};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['001','005','012']));},key);
await p.reload();await p.waitForTimeout(1500);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await p.waitForTimeout(300);
// 先點一下 005，讓她今天只剩 14
await p.locator('.resident-slot[data-character="005"] .resident-static').click();await p.waitForTimeout(600);
await p.locator('#bond-all').waitFor();assert.equal(await p.textContent('#bond-all-left'),'44');
if(process.env.SHOT){
  for(const v of (process.env.VARIANTS||'A').split(',')){
    // 預覽用：B＝右邊一排（跟紙條、轉盤同款），C＝左邊長膠囊（跟探索附近同款）
    await p.evaluate(v=>{const btn=document.getElementById('bond-all');
      if(v==='B'){const w=document.getElementById('home-wheel');btn.className='room-letter';btn.style.top=(w.offsetTop+46)+'px';btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg><span>摸摸</span><i class="letter-badge">44</i>';document.getElementById('companion-room').append(btn);}
      if(v==='C'){btn.className='explore-pill';btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg><span><b>一鍵摸摸</b><small>三位今天還能 ♡+44</small></span>';}
    },v);
    await p.waitForTimeout(300);await p.evaluate(()=>scrollTo(0,0));
    await p.screenshot({path:`${process.env.SHOT}-${v}.png`});
    await p.reload();await p.waitForTimeout(1300);await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  }
}
const before=await save();const e0=before.energy;
await p.click('#bond-all');await p.waitForTimeout(800);
const s=await save();
for(const no of ['001','005','012'])assert.equal(s.affection[no].today,15,`${no} filled to today cap`);
assert.ok(!s.affection['020']||!s.affection['020'].today,'non-resident untouched');
assert.ok(s.bonus.greets.ids.includes('001')&&s.bonus.greets.ids.includes('012'),'greets counted');
assert.equal(s.bonus.pets.count,5,'pet energy capped at 5/day');
assert.ok(s.energy-e0>=18,'greet +10 and 4 pets +8 at least'); // 兩位打招呼 +10、摸頭剩 4 次 +8，其餘來自升級獎勵
assert.ok(await p.locator('#bond-all').isHidden(),'button hides when nothing left');
await p.locator('#bond-up[open]').waitFor({timeout:4000}); // 15 點 → Lv.2 升級視窗照常出現
assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no horizontal scroll');
assert.equal(errs.length,0,errs.join('\n'));console.log('bond-all: residents filled to daily cap, normal energy rules, hides when done, level-up popup PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
