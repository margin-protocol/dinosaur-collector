const asset = path => new URL(`../../../assets/${path}`, import.meta.url).href;
export const ART = {
  hall: asset('storybooks/chapter-one/hall.webp'),
  banquet: asset('storybooks/chapter-one/banquet.webp'),
  afterparty: asset('storybooks/chapter-one/afterparty.webp'),
  king: asset('storybooks/chapter-one/king-shy.webp'),
  siang: asset('characters/siang-001-hd/idle-open.webp'),
  mochi: asset('enemies/chapter-01/ch1-01-mochi-thief.webp'),
  sock: asset('enemies/chapter-01/ch1-02-sock-ranger.webp'),
  bento: asset('enemies/chapter-01/ch1-03-nagging-bento.webp'),
};
// Standalone presentation data. No game state, unlock, reward or storage dependency.
export const SCENES = [
  { id:'crown', title:'王冠歪掉了', background:'hall', actors:['king'], description:'夕陽照著空蕩蕩的布丁王宮，焦糖大王低下頭，王冠歪在一邊。', beats:[
    {speaker:'旁白',text:'戰鬥結束了。\n布丁王宮裡，突然變得好安靜。'},
    {speaker:'焦糖大王',text:'「……本王沒有哭。\n是焦糖流進眼睛了。」'},
  ]},
  { id:'letters', title:'黏住的祕密', background:'hall', actors:['king','siang'], description:'小湘拉起一張邀請卡，後面竟黏著一整串，連焦糖大王都被帶得晃了一下。', beats:[
    {speaker:'旁白',text:'小湘撿起一張邀請卡。\n輕輕一拉——後面還有一張。'},
    {speaker:'原味小湘',text:'「一張、兩張……\n欸？怎麼連大王也跟著過來了！」'},
    {speaker:'焦糖大王',text:'「本王明明……\n每一張都有寫名字。」'},
  ]},
  { id:'waiting', title:'原來一直在等人', background:'hall', actors:['king'], description:'鏡頭慢慢望向空著的椅子，大王捧著自己的小手，燈光靜靜亮著。', beats:[
    {speaker:'旁白',text:'桌子擺好了，湯匙也排好了。\n只有椅子，一直空著。'},
    {speaker:'焦糖大王',text:'「可是，等到布丁都不冰了……\n也沒有人來。」'},
  ]},
  { id:'delivery', title:'這次，好好送出去', background:'hall', actors:['siang','mochi','sock','bento'], description:'小湘與三位小怪一起整理卡片，襪子遊俠揹著郵袋出發，糰子和便當盒在旁邊鬥嘴。', beats:[
    {speaker:'旁白',text:'小湘陪牠把點心還回去，\n再把黏住的邀請，一張一張分開。'},
    {speaker:'偷吃鬼糰子',text:'「我可以當試吃員！」'},
    {speaker:'碎碎念便當盒',text:'「你先當道歉員！」'},
  ]},
  { id:'feast', title:'幾天後，王宮好吵', background:'banquet', actors:[], description:'宴會桌終於坐滿朋友，小湘分享布丁，小恐龍捧著大碗，還有一張空椅子留給你。', beats:[
    {speaker:'旁白',text:'幾天後，湯匙碰上杯子，\n笑聲把整間小王宮填得滿滿的。'},
    {speaker:'焦糖大王',text:'「本王宣布——唔！\n……這個好吃。」'},
  ]},
  { id:'seat', title:'還有一個位子', background:'banquet', actors:[], description:'鏡頭慢慢靠近宴會桌前的空椅子，上面有一封邀請，桌上替你放好了一支湯匙。', beats:[
    {speaker:'旁白',text:'焦糖大王拉開旁邊的椅子，\n替你放好一支乾淨的湯匙。'},
    {speaker:'焦糖大王',text:'「……下次，\n你也要來喔。」'},
  ]},
  { id:'bonus', title:'本王的那份呢？', background:'afterparty', actors:[], description:'宴會後只剩空布丁杯，小恐龍嘴邊沾著焦糖；焦糖大王無奈地摸摸牠的頭。', beats:[
    {speaker:'旁白',text:'宴會結束以後……\n桌上只剩一個空布丁杯。'},
    {speaker:'焦糖大王',text:'「……本王記得，\n這裡還有一個布丁。」'},
    {speaker:'小恐龍',text:'「……嗝。」'},
    {speaker:'焦糖大王',text:'「下次宴會……\n本王要先把你的那份裝成大碗的。」'},
  ]},
];
