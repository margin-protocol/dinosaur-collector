// 收到蛋的提示（湘 11/28「玩家拿到蛋常常沒發現被發蛋了」）：
// 存檔後手上的蛋變多就跳小卡（A），按晚點會在首頁留「新蛋 +N」，打開選擇蛋才消失；換位置、換存檔不誤報
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const W=Number(process.env.W||360);
const c=await b.newContext({viewport:{width:W,height:800},isMobile:true,hasTouch:true,reducedMotion:'reduce',timezoneId:'Asia/Taipei'});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/open-meteo\.com/,r=>r.abort());
const key='siang-collector:v1';
await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();
// 純函式：換位置不算、孵掉不算、收到才算
const unit=await p.evaluate(async()=>{const {holdings,arrivals}=await import('/js/egg-arrive.js');
const s={wishEgg:{stock:1},weather:{stock:0},travel:{eggs:[]},gifts:{eggs:[]},egg:{id:'ordinary'},shelf:[]};const h0=holdings(s);
s.wishEgg.stock=0;s.egg={id:'wish'};const moved=arrivals(h0,s).length;
const h1=holdings(s);s.gifts.eggs.push({egg:'keepsake',character:'061',from:'x'});s.travel.eggs.push('臺中市');s.weather.stock+=2;
return {moved,got:arrivals(h1,s)};});
assert.equal(unit.moved,0,'從蛋庫拿上架不算收到');
assert.deepEqual(unit.got,[{id:'weather'},{id:'weather'},{id:'county',county:'臺中市'},{id:'keepsake',character:'061'}]);
// 已經孵過第一隻的存檔
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=1;s.dex={'001':{at:'x'}};s.seenIntro=true;s.tutorial={status:'done'};localStorage.setItem(k,JSON.stringify(s));},key);
await p.reload();await p.waitForTimeout(800);
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
const skip=p.getByText('先自己逛逛');if(await skip.count()&&await skip.first().isVisible())await skip.first().click();
const give=fn=>p.evaluate(async f=>{const {updateState}=await import('/js/state.js');await updateState(new Function('s',f));},fn);
// 收到一顆願望蛋 → 跳小卡
await give('s.wishEgg.stock+=1;');
await p.locator('#egg-arrive[open]').waitFor({timeout:4000});
assert.match(await p.locator('#egg-arrive-title').textContent(),/收到一顆「願望蛋」/);
const card=await p.locator('#egg-arrive').boundingBox();assert(card.x>=0&&card.x+card.width<=W,'小卡不超出畫面');
assert(await p.locator('#egg-arrive-chips').isHidden());
// 晚點再說 → 首頁小蛋 +1，入口有角標
await p.locator('#egg-arrive-later').click();
await p.locator('#egg-bubble').waitFor({state:'visible'});
assert.equal(await p.locator('#egg-bubble b').textContent(),'+1');
const bub=await p.locator('#egg-bubble').boundingBox();assert(bub.x>=0,'小蛋不超出畫面');
assert.equal(await p.locator('#open-eggs .egg-new-dot').textContent(),'新蛋 1');
// 一次收到好幾種 → 一張小卡列出來
await give("s.weather.stock+=1;s.gifts=s.gifts||{eggs:[]};s.gifts.eggs=s.gifts.eggs||[];s.gifts.eggs.push({egg:'keepsake',character:'061',from:'t',at:'t'});");
await p.locator('#egg-arrive[open]').waitFor({timeout:4000});
assert.match(await p.locator('#egg-arrive-title').textContent(),/收到 2 顆新的蛋/);
assert.match(await p.locator('#egg-arrive-chips').textContent(),/天氣蛋.*紀念蛋 · 台灣小湘/);
if(process.env.SHOT)await p.screenshot({path:process.env.SHOT});
// 去看看 → 打開選擇蛋，新蛋標記清掉
await p.locator('#egg-arrive-go').click();
await p.locator('#egg-picker[open]').waitFor({timeout:4000});
assert(await p.locator('#egg-bubble').isHidden(),'打開選擇蛋後小蛋收起');
assert.equal(await p.locator('.egg-new-dot').count(),0);
await p.locator('#close-eggs').click();
// 有視窗開著的時候收到（那個視窗自己會講）→ 不跳小卡，只亮小蛋
await p.locator('#egg-picker').evaluate(d=>d.showModal());
await give('s.wishEgg.stock+=1;');await p.waitForTimeout(400);
await p.locator('#close-eggs').click();
await p.waitForTimeout(1600);
assert.equal(await p.locator('#egg-arrive[open]').count(),0,'有視窗時收到不跳小卡');
// 從蛋庫拿出來放上培養架：不算收到
await p.evaluate(()=>{try{localStorage.setItem('siang-collector:egg-new:v1','[]')}catch{}});
await give("s.wishEgg.stock-=1;s.egg={id:'wish',warmth:0,since:'x'};");await p.waitForTimeout(1500);
assert.equal(await p.locator('#egg-arrive[open]').count(),0,'換位置不跳');
// 一次多出一大堆（雲端還原）：不跳
await give('s.wishEgg.stock+=30;');await p.waitForTimeout(1500);
assert.equal(await p.locator('#egg-arrive[open]').count(),0,'換存檔不跳');
assert.equal(errs.length,0,errs.join('\n'));console.log('egg arrive card + bubble PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
