# 頁間居民：遊戲架構與改動地圖

改東西之前先看這份地圖。它幫你找出這次改動會碰到哪些玩法、要看哪些檔案、要驗哪些流程。

- 底稿是皮寶的《頁間居民遊戲架構與改動地圖》，德寶在 2026-11-28 拿 main `c05262c` 的程式逐條核對過，錯的已經改掉，缺的也補上了。
- 分工：湘決定玩家會遇到什麼；德寶照著地圖找出要改的地方；皮寶照同一條路線複驗。
- 這份只寫架構和路線。細節以程式和各自的文件為準，上新角色照 [NEW_RESIDENT.md](NEW_RESIDENT.md)。
- 程式結構有變的時候（新系統、新存檔欄位、新規則），請在同一次推送裡一起更新這份。

## 1. 主循環

做日常拿能量 → 孵蛋遇見居民 → 入住培養感情、打開故事 → 帶居民出門或討伐 → 拿到資源、線索或新的蛋，再回到收藏。

料理把討伐跟日常接起來：討伐撿到的食材煮成菜，餵居民能加好感，也能拿到一次性的討伐加成。研究室則把已經收藏的居民變成新收藏的線索：兩位居民符合配方就能調配，最後得到紀念蛋。

## 2. 系統分區（玩家在做什麼 → 檔案 → 存檔欄位）

| 系統 | 玩家在做什麼 | 主要檔案 | 存檔 `state.` |
|---|---|---|---|
| 每日願望 | 每天三個願望（照片、小測驗、行動） | wishes.js、wish-copy.js、wish-presenter.js、wish-voice-*.js | wishes |
| 願望印記 | 三個願望都完成拿一枚，集滿 3 枚換一顆願望蛋 | wish-egg.js | wishEgg |
| 研究者等級／成長願望 | 等級、章節目標、領取已完成的願望 | progression.js | player |
| 月簽到 | 7／14／21／28 天各有獎勵，28 天送星光蛋 | checkin.js | checkin |
| 每週賓果 | 3×3 小任務，連成一線領獎 | bingo.js | bingo |
| 小恐龍轉盤 | 每天 3 次，用能量押注轉盤 | wheel.js、dino.js | wheel、dino |
| 湘的委託／記憶檔案／約會碼 | 照片委託要接雲端；湘蓋章發獎 | commissions.js、missions.js、gifts.js | missions、memories、gifts |
| 全服信箱／兌換碼 | 領能量、蛋、化石、墨玉、星光糖 | gifts.js | gifts |
| 定位與天氣探索 | 探索附近、天氣蛋、縣市打卡 | geo.js、weather.js、travel.js | weather、travel |
| 蛋與孵化 | 選蛋、蛋架、培育、孵化、保底 | eggs.js、egg-view.js、hatch-fx.js、energy.js | egg、shelf、cradle、eggOffer、energy、hatched |
| 重複相遇 | 每次 +化石；星級 +1 到 ★5；★5 之後才給同稀有度的星光糖 | eggs.js（DUPLICATE_FOSSILS）、candy.js | dex[no].dup、fossils、candy、candyBuy |
| 化石交換所 | 換能量、指定居民、開第二個研究欄位 | fossils.js | fossils、labSlots |
| 圖鑑 | 收藏、介紹、未收集時的神秘線索 | eggs.js、intros.js、bond-art.js | dex |
| 入住與好感 | 摸頭、點她、餵布丁（每位每天上限 15 點）、升好感、羈絆故事 | room.js、home-life.js、affection.js、bond-copy.js、extra-lines.js、resident-lines.js | affection |
| 三寶同住彩蛋 | 開發團隊三位都入住才會觸發 | devteam.js、devteam-lines.js | devteam |
| 出門 | 跑腿、在家幫忙、遠行帶回縣市蛋（每天一顆）、叫回 | errands.js、errand-copy.js | errands |
| 廚房 | 用食材煮菜、餵食、口味筆記、料理加成 | kitchen.js、kitchen-lines.js、taste-profiles.js、data/SIANG_KITCHEN_TASTE_PROFILES.json | kitchen |
| 主線討伐 | 組隊、派遣、收戰報、特訓、連戰到天亮 | battle.js、team-ui.js、skills.js、team-bonds.js、battle-log.js、battle-theater.js | battle |
| 系列支線 | 常駐支線＋每週輪換支線（12/5 開放） | side.js、side-story.js、side-theater.js | side |
| 異世活動 | 活動關卡、劇情、信物、墨玉閣、封存 | events.js、event-theater.js、event-mo-story.js、mo-ssr-fx.js | events、clock |
| 頁邊茶肆 | 墨點、扶門、三寶紀念蛋（11/29 12:00 起才出現） | studio-jh.js | studioJh |
| 研究室 | 找線索、選兩位搭檔、調配倒數、領紀念蛋 | lab.js（規則）、recipes.js（配方資料）、research.js（畫面）、research-notes.js | research、recipes、lab、lab2、labSlots |
| 成就／稱號 | 成就領獎；稱號櫃只能戴一個，戴著才有加成 | achievements.js、titles.js | achievements、title |
| 紙條／劇場 | 紙條收藏、章節尾聲劇場、書靈咕咕 | letters.js、chapter-epilogue.js、gugu*.js | letters |
| 新手引導 | 教學與導覽 | tutorial.js、guide.js | tutorial、guide |

畫面怎麼串起來都在 app.js（約 5,500 行），找某個畫面先搜它的 id。

## 3. 底層（每次改都可能碰到）

- **存檔**：存在本機 localStorage `siang-collector:v1`（state.js）。寫入一律用 `updateState(s => …)`，它有跨分頁的鎖，避免同一份獎勵被領兩次。舊存檔靠 `hydrateProgression` 和各系統的 `ensureXxx(state)` 補齊欄位，**新增欄位時一定要想好舊存檔沒有這欄會怎樣**。
- **編號**：居民的存檔 key 一旦上線就不換，改顯示名稱或換系列都不能動它（已經是數字 key、後來歸到異世的居民，用 `label` 顯示就好）。No.100 保留。`CHARACTERS` 是照編號排的 Proxy；其他用編號當 key 的物件（蛋池、`state.dex`）列舉時要自己排序。
- **換版**：sw.js 採快取優先，打開遊戲只用 HEAD 檢查 changelog.json 判斷有沒有新版，所以**每次推送都要在 changelog.json 最上面加一筆**。只有測試服看得到的更新加上 `"test": true`。
- **測試服**：網址加 `?test`（test-boot.js、test-server.js），存檔跟正式服分開，第一次打開會拿到一份全滿的存檔。
- **後台**：server/worker.js（Cloudflare Worker＋D1）負責雲端備份（要邀請碼）、回家和討伐的手機通知（push.js、push-timers.js）、全服信箱、審核室和營運看板（review.js、ops.js、ops-ui.js、cloud.js）。邀請碼和 token 只存在玩家自己的裝置上。
- **可信時間**：活動和支線開關看伺服器時間（events.js `eventNow`、side.js `sideNowMs`），不看手機時間。

## 4. 湘定好的規則（不能改，除非湘明說要改）

- 成長願望和研究者等級的章節目標不要動。
- 副架可以直接放新的普通蛋，這是設計，不是漏洞。
- 墨痕蛋的新面孔 ×2 不改。
- 外出合照不加口紅。
- 「探索附近」不做手動選縣市，免得縣市蛋可以作弊。
- 視覺改動先給 2～3 種樣式的手機截圖（360–430px）讓湘挑。
- 成就的圖鑑門檻不能超過正式服拿得到的居民數（大約 115 位）。

## 5. 改一處時，沿哪條線看

| 改動 | 連帶影響（先查這些檔案） | 最小驗收 |
|---|---|---|
| 上新角色 | 照 NEW_RESIDENT.md 的 12 個檔填；異世居民還要填 world-voice.js（tests/residents-all.mjs 沒填會擋） | 還沒收集時不劇透；照指定方式拿得到；孵化後圖鑑和至少一個互動頁的圖文正確；異世居民不要寫成小湘的口吻 |
| 改取得方式或系列 | eggs.js 的蛋池、`JOIN_WHEN_OWNED`、星光蛋；fossils.js 的指定居民；achievements.js；recipes.js；換系列還要查 battle.js 的系列加成、剋制和篩選 | 新玩家拿得到；舊玩家的收藏、好感、隊伍都還對得上；角色沒有混進別的蛋池 |
| 開活動 | events.js 的 `EVENT_DEFS`（排程、章節、關卡、商店、代幣）→ event-theater.js → gifts.js（墨玉）→ ops.js 的 `timeline` | 用測試存檔走開放前、開放當下、討伐結束、商店結束四個時間點；舊紀錄都還在；獎勵只能領一次；剩下的代幣換成能量（`settleLeftovers`） |
| 開支線 | side.js 的 `SIDE_LINES`、`WEEKLY_ORDER`、`SIDE_OPEN_AT` → side-story.js → titles.js 的支線稱號 | 跟活動進度分開存；每週一換線之後進度還在 |
| 加配方 | recipes.js 加一筆（`secret` 兩位都收集到才出現；`bond` 好感門檻）→ 兩位居民的取得方式 → lab.js 的忙碌狀態和倒數 → 領蛋 → 孵化 | 缺角色不能開始；調配中的兩位不在首頁、不能出門或討伐；時間到只領一顆；換頁或重開不會重發；任一位是限時取得時，活動結束後要有交代 |
| 改獎勵、成本或資源規則 | 掉落 → 背包 → 兌換 → 成就 → 數字顯示 → 存檔。能量、化石、星光糖、食材、墨玉各有自己的來源和用途 | 對照戰報、背包和成就上的數字；測剛好夠、差 1、已經領過、重開、重複操作 |
| 改討伐數值 | battle.js（`SPEED_CAP` 25%：技能、羈絆、料理共用這個上限，剋制另外算）、skills.js、team-bonds.js、kitchen.js 的 `teamFood` | 戰報上的時間和加成有算對；不要只剩一種最佳隊伍 |
| 只改台詞或立繪 | 角色出現的每個畫面，以及共用同一份圖文的地方 | 手機上看一次；確認還沒解鎖的畫面沒有提早露出。沒動到規則就不用重測整個蛋池 |

## 6. 實例：墨痕江湖的頁邊茶肆

茶肆把三條玩法串在一起（studio-jh.js，11/29 12:00 下卷開放後才出現）：

1. **MO-009 江湖百曉・皮寶**：活動畫面藏了 5 滴墨點（`INKS`，其中一滴在 MO-06 的關卡卡片上），全部點到就送紀念蛋。
2. **MO-010 千機巧匠・德寶**：在 3 個不同的日子各扶一次茶肆的門（看伺服器日期），再打贏 MO-05 破廟，就送紀念蛋。
3. **MO-011 頁邊教主・湘寶**：把皮寶和德寶放進研究室調配 2 天（recipes.js 的 `margin-chief`，`secret`）。

所以移動墨點、改破廟的通關條件，或是提早收起茶肆，都可能讓玩家做不到最後的配方。只改茶肆的台詞就不用動研究室。

**寫活動稿時要先講清楚**：活動結束時，下面四種玩家各會怎樣——已經收藏到居民的、領了蛋還沒孵的、配方調配中還沒領的、還沒拿齊材料的。前三種一定要保留進度；最後一種由湘決定：維持限時、等復刻，還是另外開常駐入口，不能偷偷改規則。

## 7. 測試與推送

- 測試在 tests/：`.cjs` 用 Chromium（`CHROMIUM_PATH=/opt/pw-browsers/chromium`），`.mjs` 直接用 node 跑。跑完要 `git checkout docs/review`。
- main 上已知本來就會失敗或偶爾不穩的測試，以專案記憶裡的清單為準，不要因為它們擋住推送。
- 推送前先 rebase origin/main；作者署名「德寶 (Claude)」；changelog 用寫給玩家看的口吻。
- 營運看板「這版要驗」放這次的關鍵流程，等玩家版真的換成新版再複驗。主分支修好了，不代表玩家版已經驗完。

## 8. 怎麼維護這份地圖

1. **湘定玩法**：每次交件多寫一行：改了什麼｜玩家從哪裡進來｜會得到或失去什麼｜活動結束後怎麼處理。不用寫檔名。
2. **德寶接程式**：有新系統、新的存檔欄位或新規則時，同一次推送裡一起更新第 2～5 節。
3. **皮寶複驗**：用新存檔和舊的測試存檔各走一次受影響的路線。
