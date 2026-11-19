const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
// Read actual rendered foreground/background colours, including gradient endpoints and inherited opacity.
async function contrastFailures(page,scope){return page.locator(scope).evaluate(root=>{
 const rgba=s=>{const n=s.match(/[\d.]+/g)?.map(Number);return n&&n.length>=3?[n[0],n[1],n[2],n[3]??1]:[0,0,0,0]};
 const over=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3])).concat(1);
 const lum=a=>a.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
 const failures=[];
 for(const e of root.querySelectorAll('*')){
  const text=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
  if(!/[\p{L}\p{N}]/u.test(text)||!e.getClientRects().length||e.closest('[aria-hidden="true"],svg,canvas'))continue;
  const cs=getComputedStyle(e);if(cs.visibility!=='visible')continue;
  let opacity=1;const chain=[];for(let p=e;p;p=p.parentElement){chain.unshift(p);opacity*=Number(getComputedStyle(p).opacity)}if(opacity<.01)continue;
  let backgrounds=[[255,255,255,1]];
  for(const p of chain){const st=getComputedStyle(p),bg=rgba(st.backgroundColor);backgrounds=backgrounds.map(b=>over(bg,b));
   const stops=st.backgroundImage.match(/rgba?\([^)]+\)/g);
   if(stops)backgrounds=backgrounds.flatMap(b=>stops.map(s=>over(rgba(s),b))).slice(0,32);
  }
  const fg=rgba(cs.color);fg[3]*=opacity;const value=Math.min(...backgrounds.map(bg=>ratio(over(fg,bg),bg)));
  const large=parseFloat(cs.fontSize)>=24||(parseFloat(cs.fontSize)>=18.66&&Number(cs.fontWeight)>=700);const min=large?3:4.5;
  if(value+0.02<min)failures.push({selector:e.id?'#'+e.id:e.tagName.toLowerCase()+'.'+e.className,text:text.slice(0,42),ratio:Number(value.toFixed(2)),min,color:cs.color,opacity});
 }
 return failures;
});}
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});fs.mkdirSync('docs/review/light-contrast',{recursive:true});
 const allFailures=[];
 for(const width of [360,390,430]){const c=await b.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8000');await p.locator('#intro-ok').click();await p.locator('#intro').waitFor({state:'hidden'});
 await p.evaluate(()=>{const k='siang-collector:v1',s=JSON.parse(localStorage.getItem(k));s.dex=Object.fromEntries(['001','005','016','037','050','056'].map(no=>[no,{at:'2026-11-17'}]));s.battle.stages.mochi={stars:2,best:1300,last:1200,clears:1,tries:1,firstAt:'2026-11-17T08:00:00Z',review:{text:'這次有認真看對手，好吧，算你有進步。'}};s.egg={id:'cipher',warmth:80,since:'2026-11-17'};s.shelf=[{id:'cipher',warmth:80,since:'2026-11-16'}];s.hatched=6;s.energy=100;s.fossils=100;s.tutorial=null;s.affection={'037':{pts:30,day:'2026-11-17',today:0,home:'2026-11-17'}};localStorage.setItem(k,JSON.stringify(s));localStorage.setItem('siang-collector:residents:v1','[]')});await p.reload();assert(await p.locator('#archive').isHidden(),'closed archive stays hidden');
 const stable=await p.evaluate(()=>localStorage.getItem('siang-collector:v1'));
 const close=async()=>p.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 const nav=async view=>{await close();await p.locator('#open-center').click();await p.locator(`.nav__item[data-view="${view}"]`).click()};
 const open=async id=>{await close();await p.locator('#open-center').click();await p.locator(id).click()};
 async function audit(label,scope,shot=false){assert.equal(await p.locator('html').getAttribute('data-theme'),awaitTheme);const f=await contrastFailures(p,scope);allFailures.push(...f.map(x=>({width,theme:awaitTheme,label,...x})));if(shot){await p.locator(scope).evaluate(e=>Promise.all([...e.querySelectorAll('img')].map(i=>i.decode().catch(()=>{}))));await p.screenshot({path:`docs/review/light-contrast/${awaitTheme}-${label}-${width}.png`});}assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 let awaitTheme;
 for(const theme of ['cream','sakura','daylight']){awaitTheme=theme;await open('#open-themes');await p.locator(`[data-palette="${theme}"]`).click();await close();
  await nav('home');await audit('home','.view--home');
  await nav('incubate');await audit('incubate','.view--incubate');
  await p.evaluate(()=>{document.querySelector('#banner').style.opacity='1';document.querySelector('#banner-en').textContent='STAGE 2 / 4';document.querySelector('#banner-zh').textContent='蛋有動靜了';document.querySelector('#float-gain').style.opacity='1';document.querySelector('#float-gain').textContent='+10'});await audit('incubate-feedback','.view--incubate');await p.evaluate(()=>{document.querySelector('#banner').style.opacity='';document.querySelector('#float-gain').style.opacity=''});
  await p.locator('#open-eggs').click();await audit('eggs','#egg-picker');
  // Audit category details too: the current egg uses aria-pressed, not .is-selected.
  for(const cat of ['cipher','ordinary','wish']){await p.locator(`[data-cat="${cat}"]`).click();await audit(`eggs-${cat}`,'#egg-picker',width===390&&cat==='cipher');if(cat==='cipher'){const selected=p.locator('.egg-choice[aria-pressed="true"]');assert.equal(await selected.count(),1);assert(await selected.evaluate(e=>getComputedStyle(e).backgroundColor===(()=>{const probe=document.createElement('span');probe.style.color='var(--t-selected)';document.body.append(probe);const c=getComputedStyle(probe).color;probe.remove();return c})()));}await p.locator('[data-back]').click();}
  await nav('wish');await p.locator('#tab-daily').click();await audit('wishes','.view--wish');await p.locator('#tab-growth').click();await audit('growth','#panel-growth');
  await nav('dex');await audit('dex','main[data-view="dex"]',width===390);await p.locator('[data-dex-no="037"]').click();await audit('bond','#dex-detail');
  await nav('research');await audit('research','#research-root');
  for(const [id,label,scope]of [['#open-achievements','achievements','#achievement-dialog'],['#open-bingo','bingo','#bingo-dialog'],['#open-wheel','wheel','#wheel-dialog'],['#open-cloud','cloud','#cloud-dialog'],['#open-code','code','#code-dialog'],['#open-postcard','postcard','#postcard-dialog'],['#open-updates','updates','#whats-new'],['#open-tutorial','tutorial','#tutorial-guide'],['#open-themes','themes','#theme-dialog']]){await open(id);await audit(label,scope,width===390&&label==='wheel');
   if(label==='wheel'){
    const inks=await p.evaluate(()=>{const lum=s=>{const a=s.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a.reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)};return [...document.querySelectorAll('#wheel text')].filter(e=>/[\p{L}\p{N}]/u.test(e.textContent)).map(e=>{const a=lum(getComputedStyle(e).fill),b=lum(getComputedStyle(e.previousElementSibling).fill);return {text:e.textContent,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)}})});
    for(const ink of inks)assert(ink.ratio>=4.5,`wheel ${ink.text}: ${ink.ratio}`);
   }}
  await open('#open-archive');for(const tab of ['battle','bond','travel']){await p.locator(`[data-archive-tab="${tab}"]`).click();const summary=p.locator('#archive-body details summary').first();if(await summary.count())await summary.click();await audit(`archive-${tab}`,'#archive',width===390&&tab==='bond');}
  await open('#open-errands');await audit('travel','#errand-dialog');await p.locator('#tab-battle').click();await audit('battle-map','#battle-pane',width===390);await p.locator('.battle-chapter:not(.battle-wild) .battle-stage-card').first().click();await p.locator('#battle-siangs .errand-siang').first().click();await audit('forecast','#battle-pane',width===390);for(const level of ['good','ok','risk']){await p.locator('#battle-forecast').evaluate((e,l)=>e.dataset.level=l,level);await audit(`forecast-${level}`,'#battle-pane');}
  // Status colours and score labels must remain legible even before a real report exists.
  await close();await p.evaluate(()=>{const r=document.querySelector('#battle-result');document.querySelector('#battle-result-score').innerHTML='<div class="is-record"><small>歷史最高</small><b>125</b></div><div class="is-up"><small>比上次進步</small><b>+20</b></div>';document.querySelector('#battle-result-log').innerHTML='<li class="is-special">發揮剋制優勢</li><li class="is-power">隊伍戰力 30</li>';document.querySelector('#battle-result-review').hidden=false;document.querySelector('#battle-review-label').textContent='咕咕書評';document.querySelector('#battle-review-text').textContent='這次有認真看對手，好吧，算你有進步。';document.querySelector('#battle-review-note').hidden=false;document.querySelector('#battle-review-note').textContent='記得看看自己的隊伍，也記得好好休息。';r.showModal()});await audit('battle-report','#battle-result');
  await close();await p.evaluate(()=>{document.querySelector('#whats-new-list').innerHTML='<section class="whats-new__entry"><small>2026.11.17</small><h3>最新更新</h3><ul><li>小湘的新故事已經準備好了。</li></ul></section>';document.querySelector('#whats-new').showModal()});await audit('updates','#whats-new');
 }
 await close();
 // The light stylesheet must not restyle the original dark palettes.
 await open('#open-themes');await p.locator('[data-palette="blue"]').click();await close();await nav('dex');
 const styles=()=>p.evaluate(()=>['.dex__card','.dex__name','.battle-stage-card','.wheel-stake','.dex-bond__unlocks li','.whats-new__entry h3'].map(q=>{const e=document.querySelector(q);if(!e)return null;const s=getComputedStyle(e);return [s.color,s.backgroundColor,s.opacity]}));
 const dark=await styles();await p.evaluate(()=>document.querySelector('link[href="css/light-theme.css"]').sheet.disabled=true);assert.deepEqual(await styles(),dark,'dark palette styles preserved');await p.evaluate(()=>document.querySelector('link[href="css/light-theme.css"]').sheet.disabled=false);
 assert.equal(await p.evaluate(()=>localStorage.getItem('siang-collector:v1')),stable,'readability review changes no game progress');assert.deepEqual(errors,[]);
 console.log(`${width}px: all three light palettes audited`);await c.close();}
 await b.close();if(allFailures.length){console.log(JSON.stringify(allFailures,null,2));throw new Error(`${allFailures.length} low-contrast text samples`)}console.log('Light themes: rendered text contrast, key screens and statuses, no overflow, unchanged progress PASS');
})().catch(e=>{console.error(e);process.exit(1)});
