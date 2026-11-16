// 紙條：里程碑解鎖、未讀標記、湘從審核室寄紙條（驗證印章，偽造的不收）
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fake=require('./fake-github.cjs')();
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const errs=[];const opts={viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'};
const rc=await b.newContext(opts);await rc.route('https://api.github.com/**',fake.handler);const r=await rc.newPage();r.on('pageerror',e=>errs.push('review: '+e.message));
await r.goto('http://127.0.0.1:8000/review.html');await r.fill('#cloud-repo',fake.repo);await r.fill('#cloud-token','good-token');await r.click('#cloud-save');await r.waitForFunction(()=>/連線成功/.test(document.querySelector('#cloud-status').textContent));
await r.click('#key-generate');await r.waitForFunction(()=>document.querySelector('#key-public').value.length>20);const pub=JSON.parse(await r.inputValue('#key-public'));
await r.fill('#letter-title','今天好想你');await r.fill('#letter-body','致親愛的飼養員：\n\n今天也辛苦了。\n\n—— 小湘 ♡');await r.click('#letter-send');await r.waitForFunction(()=>/寄出了/.test(document.querySelector('#letter-status').textContent));
await r.waitForFunction(()=>document.querySelectorAll('#letter-list li').length===1);
// forged letter
const gc=await b.newContext(opts);await gc.route('https://api.github.com/**',fake.handler);
await gc.route('**/js/reviewer-key.js',route=>route.fulfill({contentType:'text/javascript',body:`export const REVIEWER_PUBLIC_JWK = ${JSON.stringify(pub)};`}));
const g=await gc.newPage();g.on('pageerror',e=>errs.push('game: '+e.message));
await g.goto('http://127.0.0.1:8000');await g.click('#intro-ok');
const forged=await g.evaluate(async()=>{const {generateKeys,signPayload}=await import('/js/sign.js');const k=await generateKeys();return signPayload(k.privateKey,{v:1,type:'letter',id:'zzz-fake',title:'假的',body:'假的紙條',createdAt:new Date().toISOString()});});
fake.write('letters/zzz-fake.json',JSON.stringify(forged));
const key='siang-collector:v1';const save=()=>g.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
// milestone
await g.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));},key);await g.reload();await g.waitForTimeout(800);
let s=await save();assert.equal(await g.textContent('#letter-badge'),'1');
await g.click('#home-letter');await g.locator('#letter-box[open]').waitFor();assert.equal(await g.locator('.letter-item').count(),2);
await g.locator('.letter-item',{hasText:'初次見面'}).click();await g.locator('#letter-read[open]').waitFor();assert.match(await g.textContent('#letter-read-body'),/真的把我孵出來/);
await g.click('#letter-read-ok');await g.waitForTimeout(300);await g.click('#close-letter-box');assert(await g.locator('#letter-badge').isHidden());
// connect → mail fetched (forged ignored)
await g.click('#open-center');await g.click('#open-cloud');await g.fill('#cloud-repo',fake.repo);await g.fill('#cloud-token','good-token');await g.click('#cloud-save');await g.waitForFunction(()=>/連線成功/.test(document.querySelector('#cloud-status').textContent));await g.click('#close-cloud');
await g.reload();await g.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).letters.mail.length>0,key,{timeout:10000});await g.waitForTimeout(500);
s=await save();assert.equal(s.letters.mail.length,1);assert.equal(s.letters.mail[0].title,'今天好想你');
assert.equal(await g.textContent('#letter-badge'),'1');
await g.click('#home-letter');await g.locator('.letter-item.is-mail').click();assert.match(await g.textContent('#letter-read-body'),/今天也辛苦了/);
if(process.env.SHOT) await g.screenshot({path:process.env.SHOT});
await g.click('#letter-read-ok');await g.waitForTimeout(200);
// reload: no duplicate
await g.reload();await g.waitForTimeout(1500);s=await save();assert.equal(s.letters.mail.length,1);
assert.equal(errs.length,0,errs.join('\n'));
console.log('letters: milestone unlock+unread badge, reviewer letter sign/send/receive, forged ignored, no duplicates PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
