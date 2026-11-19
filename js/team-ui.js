import { TEAM_BONDS, effectText } from './team-bonds.js';
import { CHARACTERS, characterSources, loadWithFallback } from './eggs.js';
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
const action=(text,fn)=>{const b=el('button',text,'btn btn--quiet');b.type='button';b.onclick=fn;return b;};
function portrait(no){const img=el('img');img.alt=CHARACTERS[no].name;loadWithFallback(img,characterSources(CHARACTERS[no].image));return img;}
export function renderAtlas(host,state){
  const open=host.querySelector('details')?.open;
  const details=el('details',null,'team-atlas');details.open=Boolean(open);
  const known=state.teamBonds?.unlocked||{};
  details.append(el('summary',`隱藏羈絆圖鑑 · ${TEAM_BONDS.filter(b=>known[b.id]).length} / 12`),el('p','任意三位 LV5 戰力 +10%；特殊羈絆取代通用加成。照著線索組隊，三位 LV5 一起出發即可收藏三人合照閃卡。'));
  for(const b of TEAM_BONDS){const card=el('article',null,'team-bond-card');card.append(el('small',known[b.id]?'合照已收藏':'尚未發現'),el('h3',known[b.id]?b.name:'未揭曉的默契'),el('p',b.clue));
    if(known[b.id]){const photo=el('div',null,'team-bond-photo');photo.setAttribute('role','img');photo.setAttribute('aria-label',`${b.name}三人合照閃卡`);photo.append(...b.nos.map(portrait));card.append(photo,el('p',effectText(b)),el('small',`相遇紀念 · ${known[b.id].slice(0,10)}`));}details.append(card);
  }host.replaceChildren(details);
}
export function renderTeamTools(host,{state,free,picked,comparison,onChoose,onSave,onDelete}){
  const presets=el('details',null,'team-presets');presets.open=host.querySelector('.team-presets')?.open||false;presets.append(el('summary','常用隊伍 · 5 個位置'));
  const name=el('input');name.type='text';name.maxLength=20;name.placeholder='隊伍名稱（選填）';name.setAttribute('aria-label','儲存的隊伍名稱');presets.append(name);
  for(let i=0;i<5;i++){const p=state.teamBonds?.presets?.[i],row=el('div',null,'team-preset');row.append(el('b',p?.name||`隊伍 ${i+1} · 空位`));if(p)row.append(el('small',p.nos.map(n=>CHARACTERS[n].name).join('、')));
    if(p){const use=action('選用',()=>onChoose(p.nos));use.disabled=p.nos.some(n=>!free.includes(n));row.append(use);if(use.disabled)row.append(el('small','有人忙碌或休息中，暫時不能出發'));row.append(action('清除',()=>onDelete(i)));}
    const save=action(p?'覆寫此隊':'儲存目前三人',()=>onSave(i,picked,name.value));save.disabled=picked.length!==3;row.append(save);presets.append(row);
  }
  const compare=el('details',null,'team-compare');compare.open=host.querySelector('.team-compare')?.open||false;compare.append(el('summary','最佳隊伍比較'),el('p','依目前可出發的角色與已發現的羈絆比較（勇者隊也會列出）。三星需戰力達對手 1.6 倍，僅在必勝時標示門檻。'));
  const seen=new Set();for(const [label,t] of [['最高戰力',comparison.strength],['最快必勝',comparison.fastest],['勇者隊',comparison.heroes]]){if(!t)continue;const key=[...t.nos].sort().join();if(seen.has(key)&&label!=='勇者隊')continue;seen.add(key);
    const row=el('article',null,'team-compare-row');const heading=label==='最高戰力'&&comparison.fastest&&[...comparison.fastest.nos].sort().join()===key&&t.chance===1?'最高戰力／最快必勝':label;row.append(el('b',label==='最快必勝'&&t.chance<1?'最快候選（未保證勝利）':heading),el('p',t.nos.map(n=>CHARACTERS[n].name).join('、')),el('small',`約 ${t.minutes} 分鐘 · 戰力 ${t.total} · ${t.chance===1?`${t.stars} 星門檻達成`:`勝率約 ${Math.round(t.chance*100)}%`}`));
    if(t.bond)row.append(el('small',t.bond.id==='general'?effectText(t.bond):state.teamBonds?.unlocked[t.bond.id]?`${t.bond.name} · ${effectText(t.bond)}`:'未知的 LV5 默契正在共鳴'));
    row.append(action('選用這一隊',()=>onChoose(t.nos)));compare.append(row);
  }if(!comparison.strength)compare.append(el('p','目前沒有可以出發的小湘。'));host.replaceChildren(presets,compare);
}
