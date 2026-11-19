// 用手指點過之後，首頁小湘被程式還回焦點也不能畫出焦點框；改用鍵盤（Tab）時要畫
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
const p=await (await b.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true,reducedMotion:'reduce'})).newPage();
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');await p.waitForTimeout(300);
await p.evaluate(()=>{const k='siang-collector:v1';const s=JSON.parse(localStorage.getItem(k));s.tutorial=null;s.hatched=1;s.dex={'001':{at:'2026-11-10T00:00:00Z'}};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1',JSON.stringify(['001']));localStorage.setItem('siang-collector:theme:v1','sakura');});
await p.reload();await p.waitForTimeout(700);
const portrait=p.locator('[aria-label^="與原味小湘"]').first();
await p.mouse.click(5,5);
const ring=()=>p.evaluate(()=>{const el=document.querySelector('[aria-label^="與原味小湘"]');el.focus({focusVisible:true});const cs=getComputedStyle(el);return cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0;});
assert.equal(await ring(),false,'no ring after tapping');
await p.keyboard.press('Tab');assert.equal(await ring(),true,'ring for keyboard users');
console.log('no focus ring after taps, ring kept for keyboard PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
