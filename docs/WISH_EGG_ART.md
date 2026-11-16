# 願望蛋正式三層素材

使用者已核准願望蛋外觀，指定交付 assets/eggs/wish/ 的 shell、glow、cracks 三層。

| 檔案 | 規格 | 大小 | 用途 |
| --- | --- | --- | --- |
| shell.webp | 1024×1024 RGBA、透明 WebP | 170,710 bytes | 核准的淡紫月白膜層蛋殼與小願光 |
| glow.webp | 同畫布、透明 WebP | 187,738 bytes | 獨立柔和內光，沿用 screen 混合及進度亮度 |
| cracks.webp | 同畫布、透明 WebP | 17,326 bytes | 稀疏角狀裂痕，沿用 60%／90% 階段揭露 |

蛋殼源於已核准 concepts-v1/wish.webp；glow、cracks 由 image generation 依蛋殼另繪透明效果，未把完整蛋殼複製成效果層。原生成 PNG 保留於工作區 generated_images：glow exec-91a4c0bd-5dce-4ad5-aa18-f61f98bfa210.png、cracks exec-f7252293-907f-4ea7-8ee0-8f42c6c628e4.png。

## 對位與匯出

採目前共用蛋素材的 1024 正方形畫布。以蛋殼 alpha>128 的範圍建立同一個縮放／平移矩陣，三層一起對位到殼底中心 (512,701)、蛋殼高度約 466px。程式原有 +1.5%／−3% 位移後，顯示底部約 (527,670)，和現有培養架一致。效果層以蛋殼 alpha 限定在輪廓內，避免光或裂痕畫到底座；最終 WebP 採無損編碼，各層小於 300KB。

EGGS.wish 原本仍有 art:'origin' 和改色 tint，僅放檔案不會載入新圖，因此本次移除願望蛋這兩個暫用欄位。createEggView 與選蛋入口會直接使用 wish/{shell,glow,cracks}.webp。沒有改保溫需求、角色池、機率、印記、庫存或存檔；本源蛋、普通蛋與培養架未修改。

## 驗證

- tests/wish-art.cjs：三層確實由 wish 路徑載入、原生尺寸、無 tint、裂痕階段、透明背景、效果不超出殼面；360／390／430px 與 612px 矮螢幕。
- tests/wish-egg.cjs：每日 3/3 印記、換取庫存、選蛋、未注入時換回退庫存、實際孵化與下一顆蛋。
- 實際手機尺寸截圖：docs/review/wish-art-{rest,cracking,ready}-{360,390,430}.png。

本次使用 Chromium 手機模擬，真機 Safari／Chrome 的色彩與動畫流暢度仍待實機驗收。
