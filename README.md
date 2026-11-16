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
- 首頁可安排最多三位已收集的小湘入住，角色點擊可打招呼；原味小湘使用 1254px 高清待機、八格走路、坐姿眨眼與站坐過渡。其他角色目前以靜態立繪入住（尚無動畫）
- 孵完回首頁、有空位時自動入住，並在培育頁送來下一顆蛋；孵到重複的小湘會換成化石碎片
- 每天三個新願望：每項 35 能量＋10 XP；100 XP 升一級，每級另有三項跨日保留的成長願望，每項可領一次 20 XP＋20 能量
- 願望頁可切換已收集的小湘；只換造型與語氣，不重置任務或進度
- 探索：首頁「探索」用手機定位判斷所在縣市（本島 19 縣市），第一次到某縣市時，該縣市的小湘會跳出來說想出現，並送一顆縣市蛋（150 能量，固定孵出該縣市小湘）。已允許定位的話，打開遊戲時自動感應。座標不保存、不上傳，存檔只記縣市與日期。縣市小湘 No.016–034 的名稱、台詞與立繪暫定
- 天氣與時間：探索／自動感應時順便查目前天氣（Open-Meteo，免金鑰，座標不保存）。下雨的日子每天最多送一顆天氣蛋（蛋庫最多 2 顆，150 能量，雨傘小湘最常見）；當天下雨時普通蛋、願望蛋的雨傘小湘機率 ×3；深夜 23:00–04:59 孵化時夜貓小湘機率 ×4，培育頁會顯示提示
- 願望蛋：三個每日願望全部完成的日子各得一枚願望印記（不必連續），集滿 3 枚換一顆願望蛋（150 能量，R／SR 機率較高），在「選擇蛋」取出培育；未注入能量就換掉會放回蛋庫

第一批 15 隻小湘名單已定案（見 `js/eggs.js`）；普通蛋池為 No.001–010、013（010、013 為低機率 SR），No.011、012、014、015 保留特殊取得。圖鑑分五個系列（日常、天氣與時間、隱藏配方、約會、紀念限定），可切換依編號或依系列顯示。No.002–015 靜態立繪已交付（未收集時圖鑑自動顯示黑影）；動畫目前只有 No.001。暫定內容：普通蛋借用本源蛋改色。
研究室已提供可操作的介面預覽（選兩位已收集夥伴、線索與結果示範），不消耗資源或發放角色；正式結算待確認。記憶分頁尚未開放。

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
js/wish-egg.js      願望印記與願望蛋庫存
js/travel.js        旅行紀錄與縣市蛋
js/weather.js       天氣蛋、雨天與深夜的孵化加成
js/geo.js           定位與縣市判定
assets/geo/counties.json 本島 19 縣市邊界（g0v/twgeojson，資料來源內政部國土測繪中心，簡化約 130 公尺）
js/wish-presenter.js 願望頁的角色偏好與台詞
js/room.js          入住偏好與多角色場景
js/actors.js        首頁會走動的角色（狀態機與逐格動畫）
js/siang-hd.js      高清影格、時長、腳底對齊與預先解碼
js/research.js      研究室選角、線索與唯讀結果預覽
js/app.js           畫面與玩法邏輯
assets/incubator/   共用培養架（cradle-back / cradle-front）
assets/eggs/<id>/   每顆蛋的圖層（shell / glow / cracks）
assets/characters/  小湘
assets/mascot/      小恐龍
```

沒有建置步驟，純靜態檔案，直接由 GitHub Pages（main 分支根目錄）提供。
本機預覽：`python3 -m http.server`，再開 `http://localhost:8000`。
