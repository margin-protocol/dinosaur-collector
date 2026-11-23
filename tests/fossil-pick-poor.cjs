// 指定小湘：N 收齊、化石不夠最便宜那位時，按鈕不灰掉，點進去會說還差多少；UR 也有列出來；全部收齊才停用
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
for(const width of [360,430]){
const c=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const setup=(all)=>p.evaluate(async([k,all])=>{const {EGGS,CHARACTERS}=await import('/js/eggs.js');const {pickable}=await import('/js/fossils.js');const s=JSON.parse(localStorage.getItem(k));s.hatched=40;s.dex={};
for(const no of pickable(s,EGGS,CHARACTERS)) if(all||CHARACTERS[no].rarity==='N') s.dex[no]={at:'x'};s.fossils=34;localStorage.setItem(k,JSON.stringify(s));},[key,all]);
await setup(false);await p.reload();await p.waitForTimeout(400);
await p.click('#chip-fossil');await p.locator('#fossil-dialog[open]').waitFor();
assert(!(await p.locator('[data-offer="pick"]').isDisabled()),'化石不夠也要點得進去');
await p.click('[data-offer="pick"]');await p.locator('#fossil-pick').waitFor();
const txt=await p.locator('#fossil-pick-list').textContent();
assert.match(txt,/現在最便宜的一位要 50 化石，還差 16 個/);assert.match(txt,/UR · 每位 150 化石（還差 116）/);
assert(await p.locator('[data-pick="109"]').count(),'UR 109 要列出來');
assert.equal(await p.locator('[data-pick]:not(:disabled)').count(),0);
if(process.env.SHOT_DIR){await p.locator('#fossil-dialog').evaluate(d=>d.scrollTop=0);await p.screenshot({path:`${process.env.SHOT_DIR}/pick-${width}-top.png`});await p.locator('#fossil-pick').scrollIntoViewIfNeeded();await p.screenshot({path:`${process.env.SHOT_DIR}/pick-${width}-list.png`});}
await setup(true);await p.reload();await p.waitForTimeout(400);
await p.click('#chip-fossil');await p.locator('#fossil-dialog[open]').waitFor();
assert(await p.locator('[data-offer="pick"]').isDisabled(),'全部收齊才停用');
assert.match(await p.locator('[data-offer="pick"]').textContent(),/都遇見了/);
if(process.env.SHOT_DIR) await p.screenshot({path:`${process.env.SHOT_DIR}/pick-${width}-all.png`});
assert.equal(errs.length,0,errs.join('\n'));await c.close();}
console.log('fossil-pick-poor: pick opens when too poor, shows shortfall + UR tier, disabled only when all met PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
