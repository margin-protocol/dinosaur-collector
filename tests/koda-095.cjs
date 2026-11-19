// No.095 Koda 小湘：SSR 紀念、不在蛋池、立繪與台詞都接上
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{const E=await import('/js/eggs.js');const c=E.CHARACTERS['095'];
 const I=await import('/js/intros.js'),B=await import('/js/bond-copy.js'),X=(await import('/js/extra-lines.js')).EXTRA_LINES;
 return {copy:!!(I.INTROS['095']&&I.MYSTERY_INTROS['095']&&B.BOND_STORIES['095']&&B.BOND_LINES['095'][5]&&X['095'].hatch),rarity:c.rarity,pools:Object.values(E.EGGS).filter(e=>e.pool?.['095']).length,art:await fetch(`/assets/characters/${c.image}.webp`).then(x=>x.ok)};});
assert.deepEqual(r,{copy:true,rarity:'SSR',pools:0,art:true});
const q=await b.newPage();await q.goto('http://127.0.0.1:8000/review.html');
assert.equal(await q.locator('#code-character option[value="095"]').count(),1,'審核室可以選Koda 小湘當暗號獎勵');
assert.equal(errs.length,0,errs.join('\n'));console.log('No.095 Koda Siang: SSR, not in pools yet, art, selectable as code reward PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
