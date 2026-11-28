// 節日紀念蛋（每年一次、期間判定）、生日只限當天、走遍臺灣送台灣小湘、圖鑑介紹卡
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const errs=[];const key='siang-collector:v1';
const page=async(time)=>{const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',timezoneId:'Asia/Taipei'});await c.addInitScript(()=>{try{localStorage.setItem('siang-collector:egg-style','c')}catch{}});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.clock.install({time:new Date(time)});await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');return {c,p,save:()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key)};};
// valentine window
let {c,p,save}=await page('2027-02-12T10:00:00+08:00');
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};s.egg={id:'ordinary',warmth:0,since:'2027-02-01T00:00:00Z'};localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(700);
let s=await save();assert.deepEqual(s.gifts.keepsakes,['valentine-2027']);assert.equal(s.gifts.eggs.filter(e=>e.egg==='keepsake'&&e.character==='056').length,1);
await p.reload();await p.waitForTimeout(700);s=await save();assert.equal(s.gifts.eggs.length,1);
// hatch it
await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(300);await p.click('#open-eggs');await p.click('[data-cat=\"keepsake\"]');await p.click('[data-egg=\"keepsake\"]');await p.waitForTimeout(300);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.egg.warmth=100;localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(400);
await p.click('#cultivate');await p.locator('#reveal').waitFor();await p.waitForTimeout(300);assert.equal(await p.textContent('#reveal-name'),'情人節小湘');
await p.evaluate(()=>document.querySelector('#reveal').close());await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(400);await p.click('[data-dex-no="056"]');assert.match(await p.textContent('#dex-detail-story'),/情人節收到的紀念蛋.*第 2 顆蛋/);
await c.close();
// birthday only on the day
({c,p,save}=await page('2027-07-15T10:00:00+08:00'));await p.waitForTimeout(500);s=await save();assert.equal(s.gifts.keepsakes.length,0);await c.close();
({c,p,save}=await page('2027-07-14T10:00:00+08:00'));await p.waitForTimeout(700);s=await save();assert.deepEqual(s.gifts.keepsakes,['birthday-2027']);assert.equal(s.gifts.eggs[0].character,'015');await c.close();
// taiwan after all 19 counties; dex detail card
({c,p,save}=await page('2027-05-01T10:00:00+08:00'));
await p.evaluate(async(k)=>{const {CHARACTERS}=await import('/js/eggs.js');const s=JSON.parse(localStorage.getItem(k));s.hatched=20;s.dex={'001':{at:'2027-04-01T00:00:00Z'}};for(const ch of Object.values(CHARACTERS)) if(ch.county&&ch.county!=='綠島') s.dex[ch.no]={at:'2027-04-02T00:00:00Z'};localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(700);s=await save();assert.deepEqual(s.gifts.keepsakes,['taiwan']);assert.equal(s.gifts.eggs[0].character,'061');
await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(500);
await p.click('[data-dex-no="023"]');await p.locator('#dex-detail[open]').waitFor();
assert.match(await p.textContent('#dex-detail-intro'),/高美濕地/);assert.match(await p.textContent('#dex-detail-how'),/臺中市探索/);
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
await p.click('#close-dex-detail');await p.click('[data-dex-no="051"]');assert.equal(await p.textContent('#dex-detail-name'),'???');assert.match(await p.textContent('#dex-detail-how'),/普通蛋、願望蛋/);
await p.click('#close-dex-detail');await p.click('[data-dex-no="056"]');assert.match(await p.textContent('#dex-detail-how'),/情人節/);
await c.close();
assert.equal(errs.length,0,errs.join('\n'));
console.log('holiday: valentine keepsake once/year + fixed hatch, birthday only on 7/14, Taiwan after 19 counties, dex detail PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
