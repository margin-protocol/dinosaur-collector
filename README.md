# 🦖 小湘收集器｜SIANG COLLECTOR

私人雙人收藏養成 PWA：孵恐龍蛋、收集小湘、在現實生活中探索。

## 文件

- 企劃：[docs/PLAN.md](docs/PLAN.md)
- 美術方向：[docs/ART_DIRECTION_V0.7.md](docs/ART_DIRECTION_V0.7.md)
- 素材規格（尺寸、對位、檔名）：[docs/ASSET_SPEC.md](docs/ASSET_SPEC.md)
- 首頁 UI／UX 精修紀錄與雙平台適配：[docs/UI_HOME.md](docs/UI_HOME.md)
- 今日／成長願望與研究者等級：[docs/WISHES_PROGRESSION.md](docs/WISHES_PROGRESSION.md)
- 日常首頁與入住安排：[docs/COMPANION_HOME.md](docs/COMPANION_HOME.md)
- 第二階段技術盤點與改造計畫：[docs/UI_PHASE2_PLAN.md](docs/UI_PHASE2_PLAN.md)

## 目前進度

第一圈完整玩法已可玩（部分素材仍是佔位圖）：

- 小恐龍用對話泡泡提示今天的願望 → 到「願望」拍下指定顏色的東西（手機上分析顏色，照片不上傳、不保存）→ 取得能量
- 從日常首頁前往「培育」，點蛋注入能量 → 生命訊號滿了點蛋破殼 → 分析過場 → 揭曉小湘 → 收進黑影圖鑑
- 首頁可安排最多三位已收集的小湘入住，角色點擊可打招呼；原味小湘使用 1254px 高清待機、八格走路、坐姿眨眼與站坐過渡。其他角色素材未交付，先使用 Q 版人形剪影
- 孵完回首頁、有空位時自動入住，並在培育頁送來下一顆蛋；孵到重複的小湘會換成化石碎片
- 每天三個新願望：每項 35 能量＋10 XP；100 XP 升一級，每級另有三項跨日保留的成長願望，每項可領一次 20 XP＋20 能量
- 願望頁可切換已收集的小湘；只換造型與語氣，不重置任務或進度

第一批 15 隻小湘名單已定案（見 `js/eggs.js`）；普通蛋前期池為 No.001–009，No.011–015 保留特殊取得。暫定內容：普通蛋借用本源蛋改色、No.002 以後立繪未交付（顯示剪影）。
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
css/wishes-game.css 新版今日／成長願望介面
css/wish.css        舊版魔法書樣式（保留檔案，目前不載入）
css/hud.css         全息反光與破殼分析過場
sw.js               離線快取（加入主畫面後可離線開啟）
js/eggs.js          恐龍蛋與小湘的資料表、素材路徑規則
js/egg-view.js      培養架（固定）與恐龍蛋（可替換）元件、孵化階段
js/state.js         本機存檔
js/wishes.js        願望與拍照取色、每日文案選擇
js/wish-copy.js     願望文案池（名稱與台詞，可直接增修）
js/book.js          舊版翻頁魔法書（目前不載入）
js/missions.js      每日願望切換與拍照操作
js/progression.js   玩家等級、成長目標與唯一領獎
js/wish-presenter.js 願望頁的角色偏好與台詞
js/room.js          入住偏好與多角色場景
js/actors.js        首頁會走動的角色（狀態機與逐格動畫）
js/siang-hd.js      高清影格、時長、腳底對齊與預先解碼
js/app.js           畫面與玩法邏輯
assets/incubator/   共用培養架（cradle-back / cradle-front）
assets/eggs/<id>/   每顆蛋的圖層（shell / glow / cracks）
assets/characters/  小湘
assets/mascot/      小恐龍
```

沒有建置步驟，純靜態檔案，直接由 GitHub Pages（main 分支根目錄）提供。
本機預覽：`python3 -m http.server`，再開 `http://localhost:8000`。
