// 「領取已完成的願望」按鈕：三項都完成時一次全部領取（以前只會把焦點移到第一個領取鈕，看起來像點不下去）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const key='siang-collector:v1';const save=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(300);
await p.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k));s.player.xp=200;s.player.claimed=['growth:1:1','growth:1:2','growth:1:3','growth:2:1','growth:2:2','growth:2:3'];s.player.energyClaimed=[...s.player.claimed];s.player.chapters=['1','2'];s.fossils=0;s.errands.total=1;s.bonus.total.explores=1;s.hatched=3;localStorage.setItem(k,JSON.stringify(s));},key);
await p.goto('http://127.0.0.1:8000/#wish');await p.reload();await p.waitForTimeout(400);
if(await p.isVisible('#intro-ok'))await p.click('#intro-ok');
await p.click('#tab-growth');await p.waitForTimeout(300);
assert.match(await p.textContent('#chapter-title'),/走出門看看/);
// 先手動領一項，剩下兩項用大按鈕一起領
await p.click('[data-goal="growth:3:1"]');await p.waitForTimeout(350);
assert.equal((await p.textContent('#growth-action')).trim(),'領取已完成的願望');
const energy0=(await save()).energy;
await p.click('#growth-action');await p.waitForTimeout(500);
const s=await save();
assert.ok(['growth:3:2','growth:3:3'].every(id=>s.player.claimed.includes(id)),'both remaining goals claimed');
assert.equal(s.energy-energy0,40);assert.deepEqual(s.player.chapters,['1','2','3']);assert.equal(s.fossils,5);
assert.match(await p.textContent('#growth-feedback'),/第 3 章「走出門看看」完成/);
assert.match(await p.textContent('#chapter-title'),/收藏世界的顏色/);
assert.equal(await p.isDisabled('#growth-action'),false);
assert.deepEqual(errs,[]);console.log('growth-claim-all ok');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
