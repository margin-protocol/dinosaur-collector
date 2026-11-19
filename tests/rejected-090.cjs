// 落榜小湘 No.090：SR、目前不在任何蛋池（等湘用暗號發送）、圖檔、可以在審核室選成暗號獎勵
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{const E=await import('/js/eggs.js');const c=E.CHARACTERS['090'];
 const I=await import('/js/intros.js'),B=await import('/js/bond-copy.js'),X=(await import('/js/extra-lines.js')).EXTRA_LINES;
 return {copy:!!(I.INTROS['090']&&I.MYSTERY_INTROS['090']&&B.BOND_STORIES['090']&&B.BOND_LINES['090'][5]&&X['090'].hatch),rarity:c.rarity,pools:Object.values(E.EGGS).filter(e=>e.pool?.['090']).length,art:await fetch(`/assets/characters/${c.image}.webp`).then(x=>x.ok)};});
assert.deepEqual(r,{copy:true,rarity:'SR',pools:0,art:true});
const q=await b.newPage();await q.goto('http://127.0.0.1:8000/review.html');
assert.equal(await q.locator('#code-character option[value="090"]').count(),1,'審核室可以選落榜小湘當暗號獎勵');
assert.equal(errs.length,0,errs.join('\n'));console.log('No.090 rejected Siang: SR, not in pools yet, art, selectable as code reward PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
