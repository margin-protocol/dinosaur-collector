# 第三章《故障的玩具星球｜Toy Planet.exe》接入計畫

狀態：**湘 2026-11-19 拍板數值與規則；等正式立繪核准後才接入程式。**

## 湘的決定（11/19）

1. **Boss 調強**：歡笑總監戰力 150 → **165**（約為 3-3 的 1.3 倍，接近前兩章 Boss 的壓迫感）。小怪維持暫定值。
2. **野外巡邏不劇透**：野外只出現已解鎖關卡的敵人（已實裝：`js/battle.js` 的 `wildBases`，測試 `tests/wild-spoiler.cjs`）。第三章上線後，沒打到第三章的玩家不會在野外先遇到。
3. **勇者小隊打 3-B 特別強是 OK 的**：3-B 剋制 hero，可與勇者小隊全員 +50% 疊加，當作集滿勇者小隊的獎勵。

## 定案數值

| id | 關卡 | 名稱 | 戰力 | 時間 | 剋制 |
|---|---|---|---|---|---|
| toy-bunny | 3-1 | 發條兔 | 100 | 75 分 | daily |
| glitch-gummy | 3-2 | 亂碼軟糖熊 | 110 | 75 分 | friends |
| melody-guard | 3-3 | 八音盒衛兵 | 125 | 90 分 | recipe |
| director-giggle | 3-B | 歡笑總監 | **165** | 120 分 | hero、daily |

沿用現有 ENEMIES 欄位、CHAPTERS 順序、戰力／星級／獎勵（首次打倒 Boss＝願望蛋）與故事檔案館；不新增 HP、技能、小遊戲或特殊獎勵蛋。

## 接入時要改的程式

- `js/battle.js`：ENEMIES 加 4 筆；CHAPTERS 加 `{ id: 3, name: '故障的玩具星球', stages: ['toy-bunny', 'glitch-gummy', 'melody-guard', 'director-giggle'] }`。
- 解鎖、戰力、預估、獎勵、故事檔案館、咕咕書評都會自動接上，不用改。
- 測試：battle／archive／wild 補第三章。

## 需要皮寶提供（每隻敵人）

`bio`、`emoji`、`intro`（出場台詞）、`weakHit`（被剋制時）、`weakTag`（剋制提示）、`win`、`lose`；Boss 另需 `story.before`／`story.after`；`clue` 可選（第二章只有 2-1 有）。
圖檔：`assets/enemies/chapter-03/ch3-01-toy-bunny.webp`、`ch3-02-glitch-gummy`、`ch3-03-melody-guard`、`ch3-boss-director-giggle`（1024×1024 透明 WebP，與前兩章一致）。Boss 打倒後的紙條（`js/letters.js`）可選。
