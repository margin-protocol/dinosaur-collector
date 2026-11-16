# 普通蛋／縣市蛋正式三層素材

依使用者要求，用已核准 ordinary、regional 概念蛋殼分別製作正式三層。縣市蛋的正式 id 與資料夾均為 **county**，regional 只保留為概念圖名稱。

| 目錄 | shell.webp | glow.webp | cracks.webp |
| --- | ---: | ---: | ---: |
| assets/eggs/ordinary/ | 159,708 bytes | 197,494 bytes | 15,508 bytes |
| assets/eggs/county/ | 196,402 bytes | 192,872 bytes | 13,040 bytes |

全部為 **1024×1024 RGBA 透明 WebP**，無損編碼，各層小於 300KB。普通蛋維持暖白珍珠殼與桃色內光；縣市蛋維持青玉地形紋與琥珀內光。glow／cracks 是獨立生成的效果層，不是將完整蛋殼當成疊圖。

## 共用對位

沿用願望蛋匯出規格：以各概念蛋殼 alpha>128 的內容範圍建立單一矩陣，三層一起對位到 1024 畫布的蛋底中心 (512,701)、殼高約 466px。程式原有 +1.5%／−3% 顯示位移後對齊現有培養架。glow、cracks 以蛋殼 alpha 限制在輪廓內，原始圖未畫入底座。

原始生成圖保留在 generated_images：
- ordinary glow：exec-36a29023-ddac-4646-8def-1de8846b64fa.png
- ordinary cracks：exec-6839aaa7-cd6a-4f00-99ea-2e8706350d2c.png
- county glow：exec-e0c58bf9-2df1-41a5-9caf-9544a6473d6b.png
- county cracks：exec-e68e9dcc-c9d1-45ff-8774-7f3da3c401e6.png

EGGS.ordinary 與 EGGS.county 移除 art:'origin'、tint 暫用設定，使既有素材載入器直接找到兩個正式資料夾。未改保溫需求、抽取機率、縣市對應角色、蛋庫存、取得與退庫規則。本源蛋、願望蛋與培養架保持原樣。

## 驗證

- tests/egg-art.cjs：可用 EGG_IDS 指定要驗證的蛋；三層路徑、尺寸、透明度、效果輪廓、裂痕階段及 360／390／430px、矮螢幕。
- tests/wish-art.cjs 保留原有指令，轉呼叫共用驗證，以免複製同樣測試。
- tests/explore.cjs：模擬縣市定位，領取／退回縣市蛋、指定縣市角色孵化、外島與拒絕定位。
- tests/mobile.cjs：拍照獎勵、能量、培育、實際孵化與存檔。
- docs/review/{ordinary,county}-art-{rest,cracking,ready}-{360,390,430}.png 為實際手機尺寸截圖。

使用 Chromium 手機模擬；真機 Safari／Chrome 色彩與流暢度仍待實機驗收。
