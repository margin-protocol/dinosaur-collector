// The same readable report transcript is used by the game and the preview.
export function renderBattleLog(host,lines){
 host.setAttribute('role','list');
 host.replaceChildren(...lines.map(line=>{
  const item=document.createElement('li');
  item.className=/^[✦♡]/u.test(line)?'is-special':'';
  const colon=line.indexOf('：');
  if(colon>0&&colon<60&&line.slice(colon+1).trimStart().startsWith('「')&&!item.className){
   const speaker=document.createElement('b');speaker.className='battle-log__speaker';speaker.textContent=line.slice(0,colon);
   const speech=document.createElement('p');speech.textContent=line.slice(colon+1).trim();item.append(speaker,speech);
  }else{const text=document.createElement('p');text.textContent=line;item.append(text);}
  return item;
 }));
}
