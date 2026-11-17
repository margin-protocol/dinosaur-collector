// 每日願望新玩法：雙色拍照、陪伴（摸摸頭進度→收下）、主題拍照（拍了就算＋每日相簿）、小恐龍的問題、限時、改版當天沿用舊願望
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
const seed=(ids,extra={})=>p.evaluate(([k,ids,extra])=>{const s=JSON.parse(localStorage.getItem(k));const d=new Date();const pad=n=>String(n).padStart(2,'0');const today=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;s.wishes={date:today,done:[],stage:'young',ids,base:{pets:s.bonus.total.pets||0,greets:0,explores:0,departed:0}};Object.assign(s,extra);localStorage.setItem(k,JSON.stringify(s));},[key,ids,extra]);
const img=(colors)=>p.evaluate(cols=>{const cv=document.createElement('canvas');cv.width=cv.height=60;const g=cv.getContext('2d');cols.forEach((col,i)=>{g.fillStyle=col;g.fillRect(0,i*60/cols.length,60,60/cols.length);});return cv.toDataURL('image/png').split(',')[1];},colors).then(x=>Buffer.from(x,'base64'));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(400);
// a fresh day uses the new mix: one colour-type, one no-photo, one theme
let s=await save();const mix=await p.evaluate(async()=>{const m=await import('/js/wishes.js');return m.wishesFor(m.todayKey()).map(w=>w.kind);});
assert(['color','duo','rainbow','bright','dark','morning','night'].includes(mix[0]));assert(['act','quiz'].includes(mix[1]));assert.equal(mix[2],'theme');
// legacy day: wishes started before the update keep the old three colours
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.wishes={date:s.wishes.date,done:[],stage:'young'};localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.waitForTimeout(300);
s=await save();assert(s.wishes.ids.every(id=>/^[a-z]+$/.test(id)),'legacy colour ids: '+s.wishes.ids);
// duo + act + theme
await seed(['duo:yellow:blue','act:pet','theme:0'],{energy:0});await p.goto('http://127.0.0.1:8000/#wish');await p.reload();await p.waitForTimeout(400);
await p.locator('.mission[data-wish="duo:yellow:blue"] input').setInputFiles({name:'r.png',mimeType:'image/png',buffer:await img(['#d2203f'])});
await p.locator('#photo[open]').waitFor();assert.match(await p.textContent('#photo-title'),/還差一種顏色/);await p.click('#photo-ok');
await p.locator('.mission[data-wish="duo:yellow:blue"] input').setInputFiles({name:'yb.png',mimeType:'image/png',buffer:await img(['#f0b03a','#3f8fe0'])});
await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).wishes.done.includes('duo:yellow:blue'),key);
s=await save();assert(s.player.stats.colors.includes('yellow')&&s.player.stats.colors.includes('blue'));
// act: not ready → disabled; pet 3 times → claim
await p.locator('#book-gems button').nth(1).click();
assert(await p.locator('.mission[data-wish="act:pet"] .mission-claim').isDisabled());assert.match(await p.textContent('.mission[data-wish="act:pet"] .mission-progress'),/0 \/ 3/);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.bonus.total.pets=(s.bonus.total.pets||0)+3;localStorage.setItem(k,JSON.stringify(s));},key);await p.reload();await p.waitForTimeout(400);
await p.locator('#book-gems button').nth(1).click();
await p.locator('.mission[data-wish="act:pet"] .mission-claim').scrollIntoViewIfNeeded();await p.waitForTimeout(300);if(process.env.SHOT) await p.screenshot({path:process.env.SHOT});
await p.click('.mission[data-wish="act:pet"] .mission-claim');await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).wishes.done.includes('act:pet'),key);
// theme: any photo counts, goes to the album
await p.locator('#book-gems button').nth(2).click();
await p.locator('.mission[data-wish="theme:0"] input').setInputFiles({name:'any.png',mimeType:'image/png',buffer:await img(['#777','#333','#aa8'])});
await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).wishes.done.includes('theme:0'),key);
s=await save();assert.equal(s.wishes.done.length,3);assert.equal(s.energy,105);
await p.waitForTimeout(2500);await p.click('#open-album');await p.locator('#album-dialog[open]').waitFor();assert.equal(await p.locator('.album-item').count(),1);
assert.match(await p.textContent('.album-item'),/圓形/);
if(process.env.SHOT2){await p.waitForTimeout(300);await p.screenshot({path:process.env.SHOT2});}
await p.click('#close-album');
// quiz: either answer completes
await seed(['red','quiz:0','theme:1']);await p.reload();await p.waitForTimeout(400);
await p.locator('#book-gems button').nth(1).click();await p.click('.mission[data-wish="quiz:0"] .mission-quiz button >> nth=0');
await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).wishes.done.includes('quiz:0'),key);
// timed wishes respect their window
const t=await p.evaluate(async()=>{const m=await import('/js/wishes.js');const w=m.wishById('morning');const st={colors:{},bright:0.9,dark:0,glow:0};return [m.judge(w,st,new Date(2026,10,18,8)).pass,m.judge(w,st,new Date(2026,10,18,14)).pass,m.judge(m.wishById('night'),{colors:{},bright:0.1,dark:0.6,glow:0.05},new Date(2026,10,18,22)).pass];});
assert.deepEqual(t,[true,false,true]);
// completeDaily refuses an act wish that is not ready
const refused=await p.evaluate(async k=>{const {completeDaily}=await import('/js/progression.js');const s=JSON.parse(localStorage.getItem(k));s.wishes.ids=['red','act:errand','theme:2'];s.wishes.done=[];s.wishes.base.departed=s.errands.departed||0;return completeDaily(s,s.wishes.date,'act:errand').awarded;},key);
assert.equal(refused,false);
assert.equal(errs.length,0,errs.join('\n'));
console.log('daily mix: new mix, legacy day kept, duo photo, act progress claim, theme album, quiz, time windows PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
