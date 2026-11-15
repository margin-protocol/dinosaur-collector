# 🦖 小湘收集器｜SIANG COLLECTOR

私人雙人收藏養成 PWA：孵恐龍蛋、收集小湘、在現實生活中探索。

## 文件

- 企劃：[docs/PLAN.md](docs/PLAN.md)
- 美術方向：[docs/ART_DIRECTION_V0.7.md](docs/ART_DIRECTION_V0.7.md)
- 素材規格（尺寸、對位、檔名）：[docs/ASSET_SPEC.md](docs/ASSET_SPEC.md)
- 首頁 UI／UX 精修紀錄與雙平台適配：[docs/UI_HOME.md](docs/UI_HOME.md)
- 日常首頁與入住安排：[docs/COMPANION_HOME.md](docs/COMPANION_HOME.md)
- 第二階段技術盤點與改造計畫：[docs/UI_PHASE2_PLAN.md](docs/UI_PHASE2_PLAN.md)

## 目前進度

第一圈完整玩法已可玩（部分素材仍是佔位圖）：

- 小恐龍用對話泡泡提示今天的願望 → 到「願望」拍下指定顏色的東西（手機上分析顏色，照片不上傳、不保存）→ 取得能量
- 從日常首頁前往「培育」，點蛋注入能量 → 生命訊號滿了點蛋破殼 → 分析過場 → 揭曉小湘 → 收進黑影圖鑑
- 首頁可安排最多三位已收集的小湘入住，角色點擊可打招呼；原味小湘保留待機、走路與坐姿動畫。其他角色素材未交付，先使用 Q 版人形剪影
- 孵完回首頁、有空位時自動入住，並在培育頁送來下一顆蛋；孵到重複的小湘會換成化石碎片
- 每天三個新願望；進度存在手機本機

暫定內容（等確認後替換）：No.002–004 三隻小湘的名單、普通蛋借用本源蛋改色。
研究、記憶分頁尚未開放。

## 結構

```text
index.html
css/tokens.css      顏色、字體等設計代幣
css/app.css         基礎：資源列、按鈕、對話框、分頁列、願望與圖鑑頁
css/game.css        培育：培養架與蛋、生命訊號、角色與互動回饋
css/mobile.css      共用按鈕、任務與抽屜
css/lobby.css       場景式介面與字體
css/companion.css   日常首頁與入住安排
css/wish.css        舊版魔法書樣式（保留檔案，目前不載入）
css/hud.css         全息反光與破殼分析過場
sw.js               離線快取（加入主畫面後可離線開啟）
js/eggs.js          恐龍蛋與小湘的資料表、素材路徑規則
js/egg-view.js      培養架（固定）與恐龍蛋（可替換）元件、孵化階段
js/state.js         本機存檔
js/wishes.js        願望與拍照取色、每日文案選擇
js/wish-copy.js     願望文案池（名稱與台詞，可直接增修）
js/book.js          舊版翻頁魔法書（目前不載入）
js/missions.js      三項每日願望呈現
js/room.js          入住偏好與多角色場景
js/actors.js        首頁會走動的角色（狀態機與逐格動畫）
js/app.js           畫面與玩法邏輯
assets/incubator/   共用培養架（cradle-back / cradle-front）
assets/eggs/<id>/   每顆蛋的圖層（shell / glow / cracks）
assets/characters/  小湘
assets/mascot/      小恐龍
```

沒有建置步驟，純靜態檔案，直接由 GitHub Pages（main 分支根目錄）提供。
本機預覽：`python3 -m http.server`，再開 `http://localhost:8000`。
