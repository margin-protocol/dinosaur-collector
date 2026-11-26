// 手機通知設定（湘 11/25 選 A 開關清單）：手記有入口、不用邀請碼就能開回家／討伐、沒邀請碼時湘的消息不能開、
// 出門後自動把回來時間送到後台（假推播訂閱＋攔截 /timers）、叫回後重送、關掉送 /timers/off、測試服不連後台。
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const width=Number(process.env.W||360);
const c=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
await c.grantPermissions(['notifications'],{origin:'http://127.0.0.1:8000'});
// 雲端這邊沒有 FCM、headless 一律拒絕通知，改用假的權限和訂閱
await c.addInitScript(()=>{const fake={endpoint:'https://fcm.googleapis.com/fcm/send/fake-endpoint',toJSON(){return{endpoint:this.endpoint,keys:{p256dh:'B'.repeat(87),auth:'a'.repeat(22)}};},unsubscribe:async()=>{window.__subbed=false;return true;}};
Object.defineProperty(Notification,'permission',{get:()=>'granted'});Notification.requestPermission=async()=>'granted';window.__subbed=false;PushManager.prototype.getSubscription=async function(){return window.__subbed?fake:null;};PushManager.prototype.subscribe=async function(){window.__subbed=true;return fake;};});
const sent=[];await c.route(/workers\.dev\/timers/,async r=>{sent.push({url:r.request().url(),body:JSON.parse(r.request().postData()||'{}')});await r.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:'{"ok":true}'});});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');await p.waitForTimeout(500);
await p.click('#open-center');await p.click('#open-notify');await p.waitForSelector('#notify-dialog[open]');await p.waitForTimeout(300);
const checked=k=>p.getAttribute(`[data-notify="${k}"]`,'aria-checked');const dis=k=>p.$eval(`[data-notify="${k}"]`,e=>e.disabled);
assert.equal(await checked('main'),'false');assert.equal(await dis('home'),true,'總開關關著時子開關不能按');
if(process.env.SHOT)await p.locator('#notify-dialog').screenshot({path:`${process.env.SHOT}/notify-off-${width}.png`});
await p.click('[data-notify="main"]');await p.waitForFunction(()=>document.querySelector('[data-notify="main"]').getAttribute('aria-checked')==='true');
assert.equal(await checked('home'),'true');assert.equal(await checked('battle'),'true');assert.equal(await checked('quiet'),'true');
assert.equal(await checked('msg'),'false');assert.equal(await dis('msg'),true,'沒邀請碼不能開湘的消息');
assert.match(await p.textContent('#notify-msg-sub'),/邀請碼/);
assert.equal(sent.length,1);assert.equal(sent[0].body.endpoint,'https://fcm.googleapis.com/fcm/send/fake-endpoint');assert.match(sent[0].body.key,/^[\w-]{20,64}$/);assert.deepEqual(sent[0].body.timers,[]);
if(process.env.SHOT)await p.locator('#notify-dialog').screenshot({path:`${process.env.SHOT}/notify-on-${width}.png`});
// 出門 → 存檔一變就把回來時間送出去
await p.evaluate(async()=>{const {updateState}=await import('/js/state.js');const iso=t=>new Date(t).toISOString();
await updateState(s=>{s.errands=s.errands||{};s.errands.active=[{id:'t1',place:'conv',nos:['001'],start:iso(Date.now()),until:iso(Date.now()+3600e3),loot:{}}];});});
await p.waitForFunction(n=>window.__sentLen===undefined,0);await p.waitForTimeout(2200);
const last=()=>sent.at(-1).body;assert.equal(sent.length,2,'出門後送一次');assert.equal(last().timers.length,1);assert.match(last().timers[0].title,/回來囉|忙完了|早安/);
assert.ok(Math.abs(last().timers[0].at-(Date.now()+3600e3))<120e3||last().timers[0].title.startsWith('早安'));
// 存檔再變但清單一樣：不重送
await p.evaluate(async()=>{const {updateState}=await import('/js/state.js');await updateState(s=>{s.hatched=(s.hatched||0)+0;});});await p.waitForTimeout(2000);assert.equal(sent.length,2);
// 關掉回家：清單變空
await p.click('[data-notify="home"]');await p.waitForTimeout(600);assert.deepEqual(last().timers,[]);
// 晚上安靜切換會重送
await p.click('[data-notify="home"]');await p.waitForTimeout(600);await p.click('[data-notify="quiet"]');await p.waitForTimeout(600);assert.equal(await checked('quiet'),'false');assert.equal(last().timers.length,1);
// 回家、討伐都關 → 送 /timers/off
await p.click('[data-notify="home"]');await p.waitForTimeout(500);await p.click('[data-notify="battle"]');await p.waitForTimeout(800);
assert.match(sent.at(-1).url,/\/timers\/off$/);assert.equal(await checked('main'),'false','都關了總開關也跟著關');
// 再打開總開關：回家、討伐自動恢復
await p.click('[data-notify="main"]');await p.waitForTimeout(800);assert.equal(await checked('home'),'true');assert.equal(await checked('battle'),'true');
// 總開關關掉 → 取消訂閱
await p.click('[data-notify="main"]');await p.waitForTimeout(800);assert.equal(await checked('main'),'false');assert.equal(await p.evaluate(()=>window.__subbed),false);
assert.deepEqual(errs,[]);
// 測試服：開關能按，但完全不連後台
const before=sent.length;const t=await c.newPage();await t.goto('http://127.0.0.1:8000/?test');await t.waitForTimeout(800);if(await t.locator('#intro-ok').isVisible())await t.click('#intro-ok');
await t.evaluate(()=>{document.getElementById('open-notify').click();});await t.waitForTimeout(300);
assert.match(await t.textContent('#notify-hint'),/測試服/);await t.click('[data-notify="main"]');await t.waitForTimeout(2500);
assert.equal(await t.getAttribute('[data-notify="main"]','aria-checked'),'true');assert.equal(sent.length,before,'測試服不送');
await b.close();console.log('notify-settings: entry, no invite needed, msg needs invite, sync on save, dedupe, toggles resync, off, unsubscribe, test server offline PASS');
})().catch(e=>{console.error(e);process.exit(1);});
