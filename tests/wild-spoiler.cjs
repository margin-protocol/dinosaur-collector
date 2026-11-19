// 野外巡邏不劇透：只會遇到已解鎖關卡的敵人（新手不會撞見後面章節或 EX 的咕咕）
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage();await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{const B=await import('/js/battle.js');
 const mk=(stages)=>{const s={dex:{'001':{at:'x'}},affection:{},battle:{}};B.ensureBattle(s);Object.assign(s.battle.stages,stages);return s;};
 const seen=(s)=>{const ids=new Set();for(let d=1;d<=200;d++){s.battle.wild=null;B.ensureWild(s,`2027-01-${String(d%28+1).padStart(2,'0')}-${d}`).list.forEach(w=>ids.add(w.base));}return [...ids].sort();};
 const fresh=mk({});const mid=mk({mochi:{clears:1},sock:{clears:1}});const all={};for(const id of Object.keys(B.ENEMIES))all[id]={clears:1};const vet=mk(all);
 return {fresh:seen(fresh),mid:seen(mid),vet:seen(vet),total:Object.keys(B.ENEMIES).length};});
assert.deepEqual(r.fresh,['mochi']);assert.deepEqual(r.mid,['bento','mochi','sock']);
assert(!r.mid.includes('gugu')&&!r.mid.includes('caramel-king'));assert(r.vet.includes('gugu')&&r.vet.includes('thunder-king'),r.vet.join());
console.log('wild patrol: only unlocked enemies (fresh / mid / veteran) PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
