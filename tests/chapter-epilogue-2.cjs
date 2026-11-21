// 第二章尾聲劇場《小聲一點，也聽得見》：劇本結構、檔案館重看全程、木牌／閃光／字卡、存檔不變、手機寬度。
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const shots='docs/review/chapter-epilogue-2';
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),p=await c.newPage(),errors=[];p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
p.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))errors.push('404 '+r.url());});
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const unit=await p.evaluate(async()=>{const E=await import('/js/chapter-epilogue.js');const beats=E.resolveBeats(E.EPILOGUES['thunder-king']);
 return {acts:[...new Set(beats.filter(x=>x.act).map(x=>x.act))],cards:beats.filter(x=>x.kind==='card').map(x=>x.card),last:beats.at(-1),signs:beats.filter(x=>x.sign).length,flashes:beats.filter(x=>x.flash).length,ch:E.EPILOGUES['thunder-king'].chapter};});
assert.deepEqual(unit.acts,['最後一聲雷','原來，牠一直在看橋','這麼近，聽得見的','山谷重新開門','今天先說再見','很小聲的歡迎','音量調好了……大概']);
assert.deepEqual(unit.cards,['幾天後……','這一天，雷聲很小。','片尾彩蛋','轟——隆——！！！！']);assert.equal(unit.last.stamp,'第二章・完');assert(unit.signs>=4);assert(unit.flashes>=4);assert.equal(unit.ch,2);
await p.evaluate(async()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=3;s.tutorial=null;s.dex={'001':{at:'x'}};const st={};for(const id of ['mochi','sock','bento','caramel-king','sneeze-cloud','lost-shadow','angry-mushroom','thunder-king'])st[id]={clears:1,tries:1,stars:1,best:1,last:1};s.battle={stages:st,active:[],rest:{},story:{'caramel-king:after':'x','thunder-king:before':'x','thunder-king:after':'x'}};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1','[]');});
await p.reload();const save=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));const before=await save();
await p.evaluate(()=>document.getElementById('archive').showModal());await p.evaluate(()=>document.querySelector('[data-archive-tab="battle"]')?.click());
const btn=p.locator('#archive-body .epilogue-cta').nth(1);assert.equal(await p.locator('#archive-body .epilogue-cta').count(),2);
await btn.evaluate(n=>n.closest('details').open=true);await btn.click();await p.locator('#chapter-epilogue[open]').waitFor();
fs.mkdirSync(shots,{recursive:true});const total=Number((await p.locator('.epi__count').textContent()).split('/')[1]);
const keys={0:'storm',3:'bridge',9:'stone',12:'crown',16:'nod',25:'sign',30:'see-you',40:'peek',45:'welcome',46:'quiet',53:'boom',54:'aftermath',62:'stamp'};
for(let i=0;i<total;i++){assert.equal(await p.locator('.epi__stage').getAttribute('data-step'),String(i));
 if(keys[i]){await p.waitForTimeout(80);await p.locator('.epi__stage img').evaluateAll(imgs=>Promise.all(imgs.filter(x=>x.src).map(x=>x.decode().catch(()=>{}))));await p.screenshot({path:`${shots}/${String(i).padStart(2,'0')}-${keys[i]}-390.png`});}
 if(i===25)assert.equal(await p.locator('.epi__sign').textContent(),'歡迎來玩。請勿踩菇。');
 await p.locator('.epi__stage').click({position:{x:200,y:200}});}
await p.locator('.epi__end').waitFor();assert.match(await p.locator('#epilogue-title').textContent(),/第二章《烏雲山谷》・完/);assert.match(await p.locator('.epi__unlock').textContent(),/第三章/);
await p.screenshot({path:`${shots}/end-390.png`});await p.locator('[data-a="again"]').click();
for(const theme of ['sakura','blue']){await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);for(const [w,h] of [[360,640],[430,932]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(100);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const r=await p.locator('#chapter-epilogue').boundingBox();assert(r.y>=0&&r.y+r.height<=h+1);await p.screenshot({path:`${shots}/${theme}-${w}.png`});}}
await p.keyboard.press('Escape');await p.locator('#chapter-epilogue').waitFor({state:'hidden'});
assert.deepEqual(await save(),before,'replay never touches the save');assert.deepEqual(errors,[]);
console.log(`chapter epilogue 2: ${total} beats, 7 acts, 4 cards, sign/flash, archive replay, save untouched, 360–430 both themes PASS`);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
