# 🦖 小湘收集器｜SIANG COLLECTOR

私人雙人收藏養成 PWA：孵恐龍蛋、收集小湘、在現實生活中探索。

## 文件

- 企劃：[docs/PLAN.md](docs/PLAN.md)
- 美術方向：[docs/ART_DIRECTION_V0.7.md](docs/ART_DIRECTION_V0.7.md)
- 素材規格（尺寸、對位、檔名）：[docs/ASSET_SPEC.md](docs/ASSET_SPEC.md)

## 目前進度

第一圈完整玩法已可玩（部分素材仍是佔位圖）：

- 小恐龍用對話泡泡提示今天的願望 → 到「願望」拍下指定顏色的東西（手機上分析顏色，照片不上傳、不保存）→ 取得能量
- 回培育槽點蛋注入能量 → 生命訊號滿了點蛋破殼 → 分析過場 → 揭曉小湘 → 收進黑影圖鑑
- 孵完自動送來下一顆蛋；孵到重複的小湘會換成化石碎片
- 每天三個新願望；進度存在手機本機

暫定內容（等確認後替換）：No.002–004 三隻小湘的名單、普通蛋借用本源蛋改色。
研究、記憶分頁尚未開放。

## 結構

```text
index.html
css/tokens.css      顏色、字體等設計代幣
css/app.css         基本版面與動畫
css/hud.css         掃描儀、心電圖、玻璃面板、過場
css/game.css        遊戲版面：資源列、浮動按鈕、小恐龍、願望
js/eggs.js          恐龍蛋與小湘的資料表、素材路徑規則
js/egg-view.js      培養架（固定）與恐龍蛋（可替換）元件、孵化階段
js/state.js         本機存檔
js/wishes.js        願望與拍照取色
js/app.js           畫面與玩法邏輯
assets/incubator/   共用培養架（cradle-back / cradle-front）
assets/eggs/<id>/   每顆蛋的圖層（shell / glow / cracks）
assets/characters/  小湘
assets/mascot/      小恐龍
```

沒有建置步驟，純靜態檔案，直接由 GitHub Pages（main 分支根目錄）提供。
本機預覽：`python3 -m http.server`，再開 `http://localhost:8000`。
