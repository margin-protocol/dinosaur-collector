// 未完待續小湘 No.091：SSR 配方小湘、不在蛋池、立繪、台詞；研究所小湘＋落榜小湘同住 3 天會送來紀念蛋
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{const E=await import('/js/eggs.js'),R=await import('/js/recipes.js'),I=await import('/js/intros.js'),B=await import('/js/bond-copy.js'),X=(await import('/js/extra-lines.js')).EXTRA_LINES;
  const c=E.CHARACTERS['091'];const rec=R.RECIPES.find(x=>x.target==='091');
  const s={recipes:{},gifts:{eggs:[]}};const t=d=>R.tickRecipes(s,{residents:['089','090'],raining:false,today:d});
  t('2026-12-01');t('2026-12-01');t('2026-12-02');const res=t('2026-12-03');
  return {rarity:c.rarity,series:c.series,pools:Object.values(E.EGGS).filter(e=>e.pool?.['091']).length,art:await fetch(`/assets/characters/${c.image}.webp`).then(x=>x.ok),
    members:rec.members,days:rec.days,done:s.recipes['to-be-continued'].done,completed:res.completed.length===1&&s.gifts.eggs[0].character==='091',
    copy:!!(I.INTROS['091']&&I.MYSTERY_INTROS['091']&&B.BOND_STORIES['091']&&B.BOND_LINES['091'][5]&&X['091'].hatch&&X['091'].dispatch)};});
assert.deepEqual(r,{rarity:'SSR',series:'recipe',pools:0,art:true,members:['089','090'],days:3,done:true,completed:true,copy:true});
assert.equal(errs.length,0,errs.join('\n'));console.log('No.091 to-be-continued: recipe 089+090 x3 days, SSR, not in pools, art, copy PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
