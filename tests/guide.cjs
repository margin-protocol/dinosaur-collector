// 玩家指引：新玩家功能逐步出現、新功能提示、第一次打開的小恐龍解說（只一次）、今天可以做的事、手記分組、已在玩的人全部解鎖
const {chromium,devices}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({...devices['Pixel 7'],reducedMotion:'reduce'});await c.addInitScript(()=>{window.__testGuide=true;});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(600);
// brand-new player: no 出門 / 轉盤 / 討伐 yet
let s=await save();assert.deepEqual(s.guide.unlocked,[]);
assert(await p.locator('#home-errand').isHidden());assert(await p.locator('#home-wheel').isHidden());
await p.click('#open-center');assert(await p.locator('#open-battle').isHidden());assert(await p.locator('#open-errands').isHidden());
assert.equal(await p.locator('.nav-group').count(),5);assert.match(await p.textContent('.nav-group'),/每天/);
await p.click('#close-center').catch(()=>p.keyboard.press('Escape'));
// first Siang → 出門 unlocks with a popup
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'x'}};s.hatched=1;s.tutorial=null;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['001']));},key);
await p.reload();await p.locator('#unlock-dialog[open]').waitFor({timeout:6000});assert.match(await p.textContent('#unlock-title'),/出門/);
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
await p.click('#unlock-go');await p.locator('#errand-dialog[open]').waitFor();
// first-open tip, once
await p.locator('.guide-tip[data-tip="errand"]').waitFor();assert(await p.locator('#errand-dialog .errand-tabs').isHidden(),'battle tab hidden while locked');
await p.click('.guide-tip[data-tip="errand"] .guide-tip__ok');await p.waitForTimeout(200);
s=await save();assert(s.guide.seen.includes('errand'));assert(s.guide.unlocked.includes('errand'));
await p.click('#close-errands');await p.click('#home-errand');await p.waitForTimeout(200);assert.equal(await p.locator('.guide-tip[data-tip="errand"]').count(),0,'tip only once');
await p.click('#close-errands');
// today checklist
await p.waitForTimeout(300);assert(await p.locator('#today-pill').isVisible());assert.match(await p.textContent('#today-pill'),/今天還有 \d+ 件事/);
await p.click('#today-pill');await p.locator('#today-dialog[open]').waitFor();
const items=await p.locator('.today-item b').allTextContents();assert(items.some(t=>/今日願望/.test(t)),items.join());assert(items.some(t=>/派小湘出門/.test(t)),items.join());
if(process.env.SHOT2){await p.waitForTimeout(200);await p.screenshot({path:process.env.SHOT2});}
await p.locator('.today-item:has-text("今日願望")').click();await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>location.hash),'#wish');
await p.locator('.guide-tip[data-tip="wish"]').waitFor();
// 3 Siangs → 轉盤 and 討伐
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.dex['005']={at:'x'};s.dex['016']={at:'x'};localStorage.setItem(k,JSON.stringify(s));},key);
await p.goto('http://127.0.0.1:8000/#home');await p.reload();await p.locator('#unlock-dialog[open]').waitFor({timeout:6000});
const first=await p.textContent('#unlock-title');await p.click('#unlock-later');await p.locator('#unlock-dialog[open]').waitFor({timeout:6000});const second=await p.textContent('#unlock-title');await p.click('#unlock-later');
assert.deepEqual([first,second].sort(),['新功能：小恐龍轉盤','新功能：討伐'].sort());
assert(await p.locator('#home-wheel').isVisible());
// established players get everything unlocked without popups
const est=await p.evaluate(async()=>{const g=await import('/js/guide.js');const s={hatched:5,dex:{'001':{},'002':{}}};g.ensureGuide(s);return s.guide.unlocked.length===g.GATED.length;});assert(est);
// guide page lists features
await p.click('#open-center');await p.click('#open-tutorial');await p.locator('#tutorial-guide[open]').waitFor();assert.match(await p.textContent('#guide-features'),/故事檔案館（還沒出現）/);
assert.equal(errs.length,0,errs.join('\n'));console.log('guide: gated features, unlock popups, one-time tips, today checklist, grouped journal, established unlock PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
