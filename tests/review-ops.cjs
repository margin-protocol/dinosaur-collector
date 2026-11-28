// 審核室「營運」分頁（湘 11/28）：上線看板（玩家版／主分支版本、活動時間從設定讀、這版要驗）＋Bug 清單（主分支已修／玩家版已驗分開標）
// 資料在小湘雲端 shared/ops/board.json：只有審核員讀寫得到，玩家邀請碼和沒登入都讀不到。
// SHOT=路徑前綴 會存截圖；WIDTH 換寬度。
const {chromium}=require('playwright'),assert=require('node:assert/strict');const {spawn}=require('node:child_process');
(async()=>{const port=8796;const api=spawn('node',['server/dev-server.mjs',String(port)],{stdio:'ignore'});await new Promise(r=>setTimeout(r,1200));
const API=`http://127.0.0.1:${port}`;
try{
const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const width=Number(process.env.WIDTH||390);
const ctx=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:process.env.SHOT?2:1});await ctx.addInitScript(a=>{globalThis.SIANG_API_OVERRIDE=a;},API);
// 主分支版本：假裝 GitHub 上比玩家版新一版
const local=require('../changelog.json');const mainV=local[0].version+'z';
await ctx.route('https://raw.githubusercontent.com/**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify([{version:mainV,title:'下一版'}])}));
const errs=[];const r=await ctx.newPage();r.on('pageerror',e=>errs.push(e.message));
await r.goto(`http://127.0.0.1:8000/review.html`);
// 沒登入：營運分頁鎖著
await r.locator('#tab-ops').click();await r.locator('#ops-locked').waitFor();assert(await r.locator('#ops-bugs').isHidden());
await r.locator('#tab-setup').click();
await r.locator('#rv-claim').click();await r.locator('#rv-backup:not([hidden])').waitFor();await r.locator('#rv-backup-done').click();
await r.locator('#player-add').click();await r.locator('#rv-new-name').fill('朋朋');await r.locator('#rv-new button[type=submit]').click();
await r.waitForFunction(()=>document.querySelector('#rv-invite-hint').textContent.includes('朋朋'));const invite=await r.locator('#rv-invite-text').inputValue();
await r.locator('#tab-ops').click();await r.locator('#ops-bugs').waitFor();assert(await r.locator('#ops-locked').isHidden());
// 第一次：放進 11/28 的五個 bug 當範例，玩家版都已經有了＝待驗
await r.waitForFunction(()=>document.querySelectorAll('#ops-bug-list .ops-bug').length===5);
assert.equal(await r.textContent('#ops-live'),`v${local[0].version}`);assert.equal(await r.textContent('#ops-main'),`v${mainV}`);
assert.match(await r.textContent('#ops-sync'),/還在部署/);
assert.match(await r.textContent('#ops-filter [data-filter=live]'),/待驗 5/);
assert.match(await r.textContent('#ops-bug-list'),/隊名/);assert.match(await r.textContent('#ops-bug-list'),/主分支已修11\.28o/);
assert.equal(await r.locator('#ops-checks .ops-check.is-bug').count(),5,'玩家版有了、還沒驗的 bug 自動列進「這版要驗」');
// 活動時間：從遊戲設定讀（不是手抄）
const times=await r.textContent('#ops-times');
const {EVENT_DEFS}=await import('../js/events.js');const {SIDE_OPEN_AT}=await import('../js/side.js');
assert.equal(EVENT_DEFS.mo.start,'2026-11-26T12:00:00+08:00');assert.equal(SIDE_OPEN_AT,'2026-12-05T12:00:00+08:00');
if(Date.now()<Date.parse('2026-12-05T04:00:00Z')){assert.match(times,/12\/5（六）12:00/);assert.match(times,/島嶼不歸檔/);}
if(Date.now()<Date.parse('2026-12-17T04:00:00Z')){assert.match(times,/12\/17（四）12:00/);assert.match(times,/商店關閉/);}
if(Date.now()<Date.parse('2026-11-29T04:00:00Z'))assert.match(times,/11\/29（日）12:00.*下卷/s);
// 這版要驗：加一項手動的
await r.locator('#ops-check-text').fill('下卷開放後劇情順序');await r.locator('#ops-check-form button').click();
await r.waitForFunction(()=>/已加進這版要驗/.test(document.getElementById('ops-status').textContent));
// 皮寶複驗一個
const team=r.locator('#ops-bug-list .ops-bug',{hasText:'隊名'});
await team.locator('.ops-who').selectOption('皮寶');await team.getByRole('button',{name:'標成玩家版已驗'}).click();
await r.waitForFunction(()=>/玩家版已驗/.test(document.getElementById('ops-status').textContent));
assert.equal(await r.locator('#ops-bug-list .ops-bug').count(),4,'已驗的離開「還沒結」');
await r.locator('#ops-filter [data-filter=verified]').click();assert.match(await r.textContent('#ops-bug-list'),/玩家版已驗皮寶/);
// 回報一個新 bug → 待修 → 主分支已修（主分支版本比玩家版新＝還沒上線，不能標已驗）
await r.locator('#ops-filter [data-filter=todo]').click();
await r.locator('#ops-add').click();const f=r.locator('.ops-form');
await f.locator('[name=title]').fill('下卷開放後信物櫃少一格');await f.locator('[name=steps]').fill('1. 打開墨痕江湖\n2. 信物櫃\n3. 應該 5 格，結果 4 格');await f.locator('[name=priority]').selectOption('P0');
await f.locator('button[type=submit]').click();await r.waitForFunction(()=>/已加進清單/.test(document.getElementById('ops-status').textContent));
const nb=r.locator('#ops-bug-list .ops-bug',{hasText:'信物櫃'});assert.equal(await nb.locator('.ops-steps li.is-now').textContent(),'回報皮寶');
assert.equal(await r.locator('#ops-bug-list .ops-bug').first().textContent().then(t=>t.includes('信物櫃')),true,'待修排最前');
if(process.env.SHOT)await r.screenshot({path:`${process.env.SHOT}-open.png`,fullPage:true});
await nb.getByRole('button',{name:'標成主分支已修'}).click();assert.equal(await nb.locator('.ops-ver').inputValue(),mainV);await nb.getByRole('button',{name:'確定'}).click();
await r.waitForFunction(()=>/已標成主分支已修/.test(document.getElementById('ops-status').textContent));
const nb2=r.locator('#ops-bug-list .ops-bug',{hasText:'信物櫃'});assert.match(await nb2.locator('.ops-steps li.is-now').textContent(),/主分支已修\d/);assert(await nb2.getByRole('button',{name:'標成玩家版已驗'}).isDisabled());
assert.equal(await r.evaluate(()=>document.documentElement.scrollWidth),width,'no horizontal scroll');
// 重新整理後資料還在（存在雲端）
await r.reload();await r.locator('#tab-ops').click();await r.waitForFunction(()=>document.querySelectorAll('#ops-bug-list .ops-bug').length===5);
assert.match(await r.textContent('#ops-checks'),/下卷開放後劇情順序/);
if(process.env.SHOT){await r.addStyleTag({content:'.tabs{position:static!important}'});await r.locator('#sec-ops-board').screenshot({path:`${process.env.SHOT}-board.png`});await r.locator('#ops-bugs').screenshot({path:`${process.env.SHOT}-bugs.png`});}
// 玩家邀請碼、沒登入：都讀不到營運資料
const leak=await r.evaluate(async([api,inv])=>[(await fetch(`${api}/f/shared/ops/board.json`,{headers:{Authorization:'Bearer '+inv}})).status,(await fetch(`${api}/f/shared/ops/board.json`)).status,(await fetch(`${api}/ls/shared/ops`,{headers:{Authorization:'Bearer '+inv}})).status],[API,invite]);
assert.equal(leak[0],404);assert.equal(leak[1],401);
assert.deepEqual(errs,[]);await b.close();console.log('review-ops ok');
}finally{api.kill();}
})().catch(e=>{console.error(e);process.exit(1);});
