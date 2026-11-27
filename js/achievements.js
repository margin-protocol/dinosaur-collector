import { worldOf } from './eggs.js';
import { levelOf, MAX_LEVEL } from './affection.js';
import { inkCount, INKS } from './studio-jh.js';
import { siangMailCount } from './letters.js';
import { MAIN_ISLAND } from './geo.js';
import { sideOn, stageWon, lineCleared, MAIN_COUNTY, hasFeat, lineRan } from './side.js';
import { CHARACTERS as SIDE_CHARS } from './eggs.js';
const ANIMAL_ALL = Object.keys(SIDE_CHARS).filter((no) => SIDE_CHARS[no].series === 'animals' && !SIDE_CHARS[no].sidePreview && no !== '119'); // 企劃定 14 位；通關送的 119 不算
import { dishById, recipesFound, secretsFound } from './kitchen.js';
const darkDish = (id) => dishById(id)?.dark;
// 成就：由進度直接推算是否達成；領取獎勵的紀錄存在 state.achievements.claimed
const dexCount = (s) => Object.keys(s.dex || {}).length;
const originNos = (chars) => Object.values(chars).filter((c) => worldOf(c) === 'origin').map((c) => c.no);
const rarityOwned = (s, chars, r) => Object.keys(s.dex || {}).some((no) => chars[no]?.rarity === r);
const seriesDone = (s, chars) => {
  const by = {};
  for (const c of Object.values(chars)) (by[c.series] ||= []).push(c.no);
  return Object.values(by).filter((list) => list.every((no) => s.dex?.[no])).length;
};
const t = (s, k) => s.bonus?.total?.[k] || 0;
export const TSUKIMI = ['110', '111', '112', '113', '114'];
export const LAW_TI = ['115', '116'];

export const ACHIEVEMENT_GROUPS = ['孵化', '收藏', '願望', '旅行', '陪伴', '廚房', '隱藏'];
export const ACHIEVEMENTS = [
  { id: 'hatch-1', group: '孵化', title: '初次破殼', hint: '孵化 1 顆蛋', goal: 1, value: (s) => s.hatched || 0, reward: 20 },
  { id: 'hatch-10', group: '孵化', title: '熟練的飼養員', hint: '孵化 10 顆蛋', goal: 10, value: (s) => s.hatched || 0, reward: 40 },
  { id: 'hatch-30', group: '孵化', title: '孵化室常客', hint: '孵化 30 顆蛋', goal: 30, value: (s) => s.hatched || 0, reward: 60 },
  { id: 'hatch-100', group: '孵化', title: '傳說中的飼養員', hint: '孵化 100 顆蛋', goal: 100, value: (s) => s.hatched || 0, reward: 100 },
  { id: 'dex-10', group: '收藏', title: '小小收藏家', hint: '收集 10 位小湘', goal: 10, value: dexCount, reward: 30 },
  { id: 'dex-30', group: '收藏', title: '收藏家', hint: '收集 30 位小湘', goal: 30, value: dexCount, reward: 60 },
  // 湘 11/25：全圖鑑只算創始系列（異世限定居民活動結束後拿不到，不算進來；異世另外有自己的收藏成就）
  { id: 'dex-all', group: '收藏', title: '全圖鑑', hint: '收集所有創始系列的小湘', goal: (s, chars) => originNos(chars).length, value: (s, chars) => originNos(chars).filter((no) => s.dex?.[no]).length, reward: 200 },
  { id: 'series-1', group: '收藏', title: '整套收藏', hint: '集滿任何一個系列', goal: 1, value: seriesDone, reward: 50 },
  { id: 'ssr', group: '收藏', title: '閃閃發光', hint: '遇見一位 SSR 小湘', goal: 1, value: (s, c) => (rarityOwned(s, c, 'SSR') ? 1 : 0), reward: 50 },
  { id: 'ur', group: '收藏', title: '奇蹟', hint: '遇見一位 UR 小湘', goal: 1, value: (s, c) => (rarityOwned(s, c, 'UR') ? 1 : 0), reward: 100 },
  // 月見町花街五階集齊（湘 11/21）：限定稱號＋共同事件《月見町的最後一盞燈》，領取時播放、之後點成就可重看
  { id: 'tsukimi-5', group: '收藏', title: '月見町的五朵花', hint: '集齊月見町系列的五位小湘', goal: 5, value: (s) => TSUKIMI.filter((no) => s.dex?.[no]).length, reward: 100,
    storyTitle: '月見町的最後一盞燈', storyArt: 'siang-114-oiran', story: "禿小湘：「花魁大人！！！！點心來了！！」\n番頭新造小湘：「等一下！妳先確認數量！！」\n太鼓新造小湘：「咚咚咚！！開宴啦！！」\n振袖新造小湘：「請大家先站好位置……」\n花魁小湘：「……呵呵。今日也真是熱鬧呢。」\n月見町一年一度的夜宴即將開始。禿小湘負責跑腿，番頭新造小湘負責安排，太鼓新造小湘負責演奏，振袖新造小湘負責舞蹈，花魁小湘則主持最後一場表演。\n所有人都非常忙碌。直到宴席結束，月見町的燈籠慢慢熄滅，五隻小湘終於坐在一起。\n禿小湘累得趴在桌上。番頭新造小湘闔上工作冊。太鼓新造小湘抱著鼓棒打哈欠。振袖新造小湘慢慢鬆開髮飾。花魁小湘則替大家倒了一杯茶。\n「今日辛苦了。」\n五隻小湘安靜了一會兒，然後突然一起笑了。\n因為她們發現，原來月見町最美好的時刻，不一定是燈火最明亮、宴席最熱鬧的時候。也可能是所有人終於卸下工作，坐在一起，好好休息的那一刻。" },
  // 十五年友情・法律ㄊㄧ雙人組（湘 11/21）：同時擁有律師ㄊㄧ與檢察官ㄊㄧ → 限定稱號＋收藏事件，領取時播放、之後點成就可重看
  { id: 'law-ti-2', group: '收藏', title: '十五年，證據確鑿', hint: '同時擁有小湘 × 律師ㄊㄧ和小湘 × 檢察官ㄊㄧ', goal: 2, value: (s) => LAW_TI.filter((no) => s.dex?.[no]).length, reward: 60,
    storyTitle: '十五年，證據確鑿', storyArt: 'siang-116-prosecutor-ti', storyOk: '繼續當朋友', story: "律師ㄊㄧ：「每個人都值得被好好聽見。」\n檢察官ㄊㄧ：「每件事情都應該以證據確認。」\n小湘：「所以你們的意思是……」\n兩隻ㄊㄧ：「妳先把事情講清楚。」\n小湘：「怎麼兩邊都在唸我啦啊啊啊啊！！！！」\n今天，小湘突然在培養架上開了一場奇怪的會議。桌上放著兩份文件。一份叫做《十五年友情存續證明》，另一份叫做《未來友情合作協議》。\nㄊㄧ看著桌上的文件，沉默了。「……這是什麼？」\n小湘非常認真地回答：「我想說我們認識十五年了耶！！應該要有個正式紀念吧？！」\nㄊㄧ翻開第一份文件。裡面寫著：「第一條：認識很久了。第二條：以後也要繼續當朋友。第三條：必要時可以互相吐槽。第四條：即使意見不同，也要好好說話。」\nㄊㄧ看完，沉默了很久。「……妳還真的寫了。」\n小湘有點不好意思。「嘿嘿……因為我覺得十五年很厲害嘛。其實我知道啦，我們不用簽這個，也還是朋友。只是……我想留一個紀念。」\nㄊㄧ看著她，最後拿起筆，在文件最下面簽了名。\n「……欸？！你真的簽了？！」\nㄊㄧ把文件還給她。「嗯。留紀念啊。」\n小湘安靜了一下，然後突然笑得非常開心。「ㄊㄧ！！！！！你最好了啦！！！！！」\nㄊㄧ立刻把文件抬高。「等一下，妳不要把飲料打翻。」\n「喔喔喔！！好！！」\n小湘把文件收進收藏冊，非常珍惜地放好。那天晚上，培養架多出了一張紀念卡。正面畫著小湘與ㄊㄧ，背面寫著：\n「十五年不是期限，是我們一起走過的時間。至於未來，繼續當朋友就好。」" },
  // 法官ㄊㄧ（120，湘 11/27）好感 Lv.5 → 隱藏成就＋稱號，領取時播放、之後點成就可重看
  { id: 'judge-ti-15', group: '隱藏', title: '十五年，不接受上訴', hint: '？？？', reveal: '法官ㄊㄧ的好感到 Lv.5', goal: 1, value: (s) => (s.dex?.['120'] && levelOf(s.affection?.['120']?.pts || 0) >= MAX_LEVEL ? 1 : 0), reward: 100, secret: true,
    storyTitle: '十五年，不接受上訴', storyArt: 'siang-120-judge-ti', storyOk: '不得再行上訴', story: "不是所有長久的關係都需要一份契約。\n有些人只是走著走著，就陪彼此走過了半個人生。\n\n法官ㄊㄧ：「認識你十五年，倒也沒什麼好後悔的。只是下一個十五年，麻煩稍微正常一點。」" },
  { id: 'wish-10', group: '願望', title: '願望實現者', hint: '完成 10 個每日願望', goal: 10, value: (s) => s.player?.stats?.wishes || 0, reward: 30 },
  { id: 'wish-50', group: '願望', title: '願望守護者', hint: '完成 50 個每日願望', goal: 50, value: (s) => s.player?.stats?.wishes || 0, reward: 60 },
  { id: 'wish-days-7', group: '願望', title: '七天的約定', hint: '在 7 個不同的日子完成全部三個願望（不必連續）', goal: 7, value: (s) => s.wishEgg?.days?.length || 0, reward: 60 },
  { id: 'snap-30', group: '願望', title: '生活觀察家', hint: '隨手收藏 30 張照片', goal: 30, value: (s) => t(s, 'snaps'), reward: 40 },
  { id: 'travel-1', group: '旅行', title: '出發！', hint: '第一次探索', goal: 1, value: (s) => Object.keys(s.travel?.visits || {}).length, reward: 20 },
  { id: 'travel-5', group: '旅行', title: '小旅行', hint: '探索 5 個地方', goal: 5, value: (s) => Object.keys(s.travel?.visits || {}).length, reward: 50 },
  { id: 'travel-19', group: '旅行', title: '環島', hint: '探索本島 19 個縣市', goal: 19, value: (s) => Object.keys(s.travel?.visits || {}).filter((k) => MAIN_ISLAND.has(k)).length, reward: 150 },
  { id: 'rain', group: '旅行', title: '雨中漫步', hint: '在下雨天撿到天氣蛋', goal: 1, value: (s) => (s.weather?.rained && s.weather.granted === s.weather.rained ? 1 : 0), reward: 30 },
  { id: 'island', group: '旅行', title: '出海', hint: '去一趟綠島', goal: 1, value: (s) => (s.travel?.visits?.['綠島'] ? 1 : 0), reward: 50 },
  { id: 'island-hop', group: '旅行', title: '跳島', hint: '澎湖、金門、馬祖都去過', goal: 3, value: (s) => ['澎湖縣', '金門縣', '連江縣'].filter((k) => s.travel?.visits?.[k]).length, reward: 100 },
  { id: 'pet-30', group: '陪伴', title: '摸頭大師', hint: '摸摸頭 30 次', goal: 30, value: (s) => t(s, 'pets'), reward: 30 },
  { id: 'snack-20', group: '陪伴', title: '布丁時間', hint: '餵小湘 20 次布丁', goal: 20, value: (s) => t(s, 'snacks'), reward: 30 },
  { id: 'greet-30', group: '陪伴', title: '打招呼', hint: '跟小湘打招呼 30 次', goal: 30, value: (s) => t(s, 'greets'), reward: 30 },
  { id: 'task-10', group: '陪伴', title: '小恐龍的好朋友', hint: '完成 10 個小恐龍的委託', goal: 10, value: (s) => t(s, 'tasks'), reward: 40 },
  { id: 'cook-dark', group: '廚房', title: '勇氣可嘉', hint: '第一次煮出黑暗料理', goal: 1, value: (s) => Object.keys(s.kitchen?.known || {}).filter((id) => darkDish(id)).length, reward: 20 },
  { id: 'cook-recipes', group: '廚房', title: '小湘的私房菜', hint: '做出全部 8 道特色料理', goal: 8, value: (s) => recipesFound(s), reward: 80 },
  { id: 'cook-secrets', group: '廚房', title: '懂她的胃', hint: '找到 10 位小湘的秘密最愛', goal: 10, value: (s) => secretsFound(s), reward: 80 },
  { id: 'cook-dark-30', group: '廚房', title: '黑暗料理界的傳說', hint: '餵小湘吃 30 次黑暗料理', goal: 30, value: (s) => s.kitchen?.darkFed || 0, reward: 50 },
  { id: 'unlucky-10', group: '收藏', title: '希望尚存', hint: '累計孵到重複的小湘 10 次（普通非酋小湘會來找你）', goal: 10, value: (s) => s.dupTotal || 0, reward: 30 },
  { id: 'unlucky-50', group: '收藏', title: '希望崩塌', hint: '累計孵到重複的小湘 50 次（中級非酋小湘會來找你）', goal: 50, value: (s) => s.dupTotal || 0, reward: 60 },
  { id: 'unlucky-100', group: '收藏', title: '非酋之道', hint: '累計孵到重複的小湘 100 次（究級非酋小湘會來找你）', goal: 100, value: (s) => s.dupTotal || 0, reward: 100 },
  { id: 'unlucky-title-1', group: '收藏', title: '再一顆就好', hint: '迎接普通非酋小湘', goal: 1, value: (s) => (s.dex?.['101'] ? 1 : 0), reward: 10 },
  { id: 'unlucky-title-2', group: '收藏', title: '我真的有那麼非嗎', hint: '迎接中級非酋小湘', goal: 1, value: (s) => (s.dex?.['102'] ? 1 : 0), reward: 20 },
  { id: 'lucky-10', group: '收藏', title: '幸運萌芽', hint: '一般的蛋累計孵到新朋友 10 次（普通歐皇小湘會來找你）', goal: 10, value: (s) => s.newTotal || 0, reward: 30 },
  { id: 'lucky-50', group: '收藏', title: '歐氣爆發', hint: '一般的蛋累計孵到新朋友 30 次（中級歐皇小湘會來找你）', goal: 30, value: (s) => s.newTotal || 0, reward: 60 },
  { id: 'lucky-100', group: '收藏', title: '天選之湘', hint: '一般的蛋累計孵到新朋友 50 次（究級歐皇小湘會來找你）', goal: 50, value: (s) => s.newTotal || 0, reward: 100 },
  { id: 'night', group: '隱藏', title: '夜行性', hint: '？？？', reveal: '在深夜孵出一顆蛋', goal: 1, value: (s) => t(s, 'nightHatch'), reward: 30, secret: true },
  { id: 'letter', group: '隱藏', title: '收到一封信', hint: '？？？', reveal: '收到湘寄來的紙條', goal: 1, value: (s) => siangMailCount(s), reward: 30, secret: true },
  { id: 'code', group: '隱藏', title: '解開暗號', hint: '？？？', reveal: '兌換一個暗號', goal: 1, value: (s) => s.gifts?.redeemed?.length || 0, reward: 30, secret: true },
  { id: 'dev-pibao', group: '隱藏', title: '再畫一隻就好！', hint: '？？？', reveal: '迎接加班皮寶', goal: 1, value: (s) => (s.dex?.['086'] ? 1 : 0), reward: 50, secret: true },
  { id: 'dev-debao', group: '隱藏', title: '這個也要做嗎？！', hint: '？？？', reveal: '迎接崩潰德寶', goal: 1, value: (s) => (s.dex?.['087'] ? 1 : 0), reward: 50, secret: true },
  { id: 'dev-idea', group: '隱藏', title: '我又想到一個！', hint: '？？？', reveal: '迎接靈感爆發小湘', goal: 1, value: (s) => (s.dex?.['088'] ? 1 : 0), reward: 80, secret: true },
  { id: 'dev-overtime', group: '隱藏', title: '今天也沒有下班', hint: '？？？', reveal: '看見開發部茶水間的深夜會議', goal: 1, value: (s) => (s.devteam?.eventSeen ? 1 : 0), reward: 50, secret: true },
  // 頁邊江湖三寶（墨痕江湖活動限定，湘 11/26）
  { id: 'jh-pibao', group: '隱藏', title: '江湖怎麼都是你的傳聞？', hint: '？？？', reveal: '在墨痕江湖找齊五則江湖傳聞，迎接江湖百曉・皮寶', goal: INKS.length, value: (s) => inkCount(s), reward: 50, secret: true },
  { id: 'jh-debao', group: '隱藏', title: '江湖也有技術債', hint: '？？？', reveal: '把頁邊茶肆的門修好，迎接千機巧匠・德寶', goal: 1, value: (s) => (s.dex?.['MO-010'] || s.studioJh?.granted?.['MO-010'] ? 1 : 0), reward: 50, secret: true },
  { id: 'jh-chief', group: '隱藏', title: '教主竟是我老闆', hint: '？？？', reveal: '讓江湖百曉・皮寶和千機巧匠・德寶一起孵出頁邊教主・湘寶', goal: 1, value: (s) => (s.dex?.['MO-011'] ? 1 : 0), reward: 100, secret: true },
  { id: 'jh-branch', group: '隱藏', title: '頁邊江湖分舵', hint: '？？？', reveal: '皮寶、德寶、湘寶三位的好感都到 Lv.5', goal: 3, value: (s) => ['MO-009', 'MO-010', 'MO-011'].filter((no) => s.dex?.[no] && levelOf(s.affection?.[no]?.pts || 0) >= MAX_LEVEL).length, reward: 100, secret: true },
  { id: 'fossil', group: '隱藏', title: '化石獵人', hint: '？？？', reveal: '收集 30 個化石碎片', goal: 30, value: (s) => s.fossils || 0, reward: 30, secret: true },
  // 常駐支線「島嶼不歸檔」的隱藏成就（湘 11/27；島嶼大團結＝本島 19 位縣市小湘出戰過這條線）。上線前只有測試服有
  ...(sideOn() ? [
    { id: 'isl-1', group: '隱藏', title: '我的名字我決定', hint: '？？？', reveal: '擊敗正名將軍・朱筆', goal: 1, value: (s) => (stageWon(s, 'island', 'isl-1') ? 1 : 0), reward: 30, secret: true },
    { id: 'isl-2', group: '隱藏', title: '朋友自己交', hint: '？？？', reveal: '擊敗斷交將軍・絕信', goal: 1, value: (s) => (stageWon(s, 'island', 'isl-2') ? 1 : 0), reward: 30, secret: true },
    { id: 'isl-3', group: '隱藏', title: '不買拉倒', hint: '？？？', reveal: '擊敗封市將軍・斂財', goal: 1, value: (s) => (stageWon(s, 'island', 'isl-3') ? 1 : 0), reward: 30, secret: true },
    { id: 'isl-4', group: '隱藏', title: '先查證再轉傳', hint: '？？？', reveal: '擊敗惑心將軍・千聲', goal: 1, value: (s) => (stageWon(s, 'island', 'isl-4') ? 1 : 0), reward: 30, secret: true },
    { id: 'isl-5', group: '隱藏', title: '誰跟你一家親', hint: '？？？', reveal: '擊敗歸冊大將軍・一統', goal: 1, value: (s) => (stageWon(s, 'island', 'isl-5') ? 1 : 0), reward: 50, secret: true },
    { id: 'isl-unite', group: '隱藏', title: '島嶼大團結', hint: '？？？', reveal: '本島 19 縣市的小湘都在「島嶼不歸檔」出戰過', goal: 19, value: (s) => (s.side?.countyRan || []).filter((no) => MAIN_COUNTY.includes(no)).length, reward: 100, secret: true },
    { id: 'isl-all', group: '隱藏', title: '本頁拒絕裝訂', hint: '？？？', reveal: '完成整條「島嶼不歸檔」', goal: 1, value: (s) => (lineCleared(s, 'island') ? 1 : 0), reward: 100, secret: true },
    // 萬物不標價（皮寶 11/27 企劃）
    { id: 'ani-1', group: '隱藏', title: '本生命非賣品', hint: '？？？', reveal: '擊敗標價商人・金秤', goal: 1, value: (s) => (stageWon(s, 'animals', 'ani-1') ? 1 : 0), reward: 30, secret: true },
    { id: 'ani-2', group: '隱藏', title: '愛心不是免責聲明', hint: '？？？', reveal: '擊敗施食師・善善', goal: 1, value: (s) => (stageWon(s, 'animals', 'ani-2') ? 1 : 0), reward: 30, secret: true },
    { id: 'ani-reptile', group: '隱藏', title: '原來蜥蜴也是動物', hint: '？？？', reveal: '帶著爬蟲類小湘擊敗施食師・善善', goal: 1, value: (s) => (hasFeat(s, 'ani-reptile') ? 1 : 0), reward: 50, secret: true },
    { id: 'ani-3', group: '隱藏', title: '不是限時收藏', hint: '？？？', reveal: '擊敗收藏家・滿櫃', goal: 1, value: (s) => (stageWon(s, 'animals', 'ani-3') ? 1 : 0), reward: 30, secret: true },
    { id: 'ani-4', group: '隱藏', title: '這裡是我家', hint: '？？？', reveal: '擊敗築牆者・無林', goal: 1, value: (s) => (stageWon(s, 'animals', 'ani-4') ? 1 : 0), reward: 30, secret: true },
    { id: 'ani-5', group: '隱藏', title: '活著就很好', hint: '？？？', reveal: '擊敗萬物局長・唯用', goal: 1, value: (s) => (stageWon(s, 'animals', 'ani-5') ? 1 : 0), reward: 50, secret: true },
    { id: 'ani-cat', group: '隱藏', title: '我家貓咪沒有工作', hint: '？？？', reveal: '帶著貓咪小湘擊敗萬物局長・唯用', goal: 1, value: (s) => (hasFeat(s, 'ani-cat') ? 1 : 0), reward: 50, secret: true },
    { id: 'ani-all', group: '隱藏', title: '萬物不標價', hint: '？？？', reveal: '完成整條「萬物不標價」', goal: 1, value: (s) => (lineCleared(s, 'animals') ? 1 : 0), reward: 100, secret: true },
    { id: 'ani-n', group: '隱藏', title: '生命沒有稀有度', hint: '？？？', reveal: '帶著 N 級動物小湘擊敗萬物局長・唯用', goal: 1, value: (s) => (hasFeat(s, 'ani-n') ? 1 : 0), reward: 50, secret: true },
    { id: 'ani-every', group: '隱藏', title: '萬物皆有一席之地', hint: '？？？', reveal: '所有動物小湘都在「萬物不標價」出戰過', goal: ANIMAL_ALL.length, value: (s) => lineRan(s, 'animals').filter((no) => ANIMAL_ALL.includes(no)).length, reward: 100, secret: true },
  ] : []),
];

export function ensureAchievements(state) {
  const old = state.achievements || {};
  state.achievements = { claimed: Array.isArray(old.claimed) ? [...new Set(old.claimed.filter((x) => typeof x === 'string'))] : [] };
  return state.achievements;
}
export function achievementStatus(state, chars) {
  return ACHIEVEMENTS.map((a) => {
    const goal = typeof a.goal === 'function' ? a.goal(state, chars) : a.goal;
    const value = Math.min(goal, a.value(state, chars));
    const done = value >= goal;
    return { ...a, goal, value, done, claimed: state.achievements.claimed.includes(a.id) };
  });
}
export function claimAchievement(state, id, chars) {
  const a = achievementStatus(state, chars).find((x) => x.id === id);
  if (!a || !a.done || a.claimed) return 0;
  state.achievements.claimed.push(id); state.energy += a.reward; return a.reward;
}
