// 圖片載入失敗的復原：第一次失敗會重試；落到佔位圖後，網路恢復或切回遊戲會再載入正式圖（11/18 暗號蛋只剩虛線外框）
const {chromium,devices}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({...devices['Pixel 7'],serviceWorkers:'block'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(400);
await p.evaluate(()=>{const k='siang-collector:v1';const s=JSON.parse(localStorage.getItem(k));s.dex={'001':{at:'x'}};s.hatched=1;s.tutorial=null;s.egg={id:'cipher',warmth:100,since:new Date().toISOString()};s.eggOffer=null;localStorage.setItem(k,JSON.stringify(s));});
const shell=()=>p.evaluate(()=>{const i=document.querySelector('.egg__layer--shell');return [i.getAttribute('src'),i.naturalWidth];});
// 1) a single blip on the shell: retried and loads the real art
let blips=1;await p.route('**/assets/eggs/cipher/shell.webp*',r=>{if(blips-->0)return r.abort('internetdisconnected');return r.continue();});
await p.reload();await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(2500);
let s=await shell();assert.match(s[0],/cipher\/shell\.webp/);assert(s[1]>0,'retried after one failure');
await p.unroute('**/assets/eggs/cipher/shell.webp*');
// 2) offline long enough to fall back to the placeholder, then the network comes back
await p.route('**/assets/eggs/cipher/**',r=>r.abort('internetdisconnected'));
await p.reload();await p.evaluate(()=>location.hash='incubate');await p.waitForTimeout(2500);
s=await shell();assert.match(s[0],/_placeholder/,'fell back while offline: '+s[0]);
await p.unroute('**/assets/eggs/cipher/**');await p.evaluate(()=>window.dispatchEvent(new Event('online')));await p.waitForTimeout(1500);
s=await shell();assert.match(s[0],/cipher\/shell\.webp/);assert(s[1]>0,'recovered when back online');
assert.equal(errs.length,0,errs.join('\n'));console.log('image retry: one blip retried, placeholder recovers when back online PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
