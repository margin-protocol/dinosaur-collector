# 三人羈絆插畫驗收

[index.html](index.html) 為 12 張插畫預覽；[gallery.png](gallery.png) 是約 320px 寬縮圖的總覽。mobile/ 為 360／390／430px、櫻花與深藍主題的實際遊戲大圖視窗。

全部 12 張：原生 1448×1086（4:3）；WebP 總量約 4.7 MiB，已解鎖才建立 img，採 lazy loading。來源與原始完整 PNG 見 art/team-bonds/；目前沒有可獨立移動角色和背景的 PSD，介面文字與反光效果為獨立層。

Chromium 手機模擬驗證：12 張解碼、比例、描述文字；未解鎖不請求合照；關閉、Esc、返回底層圖鑑及焦點；斷網退回角色圖；查看不改存檔。另以 612px 高度檢查關閉操作。未宣稱實機 iOS Safari 測試。

命令：tests/bond-art.cjs 與既有 tests/team-bonds.cjs 通過。測試資料在隔離瀏覽器環境；未為玩家直接解鎖任何羈絆。
