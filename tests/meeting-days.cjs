// 相遇的故事：「陪了你不到一天」不能多空格；蛋陪伴用滿 24 小時算；另外寫出到今天相遇第幾天（破殼當天是第一天）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const W=+(process.env.W||390);
const p=await b.newPage({viewport:{width:W,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));const d=(n,h=12)=>{const t=new Date();t.setDate(t.getDate()-n);t.setHours(h,0,0,0);return t.toISOString();};
  s.hatched=3;s.dex={
    '001':{at:d(7,13),story:{egg:'origin',since:d(7,9),nth:1,wishes:3}},
    '002':{at:d(2),story:{egg:'origin',since:new Date(Date.parse(d(2))-20*36e5).toISOString(),nth:2}},
    '003':{at:d(0,0),story:{egg:'origin',since:new Date(Date.parse(d(0,0))-3*864e5).toISOString(),nth:3}}};
  localStorage.setItem(k,JSON.stringify(s));});
if(process.env.THEME)await p.evaluate(t=>localStorage.setItem('siang-collector:theme:v1',t),process.env.THEME);
await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(400);
const story=async no=>{await p.click(`.dex__card[data-dex-no="${no}"]`);await p.waitForTimeout(250);const t=await p.textContent('#dex-detail-story');
  if(process.env.SHOT&&no==='001'){await p.locator('#dex-detail-story').scrollIntoViewIfNeeded();await p.screenshot({path:process.env.SHOT});}
  await p.click('#close-dex-detail');await p.waitForTimeout(150);return t;};
const s1=await story('001'),s2=await story('002'),s3=await story('003');
assert.match(s1,/這顆蛋陪了你不到一天才破殼，是你孵化的第 1 顆蛋；那天你完成了 3 個願望。今天是你們相遇的第 8 天。$/,s1);
assert.match(s2,/陪了你不到一天才破殼/,'20 小時不能被四捨五入成 1 天：'+s2);
assert.match(s2,/相遇的第 3 天。$/,s2);
assert.match(s3,/陪了你 3 天才破殼/,s3);
assert.match(s3,/今天是你們相遇的第一天。$/,s3);
assert(!/你 不到/.test(s1+s2+s3));
assert.deepEqual(errs,[]);await b.close();console.log('meeting-days ok');})().catch(e=>{console.error(e);process.exit(1);});
