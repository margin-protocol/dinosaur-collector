# Phase 2 設定：私人資料庫、通行碼、審核員印章

## 1. 建立私人資料庫（湘）
GitHub → New repository → 名稱自訂（不要含本名）→ **Private** → 勾選 Add a README → Create。

## 2. 建立兩把通行碼（湘）
GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token，做兩次：

| 名稱 | 給誰 | 設定 |
|---|---|---|
| siang-player | 男友的手機（遊戲） | Repository access：Only select repositories → 選上面的私人資料庫；Permissions → Contents：**Read and write**；Expiration：自訂（例如一年） |
| siang-reviewer | 湘的手機（審核室） | 同上 |

- token 只會顯示一次，複製後直接貼進手機，不要傳到聊天室公開處，也不要放進任何 repo。
- 男友不需要 GitHub 帳號。token 外洩時到同一頁按 Revoke 就失效，再產生新的。

## 3. 遊戲端（男友手機）
研究者手記 → 雲端與備份 → 貼上資料庫名稱（owner/repo）與 siang-player token → 連線。之後每天打開遊戲自動備份到 `backups/`。

## 4. 審核室（湘的手機）
打開 `review.html`（遊戲網址後面加 `/review.html`）：
1. 連線：同一個資料庫 + siang-reviewer token
2. 產生印章 → **先複製「印章備份」存進密碼管理器** → 複製公鑰交給德寶，寫進 `js/reviewer-key.js`
3. 設定暗號

## 資料庫裡的檔案
| 路徑 | 寫入者 | 內容 |
|---|---|---|
| backups/latest.json、backups/YYYY-MM-DD.json | 遊戲 | 進度備份 |
| codes/<雜湊>.json | 審核室 | 湘蓋章的暗號（檔名是暗號的雜湊，看不出原文） |
| redeemed/<雜湊>.json | 遊戲 | 一次性暗號的兌換紀錄 |

安全性：兩把 token 對資料庫都有寫入權，所以遊戲只接受湘的印章（ECDSA P-256 數位簽章）驗證通過的內容；改檔案也偽造不了印章。印章私鑰只存在湘手機的瀏覽器裡。
