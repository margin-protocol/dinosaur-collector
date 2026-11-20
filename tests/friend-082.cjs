// No.082 摯友小湘（哥哥ver）：摯友系列、暗號蛋可孵、圖檔、圖鑑小誌、好感台詞、討伐台詞
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('http://127.0.0.1:8000');
const r=await p.evaluate(async()=>{const E=await import('/js/eggs.js'),I=await import('/js/intros.js'),B=await import('/js/bond-copy.js'),F=(await import('/js/friend-lines.js')).FRIEND_LINES,FO=await import('/js/fossils.js');
 const c=E.CHARACTERS['082'];const img=await fetch(`/assets/characters/${c.image}.webp`).then(x=>x.ok);
 const pools=Object.entries(E.EGGS).filter(([id,e])=>id!=='star'&&e.pool?.['082']).map(([id])=>id);
 return {series:c.series,rarity:c.rarity,img,pools,intro:!!I.INTROS['082']&&!!I.MYSTERY_INTROS['082'],bond:!!B.BOND_STORIES['082']&&!!B.BOND_LINES['082'][5],lines:!!F['082'].hatch&&!!F['082'].victory,pick:FO.pickable({dex:{}},E.EGGS,E.CHARACTERS).includes('082'),cost:FO.pickCost(E.CHARACTERS,'082')};});
assert.deepEqual(r,{series:'friends',rarity:'SR',img:true,pools:['cipher'],intro:true,bond:true,lines:true,pick:true,cost:90});
assert.equal(errs.length,0,errs.join('\n'));console.log('No.082 bestie brother: friends series, cipher egg, art, intros, bond, battle lines, fossil pick 90 PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
