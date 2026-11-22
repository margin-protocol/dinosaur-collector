// 第四章尾聲劇場《請記得我的名字》＋後日談《天亮以後》：劇本結構、結尾卡接後日談、檔案館兩顆重看鈕、存檔不變、手機寬度。
// W=寬 THEME=主題 可另外出預覽；SHOTS=1 時逐句關鍵畫面存到 docs/review/chapter-epilogue-4。
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const shots='docs/review/chapter-epilogue-4';
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),p=await c.newPage(),errors=[];p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
p.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))errors.push('404 '+r.url());});
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const unit=await p.evaluate(async()=>{const E=await import('/js/chapter-epilogue.js');const A=E.EPILOGUES['nameless-book'],B=E.EPILOGUES[A.sequel];const a=E.resolveBeats(A),b=E.resolveBeats(B);
 const acts=(x)=>[...new Set(x.filter(y=>y.act).map(y=>y.act))];
 return {sequel:A.sequel,ch:[A.chapter,B.chapter],next:[A.next,B.next],actsA:acts(a),actsB:acts(b),lastA:a.at(-1).stamp,lastB:b.at(-1).stamp,cardsA:a.filter(x=>x.kind==='card').map(x=>x.card),cardsB:b.filter(x=>x.kind==='card').map(x=>x.card),
  bgs:[...new Set([...a,...b].filter(x=>x.bg&&x.kind!=='card').map(x=>x.bg))],huhu:[...a,...b].filter(x=>/呵呵/.test(x.text)).length,nA:a.length,nB:b.length};});
assert.equal(unit.sequel,'nameless-book~after');assert.deepEqual(unit.ch,[4,4]);assert.deepEqual(unit.next,['','']);
assert.deepEqual(unit.actsA,['最後一頁','紙頁像雪一樣','第一個清晨','換我們記得妳','把名帖交還給妳','她自己的名字','大家都在']);
assert.deepEqual(unit.actsB,['紅豆湯圓','街道的盡頭','一起等天亮']);
assert.equal(unit.lastA,'第四章・完');assert.equal(unit.lastB,'後日談・完');assert.deepEqual(unit.cardsA,['請記得我的名字。']);assert.deepEqual(unit.cardsB,['後日談','幾天後，','天亮以後，']);
assert.equal(unit.bgs.length,10,'battle bg + 9 storybook scenes');assert.equal(unit.huhu,0,'湘不喜歡一直呵呵');
const st={};for(const id of ['mochi','sock','bento','caramel-king','sneeze-cloud','lost-shadow','angry-mushroom','thunder-king','toy-bunny','glitch-gummy','melody-guard','director-giggle','welcome-lantern','wild-taiko','faceless-mirror','faceless-float','nameless-book'])st[id]={clears:1,tries:1,stars:1,best:1,last:1};
await p.evaluate((st)=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=3;s.tutorial=null;s.dex={'001':{at:'x'}};s.battle={stages:st,active:[],rest:{},story:{'caramel-king:after':'x','thunder-king:after':'x','director-giggle:after':'x','nameless-book:before':'x','nameless-book:after':'x'}};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1','[]');},st);
await p.reload();const save=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));const before=await save();
await p.evaluate(()=>document.getElementById('archive').showModal());await p.evaluate(()=>document.querySelector('[data-archive-tab="battle"]')?.click());
const ctas=p.locator('#archive-body .epilogue-cta');assert.equal(await ctas.count(),5);assert.match(await ctas.nth(4).textContent(),/後日談/);
const btn=ctas.nth(3);await btn.evaluate(n=>n.closest('details').open=true);await btn.click();await p.locator('#chapter-epilogue[open]').waitFor();
const doShots=process.env.SHOTS==='1';if(doShots)fs.mkdirSync(shots,{recursive:true});
async function walk(tag,keys){const total=Number((await p.locator('.epi__count').textContent()).split('/')[1]);
 for(let i=0;i<total;i++){assert.equal(await p.locator('.epi__stage').getAttribute('data-step'),String(i));
  if(doShots&&(keys==='all'||keys.includes(i))){await p.waitForTimeout(60);await p.locator('.epi__stage img').evaluateAll(imgs=>Promise.all(imgs.filter(x=>x.src).map(x=>x.decode().catch(()=>{}))));await p.screenshot({path:`${shots}/${tag}-${String(i).padStart(2,'0')}-390.png`});}
  await p.locator('.epi__stage').click({position:{x:200,y:200}});}
 return total;}
const keys=process.env.ALL==='1'?'all':[0,1,4,9,12,16,17,20,27,29,33,36,40,43,45,47,49];
const totalA=await walk('main',keys);assert.equal(totalA,unit.nA);
await p.locator('.epi__end').waitFor();assert.match(await p.locator('#epilogue-title').textContent(),/第四章《花街無名帖》・完/);assert(await p.locator('.epi__unlock').isHidden());
const seq=p.locator('.epi__end [data-a="sequel"]');assert(await seq.isVisible());assert.match(await seq.textContent(),/後日談《天亮以後》/);
if(doShots)await p.screenshot({path:`${shots}/main-end-390.png`});
await seq.click();assert(await p.locator('.epi__end').isHidden());
const totalB=await walk('after',process.env.ALL==='1'?'all':[1,3,9,12,16,18,22,23,25,26]);assert.equal(totalB,unit.nB);
await p.locator('.epi__end').waitFor();assert.equal(await p.locator('#epilogue-title').textContent(),'後日談《天亮以後》・完');assert.equal(await p.locator('.epi__end small').textContent(),'AFTER STORY');assert(await seq.isHidden());
if(doShots)await p.screenshot({path:`${shots}/after-end-390.png`});await p.locator('[data-a="again"]').click();await p.locator('.epi__stage').click({position:{x:200,y:200}});
for(const theme of ['sakura','blue']){await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);for(const [w,h] of [[360,640],[430,932]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(100);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const r=await p.locator('#chapter-epilogue').boundingBox();assert(r.y>=0&&r.y+r.height<=h+1);if(doShots)await p.screenshot({path:`${shots}/${theme}-${w}.png`});}}
await p.keyboard.press('Escape');await p.locator('#chapter-epilogue').waitFor({state:'hidden'});
await ctas.nth(4).evaluate(n=>n.closest('details').open=true);await ctas.nth(4).click();await p.locator('#chapter-epilogue[open]').waitFor();assert.equal(await p.locator('.epi__card b').textContent(),'後日談');await p.keyboard.press('Escape');
assert.deepEqual(await save(),before,'replay never touches the save');assert.deepEqual(errors,[]);
console.log(`chapter epilogue 4: ${totalA}+${totalB} beats, 7+3 acts, sequel button, archive replay ×2, save untouched, 360–430 both themes PASS`);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
