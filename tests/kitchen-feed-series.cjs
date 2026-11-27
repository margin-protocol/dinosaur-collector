// 廚房餵食名單依系列分組＋名字＋系列可收合（11/25 玩家回饋，湘選 C）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const width=Number(process.env.W||360);
const c=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';
await p.goto('http://127.0.0.1:8000');if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');await p.waitForTimeout(400);
const setup=await p.evaluate(async k=>{const {CHARACTERS}=await import('/js/eggs.js');const kt=await import('/js/kitchen.js');const s=JSON.parse(localStorage.getItem(k));
  const nos=Object.keys(CHARACTERS).filter((n,i)=>i%2===0||Number(n)>100);s.dex={};nos.forEach(n=>s.dex[n]={at:'2026-11-10T00:00:00Z'});s.hatched=nos.length;s.tutorial=null;
  s.guide={seen:['battle','errand'],unlocked:['errand','wheel','battle','archive']};
  const R02=kt.dishOf(kt.RECIPES.find(r=>r.id==='R02').ings).id;
  s.kitchen={ingredients:{},meals:{[R02]:2},known:{[R02]:1},tasted:{[nos[1]]:{[R02]:3}},buffs:{[nos[2]]:{kind:'power',value:0.05,dish:R02}},daily:{},darkFed:0};
  localStorage.setItem(k,JSON.stringify(s));localStorage.removeItem('siang-collector:feed-fold:v1');return {nos,tasted:nos[1],buff:nos[2]};},key);
await p.reload();await p.waitForTimeout(600);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.click('#home-errand');await p.click('#tab-kitchen');await p.locator('.kitchen-meal').first().click();await p.waitForTimeout(200);
// 每位擁有的小湘剛好出現一次，都在自己系列的標題底下，系列照 SERIES 順序
const info=await p.evaluate(async()=>{const {CHARACTERS,SERIES}=await import('/js/eggs.js');const out=[];let cur;
  for(const n of document.querySelector('#kitchen-siangs').children){if(n.matches('.kitchen-feed__series'))out.push(cur={name:n.querySelector('span').textContent.split(' · ')[0],nos:[]});else for(const t of n.querySelectorAll('[data-siang]'))cur.nos.push(t.dataset.siang);}
  const order=Object.values(SERIES).map(s=>s.name);
  return {groups:out,bad:out.flatMap(g=>g.nos.filter(no=>SERIES[CHARACTERS[no].series].name!==g.name)),idx:out.map(g=>order.indexOf(g.name))};});
assert(info.groups.length>=3,'several series');assert.deepEqual(info.bad,[],'tile in wrong series');
assert.deepEqual(info.idx,[...info.idx].sort((a,b)=>a-b),'series order');
assert.deepEqual(info.groups.flatMap(g=>g.nos).sort(),[...setup.nos].sort(),'every owned siang once');
// 名字、今天還能、吃過的評價、🍳 都還在
const t1=await p.locator(`#kitchen-siangs [data-siang="${setup.nos[0]}"]`);
assert.ok((await t1.locator('.errand-siang__name').textContent()).length>0,'has name');
assert.match(await t1.locator('span').textContent(),/今天還能 \+10/);
assert.match(await p.locator(`#kitchen-siangs [data-siang="${setup.tasted}"] span`).textContent(),/💖 超喜歡/);
assert.ok(await p.locator(`#kitchen-siangs [data-siang="${setup.buff}"] .errand-siang__food`).count(),'food swap label');
// 收起第二個系列 → 格子消失、標題變展開，重整後還記得
const head=p.locator('#kitchen-siangs .kitchen-feed__series').nth(1);const hidden=info.groups[1].nos[0];
await head.click();await p.waitForTimeout(150);
assert.equal(await p.locator(`#kitchen-siangs [data-siang="${hidden}"]`).count(),0,'folded');
assert.equal(await p.locator('#kitchen-siangs .kitchen-feed__series').nth(1).getAttribute('aria-expanded'),'false');
await p.reload();await p.waitForTimeout(600);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');
await p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
await p.click('#home-errand');await p.click('#tab-kitchen');await p.locator('.kitchen-meal').first().click();await p.waitForTimeout(200);
assert.equal(await p.locator(`#kitchen-siangs [data-siang="${hidden}"]`).count(),0,'fold remembered');
await p.locator('#kitchen-siangs .kitchen-feed__series').nth(1).click();await p.waitForTimeout(150);
assert.equal(await p.locator(`#kitchen-siangs [data-siang="${hidden}"]`).count(),1,'unfold');
// 手機寬度：名字不超出格子、沒有左右捲動
const fit=await p.$$eval('#kitchen-siangs .errand-siang',ts=>ts.every(t=>{const n=t.querySelector('.errand-siang__name').getBoundingClientRect(),r=t.getBoundingClientRect();return n.left>=r.left-0.5&&n.right<=r.right+0.5;}));assert.ok(fit,'names fit');
assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no horizontal scroll');
// 點格子還是能餵
await p.locator(`#kitchen-siangs [data-siang="${setup.nos[0]}"]`).click();await p.waitForTimeout(300);
assert.equal(await p.locator('.kitchen-result--inline').count(),1,'fed');
assert.equal(errs.length,0,errs.join('\n'));console.log('kitchen-feed-series: grouped by series, names, fold remembered PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
