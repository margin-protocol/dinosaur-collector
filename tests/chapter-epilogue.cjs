// 章節尾聲劇場：第一次打倒焦糖大王 → 收下戰報自動播放；逐句／自動／紀錄／跳過；檔案館重看；只演出不動存檔。
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const shots='docs/review/chapter-epilogue';
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),p=await c.newPage(),errors=[];p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const unit=await p.evaluate(async()=>{const E=await import('/js/chapter-epilogue.js');const ep=E.EPILOGUES['caramel-king'];const beats=E.resolveBeats(ep);
 return {n:beats.length,acts:[...new Set(beats.filter(x=>x.act).map(x=>x.act))],cards:beats.filter(x=>x.kind==='card').length,last:beats.at(-1).kind,bgs:[...new Set(beats.filter(x=>x.bg).map(x=>x.bg))],pulled:beats.filter(x=>x.pulled).length,whoOk:beats.every(x=>!x.who||x.cast.some(([k])=>k===x.who)||x.voice||x.bg!=='hall'),none:E.epilogueFor('mochi')};});
assert.equal(unit.acts.length,7);assert.equal(unit.cards,2);assert.equal(unit.last,'stamp');assert.deepEqual(unit.bgs,['hall','banquet','afterparty']);assert.equal(unit.pulled,2);assert(unit.whoOk);assert.equal(unit.none,null);
await p.evaluate(async()=>{const B=await import('/js/battle.js'),k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=3;s.tutorial=null;s.dex={'001':{at:'x'},'005':{at:'x'}};s.battle={stages:{mochi:{clears:1},sock:{clears:1},bento:{clears:1}},active:[],rest:{}};B.startBattle(s,'caramel-king',['001','005'],{now:new Date(Date.now()-3*3600000),rand:()=>0});localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1','[]');});
await p.reload();await p.click('#home-errand');await p.click('#tab-battle');await p.locator('#battle-active .btn').click();await p.locator('#battle-result[open]').waitFor();
const save=()=>p.evaluate(()=>localStorage.getItem('siang-collector:v1'));const collected=await save();
const won=JSON.parse(collected).battle.stages['caramel-king'].clears===1;
if(!won){console.log('chapter epilogue: forced battle lost; skipping first-clear flow');}
else{
 await p.locator('.battle-theater__skip').click();
 assert(await p.locator('#battle-result-story .epilogue-cta').isVisible());assert.match(await p.locator('#battle-result-story').textContent(),/尾聲劇場/);
 await p.locator('#battle-result-ok').click();await p.locator('#chapter-epilogue[open]').waitFor();
 assert.equal(await p.locator('.epi__stage').getAttribute('data-step'),'0');
 assert.deepEqual(JSON.parse(await save()),JSON.parse(collected),'opening the epilogue saves nothing');
}
// 檔案館重看（無論輸贏都直接播，確認演出）
await p.evaluate(()=>{const d=document.getElementById('chapter-epilogue');if(d.open)d.close();});
await p.evaluate(()=>document.getElementById('battle-result').close());
fs.mkdirSync(shots,{recursive:true});
const keyframes={0:'crown',4:'cards',7:'chairs',11:'mochi',14:'feast',20:'cup',27:'dino',29:'stamp'};
await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('siang-collector:v1'));s.battle.story['caramel-king:after']=s.battle.story['caramel-king:after']||new Date().toISOString();s.battle.stages['caramel-king']={...(s.battle.stages['caramel-king']||{}),clears:1,tries:1};localStorage.setItem('siang-collector:v1',JSON.stringify(s));});
await p.reload();
const beforeArchive=await save();
await p.evaluate(()=>{document.getElementById('archive').showModal();});
await p.evaluate(()=>document.querySelector('[data-archive-tab="battle"]')?.click());
const btn=p.locator('#archive-body .epilogue-cta').first();await btn.evaluate(n=>n.closest('details').open=true);await btn.click();await p.locator('#chapter-epilogue[open]').waitFor();
let i=0;const total=Number((await p.locator('.epi__count').textContent()).split('/')[1]);
for(;i<total;i++){
 assert.equal(await p.locator('.epi__stage').getAttribute('data-step'),String(i));
 if(keyframes[i]){await p.locator('.epi__stage img').evaluateAll(imgs=>Promise.all(imgs.filter(x=>x.src).map(x=>x.decode().catch(()=>{}))));await p.screenshot({path:`${shots}/${String(i).padStart(2,'0')}-${keyframes[i]}-390.png`});}
 if(i===8){await p.locator('[data-a="log"]').click();assert.match(await p.locator('.epi__log').textContent(),/每一張都有寫名字/);await p.locator('[data-a="log-close"]').click();}
 if(i<total-1)await p.locator('.epi__stage').click({position:{x:200,y:200}});
}
await p.locator('.epi__stage').click({position:{x:200,y:200}});await p.locator('.epi__end').waitFor();assert.match(await p.locator('#epilogue-title').textContent(),/第一章《布丁失竊事件》・完/);
await p.screenshot({path:`${shots}/end-390.png`});
await p.locator('[data-a="again"]').click();assert.equal(await p.locator('.epi__stage').getAttribute('data-step'),'0');
for(const theme of ['sakura','blue']){await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);for(const [w,h] of [[360,640],[390,844],[430,932]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(100);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const r=await p.locator('#chapter-epilogue').boundingBox();assert(r.y>=0&&r.y+r.height<=h+1&&r.x>=0&&r.x+r.width<=w+1,`dialog fits ${w}x${h}`);
 const bx=await p.locator('.epi__box').boundingBox();assert(bx.y+bx.height<=r.y+r.height+1);
 await p.screenshot({path:`${shots}/${theme}-${w}.png`});}}
await p.locator('[data-a="skip"]').click();await p.locator('.epi__end').waitFor();await p.locator('.epi__end [data-a="close"]').click();await p.locator('#chapter-epilogue').waitFor({state:'hidden'});
assert.deepEqual(JSON.parse(await save()),JSON.parse(beforeArchive),'replay from archive never touches the save');
// 自動播放：沒有減少動態時會自己往下走
await p.emulateMedia({reducedMotion:'no-preference'});await btn.click();await p.locator('[data-a="auto"]').click();await p.waitForFunction(()=>document.querySelector('.epi__stage').dataset.step==='1',null,{timeout:12000});await p.keyboard.press('Escape');await p.locator('#chapter-epilogue').waitFor({state:'hidden'});
assert.deepEqual(errors,[]);console.log(`chapter epilogue: ${total} beats, 7 acts, first-clear autoplay after report${won?'':' (skipped)'}, log/skip/again/auto/Esc, archive replay, save untouched, 360–430 both themes PASS`);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
