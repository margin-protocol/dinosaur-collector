// 劇場古箏配樂（11/25 湘挑 Pixabay 曲）：墨痕江湖劇情有 ♪ 開關、點開就淡入播放、關掉記在這台裝置、關劇場會停；一般章節劇場沒有配樂
const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const p=await (await b.newContext({viewport:{width:360,height:740},isMobile:true,hasTouch:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const mp3=[];p.on('request',r=>{if(r.url().includes('/assets/music/'))mp3.push(r.url());});
await p.goto('http://127.0.0.1:8000');await p.click('#intro-ok');
assert.equal(mp3.length,0,'開遊戲時不先下載音樂');
const res=await p.request.get('http://127.0.0.1:8000/assets/music/mohen-guzheng.mp3');assert.equal(res.status(),200);assert.ok((await res.body()).length<700*1024,'音樂檔要小於 700KB');
await p.evaluate(async()=>{const T=await import('/js/event-theater.js');const E=await import('/js/chapter-epilogue.js');T.buildStories('b');
  const d=document.createElement('dialog');d.className='sheet epilogue';d.id='music-test';document.body.append(d);window.__th=E.createEpilogueTheater({dialog:d});
  window.__plain=Object.keys(E.EPILOGUES).find(k=>!k.startsWith('mo:'));
  const go=document.createElement('button');go.id='go';go.textContent='go';go.onclick=()=>window.__th.play(window.__next);document.body.prepend(go);});
const M=()=>p.evaluate(async()=>(await import('/js/theater-music.js')).musicDebug());
const open=async(id)=>{await p.evaluate(id=>{window.__next=id;document.getElementById('go').click();},id);};
// 墨痕江湖：有 ♪，點開就播
await open('mo:mo-01:before');
const btn=p.locator('#music-test [data-a="music"]');
assert.ok(await btn.isVisible(),'墨痕江湖劇情有 ♪');
const box=await p.evaluate(()=>{const bar=document.querySelector('#music-test .epi__bar');return [...bar.children].filter(x=>x.offsetParent).map(x=>x.getBoundingClientRect().right);});
assert.ok(Math.max(...box)<=360,'工具列沒超出 360');
assert.equal(await btn.getAttribute('aria-pressed'),'true');
await p.waitForFunction(async()=>(await import('/js/theater-music.js')).musicDebug().playing,null,{timeout:8000});
assert.equal(mp3.length,1,'第一次播才下載');
await p.waitForTimeout(1900);let m=await M();assert.equal(m.want,'mo');assert.ok(m.gain>0.3&&m.gain<0.5,'淡入到小音量 '+m.gain);
await p.screenshot({path:'/tmp/theater-music-on.png'});
// 關掉：停、記住
await btn.click();assert.equal(await btn.getAttribute('aria-pressed'),'false');m=await M();assert.equal(m.playing,false);
assert.equal(await p.evaluate(()=>localStorage.getItem('siang-collector:theater-music:v1')),'off');
await p.screenshot({path:'/tmp/theater-music-off.png'});
// 關劇場再開：還是關著
await p.evaluate(()=>document.getElementById('music-test').close());await open('mo:mo-02:before');
assert.equal(await btn.getAttribute('aria-pressed'),'false');await p.waitForTimeout(400);assert.equal((await M()).playing,false,'關掉的話重開也不播');
// 打開：再播，關劇場就停
await btn.click();await p.waitForFunction(async()=>(await import('/js/theater-music.js')).musicDebug().playing,null,{timeout:8000});
assert.equal(mp3.length,1,'第二次不重新下載');
await p.evaluate(()=>document.getElementById('music-test').close());await p.waitForTimeout(100);m=await M();assert.equal(m.playing,false,'關劇場就停');assert.equal(m.want,null);
// 一般章節劇場：沒有 ♪、不播
await p.evaluate(()=>{window.__next=window.__plain;document.getElementById('go').click();});
assert.equal(await btn.isVisible(),false,'一般劇場沒有配樂按鈕');await p.waitForTimeout(400);assert.equal((await M()).playing,false);
assert.deepEqual(errs,[]);
console.log('theater music: lazy load, fade in, toggle remembered, stops on close, plain chapters silent PASS');await b.close();})().catch(e=>{console.error(e);process.exit(1)});
