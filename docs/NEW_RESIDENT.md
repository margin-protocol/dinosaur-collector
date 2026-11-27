# 新居民上架流程（湘 2026-11-25 選 A）

湘丟立繪＋文案（通常是皮寶的稿子）→ 德寶照這份做 → 湘看手機截圖說 OK → 推送上線。
湘只要做三件事：**丟素材、回一張選項卡、看截圖**。其他都是德寶的事。

## 0. 先確認編號

- 創始系列（小湘）：下一個空號看 `js/eggs.js` 的 CHARACTER_TABLE 最後一位＋1。**No.100 留給特殊小湘，不能用。**
- 異世居民：key 用「世界代碼-編號」，例如 `MO-009`；系列要在 SERIES 寫 `world`。
- 已經用數字 key 上線、後來歸到異世的（例如 117），存檔 key 不換，加 `label: 'MO-002'` 顯示就好。

## 1. 一張選項卡問完（request_decision 一次一題，一題一張，最多四張）

能從稿子判斷的就不要問，直接寫「我先照 X 做」。常要問的：

| 問題 | 慣例（推薦選項） |
|---|---|
| 稀有度 | 稿子有寫就照稿子 |
| 系列 | 能歸到現有 SERIES 就歸；要開新系列才問 |
| 蛋池機率（普通／暗號） | N 8／6、R 5／8、SR 2／4～5、SSR 0.6／1.5、UR 0.3／0.75；進普通或暗號蛋就會自動進星光蛋 |
| 口頭禪要留幾處 | 湘常要求減少（呵呵、哼、嘿嘿）。慣例留 2～3 處：初見 hatch、好感 Lv.5、廚房隱藏最愛 |
| 隱藏最愛食材 | 照稿子的口味描述挑 2～3 種食材，組合不能跟別人一樣（檢查會擋） |

## 2. 立繪

```
python3 tools/resident-art.py 原圖.png assets/characters/siang-118-xxx.webp --preview /tmp/預覽.png
python3 tools/resident-art.py 原圖.jpg 輸出.webp --white   # 白底原圖
```

規格：1024² 透明畫布、腳底 y=940、WebP 品質 88。工具會自動裁、縮、置中。
去背邊緣（頭髮、頭紗、半透明）還是要人看，有疑慮就做 A／B 兩版比較圖讓湘挑（117 就是這樣決定保留背景的）。

## 3. 要填的格子（12 個檔）

| 檔案 | 填什麼 |
|---|---|
| js/eggs.js | CHARACTER_TABLE 一列（no、name、rarity、line、image、series，異世加 world／label）＋蛋池機率 |
| js/intros.js | INTROS 圖鑑故事、MYSTERY_INTROS 神秘線索（還沒收集時顯示） |
| js/bond-copy.js | BOND_STORIES（好感 Lv.3 故事）、BOND_LINES 2／4／5 |
| js/extra-lines.js | hatch 初見、dispatch 出戰、victory 勝利、defeat 戰敗 |
| js/wish-voice-late.js | color（要有 `{color}`）、other（要有 `{wish}`） |
| js/kitchen-lines.js | 0 討厭、1 普通、2 好吃、3 隱藏最愛 |
| js/taste-profiles.js | like、dislike（要是食材的口味標籤）、secret（2～3 種食材 id） |
| data/SIANG_KITCHEN_TASTE_PROFILES.json | profiles 加一筆，內容跟 taste-profiles.js 一樣 |
| js/errand-copy.js | CHARACTER_REPORTS：conv、park、market、mountain、faraway 各一組 |
| js/world-voice.js（只有異世居民） | MO_PET_LINES 摸頭、MO_POKE_LINES 戳太多、MO_SNACK_LINES 餵布丁、MO_HOME_REPORTS（help 在家幫忙／guard／note／dino）、MO_NOTE_TEXTS 紙條；kitchen-lines.js 也要填 dark 奇怪料理。沒填會說小湘的通用句（湘 11/27） |
| docs/SIANG_118_英文名.md | 稿子裡沒接進遊戲的文案（待機、願望十組、觀察日誌、彩蛋、Lv.5 事件…），口頭禪也照規則刪好 |

稿子的 `**粗體**` 要拿掉（檢查會擋）。台詞裡的 `{name}` 會換成角色名。

## 4. 口頭禪計數

```
node tools/catchphrase.mjs 118 嘿嘿 呵呵
```

列出每一格出現幾次，docs 裡沒接的文案也一起數。數字對上湘選的處數才算完成。

## 5. 檢查

```
node tests/residents-all.mjs                       # 全員格子檢查：少哪一格、隱藏最愛撞到、編號 100、粗體
NO=118 node tests/resident-check.cjs               # 立繪腳位＋圖鑑在手機打得開、不會左右捲
NO=118 W=360,430 SHOT=/mnt/project-files/previews/new-118/dex node tests/resident-check.cjs   # 出給湘看的截圖
```

（.cjs 要先 `python3 -m http.server 8000`，並設 `CHROMIUM_PATH=/opt/pw-browsers/chromium`）

舊角色有些格子放在別的檔案，列在 residents-all.mjs 的 LEGACY 裡；**新角色不要加進 LEGACY**，該填的就填。

## 6. 給湘看、上線

1. 截圖（360、430 各一張）貼給湘，附一句：稀有度／系列／蛋池／口頭禪剩幾處／隱藏最愛是什麼。
2. 湘說 OK → 跑相關測試 → `git checkout docs/review` → changelog.json 最上面加一筆（玩家口吻）→ rebase origin/main → 作者「德寶 (Claude)」推 main。
3. 推 main 後 GitHub Pages 和 betweenthepages.pages.dev 都會自動更新。
4. 專案記憶更新下一個空號。
