import { bondPhotoButton } from './bond-art.js';
import { TEAM_BONDS, effectText } from './team-bonds.js';
import { CHARACTERS } from './eggs.js';
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
const action=(text,fn)=>{const b=el('button',text,'btn btn--quiet');b.type='button';b.onclick=fn;return b;};
export function renderAtlas(host,state){
  const open=host.querySelector('details')?.open;
  const details=el('details',null,'team-atlas');details.open=Boolean(open);
  const known=state.teamBonds?.unlocked||{};
  details.append(el('summary',`隱藏羈絆圖鑑 · ${TEAM_BONDS.filter(b=>known[b.id]).length} / ${TEAM_BONDS.length}`),el('p','任意三位 LV5 戰力 +10%；特殊羈絆取代通用加成。照著線索組隊，三位 LV5 一起出發即可收藏三人合照閃卡。'));
  for(const b of TEAM_BONDS){const card=el('article',null,'team-bond-card');card.append(el('small',known[b.id]?'合照已收藏':'尚未發現'),el('h3',known[b.id]?b.name:'未揭曉的默契'),el('p',b.clue));
    if(known[b.id]){const photo=bondPhotoButton(b);card.append(photo,el('p',effectText(b)),el('small',`相遇紀念 · ${known[b.id].slice(0,10)}`));}details.append(card);
  }host.replaceChildren(details);
}
// 常用隊伍按鈕縮小排一排，整合進討伐首頁的格子卡（玩家 11/28，湘選 C）
const mini=(text,fn,cls='')=>{const b=action(text,fn);b.classList.add('team-preset__btn');if(cls)b.classList.add(cls);return b;};
export function presetActions({p,i,free,picked,name,onChoose,onSave,onDelete}){
  const box=el('div',null,'team-preset__actions');
  if(p){const use=mini('選用',()=>onChoose(p.nos),'is-main');use.disabled=p.nos.some(n=>!free.includes(n));box.append(use);}
  const save=mini(p?'覆寫':'儲存目前三人',()=>onSave(i,picked,p?p.name:(name?.value||'')));save.disabled=picked.length!==3;if(p)save.setAttribute('aria-label','覆寫此隊');box.append(save);
  if(p)box.append(mini('清除',()=>onDelete(i)));
  return box;
}
export function renderTeamTools(host,{state,comparison,onChoose}){
  const compare=el('details',null,'team-compare');compare.open=host.querySelector('.team-compare')?.open||false;compare.append(el('summary','最佳隊伍比較'),el('p','依目前可出發的角色與已發現的羈絆比較（勇者隊也會列出）。三星需戰力達對手 1.6 倍，僅在必勝時標示門檻。'));
  const seen=new Set();for(const [label,t] of [['最高戰力',comparison.strength],['最快必勝',comparison.fastest],['勇者隊',comparison.heroes]]){if(!t)continue;const key=[...t.nos].sort().join();if(seen.has(key)&&label!=='勇者隊')continue;seen.add(key);
    const row=el('article',null,'team-compare-row');const heading=label==='最高戰力'&&comparison.fastest&&[...comparison.fastest.nos].sort().join()===key&&t.chance===1?'最高戰力／最快必勝':label;row.append(el('b',label==='最快必勝'&&t.chance<1?'最快候選（未保證勝利）':heading),el('p',t.nos.map(n=>CHARACTERS[n].name).join('、')),el('small',`約 ${t.minutes} 分鐘 · 戰力 ${t.total} · ${t.chance===1?`${t.stars} 星門檻達成`:`勝率約 ${Math.round(t.chance*100)}%`}`));
    if(t.bond)row.append(el('small',t.bond.id==='general'?effectText(t.bond):state.teamBonds?.unlocked[t.bond.id]?`${t.bond.name} · ${effectText(t.bond)}`:'未知的 LV5 默契正在共鳴'));
    row.append(action('選用這一隊',()=>onChoose(t.nos)));compare.append(row);
  }if(!comparison.strength)compare.append(el('p','目前沒有可以出發的小湘。'));host.replaceChildren(compare);
}
