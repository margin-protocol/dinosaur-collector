// 11/19 玩家進度不見：新手機（空進度）連上同一個邀請碼時，自動備份不能蓋掉雲端上比較多的舊進度；
// 「從雲端還原」要找到進度最多的那份；手動備份要按第二次才會覆蓋。另外讀不懂的存檔要另存起來，不能直接丟掉。
const {chromium}=require('playwright'),assert=require('node:assert/strict');const {spawn}=require('node:child_process');
(async()=>{const api=spawn('node',['server/dev-server.mjs','8798'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,1200));
const API='http://127.0.0.1:8798';
try{
const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const mk=async()=>{const c=await b.newContext({viewport:{width:390,height:844}});await c.addInitScript(a=>{globalThis.SIANG_API_OVERRIDE=a;},API);return c;};
const errs=[];
const r=await (await mk()).newPage();await r.goto('http://127.0.0.1:8000/review.html');
await r.locator('#rv-claim').click();await r.locator('#rv-backup:not([hidden])').waitFor();await r.locator('#rv-backup-done').click();
await r.locator('#player-add').click();await r.locator('#rv-new-name').fill('男友');await r.locator('#rv-new button[type=submit]').click();
await r.locator('#rv-invite:not([hidden])').waitFor();const invite=await r.locator('#rv-invite-text').inputValue();
const status=p=>p.locator('#cloud-status').textContent();
const connect=async(p)=>{await p.locator('#open-center').click();await p.locator('#open-cloud').click();await p.locator('#cloud-dialog[open]').waitFor();await p.locator('#cloud-invite').fill(invite);await p.locator('#cloud-save').click();await p.waitForFunction(()=>/歡迎，男友/.test(document.getElementById('cloud-status').textContent));await p.waitForTimeout(800);};
// 舊手機：有 5 位小湘，備份
const old=await (await mk()).newPage();old.on('pageerror',e=>errs.push(e.message));await old.goto('http://127.0.0.1:8000');await old.click('#intro-ok');
await old.evaluate(()=>{const k='siang-collector:v1';const s=JSON.parse(localStorage.getItem(k));s.tutorial=null;s.hatched=9;s.dex=Object.fromEntries(['001','002','003','004','005'].map(n=>[n,{at:'2026-11-18T00:00:00Z'}]));localStorage.setItem(k,JSON.stringify(s));});
await old.reload();await connect(old);
const latest=async()=>r.evaluate(async a=>{const s=JSON.parse(localStorage.getItem('siang-review:cloud:v1')||'null');return null;},API);
// 新手機：進度空的，連上同一個邀請碼
const fresh=await (await mk()).newPage();fresh.on('pageerror',e=>errs.push(e.message));await fresh.goto('http://127.0.0.1:8000');await fresh.click('#intro-ok');await fresh.waitForTimeout(300);
await connect(fresh);await fresh.waitForTimeout(800);
assert.match(await status(fresh),/雲端上有進度比這支手機多的備份/,'auto backup refuses to overwrite');
await fresh.locator('#cloud-backup-now').click();await fresh.waitForTimeout(800);
assert.match(await status(fresh),/再按一次/,'manual backup warns first');
await fresh.locator('#cloud-restore').click();await fresh.waitForFunction(()=>/找到進度最多的備份/.test(document.getElementById('cloud-status').textContent));
assert.match(await status(fresh),/圖鑑 5 位/);
await Promise.all([fresh.waitForEvent('load'),fresh.locator('#cloud-restore-confirm').click()]);await fresh.waitForTimeout(600);
const dex=await fresh.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('siang-collector:v1')).dex).length);assert.equal(dex,5,'restored');
await fresh.waitForTimeout(1500);assert(await fresh.locator('#cloud-dialog[open]').count(),'result dialog stays open');assert.match(await status(fresh),/還原成功！現在圖鑑有 5 位小湘、孵化 9 次/,'tells the player it worked');
// 讀不懂的存檔：另存，不丟
const bad=await (await mk()).newPage();await bad.goto('http://127.0.0.1:8000');await bad.evaluate(()=>localStorage.setItem('siang-collector:v1','{broken'));await bad.reload();await bad.waitForTimeout(500);
assert.equal(await bad.evaluate(()=>localStorage.getItem('siang-collector:v1:unreadable')),'{broken');
assert.deepEqual(errs,[]);console.log('cloud backup never overwrites more progress; restore picks best; unreadable save kept PASS');await b.close();
}catch(e){console.error(e);process.exitCode=1;}finally{api.kill();}})();
