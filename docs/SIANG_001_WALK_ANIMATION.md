# No.001 原味小湘｜走路動畫交接（8 格）

**製作人已確認走路動畫風格。** 本次僅新增素材和接入資訊，不會覆蓋圖鑑使用的正式靜態立繪 `assets/characters/siang-001-original.webp`。

## GitHub 素材

- `assets/characters/siang-001-walk.webp`：8 格 **動態 WebP**；512×512；每格 140 ms，循環播放；透明背景。
- `assets/characters/siang-001-walk-spritesheet.webp`：同一組 8 格的 **靜態透明 spritesheet**；2048×1024；4 欄×2 列；每格 512×512。
- 兩種檔案是**擇一使用**的實作選項，不要在畫面上重複疊放。

## 建議工程接入

1. 已收集的 No.001 小湘平常顯示現有 `siang-001-original.webp`，行走狀態切換到 `siang-001-walk.webp`，或者用 spritesheet 以步進方式選幀。
2. spritesheet 依 row-major 取幀：0–3 在第一列、4–7 在第二列。每格 512×512。
3. 動畫採 140 ms/格，總循環約 1.12 秒；腳底以每格 `(256,470)` 為定位錨點，適合沿地面水平移動。
4. 左右方向可以透過 `scaleX(-1)` 鏡像；需注意移動容器與翻轉容器不要使位移方向混淆。
5. 與角色圖鑑剪影分開使用；圖鑑沿用原有 approved 靜態立繪。
6. 若使用 `<img src="...siang-001-walk.webp">`，動態 WebP 在支援的瀏覽器會自行播放；若需要程式精準控幀，用 spritesheet。
7. 若使用者偏好減少動態，請顯示靜態 `siang-001-original.webp`，避免強制播放。
8. 這組圖原稿帶有淺色紙紋底色；美術部已作透明去背，建議在 Android 的深色首頁實機確認髮絲細邊與腳底不跳動。

## 待確認

`docs/ASSET_SPEC.md` 目前沒有定義角色走路動畫的檔名、spritesheet 尺寸和動畫速度，因此本文件先作為新增規格，請德寶在接入時同步更新正式素材規格。

**待機（呼吸）動畫仍為測試草稿，不在這次 GitHub 提交範圍。**
