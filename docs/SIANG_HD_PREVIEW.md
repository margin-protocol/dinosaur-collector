# 原味小湘高清動作 V1

使用者已確認高清待機造型並授權完成其他動作、直接更新 GitHub。新版正式接入首頁及 No.001 的願望、圖鑑、孵化揭曉立繪；既有遊戲存檔、抽取、獎勵與角色入住規則不變。

## 素材

`assets/characters/siang-001-hd/` 含 13 張 **1254×1254 透明 WebP**：

- idle-open / idle-closed：核准的待機睜眼、閉眼原畫。
- walk-01 至 walk-08：八個重新製作的左右腳交替步伐。
- sit-open / sit-closed：坐下休息與閉眼。
- crouch：彎膝過渡，站→坐與坐→站各播放一次。

所有畫格由 image generation 依核准造型繪製。WebP 僅做無損格式轉換，沒有將舊 512px 影格放大、銳化或以插值冒充新細節；原始生成 PNG 保留在工作區，核准待機 PNG 仍在 review-hd。manifest.json 記錄來源、原始尺寸、alpha>80 的內容範圍、位移／縮放校準及位元組數。

13 張圖約 **8.10 MB**，只有擁有 No.001 的正常活動首頁會預先解碼完整動作；減少動態模式保留待機靜止畫面。相較舊素材首載流量增加，換取原生高解析度細節。原版素材未刪除，供比較頁與歷史回溯使用。

## 播放與對齊

`js/siang-hd.js` 統一影格、時長與校準。靜態願望等頁使用相同新版 idle-open。首頁維持原狀態機、走動範圍與方向翻轉：

- 待機 3200ms 睜眼／180ms 閉眼，搭配 CSS 微幅呼吸；選單與離頁暫停，減少動態關閉。
- 走路每格 140ms，位移至少配合完整 1.12 秒週期。
- 休息 4200ms 睜眼／200ms 閉眼。
- 站坐過渡 80／140／80ms，播完才切到持續動作，不循環站坐。

各畫格以支撐腳底 y=1149 校準 CSS 位移；crouch 以腳底為中心縮至 .93，避免過渡身形突然變高。原始畫格不做像素裁切。這是逐格插畫動畫，非骨架動畫或補幀至 60fps。

## 驗證與預覽

- `tests/hd-characters.cjs`：13 張原生尺寸解碼；360／390／430px、DPR 3；首頁／願望頁一致、存檔 JSON 不變；比較頁三種動作；自然 lower→sit（含閉眼）→rise。
- `tests/actor-motion.cjs`：完整走路、幀序、選單／離頁暫停、減少動態。
- `tests/interaction.cjs`：打招呼、返回與彈窗暫停／恢復。
- `tests/room.cjs`：多角色入住、界線、跨分頁及舊存檔。

實際截圖 `docs/review/home-hd-*.png`、`siang-hd-{idle,walk,sit}-*.png`，正式首頁錄影 `home-motion-390.webm`。`review/siang-hd/` 可逐種動作與原版比較。Chromium 手機模擬通過；iOS Safari／Android Chrome 真機流暢度與記憶體仍待實機驗收。
