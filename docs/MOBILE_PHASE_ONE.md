# 第一階段美術驗收：手機養成遊戲

分支：`feat/mobile-game-phase-one`。範圍只有培養架首頁、研究者手記、今日願望；未部署、未合併。

## 畫面

依使用者核准的新版首頁視覺稿，改成滿版房間場景、輕量資源資訊、左側名稱與日期、原有蛋／培養架分層居中。生命訊號改為場景上的細進度線，移除原本的 ECG 面板；今日願望在左、培養在右，以淡紫瓷白切角主按鈕呈現。小恐龍縮小為引導配角，孵化後的小湘仍使用原本的走路、待機與坐姿動畫。概念稿是構圖參考，程式使用既有房間與角色素材，沒有將整張概念圖當背景。

研究者手記入口採細線 SVG 筆記本圖示，入口與抽屜標題使用介面共用的明體字族。研究者手記使用原生 dialog 底部抽屜（焦點限制、Escape、關閉、點背景退出），包含培養、願望、圖鑑，以及原本未開放的研究／記憶。現在頁面會有狀態色與文字。
願望一次列出三個任務：原有創意名稱、階段台詞、顏色提示、每項 +35、拍照入口、三顆進度寶石與完成回饋。移除古書翻頁，保留舊書元件檔作歷史參考但不載入。測試用重置入口不再對玩家顯示。

共用規則在 `css/mobile.css`，核准的場景構圖與瓷白／淡紫配色在 `css/lobby.css`：字體、實色面板、按鈕、觸控與鍵盤焦點、抽屜、轉場、safe-area 與 reduced-motion。主內容及頁尾在正常文流，矮畫面可捲動；場景使用明確高度避免縮網址列時素材容器歸零。

## 保留與防重複

`state.js` 存檔 key 和結構、`wishes.js` 的日期種子與 HSV 門檻、每項 35 能量、蛋數值、素材及 `actors.js` 全部保留。照片仍只在本機分析。

拍照流程加入同步鎖定、完成 id 再檢查、結算前讀取最新存檔及跨午夜拒絕舊任務；支援 Web Locks 的瀏覽器將多分頁願望分析序列化。完成先存檔再播動畫。既有 localStorage 存檔模式不提供跨裝置同步；無 Web Locks 的舊瀏覽器不保證跨分頁同時操作的原子性。

## 驗證

Chromium 觸控模式：360、390、430 × 844；各寬度另測高度 612。

- 直接比對指定 360／390／430px 與 document scrollWidth、innerWidth（避免手機 viewport 自動放大掩蓋溢出）；三張任務可達，抽屜選頁後關閉。
- 實際上傳程式產生的目標色 PNG，經原有像素辨識得到 3 × 35 = 105 能量。
- 重新整理後完成記錄與 105 能量保留，培養扣 10 後 95 能量仍保留。
- 從既有存檔 fixture 觸發本源蛋孵化、揭曉、收進圖鑑，新蛋及原味小湘正常顯示。
- 跨日保留能量與圖鑑，更新三項願望；黑色失敗照片不發獎。
- 正常動畫換幀、離頁暫停、瀏覽器返回與 Escape 抽屜關閉另有互動測試。

截圖在 [review](review/)，檔名包含寬度與狀態。`home`／`center`／`wishes`／`completed`／`short`／`hatched`；`live-actor` 為正常動畫模式。

WebKit 引擎已下載，但缺少 GTK4、Graphene 等系統庫，安裝需要無法取得的 root 密碼，因此未執行成功。iOS Safari、Android Chrome 真機與原生相機權限／取消操作尚待實機驗收，不能將桌面 Chromium 模擬視為真機通過。

## 重跑

無正式 runtime dependencies。啟動 `python3 -m http.server 8000`，另開終端：

```sh
npm install --no-save playwright
npx playwright install chromium webkit
node tests/mobile.cjs
node tests/interaction.cjs
```

可用 `CHROMIUM_ONLY=1` 跳過 WebKit，`CHROMIUM_PATH=/usr/bin/chromium` 使用系統 Chromium；`NODE_PATH` 可指向預先安裝的 Playwright。測試只操作 localhost 的隔離瀏覽器存檔。
