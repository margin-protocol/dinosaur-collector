# 首頁角色動作節奏

首頁短活動區先前常在走路八格循環完成前就回到待機。位移時間現在向上對齊完整循環（8×140ms＝1.12 秒），短距離也至少播放一輪。原高解析度素材與動作格數不變。

逐格更新由串接 setTimeout 改成 requestAnimationFrame 與絕對經過時間，避免計時誤差逐輪累加。同一待機動作的狀態變換不重設眨眼週期。首次正常播放前預先解碼三組動畫；暫停／恢復使用代次標記，避免等待解碼時產生多重播放。

`tests/actor-motion.cjs` 在實際首頁驗證完整步伐與幀序、選單／離頁暫停、reduced-motion；`tests/interaction.cjs` 回歸打招呼與返回。`RECORD_VIDEO=1` 可錄製 `docs/review/home-motion-390.webm`（需 Playwright ffmpeg）。

此修改改善播放與切換節奏，不增加原稿沒有的中間格，也未宣稱通過真機效能驗收。

高清 V1 已接入 1254px 獨立畫格，含兩影格待機／坐姿眨眼與站坐過渡；詳見 SIANG_HD_PREVIEW.md。本文件的完整八格循環指走路，待機與坐姿不再使用原版八格 sheet。
