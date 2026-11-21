// 照片委託（出題、上傳、退回、再拍、通過、獎勵、記憶檔案）與約會 QR／約會碼（掃描網址、手動輸入、過期、只能用一次、約會蛋）
require('./_legacy-cloud.cjs');const {chromium}=require('playwright'),assert=require('node:assert/strict'),fake=require('./fake-github.cjs')();
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const errs=[];const opts={viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'};
const rc=await b.newContext(opts);await rc.route('https://api.github.com/**',fake.handler);const r=await rc.newPage();r.on('pageerror',e=>errs.push('review: '+e.message));
await r.goto('http://127.0.0.1:8000/review.html');await r.fill('#cloud-repo',fake.repo);await r.fill('#cloud-token','good-token');await r.click('#cloud-save');await r.waitForFunction(()=>/連線成功/.test(document.querySelector('#cloud-status').textContent));
await r.click('#key-generate');await r.waitForFunction(()=>document.querySelector('#key-public').value.length>20);const pub=JSON.parse(await r.inputValue('#key-public'));await r.click('#tab-make');
await r.fill('#mission-title','今天晚餐吃什麼');await r.fill('#mission-body','拍下你的晚餐');await r.selectOption('#mission-reward','energy:100');await r.click('#mission-create');await r.waitForFunction(()=>/出題了/.test(document.querySelector('#mission-status').textContent));
// game
const gc=await b.newContext(opts);await gc.route('https://api.github.com/**',fake.handler);
await gc.route('**/js/reviewer-key.js',route=>route.fulfill({contentType:'text/javascript',body:`export const REVIEWER_PUBLIC_JWK = ${JSON.stringify(pub)};`}));
const g=await gc.newPage();g.on('pageerror',e=>errs.push('game: '+e.message));const key='siang-collector:v1';const save=()=>g.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await g.goto('http://127.0.0.1:8000');await g.click('#intro-ok');
await g.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};s.energy=0;localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:cloud:v1',JSON.stringify({repo:'tester/private-data',token:'good-token'}));},key);
await g.reload();await g.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).missions.list.length===1,key,{timeout:10000});
assert.equal(await g.textContent('#missions-badge'),'1');
const photo=async(color)=>Buffer.from(await g.evaluate(c=>{const cv=document.createElement('canvas');cv.width=cv.height=60;const x=cv.getContext('2d');x.fillStyle=c;x.fillRect(0,0,60,60);return cv.toDataURL('image/png').split(',')[1];},color),'base64');
const upload=async(color)=>{await g.click('#open-center');await g.click('#open-missions');await g.locator('#missions-dialog[open]').waitFor();await g.waitForFunction(()=>!/同步中/.test(document.querySelector('#missions-status').textContent));
 const [chooser]=await Promise.all([g.waitForEvent('filechooser'),g.locator('.commission .btn').first().click()]);await chooser.setFiles({name:'p.png',mimeType:'image/png',buffer:await photo(color)});
 await g.waitForFunction(()=>/上傳好了/.test(document.querySelector('#missions-status').textContent));await g.click('#close-missions');};
await upload('#c33');
assert.equal([...fake.files.keys()].filter(k=>k.startsWith('submissions/')&&k.endsWith('.jpg')).length,1);
// reviewer rejects
await r.click('#tab-inbox');await r.click('#inbox-refresh');await r.locator('#inbox-list .review-photo').waitFor();assert.equal(await r.textContent('#inbox-count'),'1');await r.locator('#inbox-list textarea').fill('太暗了，再拍一張～');await r.locator('#inbox-list .btn',{hasText:'退回'}).click();await r.waitForFunction(()=>/已退回/.test(document.querySelector('#inbox-status').textContent));assert.equal(await r.locator('#inbox-list .review-photo').count(),0,'removed without reload');
await g.reload();await g.waitForFunction(k=>Object.values(JSON.parse(localStorage.getItem(k)).missions.status).includes('rejected'),key,{timeout:10000});
await upload('#3c3');
await r.click('#inbox-refresh');await r.locator('#inbox-list .review-photo').waitFor();assert.equal(await r.locator('#inbox-list .review-photo').count(),1);
await r.locator('#inbox-list textarea').fill('看起來好好吃！下次帶我去。');await r.locator('#inbox-list .btn',{hasText:'通過'}).click();await r.waitForFunction(()=>/已通過/.test(document.querySelector('#inbox-status').textContent));
await g.reload();await g.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).memories.length===1,key,{timeout:10000});
let s=await save();assert.equal(s.energy>=100,true);assert.equal(s.memories[0].note,'看起來好好吃！下次帶我去。');assert.ok(s.memories[0].thumb.startsWith('data:image/jpeg'));
await g.reload();await g.waitForTimeout(1500);s=await save();assert.equal(s.memories.length,1,'review applied once');
await g.click('#open-center');await g.click('#open-memories');await g.locator('.memory').click();await g.locator('#memory-view[open]').waitFor();assert.match(await g.textContent('#memory-view-note'),/好好吃/);
await g.waitForFunction(()=>document.querySelector('#memory-view-img').src.startsWith('blob:'));
if(process.env.SHOT) await g.screenshot({path:process.env.SHOT});
await g.click('#close-memory-view');await g.click('#close-memories');
// date QR via scanned URL
await r.click('#tab-make');await r.fill('#date-title','高美濕地看夕陽');await r.fill('#date-note','謝謝你陪我');await r.click('#date-create');await r.locator('#date-qr svg').waitFor();
const code=await r.textContent('#date-code');assert.match(code,/^[A-Z2-9]{6}$/);
await g.goto(`http://127.0.0.1:8000/#date=${code}`);await g.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).gifts.eggs.some(e=>e.egg==='date'),key,{timeout:10000});
s=await save();assert.equal(s.memories.filter(m=>m.kind==='date').length,1);assert.equal(s.memories.find(m=>m.kind==='date').title,'高美濕地看夕陽');
// reuse rejected
const redeem=async(text)=>{await g.click('#open-center');await g.click('#open-code');await g.fill('#code-input',text);await g.click('#code-submit');await g.waitForFunction(()=>!/確認中/.test(document.querySelector('#code-status').textContent)&&document.querySelector('#code-status').textContent);const t=await g.textContent('#code-status');await g.click('#close-code');return t;};
assert.match(await redeem(code.toLowerCase()),/用過/);
// second code typed manually, then expired one
await r.selectOption('#date-character','083');assert.match(await r.textContent('#date-character'),/隨機/);await r.click('#date-create');await r.waitForFunction(c=>document.querySelector('#date-code').textContent!==c,code);const code2=await r.textContent('#date-code');
await g.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.gifts.dates=[];localStorage.setItem(k,JSON.stringify(s));},key);await g.reload();
assert.match(await redeem(code2),/約會快樂.*會孵出約會小湘・蝰蝰睡著版/);assert.match(await r.textContent('#date-status'),/蝰蝰睡著版/);s=await save();assert.deepEqual(s.gifts.eggs.filter(e=>e.egg==='date').map(e=>e.character||null),[null,'083'],'指定的約會蛋記著孵出誰');
const file=JSON.parse(fake.read(`dates/${code2}.json`));file.payload.expires='2020-01-01T00:00:00Z';fake.write('dates/ZZZZZZ.json',JSON.stringify({...file,payload:{...file.payload,code:'ZZZZZZ'}}));
assert.match(await redeem('ZZZZZZ'),/不對|印章|暗號/,'tampered/expired copy rejected');
// date egg hatches 014 or 042
await g.evaluate(()=>location.hash='incubate');await g.waitForTimeout(300);await g.click('#open-eggs');await g.click('[data-cat="date"]');assert.equal(await g.locator('[data-egg="date"][data-character]').count(),2,'隨機和指定的約會蛋分開列');await g.click('[data-egg="date"][data-character="083"]');await g.waitForTimeout(300);
s=await save();assert.equal(s.egg.character,'083','可以先孵指定的那顆');assert.deepEqual(s.gifts.eggs.filter(e=>e.egg==='date').map(e=>e.character||null),[null]);
await g.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.egg.warmth=100;localStorage.setItem(k,JSON.stringify(s));},key);await g.reload();await g.evaluate(()=>location.hash='incubate');await g.waitForTimeout(400);
await g.click('#cultivate');await g.locator('#reveal').waitFor();await g.waitForTimeout(300);assert.match(await g.textContent('#reveal-name'),/蝰蝰睡著版/);
assert.equal(errs.length,0,errs.join('\n'));
console.log('commissions: mission sign/sync, upload, reject+note, resubmit, approve+reward once, memory archive with full photo; date QR url, typed code, single use, tampered rejected, date egg PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
