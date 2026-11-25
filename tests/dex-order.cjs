// 101 以後的小湘要照編號排在後面，不能被 JS 的整數 key 排序丟到最前面（圖鑑全部／系列、許願對象）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:390,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
const nums=(l)=>l.filter(n=>/^\d+$/.test(n)).map(Number);const worldLast=(l)=>{const i=l.findIndex(n=>!/^\d+$/.test(n));return i<0||l.slice(i).every(n=>!/^\d+$/.test(n));};const sorted=(l)=>l.every((n,i)=>!i||l[i-1]<n);
const keys=await p.evaluate(async()=>{const m=await import('./js/eggs.js');return [Object.keys(m.CHARACTERS),Object.values(m.CHARACTERS).map(c=>c.no)];});
assert(sorted(nums(keys[0]))&&sorted(nums(keys[1])),'CHARACTERS 依編號列舉');assert(worldLast(keys[0]),'異世編號（MO-001…）排在數字編號後面');
await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.hatched=9;s.dex={};for(const n of ['001','002','050','101','104','107','108','115'])s.dex[n]={at:'x'};localStorage.setItem(k,JSON.stringify(s));});
await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>location.hash='dex');await p.waitForTimeout(400);
for(const mode of ['all','series']){
  await p.click(`[data-dex-mode="${mode}"]`);await p.waitForTimeout(150);
  const secs=await p.locator(mode==='all'?'.dex__grid':'.dex__section').evaluateAll(l=>l.map(s=>[...s.querySelectorAll('.dex__card')].map(e=>e.dataset.dexNo)));
  for(const s of secs) assert(sorted(nums(s)),`${mode} 模式每區依編號排：${s.slice(0,5).join(',')}…`);
  if(mode==='all') assert.equal(secs.flat()[0],'001','全部模式第一個是 001');
}
const friends=await p.locator('.dex__section',{hasText:'摯友系列'}).locator('.dex__card').evaluateAll(l=>l.map(e=>e.dataset.dexNo));
assert(friends.length&&friends.at(-1)==='116','摯友系列 116 在最後');
assert.deepEqual(errs,[]);await b.close();console.log('dex-order ok');})().catch(e=>{console.error(e);process.exit(1);});
