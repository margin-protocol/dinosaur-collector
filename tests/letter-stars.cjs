// 重要紙條：讀紙條時按星星收藏、再按取消；「★ 重要」分頁依按星時間新到舊；委託紙條顯示「小湘寫的」、不算湘寄來的成就
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:360,height:780},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=3;s.dex={'001':{at:'x'}};s.letters={read:[],seen:{},mail:[
  {id:'20261119-abcd',title:'今天好想你',body:'湘的紙條',at:'2026-11-19T10:00:00Z'},
  {id:'siang-e1',title:'夜貓小湘的紙條',body:'明天也要好好吃飯。',at:'2026-11-20T10:00:00Z'},
  {id:'siang-e2',title:'甜點小湘的紙條',body:'布丁是我的。',at:'2026-11-20T12:00:00Z'}]};localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro[open]').count())await p.click('#intro-ok');
await p.locator('#home-letter').click();await p.locator('#letter-box[open]').waitFor();
const subs=await p.locator('.letter-item small').allTextContents();
assert(subs.some(t=>/^小湘寫的/.test(t)),'委託紙條顯示小湘寫的');assert.equal(subs.filter(t=>/^湘寄來的/.test(t)).length,1);
// 重要分頁一開始是空的
await p.click('#letter-tab-starred');assert.match(await p.textContent('.letter-empty'),/還沒有重要紙條/);assert(await p.locator('#letter-locked').isHidden());
await p.click('#letter-tab-all');
const star=async title=>{await p.locator('.letter-item',{hasText:title}).click();await p.locator('#letter-read[open]').waitFor();await p.click('#letter-read-star');await p.waitForFunction(()=>document.querySelector('#letter-read-star').getAttribute('aria-pressed')==='true');await p.click('#letter-read-ok');};
await star('夜貓小湘的紙條');await p.waitForTimeout(30);await star('致親愛的飼養員');
assert.equal(await p.locator('.letter-item .letter-star').count(),2);
assert.equal(await p.textContent('#letter-starred-count'),'2');
await p.click('#letter-tab-starred');
let titles=await p.locator('.letter-item > span:first-of-type').allTextContents();
assert.equal(titles.length,2);assert.match(titles[0],/致親愛的飼養員/,'後按星的在上面');assert.match(titles[1],/夜貓小湘的紙條/);
await p.waitForTimeout(400);await p.screenshot({path:process.env.SHOT||'/tmp/letter-stars.png'});
// 再按一次取消
await p.locator('.letter-item',{hasText:'致親愛的飼養員'}).click();await p.locator('#letter-read[open]').waitFor();
assert.match(await p.textContent('#letter-read-star'),/已是重要紙條/);
if(process.env.SHOT2){await p.waitForTimeout(700);await p.screenshot({path:process.env.SHOT2});}
await p.click('#letter-read-star');await p.waitForFunction(()=>document.querySelector('#letter-read-star').getAttribute('aria-pressed')==='false');await p.click('#letter-read-ok');
assert.equal(await p.locator('.letter-item').count(),1);
let s=await save();assert.deepEqual(Object.keys(s.letters.starred),['siang-e1']);assert.equal(s.letters.mail.length,3,'紙條不會被清掉');
// 重新整理後還在
await p.reload();await p.waitForTimeout(300);s=await save();assert(s.letters.starred['siang-e1']);
const n=await p.evaluate(async k=>{const L=await import('/js/letters.js');return L.siangMailCount(JSON.parse(localStorage.getItem(k)));},key);assert.equal(n,1,'只有湘寄的算成就');
assert.equal(errs.length,0,errs.join('\n'));console.log('letter stars: star/unstar from reader, starred tab newest-first, notes labelled 小湘寫的, achievement counts only 湘 mail PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
