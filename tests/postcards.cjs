// 寄照片給湘：從相簿選、附文字、上傳、記憶檔案、湘回覆（驗證印章、偽造的不收）；隨手收藏與委託不再強制開相機
require('./_legacy-cloud.cjs');const {chromium}=require('playwright'),assert=require('node:assert/strict'),fake=require('./fake-github.cjs')();
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const errs=[];const opts={viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'};
const rc=await b.newContext(opts);await rc.route('https://api.github.com/**',fake.handler);const r=await rc.newPage();r.on('pageerror',e=>errs.push('review: '+e.message));
await r.goto('http://127.0.0.1:8000/review.html');await r.fill('#cloud-repo',fake.repo);await r.fill('#cloud-token','good-token');await r.click('#cloud-save');await r.waitForFunction(()=>/連線成功/.test(document.querySelector('#cloud-status').textContent));
await r.click('#key-generate');await r.waitForFunction(()=>document.querySelector('#key-public').value.length>20);const pub=JSON.parse(await r.inputValue('#key-public'));
const gc=await b.newContext(opts);await gc.route('https://api.github.com/**',fake.handler);
await gc.route('**/js/reviewer-key.js',route=>route.fulfill({contentType:'text/javascript',body:`export const REVIEWER_PUBLIC_JWK = ${JSON.stringify(pub)};`}));
const g=await gc.newPage();g.on('pageerror',e=>errs.push('game: '+e.message));const key='siang-collector:v1';const save=()=>g.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await g.goto('http://127.0.0.1:8000');await g.click('#intro-ok');
for(const id of ['snap-input','mission-input','postcard-input','dino-task-input']) assert.equal(await g.getAttribute('#'+id,'capture'),null,id+' allows album');
await g.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:cloud:v1',JSON.stringify({repo:'tester/private-data',token:'good-token'}));},key);await g.reload();
const png=Buffer.from(await g.evaluate(()=>{const cv=document.createElement('canvas');cv.width=cv.height=50;const x=cv.getContext('2d');x.fillStyle='#e9a';x.fillRect(0,0,50,50);return cv.toDataURL('image/png').split(',')[1];}),'base64');
await g.click('#open-center');await g.click('#open-postcard');await g.locator('#postcard-dialog[open]').waitFor();
await g.click('#postcard-send');assert.match(await g.textContent('#postcard-status'),/先選/);
await g.setInputFiles('#postcard-input',{name:'cat.png',mimeType:'image/png',buffer:png});await g.locator('#postcard-preview:not([hidden])').waitFor();
await g.fill('#postcard-text','今天看到一隻好可愛的貓');await g.click('#postcard-send');await g.waitForFunction(()=>/寄出了/.test(document.querySelector('#postcard-status').textContent));
assert.equal([...fake.files.keys()].filter(k=>k.startsWith('postcards/')).length,2);
let s=await save();assert.equal(s.memories.filter(m=>m.kind==='postcard').length,1);
// forged reply ignored
const pid=s.memories[0].postcard;
const forged=await g.evaluate(async(pid)=>{const {generateKeys,signPayload}=await import('/js/sign.js');const k=await generateKeys();return signPayload(k.privateKey,{v:1,type:'postcard-reply',id:pid,note:'假的',createdAt:'x'});},pid);
fake.write(`postcard-replies/${pid}.json`,JSON.stringify(forged));await g.reload();await g.waitForTimeout(1500);s=await save();assert.equal(s.memories[0].note,'');
fake.files.delete(`postcard-replies/${pid}.json`);
// reviewer replies
await r.click('#tab-inbox');await r.click('#inbox-refresh');await r.locator('#inbox-list .review-photo').waitFor();assert.match(await r.textContent('#inbox-list'),/好可愛的貓/);
await r.locator('#inbox-list textarea').fill('好可愛！下次帶我去看～');await r.locator('#inbox-list .btn',{hasText:'蓋章回覆'}).click();await r.waitForFunction(()=>/回覆了/.test(document.querySelector('#inbox-status').textContent));await r.click('#postcard-history summary');await r.waitForFunction(()=>/下次帶我去看/.test(document.querySelector('#postcard-list').textContent));
await g.reload();await g.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).memories[0].note!=='',key,{timeout:10000});
await g.click('#open-center');await g.click('#open-memories');await g.locator('.memory').click();await g.locator('#memory-view[open]').waitFor();
assert.match(await g.textContent('#memory-view-note'),/下次帶我去看/);assert.equal(await g.getAttribute('#memory-view-note','data-label'),'湘的回覆');assert.match(await g.textContent('#memory-view-title'),/好可愛的貓/);
if(process.env.SHOT) await g.screenshot({path:process.env.SHOT});
assert.equal(errs.length,0,errs.join('\n'));
console.log('postcards: album allowed, send with text, memory entry, forged reply ignored, signed reply shown PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
