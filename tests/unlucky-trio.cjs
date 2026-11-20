// 非酋三部曲 No.101–103：重複次數補算（從星數）、孵到重複 +1、10/50/100 自動加入收藏、不進蛋池、文案與立繪齊全
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const key='siang-collector:v1';const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const u=await p.evaluate(async()=>{const E=await import('/js/eggs.js'),U=await import('/js/unlucky.js'),I=await import('/js/intros.js'),B=await import('/js/bond-copy.js'),X=(await import('/js/extra-lines.js')).EXTRA_LINES,K=(await import('/js/kitchen-lines.js')).KITCHEN_LINES;
  const s={dex:{'001':{at:'x',dup:4},'005':{at:'x',dup:3},'007':{at:'x'}}};U.ensureDupCount(s);const seeded=s.dupTotal;
  s.dupTotal=10;const g1=U.grantUnlucky(s);const g2=U.grantUnlucky(s);s.dupTotal=120;const g3=[U.grantUnlucky(s),U.grantUnlucky(s),U.grantUnlucky(s)];
  return {seeded,g1,g2,g3,rar:U.UNLUCKY.map(n=>E.CHARACTERS[n].rarity),pools:U.UNLUCKY.some(n=>Object.values(E.EGGS).some(e=>e.pool?.[n])),
    copy:U.UNLUCKY.every(n=>I.INTROS[n]&&I.MYSTERY_INTROS[n]&&B.BOND_STORIES[n]&&B.BOND_LINES[n][5]&&X[n].dispatch&&K[n][1]),no100:!E.CHARACTERS['100'],
    art:await Promise.all(U.UNLUCKY.map(n=>fetch(`/assets/characters/${E.CHARACTERS[n].image}.webp`).then(x=>x.ok)))};});
const L=await p.evaluate(async()=>{const E=await import('/js/eggs.js'),U=await import('/js/unlucky.js');const s={dex:{'001':{at:'x'},'005':{at:'x'},'023':{at:'x'},'015':{at:'x'}}};U.ensureDupCount(s);const seed=s.newTotal;s.newTotal=10;const a=U.grantUnlucky(s);s.newTotal=40;const b=[U.grantUnlucky(s),U.grantUnlucky(s)];s.newTotal=50;b.push(U.grantUnlucky(s));const T=await import('/js/luck-talk.js');b.push(T.talkFor('101',['101','104'])?.lines.length,T.talkFor('101',['101','105']));return {seed,a,b,rar:U.LUCKY.map(n=>E.CHARACTERS[n].rarity),pools:U.LUCKY.some(n=>Object.values(E.EGGS).some(e=>e.pool?.[n])),art:await Promise.all(U.LUCKY.map(n=>fetch(`/assets/characters/${E.CHARACTERS[n].image}.webp`).then(x=>x.ok)))};});
assert.deepEqual(L,{seed:2,a:'104',b:['105',null,'106',5,null],rar:['SR','SSR','UR'],pools:false,art:[true,true,true]},'歐皇：起點只算一般蛋孵得到的（臺中、壽星不算）');
assert.deepEqual(u,{seeded:7,g1:'101',g2:null,g3:['102','103',null],rar:['SR','SSR','UR'],pools:false,copy:true,no100:true,art:[true,true,true]});
// 遊戲裡：第 10 次重複孵化 → 普通非酋小湘自己跑來
const allOrd=await p.evaluate(async()=>Object.keys((await import('/js/eggs.js')).EGGS.ordinary.pool));
await p.evaluate(([k,all])=>{const s=JSON.parse(localStorage.getItem(k));s.hatched=10;s.dex=Object.fromEntries(all.map(n=>[n,{at:'x'}]));s.dupTotal=9;s.newTotal=0;s.egg={id:'ordinary',warmth:999,since:new Date().toISOString()};localStorage.setItem(k,JSON.stringify(s));},[key,allOrd]);
await p.reload();await p.evaluate(()=>{location.hash='incubate';document.querySelectorAll('dialog[open]').forEach(d=>d.close());});await p.waitForTimeout(500);
await p.click('#cultivate');await p.locator('#reveal[open]').waitFor();await p.waitForTimeout(300);
let s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(s.dupTotal,10);
await p.click('#reveal-ok');await p.waitForTimeout(400);await p.evaluate(()=>window.dispatchEvent(new Event('focus')));
await p.waitForFunction(()=>document.querySelector('#reveal[open]')&&/普通非酋小湘/.test(document.getElementById('reveal-name').textContent),null,{timeout:8000}).catch(async()=>{await p.evaluate(()=>{});});
if(!(await p.locator('#reveal[open]').count())){await p.evaluate(()=>location.hash='home');await p.waitForTimeout(1500);}
await p.locator('#reveal[open]').waitFor({timeout:8000});assert.match(await p.textContent('#reveal-name'),/普通非酋小湘/);assert.match(await p.textContent('#reveal-greeting'),/第十次重複孵化/);
s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.ok(s.dex['101']);assert.ok(!s.dex['102']);
await p.click('#reveal-ok');await p.waitForTimeout(300);
assert.equal(errs.length,0,errs.join('\n'));
console.log('unlucky trio: seeded from stars, dup hatch counts, 10/50/100 auto join, not in pools, copy & art PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
