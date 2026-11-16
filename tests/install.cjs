// 放到主畫面：模擬 beforeinstallprompt → 自動跳卡片 → 按下呼叫 prompt()；之後再說會延後 3 天；手動入口顯示步驟
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(300);
const fire=()=>p.evaluate(()=>{window.prompted=0;const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=async()=>{window.prompted++;};e.userChoice=Promise.resolve({outcome:'accepted'});dispatchEvent(e);});
await fire();await p.locator('#install-dialog[open]').waitFor({timeout:4000});
if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
assert(await p.locator('#install-steps').isHidden());await p.click('#install-go');await p.waitForTimeout(200);
assert.equal(await p.evaluate(()=>window.prompted),1);assert(!(await p.locator('#install-dialog').evaluate(d=>d.open)));
// later → snoozed, no auto popup on next event
await fire();await p.locator('#install-dialog[open]').waitFor({timeout:4000});await p.click('#install-later');await fire();await p.waitForTimeout(2200);
assert(!(await p.locator('#install-dialog').evaluate(d=>d.open)),'snoozed');
// manual entry without a prompt → steps shown
await p.reload();await p.evaluate(()=>document.querySelector('#function-center').showModal());await p.click('#open-install');
assert(await p.locator('#install-steps').isVisible());assert.match(await p.textContent('#install-steps'),/安裝應用程式/);
assert.equal(errs.length,0,errs.join('\n'));console.log('install: auto card → prompt(), snooze 3 days, manual Android steps PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
