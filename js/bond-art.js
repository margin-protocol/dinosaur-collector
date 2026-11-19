// Finished story illustrations share existing bond ids; never used to unlock a bond.
import { CHARACTERS, characterSources, loadWithFallback } from './eggs.js';
export const BOND_ART = {
 dessert:{alt:'原味小湘抱著布丁，草莓和甜點小湘在兩側偷偷伸出湯匙。',caption:'說好一起保護布丁，怎麼大家都拿著湯匙？'},
 rainbow:{alt:'雨傘小湘替朋友撐傘，下雨小湘跳過水坑，彩虹小湘伸手接住她。',caption:'捷徑有一點濕，但牽著手就不怕走錯。'},
 midnight:{alt:'夜貓小湘靠著書頁小湘睡著，星塵小湘用小星星替書本照明。',caption:'再讀一頁就睡。這次，真的只讀一頁。'},
 garden:{alt:'園丁與晴空小湘認真等花開，膠卷小湘蹲下替她們拍照。',caption:'花還沒開，認真的樣子已經先被收藏了。'},
 gym:{alt:'把拔小湘抱著獅子玩偶睡著，ㄊㄧ小湘打開便當，Achio 小湘遞上水壺。',caption:'練完再吃！十五年了，這句話還是一樣好聽。'},
 paws:{alt:'貓咪小湘抓著接力棒不放，狗狗小湘回頭接棒，兔兔小湘跳向終點。',caption:'接力棒可以晚一點交，布丁可不能被吃完。'},
 ocean:{alt:'小丑魚小湘指路、螃蟹小湘掌舵，企鵝小湘抱著救生圈，船還繫在碼頭。',caption:'船長們都準備好了。啊，船繩還沒解開。'},
 north:{alt:'臺北、新北與基隆小湘坐在港邊看地圖、天燈和船燈，分享一籃點心。',caption:'說是回家路線，怎麼每一站都有好吃的？'},
 east:{alt:'宜蘭小湘分享蔥油餅，花蓮小湘排石頭，臺東小湘靠著朋友睡著，三人一起等海邊日出。',caption:'日出可以慢慢等，第一口蔥油餅要先留給你。'},
 heroes:{alt:'騎士小湘努力擺帥，魔法師的書偷偷冒煙，勇者小湘已經吃起慶功宴的布丁。',caption:'世界拯救完了。現在，輪到拯救快融化的布丁。'},
 storm:{alt:'天氣觀測師記錄天空，打雷小湘照顧迷你雷雲，冰雹小湘收集閃亮的天空寶石。',caption:'雷聲小一點，寶石多一點，今天的觀測很成功。'},
 gallery:{alt:'日落底片小湘舉起相機，星夜書房和月光花園小湘抬頭對她微笑。',caption:'把今天的光留好，明天還有新的故事。'},
};
function fallback(bond){const row=document.createElement('span');row.className='bond-art-fallback';row.setAttribute('role','img');row.setAttribute('aria-label',`${bond.name}的三位小湘`);for(const no of bond.nos){const img=document.createElement('img');img.alt=CHARACTERS[no].name;loadWithFallback(img,characterSources(CHARACTERS[no].image));row.append(img);}return row;}
export function bondImage(bond,{lazy=true}={}){if(!BOND_ART[bond.id])return fallback(bond);const img=document.createElement('img');img.className='bond-story-art';img.alt=BOND_ART[bond.id].alt;img.width=1448;img.height=1086;img.loading=lazy?'lazy':'eager';img.decoding='async';img.onerror=()=>img.replaceWith(fallback(bond));img.src=`assets/bonds/${bond.id}.webp`;return img;}
let viewer,opener;
function getViewer(){
 if(viewer)return viewer;
 viewer=document.createElement('dialog');viewer.id='bond-photo-viewer';viewer.className='residents-dialog sheet bond-lightbox';viewer.setAttribute('aria-labelledby','bond-photo-title');
 const heading=document.createElement('div');heading.className='drawer-heading bond-lightbox__heading';const title=document.createElement('h2');title.id='bond-photo-title';const close=document.createElement('button');close.type='button';close.className='close-button';close.setAttribute('aria-label','關閉羈絆合照');close.textContent='×';close.onclick=()=>viewer.close();heading.append(title,close);
 const image=document.createElement('div');image.className='bond-lightbox__image';const caption=document.createElement('p');caption.id='bond-photo-caption';const members=document.createElement('p');members.className='bond-lightbox__members';viewer.append(heading,image,caption,members);
 viewer.addEventListener('close',()=>{image.replaceChildren();if(opener?.isConnected)opener.focus({preventScroll:true});});
 viewer.addEventListener('click',e=>{if(e.target!==viewer)return;const r=viewer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)viewer.close();});
 document.body.append(viewer);return viewer;
}
export function openBondPhoto(bond,button){const dialog=getViewer();opener=button;dialog.querySelector('h2').textContent=bond.name;dialog.querySelector('.bond-lightbox__image').replaceChildren(bondImage(bond,{lazy:false}));dialog.querySelector('#bond-photo-caption').textContent=BOND_ART[bond.id]?.caption || bond.clue;dialog.querySelector('.bond-lightbox__members').textContent=bond.nos.map(n=>CHARACTERS[n].name).join(' · ');if(!dialog.open)dialog.showModal();dialog.scrollTop=0;}
export function bondPhotoButton(bond){const photo=document.createElement('button');photo.type='button';photo.className='team-bond-photo';photo.dataset.bondArt=bond.id;photo.setAttribute('aria-label',`查看${bond.name}三人合照閃卡`);photo.setAttribute('aria-haspopup','dialog');photo.append(bondImage(bond));const label=document.createElement('span');label.className='bond-photo-action';label.textContent='查看完整合照 ↗';photo.append(label);photo.onclick=()=>openBondPhoto(bond,photo);return photo;}
