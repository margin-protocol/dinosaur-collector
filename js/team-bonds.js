// LV5 隱藏羈絆 v1：每位只參與一組；power 是取代通用 +10% 的隊伍倍率。
import { CHARACTERS } from './eggs.js';
import { LEVELS } from './affection.js';
export const TEAM_BONDS = [
  {id:'dessert',name:'布丁保衛戰',nos:['001','002','005'],clue:'一位把日常裝進口袋，一位摘草莓，一位總帶著甜點。',power:.16,speed:0},
  {id:'rainbow',name:'雨後的捷徑',nos:['003','071','074'],clue:'撐傘的人、踩水坑的人，和雨停後才出現的那道光。',power:0,speed:.20},
  {id:'midnight',name:'熄燈後讀一頁',nos:['004','007','010'],clue:'夜貓捨不得睡，書頁捨不得翻完，星塵替她們留燈。',power:.12,speed:.10},
  {id:'garden',name:'花園慢慢醒',nos:['006','008','009'],clue:'園丁種下期待；一位收藏晴空，一位把花開的瞬間拍下來。',power:.14,speed:.05},
  {id:'gym',name:'練完再開飯',nos:['036','037','040'],clue:'有人先睡著了，十五年的老朋友練完要吃飯，還有人提醒喝水。',power:.18,speed:0},
  {id:'paws',name:'腳印接力賽',nos:['044','048','055'],clue:'喵一聲、汪一聲，最後交棒給蹦蹦跳的公主。',power:.04,speed:.15},
  {id:'ocean',name:'不會游也要出航',nos:['045','046','054'],clue:'條紋魚領航，橫著走的當舵手，怕冷的朋友擠上甲板。',power:.15,speed:.05},
  {id:'north',name:'北邊的回家路',nos:['016','017','018'],clue:'城市裡的研究、寫願望的天燈，最後到總有船回來的港口。',power:.08,speed:.12},
  {id:'east',name:'沿海等日出',nos:['032','033','034'],clue:'蔥油餅、七星潭的圓石頭，和一場說好要你載的兜風。',power:.05,speed:.15},
  {id:'heroes',name:'慶功宴不能遲到',nos:['062','063','064'],clue:'盾牌拿反、咒語念成開飯，最後一個只在意甜點店幾點關門。',power:.60,speed:0,legacyHero:true},
  {id:'storm',name:'天空實驗小隊',nos:['065','067','070'],clue:'一個觀測天空，一個替雷聲調音量，一個把冰雹認作寶石。',power:.20,speed:0},
  {id:'islands',name:'離島守護聯盟',nos:['092','093','094'],clue:'一位等海發光，一位查好潮汐，一位抱著風獅爺說這裡我來守護。',power:.05,speed:.15},
  {id:'gallery',name:'留給明天的光',nos:['076','077','080'],clue:'星夜的書房、日落的底片，和月光下還沒關門的花園。',power:.12,speed:.08},
];
export function ensureTeamBonds(state) {
  const old=state.teamBonds || {};
  state.teamBonds={unlocked:Object.fromEntries(Object.entries(old.unlocked || {}).filter(([id,v])=>TEAM_BONDS.some(b=>b.id===id)&&typeof v==='string')),presets:Array.from({length:5},(_,i)=>{const p=old.presets?.[i];return p&&Array.isArray(p.nos)&&p.nos.length===3&&new Set(p.nos).size===3&&p.nos.every(n=>CHARACTERS[n])?{name:String(p.name||`隊伍 ${i+1}`).slice(0,20),nos:[...p.nos]}:null;})};
  return state.teamBonds;
}
export function teamBond(state,nos) {
  if(nos.length!==3||new Set(nos).size!==3||!nos.every(n=>state.dex?.[n]&&(state.affection?.[n]?.pts||0)>=LEVELS[LEVELS.length-1]))return null;
  return TEAM_BONDS.find(b=>b.nos.every(n=>nos.includes(n))) || {id:'general',name:'一起長大的默契',power:.10,speed:0};
}
export function discoverBond(state,nos,now=new Date()) {
  const b=teamBond(state,nos);if(!b||b.id==='general')return null;
  const data=ensureTeamBonds(state);if(data.unlocked[b.id])return null;
  data.unlocked[b.id]=now.toISOString();return b;
}
export const effectText=b=>`${b.legacyHero?'勇者隊總戰力':'戰力'} +${Math.round(b.power*100)}%${b.speed?` · 討伐時間 −${Math.round(b.speed*100)}%`:''}`;
export function savePreset(state,slot,nos,name) {
  if(!Number.isInteger(slot)||slot<0||slot>=5||nos.length!==3||new Set(nos).size!==3||nos.some(n=>!state.dex?.[n]))return false;
  ensureTeamBonds(state).presets[slot]={name:String(name||`隊伍 ${slot+1}`).trim().slice(0,20)||`隊伍 ${slot+1}`,nos:[...nos]};return true;
}
