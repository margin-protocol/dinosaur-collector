// 第三章尾聲劇場《今天，可以不用笑》：劇本結構、檔案館重看全程、控制室螢幕（倒數／故障章）、音符、存檔不變、手機寬度。
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const shots='docs/review/chapter-epilogue-3';
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'}),p=await c.newPage(),errors=[];p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
p.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))errors.push('404 '+r.url());});
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const unit=await p.evaluate(async()=>{const E=await import('/js/chapter-epilogue.js');const beats=E.resolveBeats(E.EPILOGUES['director-giggle']);
 return {acts:[...new Set(beats.filter(x=>x.act).map(x=>x.act))],cards:beats.filter(x=>x.kind==='card').map(x=>x.card),last:beats.at(-1),screens:beats.filter(x=>x.screen).length,stamps:beats.filter(x=>x.screen?.stamp).length,notes:beats.filter(x=>x.prop==='notes').length,next:E.EPILOGUES['director-giggle'].next,ch:E.EPILOGUES['director-giggle'].chapter};});
assert.deepEqual(unit.acts,['笑臉停下來了','那些被蓋成故障的心願','一首唱錯也沒關係的歌','這次，先聽你們說','那你自己快樂嗎？','不用交成績的派對','今天學會哭哭了']);
assert.deepEqual(unit.cards,['不必永遠開心，','片尾彩蛋']);assert.equal(unit.last.stamp,'第三章・完');assert(unit.screens>=10);assert.equal(unit.stamps,3);assert(unit.notes>=5);assert.equal(unit.ch,3);assert.equal(unit.next,'第四章《花街無名帖》');
await p.evaluate(async()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=3;s.tutorial=null;s.dex={'001':{at:'x'}};const st={};for(const id of ['mochi','sock','bento','caramel-king','sneeze-cloud','lost-shadow','angry-mushroom','thunder-king','toy-bunny','glitch-gummy','melody-guard','director-giggle'])st[id]={clears:1,tries:1,stars:1,best:1,last:1};s.battle={stages:st,active:[],rest:{},story:{'caramel-king:after':'x','thunder-king:after':'x','director-giggle:before':'x','director-giggle:after':'x'}};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1','[]');});
await p.reload();const save=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));const before=await save();
await p.evaluate(()=>document.getElementById('archive').showModal());await p.evaluate(()=>document.querySelector('[data-archive-tab="battle"]')?.click());
const btn=p.locator('#archive-body .epilogue-cta').nth(2);assert.equal(await p.locator('#archive-body .epilogue-cta').count(),3);
await btn.evaluate(n=>n.closest('details').open=true);await btn.click();await p.locator('#chapter-epilogue[open]').waitFor();
fs.mkdirSync(shots,{recursive:true});const total=Number((await p.locator('.epi__count').textContent()).split('/')[1]);
const keys={1:'count',5:'confused',10:'stamp',15:'bunny',18:'notes',32:'alert',34:'listening',42:'happy',49:'over',52:'tears',66:'dino',72:'laugh',76:'end'};
for(let i=0;i<total;i++){assert.equal(await p.locator('.epi__stage').getAttribute('data-step'),String(i));
 if(keys[i]){await p.waitForTimeout(80);await p.locator('.epi__stage img').evaluateAll(imgs=>Promise.all(imgs.filter(x=>x.src).map(x=>x.decode().catch(()=>{}))));await p.screenshot({path:`${shots}/${String(i).padStart(2,'0')}-${keys[i]}-390.png`});}
 if(i===2)assert.equal(await p.locator('.epi__screen-lines').textContent(),'今日歡笑指數0%');if(i===10)assert.equal(await p.locator('.epi__screen-stamp').textContent(),'故障');if(i===20)assert(await p.locator('.epi__screen').isHidden());
 await p.locator('.epi__stage').click({position:{x:200,y:200}});}
await p.locator('.epi__end').waitFor();assert.match(await p.locator('#epilogue-title').textContent(),/第三章《故障的玩具星球》・完/);assert.match(await p.locator('.epi__unlock').textContent(),/下一章：第四章《花街無名帖》/);
await p.screenshot({path:`${shots}/end-390.png`});await p.locator('[data-a="again"]').click();
for(const theme of ['sakura','blue']){await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);for(const [w,h] of [[360,640],[430,932]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(100);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const r=await p.locator('#chapter-epilogue').boundingBox();assert(r.y>=0&&r.y+r.height<=h+1);await p.screenshot({path:`${shots}/${theme}-${w}.png`});}}
await p.keyboard.press('Escape');await p.locator('#chapter-epilogue').waitFor({state:'hidden'});
assert.deepEqual(await save(),before,'replay never touches the save');assert.deepEqual(errors,[]);
console.log(`chapter epilogue 3: ${total} beats, 7 acts, control-room screen count/stamp/alert, notes, archive replay, save untouched, 360–430 both themes PASS`);await b.close();})().catch(e=>{console.error(e);process.exit(1)});
