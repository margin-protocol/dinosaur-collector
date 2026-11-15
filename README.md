# 🦖 小湘收集器｜SIANG COLLECTOR

私人雙人收藏養成 PWA：孵恐龍蛋、收集小湘、在現實生活中探索。

## 文件

- 企劃：[docs/PLAN.md](docs/PLAN.md)
- 美術方向：[docs/ART_DIRECTION_V0.7.md](docs/ART_DIRECTION_V0.7.md)
- 素材規格（尺寸、對位、檔名）：[docs/ASSET_SPEC.md](docs/ASSET_SPEC.md)

## 目前進度

介面與孵化框架（佔位素材）：開場紙條、共用培養架＋本源蛋三層結構、保溫進度與破殼、孵化揭曉、黑影圖鑑、本機存檔。
任務、研究、記憶分頁尚未開放。

## 結構

```text
index.html
css/tokens.css      顏色、字體等設計代幣
css/app.css         版面與動畫
js/eggs.js          恐龍蛋與小湘的資料表、素材路徑規則
js/egg-view.js      培養架（固定）與恐龍蛋（可替換）元件、孵化階段
js/state.js         本機存檔
js/app.js           畫面邏輯
assets/incubator/   共用培養架（cradle-back / cradle-front）
assets/eggs/<id>/   每顆蛋的圖層（shell / glow / cracks）
assets/characters/  小湘
assets/mascot/      小恐龍
```

沒有建置步驟，純靜態檔案，直接由 GitHub Pages（main 分支根目錄）提供。
本機預覽：`python3 -m http.server`，再開 `http://localhost:8000`。
