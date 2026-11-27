// 全服信箱＋全服兌換碼（湘 11/27）：不用邀請碼的玩家也收得到；每份存檔只能領一次；名額、期限、偽造的碼
const {chromium}=require('playwright'),assert=require('node:assert/strict');const {spawn}=require('node:child_process');
(async()=>{const api=spawn('node',['server/dev-server.mjs','8798'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,1200));
const API='http://127.0.0.1:8798';
try{
const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const opts={viewport:{width:Number(process.env.W||390),height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce',timezoneId:'Asia/Taipei'};
const errs=[];
const rc=await b.newContext({...opts,permissions:['clipboard-read','clipboard-write']});await rc.addInitScript(a=>{globalThis.SIANG_API_OVERRIDE=a;},API);
const r=await rc.newPage();r.on('pageerror',e=>errs.push('review:'+e.message));await r.goto('http://127.0.0.1:8000/review.html');
await r.locator('#rv-claim').click();await r.locator('#rv-backup:not([hidden])').waitFor();const reviewer=await r.locator('#rv-backup-text').inputValue();await r.locator('#rv-backup-done').click();
await r.click('#key-generate');await r.waitForFunction(()=>document.querySelector('#key-public').value.length>20);
const pub=JSON.parse(await r.inputValue('#key-public'));
await r.click('#tab-all');assert.ok(await r.locator('#all-locked').isHidden(),'登入又有印章就不顯示鎖住提示');
// 全服信：100 墨玉＋50 化石＋2 顆星光蛋；按兩次才寄
await r.fill('#bc-title','謝謝大家一起闖江湖');await r.fill('#bc-body','各位飼養員：\n墨痕江湖開跑啦！\n—— 湘 ♡');
await r.fill('#bc-moyu','100');await r.fill('#bc-fossils','50');await r.selectOption('#bc-egg','star');await r.fill('#bc-egg-n','2');
assert.match(await r.textContent('#bc-preview'),/100 墨玉、50 化石碎片、2 顆星光蛋/);
await r.click('#bc-send');assert.match(await r.textContent('#bc-status'),/確認一下/);
await r.click('#bc-send');await r.waitForFunction(()=>/寄出了/.test(document.getElementById('bc-status').textContent));
await r.waitForFunction(()=>/已經有 0 人領了禮物/.test(document.getElementById('bc-list').textContent));
// 兌換碼：不限名額／限 1 人／過期
const mk=async(code,set)=>{await r.fill('#gc-phrase',code);await set();await r.click('#gc-create');await r.waitForFunction(()=>/完成|已經有了|至少/.test(document.getElementById('gc-status').textContent));const t=await r.textContent('#gc-status');await r.evaluate(()=>{document.getElementById('gc-status').textContent='';});return t;};
assert.match(await mk('書頁 開跑',async()=>{await r.fill('#gc-energy','300');await r.selectOption('#gc-candy-r','SSR');await r.fill('#gc-candy','2');}),/完成/);
assert.match(await mk('書頁開跑！',async()=>{await r.fill('#gc-energy','1');}),/已經有了/);
assert.match(await mk('空碼',async()=>{await r.fill('#gc-energy','');}),/至少/);
assert.match(await mk('限量一位',async()=>{await r.fill('#gc-fossils','99');await r.fill('#gc-limit','1');}),/限 1 人/);
assert.match(await mk('早就過期',async()=>{await r.fill('#gc-energy','5');await r.fill('#gc-expires','2020-01-01');}),/完成/);
await r.waitForFunction(()=>document.querySelectorAll('#gc-list li').length===3);
if(process.env.SHOT_REVIEW)await r.screenshot({path:process.env.SHOT_REVIEW,fullPage:true});
// 偽造的碼（沒蓋章）
await r.evaluate(async([a,t])=>{const {sha256Hex,normalizeCode}=await import('/js/sign.js');const h=await sha256Hex(normalizeCode('假的碼'));await fetch(`${a}/f/shared/giftcodes/${h}.json`,{method:'PUT',headers:{Authorization:'Bearer '+t},body:JSON.stringify({payload:{v:1,type:'giftcode',hash:h,rewards:[{type:'energy',amount:9999}]},sig:'AAAA'})});},[API,reviewer]);
// 遊戲：沒有邀請碼的玩家
const STYLE=process.env.MAIL_STYLE||'';const THEME=process.env.THEME||'';
const game=async()=>{const gc=await b.newContext(opts);await gc.addInitScript(([a,st,th])=>{globalThis.SIANG_API_OVERRIDE=a;if(st)globalThis.__MAIL_STYLE=st;if(th)try{localStorage.setItem('siang-collector:theme:v1',th);}catch{}},[API,STYLE,THEME]);
  await gc.route('**/js/reviewer-key.js',route=>route.fulfill({contentType:'text/javascript',body:`export const REVIEWER_PUBLIC_JWK = ${JSON.stringify(pub)};`}));
  const g=await gc.newPage();g.on('pageerror',e=>errs.push('game:'+e.message));await g.goto('http://127.0.0.1:8000');await g.click('#intro-ok');return g;};
const save=(g)=>g.evaluate(()=>JSON.parse(localStorage.getItem('siang-collector:v1')));
const g=await game();
await g.waitForFunction(()=>JSON.parse(localStorage.getItem('siang-collector:v1')).letters.mail.some(m=>m.id.startsWith('all-')),null,{timeout:15000});
let s=await save(g);const mail=s.letters.mail.find(m=>m.all);assert.equal(mail.gifts.length,3);assert.ok(!mail.giftAt);
const before={fossils:s.fossils||0,star:(s.gifts.eggs||[]).filter(e=>e.egg==='star').length};
if(STYLE===''||STYLE==='c'){
  // 預設 c：一收到就跳信封小卡
  await g.locator('#bc-pop[open]').waitFor({timeout:30000});
  assert.match(await g.textContent('#bc-pop-chips'),/×100墨玉/);assert.equal(await g.locator('#bc-pop-chips .gift-chip').count(),3);
  if(process.env.SHOT_POP)await g.screenshot({path:process.env.SHOT_POP});
  await g.click('#bc-pop-ok');await g.locator('#bc-pop').waitFor({state:'hidden'});
  s=await save(g);assert.ok(s.letters.mail.find(m=>m.all).giftAt);assert.ok(s.letters.read.includes(mail.id),'按收下也算讀過');
}
await g.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await g.click('#home-letter');await g.locator('#letter-box[open]').waitFor();
assert.match(await g.textContent('#letter-list'),/湘寄給大家的/);
await g.locator('.letter-item',{hasText:'謝謝大家一起闖江湖'}).click();await g.locator('#letter-read[open]').waitFor();
if(STYLE==='a'){await g.waitForFunction(()=>/已收下/.test(document.getElementById('letter-read-gift').textContent));assert.match(await g.textContent('#letter-read-gift'),/100 墨玉、50 化石碎片、2 顆星光蛋/);}
else{
  if(STYLE==='b'){assert.equal(await g.textContent('#letter-read-claim'),'收下禮物');if(process.env.SHOT_LETTER_BEFORE)await g.screenshot({path:process.env.SHOT_LETTER_BEFORE});await g.click('#letter-read-claim');}
  await g.waitForFunction(()=>/已收下/.test(document.getElementById('letter-read-claim').textContent));
  assert.ok(await g.locator('#letter-read-chips.is-got').isVisible());assert.ok(await g.locator('#letter-read-gift').isHidden());
}
s=await save(g);assert.equal(s.fossils,before.fossils+50);assert.equal(s.events.mo.tokens,100);assert.equal(s.gifts.eggs.filter(e=>e.egg==='star').length,before.star+2);
if(process.env.SHOT_LETTER)await g.screenshot({path:process.env.SHOT_LETTER});
// 重新整理：不會再收一次
await g.reload();await g.waitForTimeout(2500);s=await save(g);assert.equal(s.letters.mail.filter(m=>m.all).length,1);assert.equal(s.events.mo.tokens,100);
// 兌換碼
const redeem=async(gg,text)=>{await gg.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await gg.click('#open-center');await gg.click('#open-code');await gg.fill('#code-input',text);await gg.click('#code-submit');await gg.waitForFunction(()=>{const t=document.getElementById('code-status').textContent;return t&&t!=='確認中…';});return gg.textContent('#code-status');};
const energy0=(await save(g)).energy;
assert.match(await redeem(g,'書頁開跑'),/兌換成功！獲得300 能量、2 顆 SSR 星光糖/);
s=await save(g);assert.equal(s.energy,energy0+300);assert.equal(s.candy.SSR,2);
assert.match(await redeem(g,'書 頁 開 跑'),/已經領過/);
assert.match(await redeem(g,'限量一位'),/兌換成功/);
assert.match(await redeem(g,'早就過期'),/過期/);
assert.match(await redeem(g,'假的碼'),/印章不對/);
assert.match(await redeem(g,'沒有這組'),/不對/);
if(process.env.SHOT_CODE)await g.screenshot({path:process.env.SHOT_CODE});
// 另一支手機：一般碼還能領；限量碼已經額滿
const g2=await game();
assert.match(await redeem(g2,'書頁開跑'),/兌換成功/);
assert.match(await redeem(g2,'限量一位'),/領完/);
// 審核室看得到人數
await r.click('#bc-refresh');await r.waitForFunction(()=>/已經有 1 人領了禮物/.test(document.getElementById('bc-list').textContent));
await r.click('#gc-refresh');await r.waitForFunction(()=>/已兌換 2 次/.test(document.getElementById('gc-list').textContent)&&/1 \/ 1（額滿）/.test(document.getElementById('gc-list').textContent));
// 收回全服信：之後新來的不會收到，已收到的不受影響
const del=r.locator('#bc-list button',{hasText:'收回'});await del.click();await del.click();await r.waitForFunction(()=>/還沒有寄過/.test(document.getElementById('bc-list').textContent));
const g3=await game();await g3.waitForTimeout(3000);assert.equal((await save(g3)).letters.mail.filter(m=>m.all).length,0);
assert.equal(errs.length,0,errs.join('\n'));console.log('broadcast + gift codes: everyone mail, once per save, limit, expiry, forged, counts, recall PASS');await b.close();
}finally{api.kill();}
})().catch(e=>{console.error(e);process.exit(1);});
