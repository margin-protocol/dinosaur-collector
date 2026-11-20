// No.096 爬爬小湘：SSR 動物系列、普通／願望／暗號蛋孵得到、立繪與台詞都接上
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{const E=await import('/js/eggs.js');const c=E.CHARACTERS['096'];
 const I=await import('/js/intros.js'),B=await import('/js/bond-copy.js'),X=(await import('/js/extra-lines.js')).EXTRA_LINES;
 return {copy:!!(I.INTROS['096']&&I.MYSTERY_INTROS['096']&&B.BOND_STORIES['096']&&B.BOND_LINES['096'][5]&&X['096'].hatch),rarity:c.rarity,pools:Object.values(E.EGGS).filter(e=>e.id!=='star'&&e.pool?.['096']).length,art:await fetch(`/assets/characters/${c.image}.webp`).then(x=>x.ok)};});
assert.deepEqual(r,{copy:true,rarity:'SSR',pools:3,art:true});
const q=await b.newPage();await q.goto('http://127.0.0.1:8000/review.html');
assert.equal(await q.locator('#code-character option[value="096"]').count(),1,'審核室可以選爬爬小湘當暗號獎勵');
assert.equal(errs.length,0,errs.join('\n'));console.log('No.096 Papa Gecko Siang: SSR, in ordinary/wish/cipher pools, art, selectable as code reward PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
