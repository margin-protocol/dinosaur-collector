// 雲端備份／還原、審核頁印章、暗號蓋章與兌換（含偽造、重複、過期）、暗號蛋指定角色
require('./_legacy-cloud.cjs');const {chromium}=require('playwright'),assert=require('node:assert/strict'),fake=require('./fake-github.cjs')();
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const errs=[];const ctxOpts={viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',timezoneId:'Asia/Taipei'};
// 審核頁
const rc=await b.newContext({...ctxOpts,permissions:['clipboard-read','clipboard-write']});await rc.route('https://api.github.com/**',fake.handler);
const r=await rc.newPage();r.on('pageerror',e=>errs.push('review: '+e.message));
await r.goto('http://127.0.0.1:8000/review.html');
await r.fill('#cloud-repo',fake.repo);await r.fill('#cloud-token','bad-token');await r.click('#cloud-save');await r.waitForFunction(()=>/連不上/.test(document.querySelector('#cloud-status').textContent));
await r.fill('#cloud-token','good-token');await r.click('#cloud-save');await r.waitForFunction(()=>/連線成功/.test(document.querySelector('#cloud-status').textContent));
assert(await r.locator('#code-create').isDisabled(),'cannot sign without key');
await r.click('#key-generate');await r.waitForFunction(()=>document.querySelector('#key-public').value.length>20);
const pub=JSON.parse(await r.inputValue('#key-public'));assert.equal(pub.d,undefined,'public key has no private part');
const backup=await r.evaluate(async()=>{const d=await new Promise(res=>{const q=indexedDB.open('siang-review',1);q.onsuccess=()=>res(q.result)});return new Promise(res=>{const q=d.transaction('keys').objectStore('keys').get('reviewer');q.onsuccess=()=>res(q.result)})});
assert.ok(backup.d);
// create codes
const mk=async(phrase,reward,extra={})=>{await r.fill('#code-phrase',phrase);await r.selectOption('#code-reward',reward);if(extra.character){await r.selectOption('#code-character',extra.character);}if(extra.expires)await r.fill('#code-expires',extra.expires);else await r.fill('#code-expires','');await r.setChecked('#code-reusable',!!extra.reusable);await r.click('#code-create');await r.waitForFunction(()=>/完成|已經設定/.test(document.querySelector('#code-status').textContent));return r.textContent('#code-status');};
assert.match(await mk('恐龍偷吃草莓','character',{character:'011'}),/完成/);
assert.match(await mk('恐龍偷吃草莓','energy:50'),/已經設定/);
assert.match(await mk('早就過期','energy:100',{expires:'2020-01-01'}),/完成/);
assert.match(await mk('天天都愛你','energy:50',{reusable:true}),/完成/);
await r.waitForFunction(()=>document.querySelectorAll('#code-list li').length===3);
if(process.env.SHOT) await r.screenshot({path:process.env.SHOT,fullPage:true});
// 遊戲
const gc=await b.newContext(ctxOpts);await gc.route('https://api.github.com/**',fake.handler);
await gc.route('**/js/reviewer-key.js',route=>route.fulfill({contentType:'text/javascript',body:`export const REVIEWER_PUBLIC_JWK = ${JSON.stringify(pub)};`}));
const g=await gc.newPage();g.on('pageerror',e=>errs.push('game: '+e.message));
await g.goto('http://127.0.0.1:8000');await g.click('#intro-ok');
const key='siang-collector:v1';const save=()=>g.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await g.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};s.egg={id:'ordinary',warmth:0,since:'2026-11-16'};s.energy=7;localStorage.setItem(k,JSON.stringify(s));},key);await g.reload();
const openCenter=async(id)=>{await g.click('#open-center');await g.click(id);};
// redeem before connecting
await openCenter('#open-code');await g.fill('#code-input','恐龍偷吃草莓');await g.click('#code-submit');await g.waitForFunction(()=>/連線/.test(document.querySelector('#code-status').textContent));await g.click('#close-code');
// Theme preference travels with backups without touching game resources.
await openCenter('#open-themes');await g.click('[data-palette="mint"]');await g.click('#theme-done');
// connect → auto backup
await openCenter('#open-cloud');await g.fill('#cloud-repo',fake.repo);await g.fill('#cloud-token','good-token');await g.click('#cloud-save');
await g.waitForFunction(()=>/上次備份/.test(document.querySelector('#cloud-last').textContent));
assert.ok(fake.read('backups/latest.json'));assert.equal(JSON.parse(JSON.parse(fake.read('backups/latest.json')).keys[key]).energy,7);
assert.equal(JSON.parse(fake.read('backups/latest.json')).keys['siang-collector:theme:v1'],'mint');
assert.equal(JSON.stringify(await save()).includes('good-token'),false,'token not in save');
await g.click('#close-cloud');
const redeem=async(text)=>{await openCenter('#open-code');await g.fill('#code-input',text);await g.click('#code-submit');await g.waitForFunction(()=>!/確認中/.test(document.querySelector('#code-status').textContent)&&document.querySelector('#code-status').textContent);const t=await g.textContent('#code-status');await g.click('#close-code');return t;};
assert.match(await redeem('想不到的暗號'),/不對/);
assert.match(await redeem(' 恐龍 偷吃，草莓！'),/兌換成功.*草莓蛋糕小湘/s);
let s=await save();assert.deepEqual(s.gifts.eggs.filter(e=>e.from!=='civic-2026').map(e=>[e.egg,e.character]),[['cipher','011']]);
assert.match(await redeem('恐龍偷吃草莓'),/已經兌換/);
assert.match(await redeem('早就過期'),/過期/);
assert.match(await redeem('天天都愛你'),/兌換成功/);s=await save();assert.equal(s.energy,57);
// forged code: valid-looking file with a signature from another key
const forged=await g.evaluate(async()=>{const {generateKeys,signPayload,sha256Hex,normalizeCode}=await import('/js/sign.js');const k=await generateKeys();const hash=await sha256Hex(normalizeCode('偽造的暗號'));return {hash,signed:await signPayload(k.privateKey,{v:1,type:'code',hash,reward:{type:'energy',amount:999},once:true,expires:null,createdAt:'x'})};});
fake.write(`codes/${forged.hash}.json`,JSON.stringify(forged.signed));
assert.match(await redeem('偽造的暗號'),/印章不對/);s=await save();assert.equal(s.energy,57);
// tampered reward in a genuine code
const h=Object.keys(Object.fromEntries(fake.files)).find(p=>p.startsWith('codes/')&&JSON.parse(fake.read(p)).payload.reward.amount===50&&JSON.parse(fake.read(p)).payload.once===false);
const t=JSON.parse(fake.read(h));t.payload.reward.amount=1000;fake.write(h,JSON.stringify(t));
assert.match(await redeem('天天都愛你'),/印章不對/);
// another device redeemed the one-time code already
await g.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.gifts.redeemed=[];localStorage.setItem(k,JSON.stringify(s));},key);await g.reload();
assert.match(await redeem('恐龍偷吃草莓'),/已經被兌換/);
// cipher egg hatches the chosen character
await g.evaluate(()=>location.hash='incubate');await g.waitForTimeout(300);
await g.click('#open-eggs');await g.click('[data-cat=\"cipher\"]');await g.click('[data-egg=\"cipher\"]');await g.waitForTimeout(300);
s=await save();assert.equal(s.egg.id,'cipher');assert.equal(s.egg.character,'011');
await g.click('#open-eggs');await g.click('[data-cat=\"ordinary\"]');await g.click('[data-egg=\"ordinary\"]');await g.waitForTimeout(300);s=await save();assert.equal(s.gifts.eggs[0].character,'011');
await g.click('#open-eggs');await g.click('[data-cat=\"cipher\"]');await g.click('[data-egg=\"cipher\"]');await g.waitForTimeout(300);
await g.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.egg.warmth=100;localStorage.setItem(k,JSON.stringify(s));},key);await g.reload();await g.evaluate(()=>location.hash='incubate');await g.waitForTimeout(400);
await g.click('#cultivate');await g.locator('#reveal').waitFor();await g.waitForTimeout(300);
assert.equal(await g.textContent('#reveal-name'),'草莓蛋糕小湘');await g.click('#reveal-ok');
// restore from cloud backup onto a wiped device
await openCenter('#open-cloud');await g.click('#cloud-backup-now');await g.waitForFunction(()=>/備份完成/.test(document.querySelector('#cloud-status').textContent));await g.click('#close-cloud');
const before=await save();
await g.evaluate(()=>localStorage.setItem('siang-collector:theme:v1','rose'));
await g.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.dex={};s.energy=0;localStorage.setItem(k,JSON.stringify(s));},key);await g.reload();
await openCenter('#open-cloud');await g.click('#cloud-restore');await g.locator('#cloud-restore-confirm').waitFor();
await Promise.all([g.waitForNavigation(),g.click('#cloud-restore-confirm')]);
s=await save();assert.ok(s.dex['011']);assert.equal(s.energy,before.energy);
await g.waitForFunction(()=>document.documentElement.dataset.theme==='mint');
assert.equal(await g.evaluate(()=>localStorage.getItem('siang-collector:theme:v1')),'mint','restores backed-up theme');
// reviewer key restore on a new device
const r2c=await b.newContext(ctxOpts);await r2c.route('https://api.github.com/**',fake.handler);const r2=await r2c.newPage();await r2.goto('http://127.0.0.1:8000/review.html');
await r2.click('#key-show-import');await r2.fill('#key-import-text',JSON.stringify(backup));await r2.click('#key-import-ok');await r2.waitForFunction(()=>/已還原/.test(document.querySelector('#key-status').textContent));
assert.equal(JSON.parse(await r2.inputValue('#key-public')).x,pub.x);
assert.equal(errs.length,0,errs.join('\n'));
console.log('cloud: connect/auth error, auto backup+restore, reviewer key gen/restore, code sign/redeem, forged/tampered/expired/one-time, cipher egg fixed hatch PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
