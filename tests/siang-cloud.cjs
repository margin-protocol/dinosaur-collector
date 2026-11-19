// 小湘雲端（Cloudflare Worker，用本機 SQLite 模擬 D1）：審核員設定通行碼 → 新增玩家拿邀請碼 → 玩家貼邀請碼連線、備份
// → 審核室看得到、別的玩家看不到；全體暗號；重新產生邀請碼後舊的失效；停用
const {chromium}=require('playwright'),assert=require('node:assert/strict');const {spawn}=require('node:child_process');
(async()=>{const api=spawn('node',['server/dev-server.mjs','8799'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,1200));
const API='http://127.0.0.1:8799';
try{
const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const ctx=await b.newContext({viewport:{width:390,height:844},permissions:['clipboard-read','clipboard-write']});await ctx.addInitScript(a=>{globalThis.SIANG_API_OVERRIDE=a;},API);
const errs=[];
// 審核室：第一次設定
const r=await ctx.newPage();r.on('pageerror',e=>errs.push('review:'+e.message));await r.goto('http://127.0.0.1:8000/review.html');
await r.locator('#rv-claim').click();await r.locator('#rv-backup:not([hidden])').waitFor();
const reviewer=await r.locator('#rv-backup-text').inputValue();assert.match(reviewer,/^REVIEW-/);
await r.locator('#rv-backup-done').click();
await r.locator('#player-add').click();await r.locator('#rv-new-name').fill('男友');await r.locator('#rv-new button[type=submit]').click();
await r.locator('#rv-invite:not([hidden])').waitFor();const invite=await r.locator('#rv-invite-text').inputValue();assert.match(invite,/^SIANG-/);
await r.locator('#player-add').click();await r.locator('#rv-new-name').fill('朋友');await r.locator('#rv-new button[type=submit]').click();
await r.waitForFunction(()=>document.querySelector('#rv-invite-text').value&&document.querySelector('#rv-invite-hint').textContent.includes('朋友'));const invite2=await r.locator('#rv-invite-text').inputValue();
assert.equal(await r.locator('#player-select option').count(),2);
// 已設定過：不能再搶審核員
const again=await r.evaluate(async a=>(await fetch(a+'/admin/claim',{method:'POST',body:JSON.stringify({hash:'0'.repeat(64)})})).status,API);assert.equal(again,409);
// 遊戲：貼邀請碼
const g=await ctx.newPage();g.on('pageerror',e=>errs.push('game:'+e.message));await g.goto('http://127.0.0.1:8000');await g.click('#intro-ok');
await g.locator('#open-center').click();await g.locator('#open-cloud').click();await g.locator('#cloud-dialog[open]').waitFor();
await g.locator('#cloud-invite').fill('nope');await g.locator('#cloud-save').click();assert.match(await g.locator('#cloud-status').textContent(),/SIANG-/);
await g.locator('#cloud-invite').fill(invite);await g.locator('#cloud-save').click();
await g.waitForFunction(()=>/歡迎，男友/.test(document.getElementById('cloud-status').textContent));
await g.locator('#cloud-backup-now').click();await g.waitForFunction(()=>/備份完成/.test(document.getElementById('cloud-status').textContent));
// 玩家各自隔離；審核員看得到
const seen=await g.evaluate(async([a,inv,inv2,rev])=>{const h=t=>({headers:{Authorization:'Bearer '+t}});
 const mine=(await fetch(a+'/ls/backups',h(inv))).json();const other=(await fetch(a+'/ls/backups',h(inv2))).json();
 const players=await (await fetch(a+'/admin/players',h(rev))).json();const boy=players.find(p=>p.name==='男友');
 const asAdmin=await (await fetch(a+'/ls/backups',{headers:{Authorization:'Bearer '+rev,'X-Player':boy.id}})).json();
 const playerAdmin=(await fetch(a+'/admin/players',h(inv))).status;
 return {mine:(await mine).length,other:(await other).length,asAdmin:asAdmin.length,playerAdmin,seenToday:Boolean(boy.seen)};},[API,invite,invite2,reviewer]);
assert.deepEqual(seen,{mine:2,other:0,asAdmin:2,playerAdmin:403,seenToday:true});
// 審核室：做印章、發全體暗號；玩家讀得到
await r.locator('#key-generate').click();await r.waitForFunction(()=>!document.getElementById('code-create').disabled);
await r.locator('#code-everyone').check();await r.locator('#code-phrase').fill('研究所上榜');await r.locator('#code-reusable').check();await r.locator('#code-create').click();
await r.waitForFunction(()=>/完成/.test(document.getElementById('code-status').textContent));
await r.waitForFunction(()=>/全體玩家/.test(document.getElementById('code-list').textContent));
const shared=await g.evaluate(async([a,inv])=>{const {sha256Hex,normalizeCode}=await import('/js/sign.js');const h=await sha256Hex(normalizeCode('研究所上榜'));return (await fetch(`${a}/f/codes/${h}.json`,{headers:{Authorization:'Bearer '+inv}})).status;},[API,invite2]);
assert.equal(shared,200,'全體暗號每位玩家都讀得到');
// 重新產生邀請碼 → 舊的失效；停用
await r.locator('#player-select').selectOption({label:'男友'});
await r.locator('#rv-reset').click();await r.locator('#rv-reset').click();await r.waitForFunction(()=>/男友/.test(document.querySelector('#rv-invite-hint').textContent));
const fresh=await r.locator('#rv-invite-text').inputValue();assert.notEqual(fresh,invite);
const st=await g.evaluate(async([a,o,n])=>[(await fetch(a+'/me',{headers:{Authorization:'Bearer '+o}})).status,(await fetch(a+'/me',{headers:{Authorization:'Bearer '+n}})).status],[API,invite,fresh]);assert.deepEqual(st,[401,200]);
await r.locator('#rv-revoke').click();await r.locator('#rv-revoke').click();await r.waitForFunction(()=>/已停用/.test(document.getElementById('cloud-status').textContent));
assert.equal(await g.evaluate(async([a,n])=>(await fetch(a+'/me',{headers:{Authorization:'Bearer '+n}})).status,[API,fresh]),401);
if(process.env.SHOT)await r.screenshot({path:process.env.SHOT,fullPage:false});
assert.equal(errs.length,0,errs.join('\n'));console.log('siang cloud: reviewer claim, invites, player backup, isolation, everyone codes, reset/revoke PASS');await b.close();
}finally{api.kill();}
})().catch(e=>{console.error(e);process.exit(1)});
