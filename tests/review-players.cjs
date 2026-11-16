// 審核室多位玩家：新增、切換、暗號只寫進目前玩家的資料庫、舊版設定自動搬移
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const A=require('./fake-github.cjs')('me/player-a'),B=require('./fake-github.cjs')('me/player-b');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844}});
await c.route('https://api.github.com/**',route=>(route.request().url().includes('player-b')?B:A).handler(route));
const r=await c.newPage();const errs=[];r.on('pageerror',e=>errs.push(e.message));
// 舊版單一設定
await r.goto('http://127.0.0.1:8000/review.html');
await r.evaluate(()=>localStorage.setItem('siang-collector:review-cloud:v1',JSON.stringify({repo:'me/player-a',token:'good-token'})));await r.reload();
assert.match(await r.textContent('#cloud-status'),/玩家 1/);assert(await r.locator('#player-row').isVisible());
await r.click('#key-generate');await r.waitForFunction(()=>document.querySelector('#key-public').value.length>20);
// 新增第二位
await r.click('#player-add');await r.fill('#player-name','朋朋');await r.fill('#cloud-repo','me/player-b');await r.fill('#cloud-token','good-token');await r.click('#cloud-save');
await r.waitForFunction(()=>/連線成功/.test(document.querySelector('#cloud-status').textContent));
assert.equal(await r.locator('#player-select option').count(),2);assert.match(await r.textContent('#sec-code h2'),/朋朋/);
// 重複資料庫
await r.click('#player-add');await r.fill('#cloud-repo','me/player-a');await r.fill('#cloud-token','good-token');await r.click('#cloud-save');assert.match(await r.textContent('#cloud-status'),/已經在名單/);await r.click('#player-cancel');
// 暗號給朋朋
await r.fill('#code-phrase','給朋朋的暗號');await r.click('#code-create');await r.waitForFunction(()=>/完成/.test(document.querySelector('#code-status').textContent));
assert.equal([...B.files.keys()].filter(k=>k.startsWith('codes/')).length,1);assert.equal([...A.files.keys()].filter(k=>k.startsWith('codes/')).length,0);
// 切回玩家 1
await r.selectOption('#player-select','0');assert.match(await r.textContent('#sec-letter h2'),/玩家 1/);
await r.fill('#letter-body','給玩家一的紙條');await r.click('#letter-send');await r.waitForFunction(()=>/寄出了/.test(document.querySelector('#letter-status').textContent));
assert.equal([...A.files.keys()].filter(k=>k.startsWith('letters/')).length,1);assert.equal([...B.files.keys()].filter(k=>k.startsWith('letters/')).length,0);
assert.equal(errs.length,0,errs.join('\n'));
console.log('review players: legacy migration, add/switch, per-player codes and letters, duplicate repo guard PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
