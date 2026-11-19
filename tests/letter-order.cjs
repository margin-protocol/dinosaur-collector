// 紙條排序：沒讀過的在最上面、讀過的湘的紙條不再置頂；討伐分頁的小紅點是小圓點、不蓋住字
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=3;s.dex={'001':{at:'x'},'004':{at:'x'}};s.letters={read:['mail-a'],mail:[{id:'mail-a',title:'夜貓小湘的紙條',body:'嗨',at:'2026-11-19T10:00:00Z'}],seen:{}};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:theme:v1','sakura');});
await p.reload();await p.waitForTimeout(400);
await p.locator('#home-letter').click();
await p.locator('#letter-box[open]').waitFor({timeout:5000});
const titles=await p.locator('.letter-item span:first-of-type').allTextContents();
assert.doesNotMatch(titles[0],/夜貓小湘的紙條/,'讀過的湘的紙條不會卡在最上面');
assert.match(titles.at(-1),/致親愛的飼養員/);
assert.equal(await p.locator('.letter-item.is-mail.is-unread').count(),0);
const s=await p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')).letters.seen);assert(Object.keys(s).length>0,'里程碑紙條記下出現時間');
await p.keyboard.press('Escape');
// 討伐分頁小紅點
await p.evaluate(()=>{const e=document.getElementById('battle-tab-badge');e.hidden=false;e.textContent='1';document.getElementById('errand-dialog')?.showModal();});
const r=await p.locator('#battle-tab-badge').boundingBox();assert(r.width<=24,`小紅點寬度 ${r.width}`);
assert.equal(errs.length,0,errs.join('\n'));console.log('letters: unread first, read mail not pinned, intro last, seen stamps; battle tab badge is a small dot PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
