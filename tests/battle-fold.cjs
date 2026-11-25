// node tests/battle-fold.cjs — 討伐頁收合（湘 11/25 選 C）：打完的章節收成小圖示、點圖示進關卡、點標題展開並記住
const {chromium}=require('playwright');const assert=require('assert');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:360,height:780},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok').catch(()=>{});
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=40;const team=['001','002','003'];s.dex=Object.fromEntries(team.map(n=>[n,{at:'x'}]));
 s.battle={stages:Object.fromEntries(['mochi','sock','bento','caramel-king'].map(id=>[id,{clears:1,stars:3,best:9}])),train:{}};localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.evaluate(()=>document.getElementById('open-battle')?.click());await p.waitForTimeout(500);
const n=await p.locator('.fold-minis__one').count();assert(n>=4,'minis '+n);
// 第 1 章已打完→收起，點第二個小圖示（襪子遊俠）直接進關卡
await p.locator('.battle-chapter').filter({hasText:'第 1 章'}).locator('.fold-minis__one').nth(1).click();await p.waitForTimeout(300);
assert(await p.locator('#battle-stage').isVisible(),'進到關卡');
await p.locator('.fold-head__btn').filter({hasText:'第 1 章'}).count();
await p.evaluate(()=>document.querySelector('#battle-stage .text-action')?.click());await p.waitForTimeout(300);
const ch1=p.locator('.battle-chapter').filter({hasText:'第 1 章'});
assert.equal(await ch1.locator('.battle-stages').isHidden(),true,'第 1 章收起');
assert.equal(await p.locator('.battle-chapter').filter({hasText:'第 2 章'}).locator('.fold-minis').count(),0,'沒打完的章節展開');
await ch1.locator('.fold-head__btn').click();await p.waitForTimeout(200);
assert.equal(await p.locator('.battle-chapter').filter({hasText:'第 1 章'}).locator('.battle-stages').isVisible(),true,'點標題展開');
await p.reload();await p.waitForTimeout(400);if(await p.locator('#intro-ok').isVisible())await p.click('#intro-ok');await p.evaluate(()=>document.getElementById('open-battle')?.click());await p.waitForTimeout(500);
assert.equal(await p.locator('.battle-chapter').filter({hasText:'第 1 章'}).locator('.battle-stages').isVisible(),true,'展開狀態記住');
assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'沒有橫向捲動');
assert.deepEqual(errs,[]);console.log('battle fold: done chapters fold to minis, mini opens stage, header toggles and persists PASS');await b.close();})();
