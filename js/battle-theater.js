// Presentation only: consumes a collected report snapshot; never imports state or reward code.
import { CHARACTERS, characterSources, loadWithFallback } from './eggs.js';
import { BOND_ART } from './bond-art.js';
import { TEAM_BONDS } from './team-bonds.js';
import { PARTY_LINES } from './badge-heroes.js';
const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;return node;};
export function buildBattleScenes(snapshot){
 const {report={},enemy={}}=snapshot,log=Array.isArray(report.log)?report.log:[],nos=(snapshot.nos||[]).filter(no=>CHARACTERS[no]).slice(0,3);
 const scenes=[{kind:'intro',label:'對手登場',speaker:enemy.name||'討伐紀錄',text:log[0]||'這次的冒險，從這裡開始。',ms:1800}];
 nos.forEach((no,i)=>scenes.push({kind:'attack',label:'小湘出手',speaker:CHARACTERS[no].name,no,text:log[i+1]||CHARACTERS[no].line,ms:1800}));
 if(report.bond||report.heroParty){const bond=TEAM_BONDS.find(b=>b.id===report.bond);const lines=log.filter(line=>PARTY_LINES.some(p=>line===`${p.speaker}：「${p.text}」`));const recorded=log.find(line=>line.startsWith('♡'));
  scenes.push({kind:'bond',label:report.heroParty?'勇者小隊連攜':'默契共鳴',speaker:bond&&snapshot.bondUnlocked?bond.name:report.heroParty?'勇者小隊':'一起出手',text:lines.length?lines.slice(-2).join('\n'):recorded||'這一刻，大家的步調對上了。',art:bond&&snapshot.bondUnlocked&&BOND_ART[bond.id]?`assets/bonds/${bond.id}.webp`:null,ms:3000});
 }
 const end=report.win?enemy.win:enemy.lose;
 scenes.push({kind:report.win?'win':'lose',label:report.win?'平安歸來':'先回家休息',speaker:enemy.name||'討伐紀錄',text:log.find(line=>line===end)|| (report.win?'這次的討伐成功了。':'先撤退，休息好了再一起出發。'),ms:2200});
 return scenes;
}
export function createBattleTheater({root,details,dialog,replay,onActivity=()=>{}}){
 let snapshot,scenes=[],index=0,running=false,userPaused=false,timer=null,due=0,remaining=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 root.innerHTML='<header class="battle-theater__head"><div><small>BATTLE STORY</small><h2 id="battle-theater-title"></h2></div><button type="button" class="battle-theater__skip">跳過演出 ↗</button></header><div class="battle-theater__progress" aria-hidden="true"></div><div class="battle-theater__stage"><div class="battle-theater__enemy"></div><div class="battle-theater__allies"></div><div class="battle-theater__impact" aria-hidden="true"></div><div class="battle-theater__bond"></div></div><div class="battle-theater__dialogue" role="status" aria-live="polite" aria-atomic="true"><small></small><b></b><p></p></div><footer class="battle-theater__controls"><button type="button" class="btn btn--quiet battle-theater__pause"></button><button type="button" class="btn battle-theater__next">下一幕 →</button></footer>';
 const closeButton=()=>{const button=el('button','×','close-button battle-result__close');button.type='button';button.setAttribute('aria-label','關閉戰報');button.onclick=()=>dialog.close();return button;};
 const actions=el('div',null,'battle-theater__actions');actions.append(root.querySelector('.battle-theater__skip'),closeButton());root.querySelector('.battle-theater__head').append(actions);
 const closebar=el('div',null,'battle-result__closebar');closebar.append(closeButton());details.prepend(closebar);
 const q=selector=>root.querySelector(selector),pause=q('.battle-theater__pause'),next=q('.battle-theater__next'),stage=q('.battle-theater__stage');
 function stopTimer(){if(timer!==null){clearTimeout(timer);remaining=Math.max(0,due-performance.now());timer=null;}}
 function schedule(){stopTimer();pause.textContent=userPaused?'繼續播放':'暫停';pause.setAttribute('aria-pressed',String(userPaused));if(!running||userPaused||document.hidden)return;due=performance.now()+remaining;timer=setTimeout(()=>{timer=null;advance();},remaining);}
 function finish(focus=true){stopTimer();running=false;root.hidden=true;details.hidden=false;stage.getAnimations({subtree:true}).forEach(a=>a.cancel());q('.battle-theater__bond').replaceChildren();dialog.removeAttribute('data-theater');dialog.setAttribute('aria-labelledby','battle-result-title');dialog.scrollTop=0;if(focus&&dialog.open)replay.focus({preventScroll:true});onActivity();}
 function advance(){if(!running)return;if(index+1>=scenes.length){finish();return;}index++;render();}
 function render(){
  stopTimer();const scene=scenes[index];remaining=scene.ms;root.dataset.scene=scene.kind;root.dataset.step=String(index);dialog.scrollTop=0;
  q('#battle-theater-title').textContent=snapshot.enemy.name||'討伐小劇場';q('.battle-theater__dialogue small').textContent=`${String(index+1).padStart(2,'0')} / ${String(scenes.length).padStart(2,'0')} · ${scene.label}`;q('.battle-theater__dialogue b').textContent=scene.speaker;q('.battle-theater__dialogue p').textContent=scene.text;
  q('.battle-theater__progress').replaceChildren(...scenes.map((_,i)=>{const dot=el('i');dot.className=i<=index?'is-done':'';return dot;}));
  q('.battle-theater__allies').querySelectorAll('[data-no]').forEach(node=>node.classList.toggle('is-active',node.dataset.no===scene.no));
  const bond=q('.battle-theater__bond');bond.replaceChildren();if(scene.art){const img=el('img');img.alt=`${scene.speaker}三人合照`;img.src=scene.art;img.onerror=()=>img.remove();bond.append(img);}
  // Restart bounded, transform-only motion when a second member attacks.
  stage.getAnimations({subtree:true}).forEach(a=>a.cancel());stage.classList.remove('is-animating');void stage.offsetWidth;stage.classList.add('is-animating');
  next.textContent=index===scenes.length-1?'查看戰報 →':'下一幕 →';schedule();
 }
 function play(data){
  stopTimer();snapshot=structuredClone(data);scenes=buildBattleScenes(snapshot);index=0;running=true;userPaused=reduced.matches;root.hidden=false;details.hidden=true;dialog.dataset.theater='playing';dialog.setAttribute('aria-labelledby','battle-theater-title');
  stage.style.backgroundImage=snapshot.scene?`linear-gradient(#17192224,#17192238),url("${snapshot.scene}")`:'';
  const enemy=q('.battle-theater__enemy');enemy.replaceChildren();const enemyImage=el('img');enemyImage.alt=snapshot.enemy.name;enemyImage.src=`assets/enemies/${snapshot.enemy.art||'unknown'}.webp`;enemyImage.onerror=()=>enemy.replaceChildren(el('span',snapshot.enemy.emoji||'✦','battle-theater__enemy-fallback'));enemy.append(enemyImage);
  const allies=q('.battle-theater__allies');allies.replaceChildren(...(snapshot.nos||[]).filter(no=>CHARACTERS[no]).slice(0,3).map(no=>{const actor=el('div',null,'battle-theater__actor');actor.dataset.no=no;const img=el('img');img.alt=CHARACTERS[no].name;loadWithFallback(img,characterSources(CHARACTERS[no].image));actor.append(img);return actor;}));
  render();q('.battle-theater__skip').focus({preventScroll:true});onActivity();
 }
 q('.battle-theater__skip').onclick=()=>finish();next.onclick=advance;pause.onclick=()=>{stopTimer();userPaused=!userPaused;schedule();};
 dialog.addEventListener('close',()=>finish(false));document.addEventListener('visibilitychange',()=>{if(running){if(document.hidden)stopTimer();else schedule();}});
 reduced.addEventListener('change',()=>{if(running&&reduced.matches){stopTimer();userPaused=true;schedule();}});
 replay.onclick=()=>{if(snapshot)play(snapshot);};
 return {play,cancel:()=>finish(false)};
}
