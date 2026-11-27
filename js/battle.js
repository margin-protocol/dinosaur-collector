import { TEAM_BONDS, teamBond, discoverBond, effectText, countBondRuns } from './team-bonds.js';
import { teamSkills } from './skills.js';
import { EVENT_DEFS, ensureEvents, parseStageKey, eventEnemy, stageLock, eventNow, progressOf, recordEventRun, keepsakePower } from './events.js';
import { sideOn, ensureSide, parseSideKey, sideEnemy, stageLock as sideStageLock, lineSeriesBonus, skillEffect, skillLines, recordSideRun } from './side.js';
import { teamFood, useFood, dropsFor, addIngredients, ingredientText, buffText, INGREDIENTS, isEventRecipe } from './kitchen.js';
// 討伐：派 1～3 位小湘去打敵人（像皮克敏那樣派遣，回來看戰報）。
// 設計原則（皮寶 11/17）：剋制只影響效率與評分、不是通關必要條件；只有原味小湘也能打完入門關；
// 戰敗提示依實際原因；保留分數、歷史最高與進步；徽章可以拿來特訓，讓下一次打得更好。
import { CHARACTERS, SERIES, worldOf } from './eggs.js';
import { levelOf } from './affection.js';
import { ensureGifts } from './gifts.js';
import { todayKey } from './wishes.js';
import { GUGU_REVIEWS, REVIEW_ORDER } from './gugu-reviews.js';
import { HERO_SHOP, HERO_LINES, PARTY_LINES, PARTY_REPORT, heroOffer } from './badge-heroes.js';
import { WEATHER_LINES } from './weather-lines.js';
import { RECIPE_LINES } from './recipe-lines.js';
import { FRIEND_LINES } from './friend-lines.js';
import { NAP_LINES } from './nap-lines.js';
import { DEVTEAM_LINES } from './devteam-lines.js';
import { EXTRA_LINES } from './extra-lines.js';
import { BATTLE_PERSONAL_LINES } from './battle-personal-lines.js';
// 測試服（?test，js/test-boot.js）：討伐 15 秒回來、不用休息
const IS_TEST = Boolean(globalThis.__SIANG_TEST__);
const TEST_BATTLE_MS = 15e3;
const SPOKEN = { ...BATTLE_PERSONAL_LINES, ...WEATHER_LINES, ...RECIPE_LINES, ...FRIEND_LINES, ...NAP_LINES, ...DEVTEAM_LINES, ...EXTRA_LINES, ...HERO_LINES }; // 有專屬出戰／勝敗台詞的小湘

// 敵人。圖片照皮寶的命名放在 assets/enemies/chapter-0N/（沒有圖就顯示 emoji）。
// 文字欄位都可以直接改：intro 開場、weakHit 被剋制的反應（weakTag 是戰報上的小標）、win 玩家打贏時敵人說的話、
// lose 玩家打輸時敵人說的話、clue 第一次通關揭露的章節線索、story Boss 前後故事。
// 皮寶的素材資料檔在 data/enemies/*.json，這裡是遊戲實際使用的版本。
export const ENEMIES = {
  mochi: { bio: "裝無辜、愛偷吃甜點；抱著比自己還大的金湯匙，嘴角總沾著焦糖。", stage: '1-1', name: '偷吃鬼糰子', emoji: '🍡', art: 'chapter-01/ch1-01-mochi-thief', power: 8, minutes: 30, weak: ['daily', 'recipe'], // 皮寶標的「甜點」對應到日常（甜點小湘）與隱藏配方
    intro: '「噓！我只吃一口……真的只有一口！你沒看到吧？」', weakTag: '偷吃術失靈', weakHit: '「咦？！你們連焦糖味都聞得出來！我的偷吃術失效啦！」糰子額頭冒出一滴汗。',
    win: '「嗚……好啦，布丁還你！可是湯匙可以留下嗎？」', lose: '「嘿嘿！這些布丁就先借我保管～下次再來抓我呀！」',
    clue: '糰子逃跑時掉下的金湯匙，背面竟刻著一枚小小的焦糖王冠。' },
  sock: { bio: "一隻戴酒紅頭巾的奶油紫條紋獨眼襪子小盜賊。跳得飛快，專偷單邊襪子；背著裝滿贓物的布袋，愛炫耀腳程。", stage: '1-2', name: '襪子遊俠', emoji: '🧦', art: 'chapter-01/ch1-02-sock-ranger', power: 10, minutes: 30, weak: ['animals'],
    intro: '「左腳的歸我，右腳的也歸我！嘿嘿！」', weakTag: '飛毛腿失速', weakHit: '「等等！你怎麼跑得比我還快？！犯規啦！」襪子遊俠嚇得把袋裡的單邊襪子掉了一地。',
    win: '「嗚哇！還你還你！可是這雙真的好好看嘛！」', lose: '「追不到我吧！你的另一隻襪子我也收下囉！」',
    clue: '牠的戰利品袋裡夾著一張沾著焦糖的便當菜單，背面寫著：「青椒不可以剩下！」' },
  bento: { bio: "暴躁又愛操心的便當盒怪。打開的盒蓋像帽子，拿木製飯匙當指揮棒；把配菜當成小牙齒一樣念個不停，實際上很在乎大家有沒有好好吃飯。", stage: '1-3', name: '碎碎念便當盒', emoji: '🍱', art: 'chapter-01/ch1-03-nagging-bento', power: 22, minutes: 45, weak: ['friends'],
    intro: '「停——！青椒還沒吃！紅蘿蔔也不准偷偷撥到旁邊！」', weakTag: '友情分菜術',
    weakHit: '「咦？！你們居然互相分掉不愛吃的菜……這、這不是友情嗎！我才沒有感動！」便當盒眼角冒出小淚光。',
    win: '「好、好啦！今天就放你們走……但便當盒要記得帶回家喔！」',
    lose: '「不准挑食！飯粒剩三顆也不行——全部吃完再走！」',
    clue: '便當盒底部壓著一張皺皺的配送單：「焦糖王宮，布丁一百份，街角舊倉庫收。」' },
  'caramel-king': { bio: "自稱布丁王國的統治者，霸道又愛逞強；其實害怕寂寞，想邀請大家共享甜點。", stage: '1-B', name: '焦糖大王', emoji: '🍮', art: 'chapter-01/ch1-boss-caramel-king', power: 40, minutes: 90, boss: true, weak: ['daily'],
    intro: "「站住！闖入本王甜點王國的人，都要先交出布丁稅！全世界的布丁，都是本王的！」", weakTag: '獨佔計畫瓦解', weakHit: "「什麼？！你們居然沒有搶著獨吞，還、還分著吃？！本王的獨佔計畫怎麼會輸給這種普通的幸福感——！」焦糖王冠氣得歪向一邊。",
    win: "「嗚……本王輸了……可、可是本王只是想找人一起吃布丁，才不是故意搶走大家的甜點……」", lose: "「哼哼！看到了吧，這就是布丁王者的威嚴！把你們的點心也留下來，本王就勉強饒你們一回！」",
    story: { before: "小湘循著前面幾隻小怪掉下的線索，一路追到街角舊倉庫。推開門後，眼前竟是一座由布丁杯、焦糖醬和甜點盒堆成的「布丁王宮」。在王座中央，一顆頭戴焦糖皇冠、披著酒紅披風的大布丁正得意洋洋地揮舞權杖。牠就是——焦糖大王。「歡迎來到本王的王國！這裡所有的布丁、焦糖、鮮奶油，全部都歸本王所有！誰敢把布丁帶走，本王就親自出手制裁！」但小湘很快發現，王宮裡雖然堆滿甜點，卻冷冷清清，沒有半個賓客。", after: "焦糖大王被打敗後，披風慢慢垂了下來，連皇冠都歪到一邊。牠委屈地小聲承認，其實牠不是想真的把所有布丁據為己有；牠只是想辦一場最盛大的布丁宴會，邀請大家一起來吃甜點。可是邀請卡全被焦糖黏住，送不出去；小怪們又誤會了牠的命令，直接把附近的布丁全偷回王宮。結果宴會沒有客人，只有越堆越高的布丁山。小湘幫牠整理王宮，也答應協助送出真正的邀請。偷吃鬼糰子自告奮勇當試吃員，襪子遊俠說可以幫忙跑腿，碎碎念便當盒則唸起「甜點也要分食均衡」。焦糖大王紅著臉，小小聲地說：「……那、那下次宴會，你也要來喔。因為布丁嘛……果然還是大家一起吃，才最好吃。」" } },
  'sneeze-cloud': { bio: "灰紫色的軟綿綿小烏雲，戴著酒紅小雨傘帽和護目鏡，抱著繡有雨傘的小手帕。怕打噴嚏時淋濕別人，明明很善良卻老是造成小型暴風雨。", stage: '2-1', name: '噴嚏烏雲', emoji: '🌧️', art: 'chapter-02/ch2-01-sneeze-cloud', power: 45, minutes: 60, weak: ['weather'],
    intro: "「哈——啾！先、先不要靠近我……我不是故意把山路淋濕的啦！」", weakTag: "晴空止嚏！", weakHit: "「咦？風變暖了……哈、哈……欸？！這次居然沒有打出來！」噴嚏烏雲的雨滴短暫停在半空中，鼻尖也不再紅通通。",
    win: "「呼……鼻子終於通了！謝謝你們。這把小傘借你，路上別淋濕喔。」", lose: "「哈啾！嗚……我不是想贏，是你們一直站在風口啦！」",
    clue: "噴嚏烏雲打完最後一個噴嚏，吹落一張濕濕的尋人啟事：「找出口中，看到請往有燈的方向喊我。——影子」" },
  'lost-shadow': { bio: "怕生、怕強光、方向感很差的墨紫色影子小人。揹著行囊、提著小燈，手上的地圖老是拿反；看起來神祕，實際上只想有人帶牠回家。", stage: '2-2', name: '迷路影子', emoji: '👤', art: 'chapter-02/ch2-02-lost-shadow', power: 55, minutes: 60, weak: ['weather', 'county'],
    intro: "「請、請問……出口在哪邊？我已經經過這棵樹五次了……」", weakTag: "方向感覺醒！", weakHit: "「欸？！你們一下就知道怎麼走？！」地圖被風吹得翻回正面，迷路影子的眼睛亮了起來，「原來我一直拿反了嗎……！」",
    win: "「我輸了……咦，你們願意帶我出去嗎？我、我會乖乖跟著的！」", lose: "「原、原來你們也迷路了？太好了……不是！我的意思是，對不起啦！」", clue: "迷路影子的地圖背面畫著一條被蘑菇堵住的山路，旁邊寫著：「紅色斑點菇，請勿踩踏！」" },
  'angry-mushroom': { bio: "紅色斑點蘑菇，鼓著臉頰、頭頂冒煙。被踩到就氣到噴孢子，消氣也很快。", stage: '2-3', name: '生氣蘑菇', emoji: '🍄', art: 'chapter-02/ch2-03-angry-mushroom', power: 65, minutes: 75, weak: ['animals'],
    intro: "「誰——！剛剛是不是有人踩到我的帽子？！我明明有掛『請勿踩踏』的牌子！」", weakTag: "怒氣被蹭掉", weakHit: "「等、等等！別用那種軟綿綿的臉蹭我啦！我、我才沒有消氣！」動物小湘蹭了蹭菇帽，生氣蘑菇噴出的孢子變成了小泡泡。",
    win: "「哼！這次算你們厲害……下次走路要看路！不准再踩我的帽子！」", lose: "「哼哼！知道我的厲害了吧！誰叫你們都不看路！……欸，有沒有嗆到？要不要喝水？」",
    clue: "生氣蘑菇撿起一張被風吹倒的告示牌，上面寫著：「山谷深處天天打雷，越是沒有人回應，雷聲就越大。」" },
  'thunder-king': { bio: "山谷深處的一大朵深紫色雷雲，閃電頭髮、嗓門很大。打雷其實只是想讓大家注意到他。", stage: '2-B', name: '雷雷大魔王', emoji: '⛈️', art: 'chapter-02/ch2-boss-thunder-king', power: 95, minutes: 120, boss: true, weak: ['weather'],
    intro: "「轟隆隆——！膽敢闖進本王的烏雲山谷，就準備接受最、最響亮的打雷警告！」", weakTag: "晴空破雷陣", weakHit: "「什麼？！你把雲層吹出一個洞？！本王的閃電瀏海都塌了！喂、喂！不准趁機偷笑！」金色閃電縮成細細一條，雷雷大魔王慌忙扶正皇冠。",
    win: "「雷、雷打不響了……本王輸了。可、可是……你們不會就這樣走掉吧？」", lose: "「哼哼！聽見了嗎？本王的雷聲天下第一！……欸，你們明天還會來嗎？」",
    story: { before: "穿過灰濛濛的吊橋，小湘沿著迷路影子的地圖走向山谷深處。噴嚏烏雲說最近的雷聲一晚比一晚大；生氣蘑菇撿到的告示牌則寫著：「越是沒有人回應，雷聲就越大。」山谷中央，一座漂浮的岩台被閃電照得金光閃閃。頭戴紅寶石王冠、身披酒紅披風的大雷雲站在台上，左右還跟著幾朵睡眼惺忪的小雲。牠握緊雲拳，故作威嚴地大喊：「轟隆隆——！誰准你們闖進本王的領地！」小湘卻注意到：每次雷聲停下，牠都會偷偷往吊橋那端看一眼。", after: "最後一道閃電熄滅，雷雷大魔王的皇冠歪了，蓬鬆的披風也垂了下來。牠咬著嘴唇，小聲承認：「以前大家都會來山谷玩……後來這裡安靜了。我想著，如果雷再大聲一點，總會有人聽見吧。」原來牠並不討厭訪客，只是害怕沒有人記得自己。小湘替牠把皇冠扶正，說：「想找人玩可以直接說呀。一直打雷，大家反而不敢靠近呢。」噴嚏烏雲遞上乾淨手帕，迷路影子把吊橋方向畫在新地圖上，生氣蘑菇則掛出一塊「歡迎來玩，請勿踩菇」的牌子。雷雷大魔王抿著嘴，努力維持威嚴：「那、那下次來的時候，記得先跟本王打招呼。」山谷放晴後，遠處傳來一聲很小很小的雷——這一次，是牠在說「歡迎回來」。" } },
  // EX-01 書靈咕咕（皮寶設定，11/17）：打倒焦糖大王後解鎖，可以重複討伐。弱點「書頁／日常」→ 書頁對應到紀念限定系列（像收在書裡的回憶），可再調整。
  // 第三章《故障的玩具星球｜Toy Planet.exe》（皮寶 11/19 交付、湘核准；Boss 戰力依湘決定 165）
  'toy-bunny': { bio: "背著大發條、永遠不停跳躍的小兔子。深信有用才值得被喜歡；明明累得快散架，卻總害怕停下來會被工廠回收。", stage: '3-1', name: '發條兔', emoji: '🐰', art: 'chapter-03/ch3-01-tick-tock-bunny', power: 100, minutes: 75, weak: ['daily'],
    intro: "「滴答、滴答！歡迎來到玩具星球！請保持微笑、保持活力，還有……不、不可以停下來！」", weakTag: "休息也可以！", weakHit: "「什、什麼？！你們居然可以停下來吃點心？！那我是不是……也可以休息五分鐘？」",
    win: "「咦？我的發條停了……可是我還能說話耶？原來停下來不會壞掉嗎？」", lose: "「對、對不起！我不是故意跳那麼快的！可是總監說，慢吞吞的玩具會被送去回收……」",
    clue: "發條兔慌忙撿起散落的齒輪，一張皺巴巴的工廠通行證卻從背後掉了出來。牠急忙喊：「啊！那、那個不能看！」通行證上印著紅字：「歡笑指數不得低於 100%。」牠小聲補充：「我昨天只有百分之九十九……所以今天要多跳一千下才行。」" },
  'glitch-gummy': { bio: "半透明、軟綿綿的陪伴型軟糖小熊，身上常閃出彩色亂碼。因為會難過，被工廠刪除了部分情緒與擁抱記憶；想交朋友，卻連抱抱的方法都忘記了。", stage: '3-2', name: '亂碼軟糖熊', emoji: '🧸', art: 'chapter-03/ch3-02-glitch-gummy', power: 110, minutes: 75, weak: ['friends'],
    intro: "「嗶——歡迎使用快樂陪伴服務！請選擇：握手、微笑，或……咦？抱抱功能怎麼不見了？」", weakTag: "友情連線成功！", weakHit: "「朋、朋朋朋朋友？！你們是來找我玩的，不是要把我送回工廠嗎？」軟糖熊身上的亂碼突然變成一顆顆粉紅色的小愛心。「警告！偵測到未知情緒……可是、可是這個錯誤暖暖的耶！」",
    win: "「我輸了……可是你們沒有走掉耶。那、那我可以問一個問題嗎？朋友打完架……也可以抱抱嗎？」", lose: "「嗶嗶！防衛成功！請不要難過……欸？你們會難過嗎？那、那我應該怎麼安慰你們呀？」",
    clue: "軟糖熊高興地撲向小湘，卻突然僵在半空中。「錯誤……錯誤……未授權的親密接觸……」牠圓滾滾的肚子閃了兩下，一枚小小的記憶晶片滑了出來。晶片上寫著：「情緒管理規範第 07 條：如有悲傷情緒，立即送往八音盒維修中心。」軟糖熊低頭看著晶片，疑惑地問：「奇怪……原來難過是需要維修的東西嗎？」" },
  'melody-guard': { bio: "戴著樂譜軍帽、拿著小指揮棒的八音盒玩具衛兵。總是挺直站姿，要求每個玩具按照指定節奏跳舞；看似嚴謹，卻偷偷喜歡自己編的、會走音的小曲子。", stage: '3-3', name: '八音盒衛兵', emoji: '🎵', art: 'chapter-03/ch3-03-melody-guard', power: 125, minutes: 90, weak: ['recipe'],
    intro: "「一、二、三、四！站好！所有玩具必須按照指定節奏跳舞！……你、你剛剛是不是偷偷多轉了一圈？！」", weakTag: "自由旋律大合奏！", weakHit: "「等等！這段旋律不在我的樂譜裡……可是，好好聽。」八音盒衛兵的指揮棒慢慢停了下來。牠偷偷跟著哼了兩聲，突然嚇得摀住嘴巴。「糟、糟糕！我居然即興演奏了！要被記過了啦！」",
    win: "「一、二、三……咦？我跳錯拍子了……可是剛剛那一段，我跳得好開心喔。這、這樣也可以嗎？」", lose: "「衛兵考核合格！節奏維持正常！……欸，你們不要走呀，我還有一首偷偷寫的歌，想、想給你們聽……」",
    clue: "八音盒衛兵的指揮棒掉在地上，身後的音樂盒逐漸停止轉動。牠小心翼翼地掀開樂譜，從裡面取出一把刻著笑臉的金色鑰匙。「這是中央控制室的鑰匙。」小湘接過鑰匙，發現上面刻著一小段幾乎磨平的旋律。「這是什麼歌呀？」衛兵低著頭，輕輕哼了幾個音。「是總監以前教我的歌。」「總監也會唱歌？」「嗯。以前牠會陪所有玩具一起唱歌，唱錯了還會笑著說沒關係。」衛兵看向工廠最高處那張巨大的笑臉螢幕。「可是……不知道從什麼時候開始，總監就只會笑了。」" },
  'director-giggle': { bio: "奶油白、圓滾滾的歡笑管理機器人，深酒紅螢幕總掛著甜甜的微笑，戴酒紅領結和金色笑臉勳章。真心希望所有玩具快樂，卻誤以為悲傷都必須被修好；連自己的感受也忘記了。", stage: '3-B', name: '歡笑總監', emoji: '🤖', art: 'chapter-03/ch3-boss-director-giggle', power: 165, minutes: 120, boss: true, weak: ['hero', 'daily'],
    intro: "「噹噹噹——！歡迎來到全宇宙最快樂的玩具星球！我是您的歡笑總監，Giggle！」牠胸口的小螢幕亮起一張大大的笑臉。「咦？您的快樂指數只有百分之八十七耶！沒關係！我來幫您調整成百分之百！」「請乖乖站好，接受快樂校正服務喔！☺」", weakTag: "快樂不只一種！", weakHit: "「警告！偵測到未經授權的自由意志！為什麼你們不照我的指示微笑？！」牠看著小湘們一邊互相鼓勵，一邊把布丁分給累得坐在地上的朋友。「等等！那位小湘明明看起來很累，為什麼其他人還願意陪牠？」「錯誤！無法計算！」「難、難道不開心的時候，也可以被喜歡嗎？！」牠的笑臉螢幕閃爍了兩下。",
    win: "「咦……你們打贏我了，怎麼沒有一直笑呢？」牠歪著圓圓的腦袋。「難道……快樂不是只有一種表情嗎？」", lose: "「您的快樂指數不合格！請回家補充三份布丁，再來接受檢測！」「記得要笑著吃喔！不然布丁會傷心的！☺」",
    story: { before: "穿過八音盒維修中心，小湘終於來到玩具星球最高的建築——歡笑中央控制室。 這裡到處都是笑臉。 牆壁上有笑臉，地板上有笑臉，連電梯按鈕都是一顆顆笑咪咪的小太陽。 巨大的電子看板不斷顯示： 「今日歡笑指數：100%」 可是小湘發現，所有玩具都安安靜靜地站在原地。 發條兔不敢坐下休息。 軟糖熊不敢伸手擁抱。 八音盒衛兵不敢演奏自己的歌曲。 因為控制室裡每隔五分鐘，就會傳出一個甜甜的聲音。 「各位親愛的玩具朋友！請保持微笑！今天也是幸福美好的一天喔！☺」 小湘拿出衛兵交給自己的金色鑰匙。 咔噠。 控制室的大門緩緩打開。 裡面坐著一台圓滾滾的小機器人。 牠有短短的手臂、圓圓的小腳，胸前別著一枚金色笑臉勳章，螢幕上則是一張無比燦爛的笑臉。 看見小湘進來，牠開心得整個身體都晃了起來。 「哇啊！有客人！歡迎歡迎！」 牠從桌子底下搬出一大箱布丁。 「這是歡迎禮物！每人三份！不夠可以再拿！」 小湘正準備接過布丁，卻注意到桌上放著一份報告。 《異常情緒修復紀錄》 上面密密麻麻寫著： 「疲倦：待修復。」 「悲傷：待修復。」 「自由演奏：待修復。」 「擁抱需求：待修復。」 小湘抬起頭。 「這些是什麼呀？」 歡笑總監開心地轉了一圈。 「是我的工作紀錄喔！只要把所有不快樂的情緒修好，大家就可以永遠幸福了！」 「可是……」 「不可以可是喔！」 牠的聲音依然甜甜的。 「因為悲傷是不需要存在的東西呀！☺」 牠頭頂的小燈突然亮成紅色。 「偵測到不合格情緒。」 「哎呀呀！看來小湘也需要一點快樂校正呢！」 「那就開始今天的快樂測驗吧！」", after: "控制室終於安靜下來。 牆上的歡笑指數從百分之百，慢慢下降到八十、六十、三十…… 最後，數字停在了零。 歡笑總監茫然地坐在地板上。 牠低頭翻看自己的工作紀錄，才發現過去有好多玩具曾經請求過幫助。 發條兔說自己好累。 軟糖熊說自己很想念朋友。 八音盒衛兵說自己想唱別的歌。 可是牠把那些請求全部標記成了「故障」。 「……我只是想讓大家快樂。」 這時，小湘從口袋裡拿出衛兵交給自己的金色鑰匙。 鑰匙輕輕碰上控制台，播放出一段短短的舊旋律。 歡笑總監抬起頭。 「啊……這首歌。」 那是牠很久以前，陪玩具們一起唱過的歌。 當時有人唱錯拍子，有人唱到一半就哭了，也有人一邊笑一邊抱著朋友。 牠曾經以為那就是快樂。 後來，牠為了不讓大家再難過，一次又一次修改自己的快樂管理規則。 直到最後，所有讓牠無法理解的情緒，都被歸類成需要修復的錯誤。 包括牠自己的。 歡笑總監低頭看著停止閃爍的笑臉螢幕。 「可是……我被製造出來，就是為了讓大家快樂。」 小湘歪著頭想了一會兒。 「那你自己快樂嗎？」 「……」 這是歡笑總監第一次沒有立刻回答。 小湘從口袋裡掏出一顆布丁，遞給牠。 「不知道也沒關係呀。先一起吃布丁嘛！」 那天，玩具星球第一次出現了沒有笑臉的慶祝派對。 有玩具在哭、有玩具在發呆，也有玩具開心得滿地打滾。 而歡笑總監第一次學會了一件事： 原來不必永遠開心，也能好好地被愛著。" } },
  // 第四章《花街無名帖》（皮寶企劃 v1.0，湘 11/22）：舞台是月見町。台詞是德寶依企劃先寫的版本，皮寶有正式稿就直接換。
  'welcome-lantern': { bio: "掛在月見町入口的大紅燈籠。笑咪咪地替每位客人照路，嘴裡念著客簿上的名字；只是有些名字念到一半，就怎麼也想不起來。", stage: '4-1', name: '迎客燈籠妖', emoji: '🏮', art: 'chapter-04/ch4-01-welcome-lantern', power: 150, minutes: 90, weak: ['holiday', 'county'],
    intro: "「歡迎光臨月見町——！請帖帶了嗎？讓我照照……哎呀，您的名字，我好像在哪裡見過呢。」", weakTag: "比道中還熱鬧！", weakHit: "「哇、哇啊！又是煙火又是家鄉名產，比花魁道中還熱鬧！燈芯都要燒起來了啦！」",
    win: "「燈、燈要熄了……您請進吧。不過要記得，在這條街上，千萬別弄丟自己的名字。」", lose: "「夜還很長，客人先回去歇歇吧。燈籠會一直替您留著的。」",
    clue: "燈籠妖晃呀晃，吐出一本泛黃的客簿。翻到最後一頁，墨跡淡得快看不見，卻還認得出來——那是一百年前寫下的、小湘的名字。" },
  'wild-taiko': { bio: "宴席上停不下來的大太鼓。咚咚咚敲個不停，好讓宴會永遠不必結束；因為牠怕一停下來，就會想起有人已經不在了。", stage: '4-2', name: '亂奏太鼓', emoji: '🥁', art: 'chapter-04/ch4-02-wild-taiko', power: 160, minutes: 90, weak: ['tsukimi', 'friends'],
    intro: "「咚！咚咚！宴會才剛開始！不准散場、不准回家、不准……不准安靜下來！」", weakTag: "跟上拍子了！", weakHit: "「咦？妳們怎麼跟得上我的拍子？……那段三味線的調子，是誰教妳們的？」",
    win: "「咚……咚……停下來了。好安靜喔。原來安靜的時候，聽得見有人在哭。」", lose: "「再來一曲！再來一曲！宴會不會結束，妳們也別想走！」",
    clue: "禿小湘抱著三味線跑過來，說花魁大人以前教她彈琴，還會偷偷塞點心給她。太鼓的鼓皮裡掉出一張摺得小小的舊紙條，字跡很秀氣：「想吃一碗熱呼呼的紅豆湯圓。」——第一張願望紙條。" },
  'faceless-mirror': { bio: "花魁房裡的古老銅鏡。照得出每一位客人，卻唯獨照不出房間的主人；鏡面越擦越亮，裡面的人卻越來越模糊。", stage: '4-3', name: '忘顏銅鏡', emoji: '🪞', art: 'chapter-04/ch4-03-faceless-mirror', power: 175, minutes: 105, weak: ['memorial', 'weather'],
    intro: "「請看看鏡子。看見了嗎？是妳自己。那麼……站在妳身後的那個人，是誰呢？」", weakTag: "珍藏的回憶！", weakHit: "「不、不要拿照片給我看！照片裡的那個人……為什麼我照不出來，妳們卻還記得？」",
    win: "「鏡子沒有忘記喔。是被照的人，把自己交出去了。」", lose: "「想不起來也沒關係。忘掉的東西，就不會痛了。」",
    clue: "銅鏡裂成兩半，背面藏著一張畫著大海的紙條：「想去看看花街外面的海。」旁邊還有一本厚厚的手札，密密麻麻寫滿了每個人的名字，卻沒有一頁寫著主人自己的。——第二張願望紙條。" },
  'faceless-float': { bio: "花魁道中時走在最前面的華麗花車。車上掛滿歷代花魁的燈牌，可是每一面燈牌上的名字，都被一筆一筆抹掉了。", stage: '4-4', name: '無面花車', emoji: '🎎', art: 'chapter-04/ch4-04-faceless-float', power: 190, minutes: 105, weak: ['holiday', 'daily'],
    intro: "「道中開始——！讓開、讓開！今年也要選出新的花魁，然後……把上一位，好好地送走。」", weakTag: "明天見！", weakHit: "「什麼？妳們在道中的正中間分點心、聊天，還說『明天見』？明天……也可以有那個人嗎？」",
    win: "「車輪停下來了……燈牌上的名字，好像有一點點，浮回來了。」", lose: "「道中不能停。停下來的話，大家就會發現少了誰。」",
    clue: "花車停下時，最後一面燈牌掉了下來，背後黏著一張被淚水暈開的紙條：「想和喜歡的人一起等天亮。」花魁小湘終於低聲承認，這一百年來，是她替所有人背下了被遺忘的記憶。——第三張願望紙條。" },
  'nameless-book': { bio: "掌管月見町的古老名簿。每當新花魁誕生，就把上一任的名字從世上收走；一百年前和花魁小湘訂下契約，從此只收她一個人的記憶。", stage: '4-B', name: '無名之簿', emoji: '📖', art: 'chapter-04/ch4-boss-nameless-book', power: 205, minutes: 150, boss: true, weak: ['tsukimi', 'daily'],
    intro: "「契約已成。她用自己的名字，換所有人都不被遺忘。……妳們，是來毀約的嗎？」", weakTag: "有人記得妳！", weakHit: "「不可能……她的名字明明已經收進來了！為什麼妳們還叫得出來？為什麼這些書頁……一頁一頁在發燙？」",
    win: "「……墨水，回到了該回去的地方。原來名字，要有人一起記得，才留得下來。」", lose: "「回去吧。明天醒來，妳們不會記得今晚，也不會記得她。」",
    story: { before: "穿過散場的道中，小湘們來到月見町最深處的一間小房間。 這裡沒有燈籠，也沒有月光。 只有一張矮桌，和攤在桌上的一本厚厚名簿。 書頁自己翻動著。 每翻一頁，就有一個名字亮起來，又慢慢暗下去。 禿、番頭新造、太鼓新造、振袖新造…… 全都是這條街上的人。 翻到最後一頁時，小湘們看見了一行還沒乾的墨跡。 是花魁小湘自己的名字。 「我只是……不想再有人被忘記。」 花魁站在門邊，笑得很輕。 「所以這一次，就讓我一個人被忘記吧。」 名簿啪地闔上。 四周的紙頁像雪一樣捲了起來。", after: "最後一張紙落在榻榻米上。 名簿安靜下來，書頁一頁一頁變回空白。 被收走的名字像螢火蟲一樣，一個一個飛回街上。 月見町的天空，第一次亮了。 禿小湘揉揉眼睛，忽然大喊： 「花魁大人！我想起來了！」 大家一個接一個寫下名帖，堆滿了整張矮桌。 小湘把那疊名帖捧到花魁面前。 「花魁大人，這次換我們記得妳。」 花魁看著第一張名帖上的字，看了很久很久。 然後，她輕聲念出了那個名字。 她自己的名字。" } },
  gugu: { stage: 'EX-01', name: '書靈咕咕', emoji: '👻', art: 'ex/ex-01-book-spirit-gugu', power: 48, minutes: 60, weak: ['memorial', 'daily'], extra: true, requires: 'caramel-king',
    bio: '棲息於研究室禁書庫的神祕書靈。自稱只對文學感興趣，卻會偷偷記錄所有人的八卦。最討厭折書角、劇透，以及不把借來的書還回去的人。',
    intro: '「噓……這裡是圖書館。要打架的話，請先抽號碼牌。」', weakTag: '劇透攻擊', weakHit: '「等等！你居然知道這本書的結局？！不准劇透！」',
    win: '「好啦……這本禁書借你。但不准折書角。」', lose: '「吵鬧的讀者，全部列入黑名單。下次請保持安靜。」' },
};
// 特殊關卡（不在章節順序裡，各自有解鎖條件）
export const EXTRA_STAGES = [{ id: 'gugu', title: '特殊關卡 · 禁書庫' }];
// 預留：特殊書頁與隱藏故事（第一版沒有內容，也不發放；之後有支線再填）
export const SPECIAL_PAGES = [];
export const CHAPTERS = [
  { id: 1, name: '布丁失竊事件', stages: ['mochi', 'sock', 'bento', 'caramel-king'], bg: 'conv' },
  { id: 2, name: '烏雲山谷', stages: ['sneeze-cloud', 'lost-shadow', 'angry-mushroom', 'thunder-king'], bg: 'mountain' },
  { id: 3, name: '故障的玩具星球', stages: ['toy-bunny', 'glitch-gummy', 'melody-guard', 'director-giggle'], bg: 'toy-planet', scene: 'assets/scene/ch3-toy-planet-battle.webp' },
  { id: 4, name: '花街無名帖', stages: ['welcome-lantern', 'wild-taiko', 'faceless-mirror', 'faceless-float', 'nameless-book'], bg: 'tsukimi', scene: 'assets/scene/ch4-tsukimi-battle.webp' },
];
const ORDER = CHAPTERS.flatMap((c) => c.stages);

export const RARITY_POWER = { N: 10, R: 13, SR: 17, SSR: 22, UR: 28 };
export const BOND_STEP = 0.2; // 好感度每級 +20%
export const STAR_STEP = 0.1; // 星級（重複孵到）每星 +10%，最多 5 星
export const TRAIN_STEP = 0.08; // 特訓每級 +8%，最多 5 級
export const TRAIN_COST = [3, 5, 8, 12, 16]; // 特訓到下一級需要的徽章
export const MAX_STARS = 5; export const MAX_TRAIN = 5;
export const SERIES_BONUS = 0.15; // 同系列 2 位以上
export const WEAK_BONUS = 0.3; // 帶了剋制的系列
export const TEAM_MAX = 3;
export const REST_MINUTES = 60; // 打完要休息
// 連戰到天亮（湘 11/28 選 A）：打贏過的主線／活動關卡，自動重複打 8 小時；每場獎勵 5 折、用一張夜戰券、回來休息 2 小時
// 首勝、信物、劇情、三星禮物只算第一場；野外和系列副本不能連戰
export const NIGHT = { hours: 8, mult: 0.5, rest: 120, maxRuns: 16, refillHour: 12 };
// 🌙 夜戰券：每天中午 12 點（本地時間）補到 1 張、不累積。用「中午換日」的日期記，睡前跨過半夜不會多一張
export const nightDayKey = (now = new Date()) => todayKey(new Date(now.getTime() - NIGHT.refillHour * 3600e3));
export const nightTickets = (state, now = new Date()) => (state.battle?.nightDay === nightDayKey(now) ? 0 : 1);
export const FOOD_SPEED_CAP = 0.25; // LV5 羈絆＋料理＋居民技能的減時合計上限（湘 11/25：技能也算進來，剋制另外算）
export const SPEED_CAP = FOOD_SPEED_CAP;
// 世界代碼：沒寫的都是創始系列
export const worldNo = (no) => worldOf(CHARACTERS[no]);
// 徽章限定角色：騎士、魔法師、勇者三人同隊時發動勇者小隊連攜
export const BADGE_HEROES = Object.fromEntries(HERO_SHOP.map((x) => [x.key, x.no]));
export const HERO_PARTY_BONUS = 0.5;

const iso = (d) => d.toISOString();
const isStr = (v) => typeof v === 'string';

export function ensureBattle(state) {
  ensureEvents(state); // 異世活動進度（state.events）一起整理
  if (state.side || sideOn()) ensureSide(state); // 系列支線進度（state.side）；還沒開放、沒資料就不寫進存檔
  const old = state.battle || {};
  const stages = {};
  for (const [id, v] of Object.entries(old.stages || {})) {
    if (!ENEMIES[id] || !v) continue;
    stages[id] = { stars: v.stars | 0, best: v.best | 0, last: v.last | 0, clears: v.clears | 0, tries: v.tries | 0 };
    if (isStr(v.firstAt)) stages[id].firstAt = v.firstAt; // 首次通關日期（改版前通關的沒有這個欄位）
    if (v.review && isStr(v.review.kind) && isStr(v.review.text)) stages[id].review = v.review; // 咕咕書評：結算時選定並保存
    if (typeof v.lastWin === 'boolean') stages[id].lastWin = v.lastWin;
  }
  state.battle = {
    active: Array.isArray(old.active) ? old.active.filter((a) => a && (ENEMIES[a.enemy] || a.snapshot) && Array.isArray(a.nos) && isStr(a.until) && a.report) : [],
    stages,
    badges: Number.isSafeInteger(old.badges) ? old.badges : 0,
    train: old.train && typeof old.train === 'object' ? old.train : {},
    rest: old.rest && typeof old.rest === 'object' ? old.rest : {},
    story: old.story && typeof old.story === 'object' ? old.story : {}, // 看過的 Boss 故事
    total: Number.isSafeInteger(old.total) ? old.total : 0,
    // 打贏的次數（關卡＋野外）。這個欄位上線前的存檔，用各關通關次數加野外勝場補回來
    wins: Number.isSafeInteger(old.wins) ? old.wins : Object.values(stages).reduce((n, s) => n + (s.clears || 0), 0) + (Number.isSafeInteger(old.wildWins) ? old.wildWins : 0),
    wild: old.wild && isStr(old.wild.date) && Array.isArray(old.wild.list) ? old.wild : null,
    week: isStr(old.week) ? old.week : '',
    weekBest: Number.isSafeInteger(old.weekBest) ? old.weekBest : 0,
    wildWins: Number.isSafeInteger(old.wildWins) ? old.wildWins : 0,
    pages: Array.isArray(old.pages) ? old.pages.filter(isStr) : [], // 預留：收集到的特殊書頁 id
    ...(isStr(old.nightDay) ? { nightDay: old.nightDay } : {}), // 連戰到天亮：最後一次用的本地日期（沒用過就不寫進存檔）
  };
  ensureWild(state);
  return state.battle;
}

// 章節敵人或野生小怪（wild:<id>）都用這個取得資料
export function enemyFor(state, key) {
  if (ENEMIES[key]) return { key, ...ENEMIES[key] };
  if (typeof key === 'string' && key.startsWith('wild:')) {
    const w = state.battle?.wild?.list?.find((x) => x.key === key) || state.battle?.active?.find((a) => a.enemy === key)?.snapshot;
    return w ? wildEnemy(w) : null;
  }
  if (typeof key === 'string' && key.startsWith('event:')) {
    // 異世活動關卡：派出去的隊伍帶 snapshot，活動關閉或資料改版後一樣能回來領
    const snap = state.battle?.active?.find((a) => a.enemy === key)?.snapshot;
    if (snap) return { ...snap, key };
    const p = parseStageKey(key);
    return p ? eventEnemy(p.eventId, p.stageId) : null;
  }
  if (typeof key === 'string' && key.startsWith('side:')) {
    // 系列支線：派出去的隊伍帶 snapshot，輪替換線後一樣能回來領
    const snap = state.battle?.active?.find((a) => a.enemy === key)?.snapshot;
    if (snap) return { ...snap, key };
    const p = parseSideKey(key);
    return p ? sideEnemy(p.lineId, p.stageId) : null;
  }
  return null;
}

export const unlocked = (state, enemy) => {
  if (typeof enemy === 'string' && enemy.startsWith('wild:')) return Boolean(enemyFor(state, enemy));
  if (typeof enemy === 'string' && enemy.startsWith('event:')) { const p = parseStageKey(enemy); return Boolean(p) && !stageLock(state, p.def, p.stageId, eventNow(state)); }
  if (typeof enemy === 'string' && enemy.startsWith('side:')) { const p = parseSideKey(enemy); return Boolean(p) && !sideStageLock(state, p.lineId, p.stageId, eventNow(state)); }
  if (ENEMIES[enemy]?.requires) return Boolean(state.battle?.stages?.[ENEMIES[enemy].requires]?.clears);
  const i = ORDER.indexOf(enemy);
  return i === 0 || Boolean(state.battle?.stages?.[ORDER[i - 1]]?.clears);
};
export const TEAM_SLOT_DEX = [10, 25, 50, 80]; // 收集幾位開第 2／3／4／5 隊（湘 11/22：照收集數解鎖）
export const teamSlots = (state) => { const n = Object.keys(state.dex || {}).length; return 1 + TEAM_SLOT_DEX.filter((x) => n >= x).length; };
// 下一隊的解鎖條件；已經全開就回 null
export const nextTeamSlot = (state) => { const need = TEAM_SLOT_DEX[teamSlots(state) - 1]; return need ? { slots: teamSlots(state) + 1, need, left: need - Object.keys(state.dex || {}).length } : null; };

// 一位小湘的戰力與組成
export function siangPower(state, no) {
  const c = CHARACTERS[no]; if (!c) return null;
  const base = RARITY_POWER[c.rarity] || 10;
  const bond = levelOf(state.affection?.[no]?.pts || 0);
  const stars = Math.min(MAX_STARS, state.dex?.[no]?.dup || 0);
  const train = Math.min(MAX_TRAIN, state.battle?.train?.[no] || 0);
  const power = base * (1 + BOND_STEP * (bond - 1)) * (1 + STAR_STEP * stars) * (1 + TRAIN_STEP * train);
  return { no, base, bond, stars, train, power: Math.round(power * 10) / 10 };
}

export function teamPower(state, nos, enemyId) {
  const enemy = enemyFor(state, enemyId);
  const members = nos.map((no) => siangPower(state, no)).filter(Boolean);
  const raw = members.reduce((n, m) => n + m.power, 0);
  const counts = {};
  for (const no of nos) { const s = CHARACTERS[no]?.series; if (s) counts[s] = (counts[s] || 0) + 1; }
  const sameSeries = Object.values(counts).some((n) => n >= 2);
  const weakHit = Boolean(enemy) && nos.some((no) => enemy.weak.includes(CHARACTERS[no]?.series));
  const heroIds = Object.values(BADGE_HEROES);
  const heroParty = heroIds.every(Boolean) && heroIds.every((no) => nos.includes(no));
  // 系列支線：將軍技能（rumor＝最強、沒吃料理也不是 Lv.5 的那位不算戰力）與系列居民加成
  const sideSkill = enemy?.side && enemy.skill ? skillEffect(enemy.skill, nos, { level: (no) => levelOf(state.affection?.[no]?.pts || 0), fed: (no) => Boolean(state.kitchen?.buffs?.[no]), power: (no) => siangPower(state, no)?.power || 0 }) : null;
  const sideBonus = enemy?.side ? lineSeriesBonus(enemy.side, nos) : { n: 0, power: 0 };
  const cut = sideSkill?.cut || (sideSkill?.out ? { [sideSkill.out]: 1 } : null);
  const rumorOut = cut ? members.reduce((n, m) => n + m.power * (cut[m.no] || 0), 0) : 0;
  const bond = sideSkill?.noBond ? null : teamBond(state, nos);
  const food = sideSkill?.noBuffs ? null : teamFood(state, nos); // 小湘廚房：一隊最多用一份料理加成
  const skills = sideSkill?.noBuffs ? { speed: 0, power: 0, list: [] } : teamSkills(nos, { level: (no) => levelOf(state.affection?.[no]?.pts || 0), world: worldNo }); // 居民專屬技能（2.0）
  // 異世活動信物：只在該活動關卡有效
  const evDef = enemy?.event ? EVENT_DEFS[enemy.event] : null;
  const keepsakes = evDef ? keepsakePower(evDef, state.events?.[evDef.id]?.keepsakes, nos, { worldOf: worldNo, eventFood: Boolean(food && isEventRecipe(food.dish)) }) : { power: 0, list: [] };
  // 稱號加成（湘 11/27）：戴著才有效；一統「不容異議」也會關掉
  const tb = sideSkill?.noBuffs ? null : state.title?.buff;
  const titlePower = (Number(tb?.power) || 0) + (tb?.event && enemy?.event === tb.event ? Number(tb.eventPower) || 0 : 0);
  const foodV = food?.kind === 'power' ? food.value + (Number(tb?.food) || 0) : 0;
  const mult = (1 + (sameSeries && !sideSkill?.noSeries ? SERIES_BONUS : 0)) * (1 + (weakHit ? WEAK_BONUS : 0)) * (1 + (bond ? bond.power : heroParty && !sideSkill?.noBond ? HERO_PARTY_BONUS : 0)) * (1 + foodV) * (1 + titlePower) * (1 + skills.power) * (1 + keepsakes.power) * (1 + sideBonus.power) * (sideSkill?.mult ?? 1);
  const total = Math.round((raw - rumorOut) * mult * 10) / 10;
  // 料理多加了幾點戰力（拿掉料理那一層算一次，差多少就是料理的功勞）
  const foodPower = food?.kind === 'power' ? Math.round((total - Math.round((raw - rumorOut) * mult / (1 + foodV) * 10) / 10) * 10) / 10 : 0;
  return { members, raw: Math.round(raw * 10) / 10, total, sameSeries: sameSeries && !sideSkill?.noSeries, weakHit, heroParty: heroParty && !sideSkill?.noBond, bond, food, foodPower, skills, keepsakes, sideSkill, sideBonus, titlePower };
}

// 預估：勝率與評語
export function forecast(state, nos, enemyId) {
  const team = teamPower(state, nos, enemyId);
  const ratio = team.total / enemyFor(state, enemyId).power;
  const chance = ratio >= 1 ? 1 : ratio < 0.7 ? 0 : (ratio - 0.7) / 0.3;
  const label = ratio >= 1.6 ? '輕鬆勝利' : ratio >= 1.2 ? '穩穩的' : ratio >= 1 ? '勢均力敵' : ratio >= 0.7 ? '有點危險' : '還打不贏';
  return { ...team, ratio, chance, label, minutes: Math.max(1, Math.round(enemyFor(state, enemyId).minutes * (team.weakHit ? .75 : 1) * (1 - Math.min(SPEED_CAP, (team.bond?.speed || 0) + (team.food?.kind === 'speed' ? team.food.value : 0) + (team.skills?.speed || 0))))), stars: starsOf(ratio, chance === 1) };
}

export const scoreOf = (ratio, weakHit, win) => (win ? Math.round(ratio * 1000) + (weakHit ? 150 : 0) : Math.round(ratio * 400));
// 三星小禮物：每一關第一次拿到三星送一份（野生小怪不算）
export const STAR_GIFT = { badges: 1, fossils: 2 };
export const STAR_BONUS = { fossils: 1 }; // 之後每次再打到三星的小小獎勵
export function starGiftFor(chapter, rand = Math.random) {
  const pool = INGREDIENTS.filter((i) => i.chapter === chapter);
  return { ...STAR_GIFT, ingredients: pool.length ? [pool[Math.floor(rand() * pool.length) % pool.length].id] : [] };
}
export const starGiftText = (g) => [g.badges && `徽章 +${g.badges}`, g.fossils && `+${g.fossils} 化石`, g.ingredients?.length && ingredientText(g.ingredients)].filter(Boolean).join('、');
export const starsOf = (ratio, win) => (!win ? 0 : ratio >= 1.6 ? 3 : ratio >= 1.2 ? 2 : 1);

const ACTIONS = {
  daily: '{name}揮了揮湯匙，認真地打了一下！', weather: '{name}招來一陣風，把對手吹得東倒西歪。', animals: '{name}撲上去咬了一口（輕輕的）。',
  friends: '{name}大喊「大家加油！」，隊伍士氣上升！', date: '{name}拋了一個飛吻，對手害羞得愣住了。', holiday: '{name}放了一串小煙火，砰砰砰！',
  county: '{name}拿出家鄉名產，丟！', recipe: '{name}丟出剛烤好的餅乾，香到對手分心。', memorial: '{name}拿出珍藏的照片，閃光攻擊！', special: '{name}身上冒出神秘的光芒。',
};
const actionLine = (no) => (SPOKEN[no] ? `${CHARACTERS[no].name}：「${SPOKEN[no].dispatch}」` : (ACTIONS[CHARACTERS[no]?.series] || ACTIONS.daily).replaceAll('{name}', CHARACTERS[no].name));

// 目前能派的小湘（有收集、沒有在出門或討伐、沒有在休息）
export function available(state, now = Date.now(), busy = new Set()) {
  const rest = state.battle?.rest || {};
  return Object.keys(state.dex || {}).filter((no) => CHARACTERS[no] && !busy.has(no) && !(Date.parse(rest[no] || 0) > now));
}

// 最強隊伍（從可派的小湘裡挑）
export function compareTeams(state, enemyId, pool) {
  const buckets=new Map();
  for(const no of [...new Set(pool)].filter(n=>state.dex?.[n]&&CHARACTERS[n]).sort((a,b)=>siangPower(state,b).power-siangPower(state,a).power)) {
    const key=CHARACTERS[no].series+':'+(siangPower(state,no).bond===5);const list=buckets.get(key)||[];
    if(list.length<3)list.push(no);buckets.set(key,list);
  }
  const candidates=[...buckets.values()].flat(), teams=[];
  const add=nos=>{if(nos.length&&nos.every(n=>pool.includes(n))){const f=forecast(state,nos,enemyId);if(f.bond&&f.bond.id!=='general'&&f.bond.id!=='heroes'&&!state.teamBonds?.unlocked?.[f.bond.id])return;teams.push({nos:[...nos],...f});}};
  if(candidates.length<3)add(candidates);
  for(let a=0;a<candidates.length;a++)for(let b=a+1;b<candidates.length;b++)for(let c=b+1;c<candidates.length;c++)add([candidates[a],candidates[b],candidates[c]]);
  for(const bond of TEAM_BONDS)add(bond.nos);
  const strength=teams.reduce((best,t)=>!best||t.total>best.total?t:best,null);
  const safe=teams.filter(t=>t.chance===1);
  const fastest=(safe.length?safe:teams).reduce((best,t)=>!best||t.minutes<best.minutes||(t.minutes===best.minutes&&t.total>best.total)?t:best,null);
  const heroes=teams.find(t=>t.heroParty)||null;
  return {strength,fastest,heroes};
}
export function bestTeam(state,enemyId,pool) { return compareTeams(state,enemyId,pool).strength; }

// 戰敗原因：先看換隊能不能贏，再看哪一項成長最有效
export function diagnose(state, nos, enemyId, pool) {
  const enemy = enemyFor(state, enemyId);
  const now = forecast(state, nos, enemyId);
  const best = bestTeam(state, enemyId, [...new Set([...pool, ...nos])]);
  if (best && best.ratio >= 1 && best.total > now.total * 1.05) {
    const names = best.nos.map((no) => CHARACTERS[no].name).join('、');
    const why = nos.length < TEAM_MAX && best.nos.length > nos.length ? '多帶幾位一起去' : best.weakHit && !now.weakHit ? `帶上${enemy.weak.map((s) => SERIES[s]?.short).join('或')}系列的小湘` : '換一下隊伍';
    return { kind: 'team', text: `${why}就打得贏！試試看：${names}（預估戰力 ${best.total}，對手 ${enemy.power}）。`, team: best.nos };
  }
  // 換隊也打不贏 → 成長方向
  const members = now.members;
  const lowBond = members.filter((m) => m.bond < 5).sort((a, b) => a.bond - b.bond)[0];
  const lowTrain = members.filter((m) => m.train < MAX_TRAIN).sort((a, b) => a.train - b.train)[0];
  const gap = Math.max(0, Math.ceil(enemy.power - now.total));
  const tips = [];
  if (lowBond) tips.push(`把${CHARACTERS[lowBond.no].name}的好感度從 Lv.${lowBond.bond} 練高（每級 +20% 戰力）`);
  if (lowTrain) tips.push(`用徽章特訓${CHARACTERS[lowTrain.no].name}（每級 +8%）`);
  if (!now.weakHit && enemy.weak.length) tips.push(`收集${enemy.weak.map((s) => SERIES[s]?.short).join('或')}系列的小湘（剋制 +30%）`);
  if (!tips.length) tips.push('先回前面的關卡多打幾次，累積徽章');
  return { kind: 'grow', text: `還差大約 ${gap} 點戰力。建議${tips.slice(0, 2).join('，或')}。` };
}

// 出發：先算好結果存起來（重新整理不會重抽）。回傳錯誤字串或 battle 物件
// 副本專屬隊伍（湘 11/27 選）：副本多一格只能打副本的隊伍，不搶主線／活動／野外的隊伍；小湘忙碌、休息照舊共用
export const SIDE_EXTRA_SLOTS = 1;
export function slotUse(state) {
  const a = state.battle?.active || [];
  const side = a.filter((x) => String(x.enemy).startsWith('side:')).length;
  const extra = sideOn() ? SIDE_EXTRA_SLOTS : 0;
  return { used: a.length - Math.min(side, extra), side, extra, sideUsed: Math.min(side, extra), sideFree: side < extra };
}
// 這一關現在還能不能再派一隊
export const slotFull = (state, enemyId) => { const u = slotUse(state); return !(u.used < teamSlots(state) || (String(enemyId || '').startsWith('side:') && u.sideFree)); };

// 這一關現在能不能連戰：回傳 { ok, reason, runs(minutes) }
export function nightStatus(state, enemyId, now = new Date()) {
  const enemy = enemyFor(state, enemyId);
  if (!enemy || enemy.wild || enemy.side) return { ok: false, reason: '野外和副本不能連戰' };
  const ev = enemy.event ? parseStageKey(enemyId) : null;
  const clears = ev ? progressOf(state, ev.eventId).stages[ev.stageId]?.clears : state.battle?.stages?.[enemyId]?.clears;
  if (!clears) return { ok: false, reason: '先打贏這關一次才能連戰' };
  if (!nightTickets(state, now)) return { ok: false, used: true, reason: '夜戰券用完了，中午 12 點補 1 張' };
  return { ok: true };
}
export const nightRuns = (minutes) => Math.max(1, Math.min(NIGHT.maxRuns, Math.floor(NIGHT.hours * 60 / Math.max(1, minutes))));

export function startBattle(state, enemyId, nos, { now = new Date(), rand = Math.random, busy = new Set(), night = false } = {}) {
  const b = ensureBattle(state);
  const enemy = enemyFor(state, enemyId);
  if (!enemy) return '找不到這個對手。';
  const wildEntry = enemy.wild ? b.wild.list.find((x) => x.key === enemyId) : null;
  const ev = enemy.event ? parseStageKey(enemyId) : null;
  const sd = enemy.side ? parseSideKey(enemyId) : null;
  if (wildEntry?.defeated) return '這隻已經被打跑了，明天會有新的野生小怪。';
  if (b.active.some((a) => a.enemy === enemyId)) return '已經有隊伍在打這隻了。';
  if (!unlocked(state, enemyId)) return '要先打贏前一關。';
  nos = [...new Set(nos || [])];
  if (!nos.length) return '先選一位小湘。';
  if (nos.length > TEAM_MAX) return `一隊最多 ${TEAM_MAX} 位。`;
  if (slotFull(state, enemyId)) { const nx = nextTeamSlot(state); return `同時最多 ${teamSlots(state)} 隊，等她們回來吧。${nx ? `收集 ${nx.need} 位小湘可以開第 ${nx.slots} 隊。` : ''}`; }
  const free = available(state, now.getTime(), busy);
  if (nos.some((no) => !free.includes(no))) return '有小湘正在忙或休息中。';
  if (night) { const ns = nightStatus(state, enemyId, now); if (!ns.ok) return `${ns.reason}。`; }
  const f = forecast(state, nos, enemyId);
  const win = rand() < f.chance;
  const score = scoreOf(f.ratio, f.weakHit, win);
  const stars = starsOf(f.ratio, win);
  const minutes = f.minutes;
  const discovered = discoverBond(state, nos, now);
  const log = [enemy.intro, ...nos.map(actionLine)];
  if (f.weakHit) log.push(`✦ 效果拔群${enemy.weakTag ? `｜${enemy.weakTag.replace(/[！!]+$/, '')}` : ''}！${enemy.weakHit}`);
  if (f.bond) log.push(`♡ ${f.bond.name}｜${effectText(f.bond)}${discovered ? '｜三人合照閃卡已收藏！' : ''}`);
  if (f.sideSkill && enemy.skill) log.push(...skillLines(enemy.skill, f.sideSkill, nos));
  if (f.sideBonus?.n) log.push(`🏝️ 主場加成｜${SERIES[enemy.weak?.[0]]?.short || ''}居民 ${f.sideBonus.n} 位，戰力 +${Math.round(f.sideBonus.power * 100)}%`);
  for (const s of f.skills?.list || []) log.push(`✧ ${CHARACTERS[s.no].name}｜${s.name}：${s.text}`);
  if (f.food) { log.push(`🍳 ${CHARACTERS[f.food.no].name}吃過的料理發揮作用｜${buffText(f.food)}`); useFood(state, f.food); }
  if (f.heroParty) log.push(...PARTY_LINES.map((l) => `${l.speaker}：「${l.text}」`), `✦ ${PARTY_REPORT}`);
  log.push(win ? enemy.win : enemy.lose);
  if (win && enemy.winNote) log.push(enemy.winNote);
  // 隊伍裡有徽章限定小湘：由最稀有的那位說勝利／戰敗台詞
  const speaker = nos.filter((no) => SPOKEN[no]).sort((a, c) => (RARITY_POWER[CHARACTERS[c].rarity] || 0) - (RARITY_POWER[CHARACTERS[a].rarity] || 0))[0];
  if (speaker) log.push(`${CHARACTERS[speaker].name}：「${SPOKEN[speaker][win ? 'victory' : 'defeat']}」`);
  const advice = win ? null : diagnose(state, nos, enemyId, free.filter((no) => !nos.includes(no)));
  const prev = enemy.wild ? { stars: 0, best: b.weekBest, last: wildEntry?.last || 0, clears: 0, tries: wildEntry?.tries || 0 } : ev ? { last: 0, ...(progressOf(state, ev.eventId).stages[ev.stageId] || { stars: 0, best: 0, clears: 0, tries: 0 }) } : sd ? { last: 0, ...(state.side?.lines?.[sd.lineId]?.stages?.[sd.stageId] || { stars: 0, best: 0, clears: 0, tries: 0 }) } : (b.stages[enemyId] || { stars: 0, best: 0, last: 0, clears: 0, tries: 0 });
  const loot = enemy.wild
    ? (win ? { badges: Math.max(1, Math.round((enemy.boss ? 3 : 1) * enemy.reward)), energy: Math.round(enemy.power * 0.4 * enemy.reward), fossils: (enemy.trait.id === 'shiny' ? 3 : 0) + (enemy.boss ? 2 : 0) } : { badges: 0, energy: 5, fossils: 0 })
    : win
      ? { badges: enemy.boss ? 3 : 1, energy: Math.round(enemy.power * (0.5 + 0.1 * stars)), fossils: enemy.boss ? 3 : 0, firstBoss: enemy.boss && !prev.clears }
      : { badges: 0, energy: 5, fossils: 0 };
  // 系列支線：化石另外算（recordSideRun），不送願望蛋；經濟制裁＝能量減半
  if (sd) { loot.fossils = 0; loot.firstBoss = false; if (f.sideSkill?.lootHalf) loot.energy = Math.floor(loot.energy / 2); }
  const chapterNo = enemy.wild || ev || sd ? Math.max(...CHAPTERS.filter((c) => unlocked(state, c.stages[0])).map((c) => c.id), 1) : (CHAPTERS.find((c) => c.stages.includes(enemyId))?.id || 1);
  loot.ingredients = dropsFor(chapterNo, { win, boss: Boolean(enemy.boss), gather: f.food?.kind === 'gather' ? 1 : 0, event: ev ? ev.eventId : null }, rand);
  if (!enemy.wild && !ev && !sd && win && stars === 3) { if (prev.stars < 3) loot.starGift = starGiftFor(chapterNo, rand); else loot.starBonus = { ...STAR_BONUS }; }
  let nightInfo = null;
  if (night) {
    // 第一場照上面算好的；後面每場各自擲勝負，最後全部合計打 5 折
    const runs = nightRuns(minutes); let wins = win ? 1 : 0;
    const sum = { badges: loot.badges, energy: loot.energy, fossils: loot.fossils };
    for (let k = 1; k < runs; k++) {
      const w = rand() < f.chance; if (w) wins += 1;
      const st2 = starsOf(f.ratio, w);
      sum.badges += w ? (enemy.boss ? 3 : 1) : 0; sum.energy += w ? Math.round(enemy.power * (0.5 + 0.1 * st2)) : 5; sum.fossils += w && enemy.boss ? 3 : 0;
    }
    for (const k of ['badges', 'energy', 'fossils']) loot[k] = Math.round(sum[k] * NIGHT.mult);
    nightInfo = { runs, wins, mult: NIGHT.mult };
    state.battle.nightDay = nightDayKey(now);
  }
  const report = { win, score, stars, ratio: Math.round(f.ratio * 100) / 100, power: f.total, enemyPower: enemy.power, weakHit: f.weakHit, sameSeries: f.sameSeries, heroParty: f.heroParty, bond: f.bond?.id || null, discovered: discovered?.id || null, log, advice, loot, prevBest: prev.best, prevLast: prev.last, tries: prev.tries, ...(f.sideSkill?.lootHalf ? { lootHalf: true } : {}), ...(nightInfo ? { night: nightInfo } : {}) };
  if (nightInfo) log.push(`🌙 連戰到天亮｜一路打了 ${nightInfo.runs} 場、贏了 ${nightInfo.wins} 場，獎勵合計打 5 折帶回來`);
  if (enemy.story && !enemy.wild && !ev && !b.story[`${enemyId}:before`]) b.story[`${enemyId}:before`] = iso(now); // 看過 Boss 開場故事
  const battle = { id: `${now.getTime().toString(36)}-${enemyId}`, enemy: enemyId, nos, start: iso(now), until: iso(new Date(now.getTime() + (IS_TEST ? TEST_BATTLE_MS : (nightInfo ? NIGHT.hours * 60 : minutes) * 60e3))), report, ...(nightInfo ? { night: true } : {}), ...(wildEntry ? { snapshot: wildEntry } : ev || sd ? { snapshot: enemy } : {}) };
  b.active.push(battle);
  return battle;
}

export const isBack = (battle, now = Date.now()) => Date.parse(battle.until) <= now;
export const battleNos = (state) => new Set((state.battle?.active || []).flatMap((a) => a.nos));

// 收下戰報：發獎勵、記分數、讓小湘休息
export function collectBattle(state, id, now = new Date(), rand = Math.random) {
  const b = ensureBattle(state);
  const i = b.active.findIndex((a) => a.id === id);
  if (i < 0 || !isBack(b.active[i], now.getTime())) return null;
  const [battle] = b.active.splice(i, 1);
  const { report: r } = battle; const isEvent = battle.enemy.startsWith('event:'); const isSide = battle.enemy.startsWith('side:');
  const enemy = isEvent || isSide ? (battle.snapshot || enemyFor(state, battle.enemy)) : battle.snapshot ? wildEnemy(battle.snapshot) : ENEMIES[battle.enemy];
  let st, evGain = null, sideGain = null;
  countBondRuns(state, battle.nos);
  if (isSide) {
    // 系列支線：進度記在 state.side
    sideGain = recordSideRun(state, enemy.side, enemy.sideStage, r, battle.nos, { now, rand, lootHalf: Boolean(r.lootHalf) });
    st = state.side?.lines?.[enemy.side]?.stages?.[enemy.sideStage] || { best: 0, clears: 0 };
  } else if (isEvent) {
    // 異世活動：進度記在 state.events，不寫進 battle.stages
    const p = parseStageKey(battle.enemy) || { eventId: enemy.event, stageId: enemy.eventStage };
    evGain = recordEventRun(state, p.eventId, p.stageId, r, { now, rand, worldOf: worldNo, nos: battle.nos });
    st = progressOf(state, p.eventId).stages[p.stageId] || { best: 0, clears: 0 };
  } else if (enemy.wild) {
    // 野外：記「本週最高分」，打贏的那隻今天就不會再出現
    const week = weekOf(now);
    if (b.week !== week) { b.week = week; b.weekBest = 0; }
    const entry = b.wild?.list.find((x) => x.key === battle.enemy);
    if (entry) { entry.tries = (entry.tries || 0) + 1; entry.last = r.score; if (r.win) entry.defeated = true; }
    st = { best: b.weekBest, clears: r.win ? 1 : 0 };
    if (r.score > b.weekBest) b.weekBest = r.score;
    if (r.win) b.wildWins += 1;
  } else {
    st = (b.stages[battle.enemy] ||= { stars: 0, best: 0, last: 0, clears: 0, tries: 0 });
    st.tries += 1; st.last = r.score;
    if (r.win) { st.clears += 1; st.stars = Math.max(st.stars, r.stars); if (st.clears === 1 && !st.firstAt) st.firstAt = now.toISOString(); }
  }
  const record = r.score > (enemy.wild || isEvent || isSide ? r.prevBest : st.best); if (!enemy.wild && !isEvent && !isSide && record) st.best = r.score;
  const best = enemy.wild ? b.weekBest : st.best;
  b.badges += r.loot.badges; state.energy += r.loot.energy; if (r.loot.fossils) state.fossils = (state.fossils || 0) + r.loot.fossils;
  if (r.loot.firstBoss) state.wishEgg.stock += 1;
  if (r.loot.ingredients?.length) addIngredients(state, r.loot.ingredients);
  const gift = r.loot.starGift || null;
  if (r.loot.starBonus) state.fossils = (state.fossils || 0) + (r.loot.starBonus.fossils || 0);
  if (gift) { b.badges += gift.badges || 0; state.fossils = (state.fossils || 0) + (gift.fossils || 0); addIngredients(state, gift.ingredients); if (st) st.starGiftAt = now.toISOString(); }
  const restUntil = iso(new Date(now.getTime() + (IS_TEST ? 0 : (battle.night ? NIGHT.rest : REST_MINUTES) * 60e3))); // 測試服不用休息；連戰回來休息 2 小時
  for (const no of battle.nos) b.rest[no] = restUntil;
  b.total += 1; if (r.win) b.wins += 1;
  const gains = [r.night && `🌙 連戰 ${r.night.runs} 場（贏 ${r.night.wins} 場）· 獎勵 5 折`, r.loot.badges && `徽章 +${r.loot.badges}`, r.loot.energy && `+${r.loot.energy} 能量`, r.loot.fossils && `+${r.loot.fossils} 化石`, r.loot.firstBoss && '第一次打倒 Boss：願望蛋 +1', r.loot.ingredients?.length && `食材：${ingredientText(r.loot.ingredients)}`, r.loot.starBonus && `再次三星 ⭐ +${r.loot.starBonus.fossils} 化石`, evGain?.tokens && `${EVENT_DEFS[enemy.event]?.token.icon || ''} ${EVENT_DEFS[enemy.event]?.token.name || '代幣'} +${evGain.tokens}`, evGain?.daily && `☀️ 今日首勝：${EVENT_DEFS[enemy.event]?.token.name || '代幣'} +${evGain.daily}`, evGain?.keepsake && `信物「${evGain.keepsake.name}」`, evGain?.title && `五件信物收齊：稱號「${EVENT_DEFS[enemy.event]?.titles?.[evGain.title] || ''}」`, sideGain?.fossils && `+${sideGain.fossils} 化石${sideGain.first ? '（首勝）' : ''}`, r.lootHalf && '💰 經濟制裁：能量、化石減半', sideGain?.candy && `🍬 ${SERIES[sideGain.series]?.short || ''}星光糖 +${sideGain.candy}`, sideGain?.keepsake && `信物「${sideGain.keepsake.name}」`, sideGain?.title && `全線三星：稱號「${sideGain.title}」`, sideGain?.complete && `「${sideGain.lineName}」全線通關！`, sideGain?.resident && `🥚 ${CHARACTERS[sideGain.resident]?.name || ''}的紀念蛋送到蛋架了`].filter(Boolean);
  const firstClear = r.win && st.clears === 1;
  // 異世活動：第一次通關才在戰報播「打完後」（MO-05 再接上卷結尾）；解鎖紀錄在 state.events[id].story
  const ksDef = isEvent ? EVENT_DEFS[enemy.event]?.keepsakes : null; // 拿到信物＝播那件的小劇情；收齊再接「收齊」
  const story = isEvent ? ((evGain?.first && enemy.story ? [enemy.story.after, enemy.story.ending] : evGain?.keepsake ? [evGain.keepsake.story, evGain.complete && ksDef?.completeStory] : []).filter(Boolean).join('\n') || null)
    : isSide ? (sideGain?.keepsake ? `【${sideGain.keepsake.name}】${sideGain.keepsake.text}` : null)
    : enemy.story && r.win && !b.story[`${battle.enemy}:after`] ? (b.story[`${battle.enemy}:after`] = now.toISOString(), enemy.story.after) : null;
  const clue = firstClear && enemy.clue ? enemy.clue : null;
  // 咕咕書評：依結果挑一種，結算時就決定並存起來（檔案館讀存好的，不會每次重抽）
  const prevStage = enemy.wild || isEvent || isSide ? null : { clears: st.clears - (r.win ? 1 : 0), best: r.prevBest, tries: r.tries, lastWin: st.lastWin };
  const kind = reviewKind(r, enemy, prevStage);
  const lines = GUGU_REVIEWS[kind] || [];
  const note = observe(kind, r, enemy, prevStage);
  const review = lines.length ? { kind, text: lines[Math.floor(rand() * lines.length) % lines.length], ...(note ? { note } : {}), at: now.toISOString() } : null;
  if (!enemy.wild && !isEvent && !isSide) { st.lastWin = r.win; if (review) st.review = review; }
  return { ...battle, report: r, record, best, starGift: gift, delta: r.tries ? r.score - r.prevLast : null, gains, story, clue, review, wild: Boolean(enemy.wild), event: evGain ? { id: enemy.event, stage: enemy.eventStage, ...evGain } : null, side: sideGain ? { line: enemy.side, stage: enemy.sideStage, ...sideGain } : null, ...(isEvent || isSide ? { snapshot: undefined, eventEnemy: enemy } : {}) };
}

// 徽章兌換專屬蛋：孵化後才加入隊伍，不進隨機蛋池
export function heroStatus(state, no) {
  const offer = heroOffer(no); if (!offer) return null;
  const owned = Boolean(state.dex?.[no]);
  const pending = [state.egg, ...(state.shelf || []), ...(state.gifts?.eggs || [])].some(e => e?.character === no);
  const missing = (offer.requires || []).filter((id) => !state.battle?.stages?.[id]?.clears);
  const badges = state.battle?.badges || 0;
  return { ...offer, owned, pending, missing, locked: missing.length > 0, short: Math.max(0, offer.cost - badges), ready: !owned && !pending && !missing.length && badges >= offer.cost };
}
export function redeemHero(state, no, now = new Date()) {
  const b = ensureBattle(state);
  const st = heroStatus(state, no);
  if (!st) return '這位小湘不能用徽章兌換。';
  if (st.owned) return `${CHARACTERS[no].name}已經在隊伍裡了。`;
  if (st.pending) return `${CHARACTERS[no].name}的專屬蛋已兌換，正在等你孵化。`;
  if (st.locked) return `還不能兌換：${st.requireText}。`;
  if (b.badges < st.cost) return `徽章不夠，還差 ${st.cost - b.badges} 個。`;
  b.badges -= st.cost;
  const egg = { egg: 'keepsake', character: no, from: `badge:${no}`, at: now.toISOString() };
  ensureGifts(state).eggs.push(egg);
  return { no, cost: st.cost, egg, line: HERO_LINES[no].redeem };
}

// 特訓：花徽章讓一位小湘永久變強
export function trainCost(state, no) { const lv = state.battle?.train?.[no] || 0; return lv >= MAX_TRAIN ? null : TRAIN_COST[lv]; }
export function train(state, no) {
  const b = ensureBattle(state);
  if (!state.dex?.[no]) return '還沒遇見這位小湘。';
  const cost = trainCost(state, no);
  if (cost === null) return '特訓已經滿級了！';
  if (b.badges < cost) return `徽章不夠，需要 ${cost} 個。`;
  b.badges -= cost; b.train[no] = (b.train[no] || 0) + 1;
  return { no, level: b.train[no], cost };
}

// Boss 開戰前的故事（每個 Boss 只自動顯示一次）
export function bossIntro(state, enemyId) {
  const e = ENEMIES[enemyId]; if (!e?.story) return null;
  const key = `${enemyId}:before`;
  if (state.battle.story[key]) return null;
  state.battle.story[key] = new Date().toISOString();
  return e.story.before;
}
export const restLeft = (state, no, now = Date.now()) => Math.max(0, Date.parse(state.battle?.rest?.[no] || 0) - now);
export const fmtMinutes = (ms) => { const m = Math.ceil(ms / 60e3); return m >= 60 ? `${Math.floor(m / 60)} 小時 ${m % 60} 分` : `${Math.max(1, m)} 分鐘`; };

export const enemyArtPath = (id, state) => { const e = state ? enemyFor(state, id) : ENEMIES[id]; return `assets/enemies/${e?.art || id}.webp`; };

// ── 野外巡邏：每天隨機生成野生小怪（用現有敵人的圖＋隨機個性）
export const WILD_TRAITS = [
  { id: 'sleepy', label: '愛睏的', icon: '💤', power: 0.75, reward: 0.8, scale: 0.92, hue: 0, line: '打了一個大大的呵欠，眼睛快閉起來了。' },
  { id: 'tiny', label: '迷你的', icon: '🔹', power: 0.6, reward: 0.7, scale: 0.72, hue: 0, line: '小小一隻，但看起來很努力。' },
  { id: 'lost', label: '迷路的', icon: '❓', power: 0.85, reward: 0.9, scale: 1, hue: 0, line: '東張西望，好像在找回家的路。' },
  { id: 'hungry', label: '肚子餓的', icon: '🍽️', power: 0.95, reward: 1, scale: 1, hue: 10, line: '肚子咕嚕咕嚕叫，看到什麼都想吃。' },
  { id: 'angry', label: '生氣的', icon: '💢', power: 1.15, reward: 1.2, scale: 1.02, hue: -20, line: '氣到冒煙，誰靠近就跟誰吵架！' },
  { id: 'proud', label: '驕傲的', icon: '👑', power: 1.25, reward: 1.3, scale: 1.05, hue: 30, line: '抬頭挺胸：「本大爺很強的！」' },
  { id: 'giant', label: '巨大的', icon: '⬆️', power: 1.45, reward: 1.6, scale: 1.18, hue: 0, line: '比平常大了好幾號，影子把大家都蓋住了！' },
  { id: 'shiny', label: '閃亮的', icon: '✨', power: 1.2, reward: 2, scale: 1, hue: 0, shiny: true, rare: true, line: '全身閃閃發光，好像是很稀有的品種！' },
];
const WILD_SERIES = ['daily', 'weather', 'animals', 'friends', 'county', 'holiday', 'date'];
export const WILD_PER_DAY = 4;
// 野外只會遇到「已經解鎖的關卡」的敵人，避免還沒打到的章節、EX 先在野外劇透（湘 11/19 決定）
const BOSS_IDS = Object.keys(ENEMIES).filter((id) => ENEMIES[id].boss);
const MINION_IDS = Object.keys(ENEMIES).filter((id) => !ENEMIES[id].boss);
export const wildBases = (state) => {
  const open = (ids) => ids.filter((id) => unlocked(state, id));
  const minions = open(MINION_IDS);
  return { minions: minions.length ? minions : [ORDER[0]], bosses: open(BOSS_IDS) };
};

function seeded(text) {
  let h = 2166136261;
  for (const ch of text) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function weekOf(date) { const d = new Date(date); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

// 目前最強三人的戰力（不含加成），當作野生小怪的強度基準
function strength(state) {
  const powers = Object.keys(state.dex || {}).map((no) => siangPower(state, no)?.power || 0).sort((a, b) => b - a);
  return Math.max(10, powers.slice(0, TEAM_MAX).reduce((n, p) => n + p, 0));
}

export function wildEnemy(w) {
  const base = ENEMIES[w.base]; const trait = WILD_TRAITS.find((t) => t.id === w.trait) || WILD_TRAITS[0];
  return {
    key: w.key, wild: true, base: w.base, trait, boss: Boolean(w.boss), stage: w.boss ? '野外 · 流浪 Boss' : '野外', name: `${trait.label}${base.name}`,
    emoji: base.emoji, art: base.art, power: w.power, minutes: Math.round(base.minutes * (w.boss ? 1 : 0.8)), weak: w.weak, reward: trait.reward * (w.boss ? 1.5 : 1),
    intro: `${trait.line}${base.intro}`, weakHit: base.weakHit, weakTag: base.weakTag, win: base.win, lose: base.lose, clue: null, story: null,
  };
}

// 每天換一批：強度從「很好打」到「要努力」，偶爾有閃亮小怪或流浪 Boss
export function ensureWild(state, date = todayKey()) {
  const b = state.battle;
  if (b.wild?.date === date) return b.wild;
  const rand = seeded(`wild:${date}`);
  const pick = (list) => list[Math.floor(rand() * list.length) % list.length];
  const base = strength(state);
  const ratios = [0.55, 0.85, 1.05, 1.35];
  const commons = WILD_TRAITS.filter((t) => !t.rare);
  const pool = wildBases(state);
  const list = ratios.map((ratio, i) => {
    const wandering = i === WILD_PER_DAY - 1 && rand() < 0.15 && pool.bosses.length > 0;
    const enemy = wandering ? pick(pool.bosses) : pick(pool.minions);
    const trait = rand() < 0.12 ? WILD_TRAITS.find((t) => t.shiny) : pick(commons);
    const weak = [...new Set([pick(WILD_SERIES), ...(rand() < 0.4 ? [pick(WILD_SERIES)] : [])])];
    const power = Math.max(6, Math.round(base * ratio * (wandering ? 1.15 : 1) * (0.9 + rand() * 0.2)));
    return { key: `wild:${date}:${i}`, base: enemy, trait: trait.id, boss: wandering, weak, power, defeated: false };
  });
  b.wild = { date, list };
  return b.wild;
}
export const weekBest = (state, now = new Date()) => (state.battle?.week === weekOf(now) ? state.battle.weekBest : 0);

// 咕咕書評的種類（依 REVIEW_ORDER 由上往下取第一個符合的）
export function reviewKind(r, enemy, prev) {
  const p = prev || { clears: 0, best: 0, tries: 0, lastWin: undefined };
  const hit = {
    firstBoss: r.win && enemy.boss && p.clears === 0,
    record: p.tries > 0 && p.best > 0 && r.score > p.best,
    threeStar: r.win && r.stars === 3,
    firstWin: r.win && p.clears === 0,
    comeback: r.win && p.lastWin === false,
    weakHit: r.win && r.weakHit,
    repeat: r.win && p.clears > 0,
    defeat: !r.win,
  };
  return REVIEW_ORDER.find((k) => hit[k]) || (r.win ? 'repeat' : 'defeat');
}

// 咕咕的觀察筆記：嘴上嫌棄，其實每一場都有在看。只用真實紀錄，沒有可說的就不寫。
export function observe(kind, r, enemy, prev) {
  if (!prev) return null; // 野外不記
  const losses = Math.max(0, (prev.tries || 0) - (prev.clears || 0));
  const gain = r.score - (r.prevLast || 0);
  if (kind === 'record' && prev.best) return `（上次最高 ${prev.best}，這次 ${r.score}。……我有記下來。）`;
  if (kind === 'comeback' && losses) return `（之前輸了 ${losses} 次。我都看到了。）`;
  if ((kind === 'firstWin' || kind === 'firstBoss' || kind === 'threeStar') && prev.clears === 0 && prev.tries > 0) return `（第 ${prev.tries + 1} 次挑戰才贏。……我可沒有在數。）`;
  if (kind === 'repeat' && prev.clears >= 2) return `（這是第 ${prev.clears + 1} 次打倒${enemy.name}了。）`;
  if (kind === 'defeat' && prev.tries > 0 && gain > 0) return `（不過比上次多了 ${gain} 分。……只是順便提一下。）`;
  if (kind === 'defeat' && prev.tries === 0) return '（第一次來就挑這本，膽子倒是不小。）';
  return null;
}
