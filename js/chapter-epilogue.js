// 章節尾聲劇場：第一次打倒章節 Boss 後播放的純故事演出（湘 11/21 選 A 劇場對話版）。
// 只負責演出：不讀寫存檔、不發獎勵。什麼時候播由 app.js 決定（第一次通關自動播，檔案館可重看）。
// 劇本照湘 11/21 給的第一～三章六幕＋片尾彩蛋；素材在 assets/storybooks/chapter-one/、chapter-two/、chapter-three/。
// 每一句（beat）沒寫的 bg / cam / cast / tone 會沿用上一句。
// cam: [x%, y%, 放大倍數]，以該點為中心放大；pan: 這句播放時慢慢移到的位置。
// cast: [[角色, 站位], …]；fx: { 角色: 動作 }；prop: 'cards'（黏成一串的邀請卡）／'sign'（蘑菇的木牌，sign: 牌子上的字）。
// screen: 控制室大螢幕上的字 { lines, count（{n} 依序換數字）, stamp（紅章）, alert, fade }；prop 'notes'：飄音符。
// card: 全黑轉場字卡（over: 疊在畫面上；boom: 白光大字）；flash: 'soft' | 'big' 打雷閃光。
import { characterSources, loadWithFallback, CHARACTERS } from './eggs.js';

const STORY = 'assets/storybooks/chapter-one/', STORY2 = 'assets/storybooks/chapter-two/', STORY3 = 'assets/storybooks/chapter-three/';
const ACTORS = {
  siang: { name: '原味小湘', src: characterSources(CHARACTERS['001'].image) },
  king: { name: '焦糖大王', src: ['assets/enemies/chapter-01/ch1-boss-caramel-king.webp'] },
  kingCry: { name: '焦糖大王', src: [`${STORY}king-shy.webp`] },
  mochi: { name: '偷吃鬼糰子', src: ['assets/enemies/chapter-01/ch1-01-mochi-thief.webp'] },
  sock: { name: '襪子遊俠', src: ['assets/enemies/chapter-01/ch1-02-sock-ranger.webp'] },
  bento: { name: '碎碎念便當盒', src: ['assets/enemies/chapter-01/ch1-03-nagging-bento.webp'] },
  dino: { name: '小恐龍', src: ['assets/mascot/dinosaur-idle.webp'] },
  thunder: { name: '雷雷大魔王', src: ['assets/enemies/chapter-02/ch2-boss-thunder-king.webp'] },
  thunderShy: { name: '雷雷大魔王', src: [`${STORY2}thunder-shy.webp`] },
  sneeze: { name: '噴嚏烏雲', src: ['assets/enemies/chapter-02/ch2-01-sneeze-cloud.webp'] },
  shadow: { name: '迷路影子', src: ['assets/enemies/chapter-02/ch2-02-lost-shadow.webp'] },
  mushroom: { name: '生氣蘑菇', src: ['assets/enemies/chapter-02/ch2-03-angry-mushroom.webp'] },
  director: { name: '歡笑總監', src: ['assets/enemies/chapter-03/ch3-boss-director-giggle.webp'] },
  directorConfused: { name: '歡笑總監', src: [`${STORY3}director-confused.webp`] },
  bunny: { name: '發條兔', src: ['assets/enemies/chapter-03/ch3-01-tick-tock-bunny.webp'] },
  gummy: { name: '軟糖熊', src: ['assets/enemies/chapter-03/ch3-02-glitch-gummy.webp'] },
  guard: { name: '八音盒衛兵', src: ['assets/enemies/chapter-03/ch3-03-melody-guard.webp'] },
};
const BG = {
  hall: `${STORY}hall.webp`, banquet: `${STORY}banquet.webp`, afterparty: `${STORY}afterparty.webp`,
  valley: `${STORY2}valley.webp`, heardYou: `${STORY2}heard-you.webp`, helping: `${STORY2}helping.webp`,
  seeYou: `${STORY2}see-you.webp`, welcomeHome: `${STORY2}welcome-home.webp`, aftermath: `${STORY2}bonus-aftermath.webp`,
  controlRoom: `${STORY3}control-room.webp`, oldSong: `${STORY3}old-song.webp`, listening: `${STORY3}listening.webp`, pudding: `${STORY3}pudding.webp`,
  party: `${STORY3}no-grades-party.webp`, happyTears: `${STORY3}happy-tears.webp`, laugh: `${STORY3}bonus-laugh.webp`,
};

export const EPILOGUES = {
  'caramel-king': {
    chapter: 1, title: '布丁失竊事件', subtitle: '尾聲・沒有寄出的布丁邀請函', next: '第二章《烏雲山谷》',
    beats: [
      { act: '王冠歪掉了', bg: 'hall', cam: [50, 60, 1], tone: 'hush', cast: [['kingCry', 'C']], text: '熱鬧的戰鬥結束，倉庫突然安靜下來。' },
      { text: '焦糖大王縮在布丁山旁，王冠晃了一下——掉到眼睛前面。', fx: { kingCry: 'droop' } },
      { who: 'kingCry', text: '「……本王沒有哭，是焦糖流進眼睛了。」' },
      { act: '黏住的祕密', tone: '', cast: [['siang', 'L'], ['kingCry', 'R']], text: '小湘撿起一疊邀請卡，輕輕一拉——', prop: 'cards' },
      { text: '整串卡片黏在一起，連大王都被拖了過去！', prop: 'cards', fx: { kingCry: 'pulled' } },
      { who: 'siang', text: '「一張、兩張、三張……欸？大王也黏上來了！」', prop: 'cards' },
      { who: 'kingCry', text: '「本王明明……每一張都有寫名字。」' },
      { act: '原來一直在等人', cast: [], tone: 'cool', cam: [18, 45, 1.8], pan: [78, 45, 1.8], text: '長桌旁的椅子都擺好了，湯匙也排得整整齊齊。' },
      { who: 'king', voice: true, cam: [55, 45, 1.35], text: '「可是，等到布丁都不冰了，也沒有人來。」' },
      { act: '這次，好好送出去', tone: '', cam: [50, 60, 1], cast: [['siang', 'L'], ['king', 'R']], text: '小湘陪牠把邀請卡一張張分開，也把偷來的點心還了回去。' },
      { cast: [['mochi', 'T1'], ['sock', 'T2'], ['bento', 'T3']], text: '襪子遊俠背起郵袋，糰子偷偷舉起手。', fx: { sock: 'hop' } },
      { who: 'mochi', text: '「我可以當試吃員！」', fx: { mochi: 'hop' } },
      { who: 'bento', text: '「你先當道歉員！」', fx: { bento: 'hop', mochi: 'shrink' } },
      { card: '幾天後……' },
      { act: '幾天後，王宮好吵', bg: 'banquet', cast: [], cam: [50, 40, 1.15], pan: [50, 50, 1], text: '原本空著的椅子坐滿了。湯匙碰杯，大家分著吃。' },
      { who: 'king', cam: [24, 40, 1.7], text: '「本王宣布——」' },
      { who: 'king', cam: [27, 42, 1.85], text: '「唔！……這個好吃。」', shake: true },
      { act: '還有一個位子', cam: [50, 96, 2], text: '焦糖大王把旁邊的椅子拉開，放上一支乾淨的湯匙。' },
      { who: 'king', cam: [50, 96, 2], pan: [50, 50, 1], text: '「……下次，你也要來喔。」' },
      { card: '片尾彩蛋', sub: '本王的那份呢？🍮' },
      { act: '本王的那份呢？', bg: 'afterparty', cam: [34, 100, 2.6], text: '桌上只剩一個空布丁杯。' },
      { bg: 'banquet', tone: 'blur', cam: [50, 50, 1.1], cast: [['dino', 'L'], ['king', 'R']], text: '焦糖大王看看杯子，又看看旁邊的小恐龍。' },
      { who: 'king', text: '「……本王記得，這裡還有一個布丁。」' },
      { text: '小恐龍搖搖頭，把湯匙慢慢藏到背後。', fx: { dino: 'shake' } },
      { text: '肚子卻很不爭氣地彈了一下。', fx: { dino: 'bounce' } },
      { who: 'dino', text: '「……嗝。」', fx: { dino: 'hop' } },
      { text: '焦糖大王沉默了兩秒。', hold: 1600 },
      { who: 'king', text: '「下次宴會……本王要先把你的那份裝成大碗的。」' },
      { text: '小恐龍的眼睛，瞬間亮了起來。', fx: { dino: 'sparkle' } },
      { bg: 'afterparty', tone: '', cast: [], cam: [50, 45, 1.12], pan: [50, 50, 1], stamp: '第一章・完' },
    ],
  },
  'thunder-king': {
    chapter: 2, title: '烏雲山谷', subtitle: '尾聲・小聲一點，也聽得見', next: '第三章《故障的玩具星球》',
    beats: [
      { act: '最後一聲雷', bg: 'valley', cam: [50, 55, 1], tone: 'storm', cast: [['thunderShy', 'C']], text: '最後一道閃電熄滅。', flash: 'big' },
      { text: '雷雷大魔王的閃電瀏海軟軟垂下，連披風都不蓬鬆了。', fx: { thunderShy: 'droop' } },
      { cast: [], cam: [22, 45, 1.6], text: '牠偷偷看向吊橋。' },
      { cam: [50, 55, 1], cast: [['siang', 'L'], ['thunderShy', 'R']], text: '小湘才剛轉身，牠就急忙往前飄了一點。', fx: { thunderShy: 'lean' } },
      { who: 'thunderShy', text: '「你、你們……」', fx: { thunderShy: 'lean' } },
      { who: 'thunderShy', text: '「不會就這樣走掉吧？」' },
      { act: '原來，牠一直在看橋', tone: '', text: '小湘停下腳步。雷雷大魔王低頭搓著兩隻雲拳。', fx: { thunderShy: 'fidget' } },
      { who: 'thunderShy', voice: true, cast: [], cam: [20, 44, 1.7], pan: [32, 46, 1.7], text: '「以前，吊橋每天都會晃。」' },
      { who: 'thunderShy', voice: true, text: '「有人來野餐，有人躲雨……還有人會坐在那邊，陪本王看夕陽。」' },
      { cam: [80, 42, 1.9], tone: 'cool', text: '牠指向岩台旁一塊平平的石頭。上面積著幾片沒有人坐過的落葉。' },
      { who: 'thunderShy', voice: true, text: '「後來這裡安靜了。」' },
      { who: 'thunderShy', tone: '', cam: [50, 55, 1], cast: [['siang', 'L'], ['thunderShy', 'R']], text: '「本王想說……再大聲一點，總會有人聽見吧。」' },
      { act: '這麼近，聽得見的', bg: 'heardYou', cast: [], cam: [57, 30, 1.6], pan: [50, 45, 1.05], text: '小湘走近，替牠扶正歪掉的皇冠。' },
      { who: 'siang', cam: [30, 46, 1.5], text: '「可是你雷打得那麼大，大家都以為你在生氣耶。」' },
      { cam: [65, 44, 1.8], text: '雷雷大魔王愣住。' },
      { who: 'thunder', text: '「……本王看起來，很兇嗎？」' },
      { bg: 'valley', cam: [50, 55, 1], cast: [['sneeze', 'T1'], ['shadow', 'T2'], ['mushroom', 'T3']], text: '後面的三位小怪，同時點了一下頭。', fx: { sneeze: 'nod', shadow: 'nod', mushroom: 'nod' } },
      { cast: [['siang', 'L'], ['thunderShy', 'R']], text: '牠的雲角瞬間垂得更低。小湘忍住笑。', fx: { thunderShy: 'droop' } },
      { who: 'siang', bg: 'heardYou', cast: [], cam: [45, 45, 1.25], text: '「你現在想說什麼？」' },
      { text: '沉默了一會兒。', hold: 1400 },
      { who: 'thunder', voice: true, cam: [65, 44, 1.7], text: '「……想找你們玩。」' },
      { who: 'siang', cam: [40, 44, 1.4], pan: [50, 50, 1], text: '「嗯，聽見了。」' },
      { act: '山谷重新開門', bg: 'helping', cam: [40, 22, 1.9], text: '噴嚏烏雲遞來一條乾淨手帕。' },
      { cam: [47, 90, 1.8], text: '迷路影子蹲在地上，把吊橋和入口畫進新地圖。' },
      { cam: [97, 50, 1.8], prop: 'sign', sign: ['歡迎來玩。'], text: '生氣蘑菇則抱來一塊木牌，認真掛好：「歡迎來玩。」' },
      { prop: 'sign', sign: ['歡迎來玩。', '請勿踩菇。'], text: '想了想，牠又補上一行：「請勿踩菇。」' },
      { cam: [76, 18, 1.8], prop: 'sign', sign: ['歡迎來玩。', '請勿踩菇。'], text: '雷雷大魔王看著大家忙進忙出，幾次張開嘴，又不好意思地閉上。' },
      { who: 'thunder', voice: true, prop: 'sign', sign: ['歡迎來玩。', '請勿踩菇。'], cam: [60, 45, 1.1], text: '最後只小小聲地說：「那個……謝謝。」' },
      { prop: 'sign', sign: ['歡迎來玩。', '請勿踩菇。'], pan: [50, 50, 1], text: '這一次，大家都聽見了。' },
      { act: '今天先說再見', bg: 'seeYou', tone: 'sunset', cam: [50, 45, 1.15], pan: [50, 50, 1], text: '夕陽照進山谷，大家準備回家。' },
      { cam: [70, 40, 1.8], text: '雷雷大魔王一路送到吊橋前，披風的小角偷偷勾著欄杆。' },
      { who: 'thunder', text: '「那、那下次來的時候……」' },
      { who: 'siang', cam: [25, 40, 1.7], text: '「會先跟你打招呼的。」' },
      { bg: 'valley', cam: [50, 55, 1], cast: [['siang', 'L'], ['thunder', 'R']], text: '牠立刻挺起胸口。', fx: { thunder: 'puff' } },
      { who: 'thunder', text: '「本王才沒有在等！」', fx: { thunder: 'hop' } },
      { text: '停了一下。', hold: 1200 },
      { who: 'thunderShy', cast: [['siang', 'L'], ['thunderShy', 'R']], text: '「……不過，那塊看夕陽的石頭，本王會擦乾淨。」' },
      { card: '幾天後……' },
      { act: '很小聲的歡迎', tone: '', cast: [], cam: [22, 45, 1.6], pan: [26, 47, 1.6], text: '幾天後，吊橋又輕輕晃了起來。' },
      { who: 'siang', voice: true, text: '「雷雷，我們來了！」' },
      { cam: [50, 55, 1], cast: [['thunder', 'P']], text: '岩台後面，立刻冒出一小撮金色閃電。接著是一頂差點戴反的皇冠。', fx: { thunder: 'peek' } },
      { text: '山谷裡響起一聲很輕、很輕的雷。', flash: 'soft' },
      { who: 'thunder', voice: true, text: '「轟隆。」' },
      { who: 'siang', cast: [['siang', 'L'], ['thunder', 'R']], text: '「嗯，我們回來了。」' },
      { bg: 'welcomeHome', cast: [], cam: [50, 42, 1.15], pan: [50, 50, 1], text: '大家坐在擦乾淨的石頭旁。雷雷大魔王努力把披風攤大一點，讓每個人都有地方坐。' },
      { card: '這一天，雷聲很小。', sub: '回應牠的聲音，卻有好多個。', over: true },
      { card: '片尾彩蛋', sub: '音量調好了……大概 ⛈' },
      { act: '音量調好了……大概', bg: 'valley', cam: [62, 70, 1.25], cast: [['thunder', 'C']], text: '雷雷大魔王對著小水窪，練習打招呼。' },
      { who: 'thunder', text: '「歡迎回來。」' },
      { text: '一聲小小的雷。', flash: 'soft' },
      { who: 'thunder', text: '「很好。自然、穩重，非常有王者風範。」', fx: { thunder: 'puff' } },
      { who: 'dino', voice: true, text: '遠處傳來小恐龍的聲音：「雷雷——我們帶點心來了！」' },
      { who: 'thunder', text: '「你們真的又來了！！！！」', fx: { thunder: 'hop' } },
      { card: '轟——隆——！！！！', boom: true },
      { bg: 'aftermath', cast: [], cam: [18, 67, 1.8], pan: [62, 55, 1.05], text: '再亮起時，小湘的頭髮蓬成一團，迷路影子的地圖貼在臉上，生氣蘑菇正用兩隻小手死死按住帽子。' },
      { cam: [53, 22, 1.7], text: '雷雷大魔王慢慢縮小。' },
      { who: 'thunder', text: '「……本王只是太開心了。」' },
      { who: 'mushroom', cam: [78, 53, 1.8], text: '「我知道！！但你先救一下我的帽子！！」', shake: true },
      { who: 'dino', cam: [80, 72, 1.8], text: '小恐龍從點心籃裡探出頭：「所以……今天也在這裡吃嗎？」' },
      { cam: [53, 22, 1.7], text: '雷雷大魔王立刻點頭，又趕快捂住自己的嘴巴。從指縫漏出一聲小小的——' },
      { who: 'thunder', voice: true, text: '「轟隆♡」', flash: 'soft' },
      { cam: [50, 45, 1.12], pan: [50, 50, 1], stamp: '第二章・完' },
    ],
  },
  'director-giggle': {
    chapter: 3, title: '故障的玩具星球', subtitle: '尾聲・今天，可以不用笑', next: '第四章《花街無名帖》',
    beats: [
      { act: '笑臉停下來了', bg: 'controlRoom', tone: 'alarm', cam: [50, 50, 1], cast: [], screen: { lines: ['今日歡笑指數', '100%'] }, text: '控制室裡，最後一聲警報熄滅。' },
      { tone: '', cam: [80, 22, 1.7], screen: { lines: ['今日歡笑指數', '{n}%'], count: [100, 80, 60, 30, 0] }, text: '牆上的歡笑指數從百分之百，慢慢降到八十、六十、三十……' },
      { screen: { lines: ['今日歡笑指數', '0%'] }, text: '最後，停在零。' },
      { cam: [50, 45, 1.15], screen: { lines: ['「請保持微笑！☺」'], fade: true }, text: '「請保持微笑」的廣播，終於沒有再次響起。' },
      { cam: [50, 55, 1], cast: [['director', 'C']], text: '歡笑總監坐在地上，螢幕上的大笑臉閃了兩下——', fx: { director: 'flicker' } },
      { cast: [['directorConfused', 'C']], text: '變成兩個茫然的小圓點。' },
      { who: 'directorConfused', text: '「……怎麼辦。」' },
      { who: 'directorConfused', text: '「我是不是，把大家的快樂弄丟了？」', fx: { directorConfused: 'droop' } },
      { act: '那些被蓋成故障的心願', cast: [], cam: [80, 22, 1.7], screen: { lines: ['工作紀錄', '異常情緒修復'] }, text: '牠翻開工作紀錄。' },
      { screen: { lines: ['發條兔：', '我好累。'] }, text: '「發條兔：我好累。」' },
      { screen: { lines: ['發條兔：', '我好累。'], stamp: '故障' }, text: '旁邊蓋著紅紅的「故障」。' },
      { screen: { lines: ['軟糖熊：', '我想念朋友。'], stamp: '故障' }, text: '「軟糖熊：我想念朋友。」也是故障。' },
      { screen: { lines: ['八音盒衛兵：', '我想唱自己的歌。'], stamp: '故障' }, text: '「八音盒衛兵：我想唱自己的歌。」還是故障。' },
      { cam: [50, 55, 1], cast: [['directorConfused', 'C']], text: '總監的手慢慢停住。' },
      { who: 'directorConfused', text: '「你們那時候……是在跟我求救嗎？」' },
      { cast: [['bunny', 'L'], ['directorConfused', 'R']], text: '發條兔低頭看著自己的腳。', fx: { bunny: 'droop' } },
      { who: 'bunny', text: '「我只是想問……可不可以先坐一下。」' },
      { act: '一首唱錯也沒關係的歌', bg: 'oldSong', cast: [], cam: [35, 55, 1.6], text: '小湘拿出那把金色鑰匙，輕輕碰上控制台。' },
      { prop: 'notes', text: '叮、叮——噹。一段有點舊、有點慢的旋律響起。' },
      { prop: 'notes', cam: [52, 42, 1.7], text: '八音盒衛兵小聲跟著哼，唱到一半，突然停住。' },
      { who: 'guard', text: '「對不起，我剛剛唱錯了。」' },
      { cam: [78, 62, 1.7], text: '歡笑總監抬起頭。' },
      { who: 'director', text: '「……以前唱到這裡，你也會唱錯。」' },
      { cam: [52, 40, 1.7], text: '衛兵緊張地抓住帽沿。' },
      { who: 'guard', text: '「然後呢？」' },
      { who: 'director', cam: [78, 62, 1.7], text: '「然後……我們就會笑著，再唱一次。」' },
      { prop: 'notes', cam: [78, 62, 1.7], pan: [50, 50, 1], text: '那時候，沒有人拿著評分表。' },
      { act: '這次，先聽你們說', bg: 'controlRoom', cam: [50, 55, 1], cast: [['directorConfused', 'C']], text: '總監低下頭。', fx: { directorConfused: 'droop' } },
      { who: 'directorConfused', text: '「對不起。」' },
      { who: 'directorConfused', text: '「我把你們想說的話，全都當成故障了。」' },
      { cast: [['gummy', 'L'], ['directorConfused', 'R']], text: '軟糖熊站在旁邊，猶豫了好久，才伸出兩隻小手。', fx: { gummy: 'fidget' } },
      { who: 'gummy', text: '「那……現在可以抱一下嗎？」' },
      { cast: [], cam: [80, 22, 1.7], screen: { lines: ['⚠ 未授權接觸'], alert: true }, text: '總監下意識看向控制台。螢幕上，還留著「未授權接觸」的舊提醒。' },
      { screen: { lines: ['⚠ 未授權接觸'], alert: true, fade: true }, text: '牠慢慢把提醒關掉。' },
      { who: 'director', bg: 'listening', cam: [72, 48, 1.5], text: '「可以。」' },
      { cam: [22, 32, 1.7], text: '發條兔終於靠著牆坐下。' },
      { prop: 'notes', cam: [22, 72, 1.7], text: '衛兵翻開自己偷偷寫的樂譜，輕聲哼唱。' },
      { prop: 'notes', text: '有一個音唱歪了。' },
      { prop: 'notes', cam: [22, 72, 1.7], pan: [50, 50, 1], text: '這一次，沒有警報響起。' },
      { act: '那你自己快樂嗎？', bg: 'pudding', cam: [72, 45, 1.5], text: '歡笑總監低頭看著停止閃爍的笑臉螢幕。' },
      { who: 'director', text: '「可是……我被製造出來，就是為了讓大家快樂。」' },
      { cam: [24, 42, 1.5], text: '小湘歪著頭想了一會兒。' },
      { who: 'siang', text: '「那你自己快樂嗎？」' },
      { who: 'director', cam: [72, 42, 1.7], text: '「……」', hold: 1400 },
      { text: '歡笑總監沒有立刻回答。' },
      { cam: [40, 58, 1.7], text: '小湘從口袋裡掏出一顆布丁，遞給他。' },
      { who: 'siang', cam: [40, 58, 1.7], pan: [50, 50, 1], text: '「不知道也沒關係呀。先一起吃布丁嘛！」' },
      { act: '不用交成績的派對', bg: 'party', cam: [50, 45, 1.15], pan: [50, 50, 1], text: '那天，玩具星球第一次出現了沒有笑臉的慶祝派對。' },
      { text: '有玩具在哭、有玩具在發呆，也有玩具開心得滿地打滾。' },
      { cam: [55, 42, 1.4], text: '而歡笑總監第一次學會：' },
      { card: '不必永遠開心，', sub: '也能被好好愛著。', over: true },
      { card: '片尾彩蛋', sub: '今天學會哭哭了 (´；ω；｀)' },
      { act: '今天學會哭哭了', bg: 'controlRoom', cam: [50, 55, 1], cast: [['siang', 'L'], ['director', 'R']], who: 'director', text: '「小湘！小湘！我今天學會新表情了！」', fx: { director: 'hop' } },
      { text: '歡笑總監興奮地跑過來。螢幕慢慢變成——' },
      { bg: 'happyTears', cast: [], cam: [66, 36, 1.9], text: '(´；ω；｀)' },
      { who: 'director', text: '「你看！我現在可以哭哭了！」' },
      { cam: [28, 42, 1.5], text: '小湘蹲下來。' },
      { who: 'siang', text: '「可是，你為什麼哭呀？」' },
      { cam: [45, 86, 1.8], text: '總監小心翼翼展開一張畫。上面是幾個歪歪的小圓圈，圍著一顆畫得特別大的布丁。' },
      { who: 'director', text: '「發條兔送我的。」' },
      { who: 'director', text: '「牠說，這是我們那天一起吃布丁的樣子。」' },
      { cam: [66, 38, 1.7], text: '牠摸摸螢幕。' },
      { who: 'director', text: '「我覺得好幸福，所以就哭了耶。」' },
      { who: 'director', text: '「……這樣也算快樂嗎？」' },
      { cam: [50, 50, 1], text: '小湘笑著抱住牠。' },
      { who: 'siang', text: '「當然算呀！」' },
      { bg: 'laugh', cam: [40, 92, 2], text: '就在這時，小恐龍抱著手帕衝過來，認真擦了兩下螢幕。' },
      { who: 'dino', text: '「咦？怎麼擦不掉？」' },
      { bg: 'happyTears', cam: [66, 36, 1.9], text: '總監愣住。' },
      { who: 'director', text: '「那、那是我的表情啦！」' },
      { bg: 'laugh', cam: [40, 92, 2], text: '小恐龍又擦了一下。' },
      { who: 'director', voice: true, text: '「等一下……好癢……哈哈哈哈！」', shake: true },
      { cam: [74, 70, 1.8], text: '螢幕突然變成：(≧▽≦)' },
      { who: 'bunny', cam: [16, 68, 1.8], text: '「欸！你又學會一個了！」' },
      { cam: [70, 45, 1.5], text: '總監看看自己的小手，又看看大家。' },
      { who: 'director', text: '「……這個，我沒有按設定耶。」' },
      { cam: [50, 45, 1.12], pan: [50, 50, 1], stamp: '第三章・完' },
    ],
  },
};
export const epilogueFor = (enemyId) => EPILOGUES[enemyId] || null;

// 把沿用規則展開成每一句完整的畫面設定（測試也用這個檢查）
export function resolveBeats(ep) {
  let cur = { bg: 'hall', cam: [50, 50, 1], cast: [], tone: '', act: '' }, pulled = false;
  return ep.beats.map((b) => {
    if (b.card) return { ...b, kind: 'card' };
    pulled = b.prop === 'cards' && (pulled || b.fx?.kingCry === 'pulled');
    cur = { ...cur, ...Object.fromEntries(['bg', 'cam', 'cast', 'tone', 'act'].filter((k) => k in b).map((k) => [k, b[k]])) };
    return { ...cur, kind: b.stamp ? 'stamp' : 'line', who: b.who || null, text: b.text || '', fx: b.fx || {}, prop: b.prop || null, sign: b.sign || null, screen: b.screen || null, flash: b.flash || null, pulled, pan: b.pan || null, voice: Boolean(b.voice), shake: Boolean(b.shake), hold: b.hold || 0, stamp: b.stamp || null, newAct: 'act' in b };
  });
}

const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };

export function createEpilogueTheater({ dialog, onActivity = () => {} }) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  dialog.innerHTML = `<div class="epi__stage" tabindex="0" aria-label="尾聲劇場，點一下看下一句">
    <div class="epi__cam"><img class="epi__bg" alt=""><div class="epi__sign" aria-hidden="true"></div><div class="epi__screen" aria-hidden="true"><div class="epi__screen-lines"></div><b class="epi__screen-stamp"></b></div></div>
    <div class="epi__notes" aria-hidden="true"><i>♪</i><i>♫</i><i>♪</i><i>♬</i></div>
    <div class="epi__cast"></div>
    <div class="epi__cards" aria-hidden="true">${'<i></i>'.repeat(6)}</div>
    <div class="epi__spark" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i></div>
    <div class="epi__bar"><span class="epi__chip"></span><button type="button" class="epi__btn" data-a="auto" aria-pressed="false">自動</button><button type="button" class="epi__btn" data-a="log">紀錄</button><button type="button" class="epi__btn" data-a="skip">跳過</button><button type="button" class="epi__btn epi__close" data-a="close" aria-label="關閉尾聲劇場">×</button></div>
    <div class="epi__act" aria-hidden="true"></div>
    <div class="epi__box" role="status" aria-live="polite"><span class="epi__name"></span><p class="epi__text"></p><span class="epi__count"></span><span class="epi__hint">點一下 ▼</span></div>
    <div class="epi__card"><b></b><small></small></div>
    <div class="epi__stamp"></div>
    <div class="epi__log" hidden><button type="button" class="epi__btn epi__close" data-a="log-close">關閉</button><h3 id="epilogue-log-title">對話紀錄</h3><div class="epi__log-list"></div></div>
    <div class="epi__end" hidden><div class="epi__end-card"><small></small><h2 id="epilogue-title"></h2><p>這段故事收進「咕咕的故事檔案館」的討伐故事，隨時可以重看。</p><div class="epi__unlock"></div><div class="epi__end-row"><button type="button" class="btn btn--quiet" data-a="again">再看一次</button><button type="button" class="btn" data-a="close">收下</button></div></div></div>
  </div>`;
  dialog.setAttribute('aria-labelledby', 'epilogue-title');
  const q = (s) => dialog.querySelector(s);
  const stage = q('.epi__stage'), bg = q('.epi__bg'), cam = q('.epi__cam'), castBox = q('.epi__cast'), box = q('.epi__box'), text = q('.epi__text');
  const actors = {};
  for (const [key, a] of Object.entries(ACTORS)) {
    const node = el('div', 'epi__actor is-out'); node.dataset.key = key;
    const img = el('img'); img.alt = a.name; img.decoding = 'async'; node.append(img); castBox.append(node); actors[key] = { node, img, loaded: false };
  }
  let ep = null, beats = [], index = 0, typing = null, autoTimer = null, auto = false, full = '', panTimer = null;

  let countTimer = null;
  const stopTimers = () => { clearInterval(typing); typing = null; clearTimeout(autoTimer); autoTimer = null; clearTimeout(panTimer); clearInterval(countTimer); };
  function renderScreen(sc) {
    const box = q('.epi__screen'), lines = q('.epi__screen-lines');
    box.hidden = !sc; if (!sc) return;
    box.className = `epi__screen${sc.alert ? ' is-alert' : ''}${sc.fade ? ' is-fade' : ''}`;
    q('.epi__screen-stamp').textContent = sc.stamp || '';
    const draw = (n) => lines.replaceChildren(...sc.lines.map((t) => el('span', '', t.replace('{n}', n))));
    if (!sc.count || reduced.matches) return draw(sc.count ? sc.count.at(-1) : '');
    let k = 0; draw(sc.count[0]);
    countTimer = setInterval(() => { k += 1; draw(sc.count[Math.min(k, sc.count.length - 1)]); if (k >= sc.count.length - 1) clearInterval(countTimer); }, 650);
  }
  function setCam([x, y, z], ms) {
    cam.style.transitionDuration = reduced.matches ? '0s' : `${ms}ms`;
    cam.style.transformOrigin = `${x}% ${y}%`; cam.style.transform = `scale(${z})`;
  }
  function render() {
    stopTimers();
    const b = beats[index]; const prev = beats[index - 1];
    stage.dataset.kind = b.kind; stage.dataset.step = String(index);
    q('.epi__count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(beats.length).padStart(2, '0')}`;
    if (b.kind === 'card') {
      q('.epi__card b').textContent = b.card; q('.epi__card small').textContent = b.sub || '';
      stage.dataset.card = b.boom ? 'boom' : b.over ? 'over' : '';
      stage.classList.remove('is-shake'); if (b.boom && !reduced.matches) { void stage.offsetWidth; stage.classList.add('is-shake'); }
      full = ''; return finishLine(1800);
    }
    if (!bg.src.endsWith(BG[b.bg])) bg.src = BG[b.bg];
    stage.dataset.tone = b.tone || '';
    const camMs = !prev || prev.kind === 'card' || prev.bg !== b.bg ? 0 : 1600;
    setCam(b.cam, camMs);
    if (b.pan && !reduced.matches) { void cam.offsetWidth; panTimer = setTimeout(() => setCam(b.pan, 5200), camMs ? camMs : 60); }
    q('.epi__chip').textContent = b.act || ep.title;
    if (b.newAct && !reduced.matches) { const act = q('.epi__act'); act.textContent = b.act; act.classList.remove('is-on'); void act.offsetWidth; act.classList.add('is-on'); }
    const onStage = new Map(b.cast);
    for (const [key, a] of Object.entries(actors)) {
      const slot = onStage.get(key);
      if (slot && !a.loaded) { loadWithFallback(a.img, ACTORS[key].src); a.loaded = true; }
      a.node.className = `epi__actor${slot ? ` is-${slot}` : ' is-out'}${b.who && slot && key !== b.who ? ' is-dim' : ''}${key === b.who ? ' is-on' : ''}`;
      const fx = b.fx[key];
      if (slot && fx && !reduced.matches) { void a.node.offsetWidth; a.node.classList.add(`fx-${fx}`); }
      else if (slot && fx) a.node.classList.add(`fx-${fx}-end`);
    }
    stage.classList.toggle('has-cards', b.prop === 'cards');
    stage.classList.toggle('has-notes', b.prop === 'notes'); renderScreen(b.screen);
    stage.classList.toggle('has-sign', b.prop === 'sign'); q('.epi__sign').replaceChildren(...(b.sign || []).map((t) => el('span', '', t)));
    stage.dataset.flash = ''; if (b.flash && !reduced.matches) { void stage.offsetWidth; stage.dataset.flash = b.flash; }
    stage.classList.toggle('is-pulled', b.pulled);
    stage.classList.toggle('has-spark', b.fx.dino === 'sparkle');
    stage.classList.remove('is-shake'); if (b.shake && !reduced.matches) { void stage.offsetWidth; stage.classList.add('is-shake'); }
    if (b.kind === 'stamp') { q('.epi__stamp').textContent = b.stamp; full = ''; return finishLine(2600); }
    const who = b.who ? ACTORS[b.who].name : '';
    q('.epi__name').textContent = who; box.classList.toggle('is-narration', !who); box.classList.toggle('is-voice', b.voice);
    full = b.text; type(b.hold);
  }
  function type(hold = 0) {
    if (reduced.matches) { text.textContent = full; return finishLine(hold); }
    let n = 0; text.textContent = ''; q('.epi__hint').hidden = true;
    typing = setInterval(() => { n += 1; text.textContent = full.slice(0, n); if (n >= full.length) { clearInterval(typing); typing = null; finishLine(hold); } }, 42);
  }
  function finishLine(hold = 0) {
    q('.epi__hint').hidden = false;
    if (auto && !document.hidden && q('.epi__log').hidden) autoTimer = setTimeout(next, 1300 + full.length * 55 + hold);
  }
  function next() {
    if (!q('.epi__end').hidden) return;
    if (typing) { clearInterval(typing); typing = null; text.textContent = full; finishLine(beats[index].hold); return; }
    if (index + 1 >= beats.length) return showEnd();
    index += 1; render(); onActivity();
  }
  function showEnd() {
    stopTimers(); const b = beats[beats.length - 1];
    if (beats[index] !== b) { index = beats.length - 1; render(); stopTimers(); }
    stage.dataset.kind = 'end'; q('.epi__end').hidden = false;
    q('.epi__end small').textContent = `CHAPTER ${ep.chapter} CLEAR`;
    q('#epilogue-title').textContent = `第${'一二三四五六七八九十'[ep.chapter - 1] || ep.chapter}章《${ep.title}》・完`;
    q('.epi__unlock').textContent = ep.next ? `下一章：${ep.next}` : ''; q('.epi__unlock').hidden = !ep.next;
    q('.epi__end .btn:not(.btn--quiet)').focus({ preventScroll: true });
  }
  function openLog() {
    stopTimers();
    q('.epi__log-list').replaceChildren(...beats.slice(0, index + 1).filter((b) => b.text).map((b) => { const p = el('p'); if (b.who) p.append(el('b', '', ACTORS[b.who].name)); p.append(b.text); return p; }));
    q('.epi__log').hidden = false; q('.epi__log [data-a="log-close"]').focus({ preventScroll: true });
  }
  function play(enemyId) {
    ep = epilogueFor(enemyId); if (!ep) return false;
    beats = resolveBeats(ep); index = 0; auto = false; q('[data-a="auto"]').setAttribute('aria-pressed', 'false');
    q('.epi__end').hidden = true; q('.epi__log').hidden = true; stage.dataset.chapter = String(ep.chapter);
    if (!dialog.open) dialog.showModal();
    render(); stage.focus({ preventScroll: true }); onActivity();
    return true;
  }
  stage.addEventListener('click', (e) => {
    const act = e.target.closest('[data-a]')?.dataset.a;
    if (act === 'auto') { auto = !auto; e.target.setAttribute('aria-pressed', String(auto)); clearTimeout(autoTimer); if (auto && !typing) finishLine(); return; }
    if (act === 'log') return openLog();
    if (act === 'log-close') { q('.epi__log').hidden = true; stage.focus({ preventScroll: true }); return finishLine(); }
    if (act === 'skip') return showEnd();
    if (act === 'again') return play(Object.keys(EPILOGUES).find((k) => EPILOGUES[k] === ep));
    if (act === 'close') return dialog.close();
    if (e.target.closest('button,.epi__log,.epi__end')) return;
    next();
  });
  stage.addEventListener('keydown', (e) => { if (e.target === stage && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight')) { e.preventDefault(); next(); } });
  dialog.addEventListener('close', () => { stopTimers(); onActivity(); });
  document.addEventListener('visibilitychange', () => { if (!dialog.open) return; if (document.hidden) clearTimeout(autoTimer); else if (!typing) finishLine(); });
  return { play, has: (id) => Boolean(epilogueFor(id)) };
}
