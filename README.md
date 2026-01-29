<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# PetLog

一個與家人一起記錄寵物照顧狀況的溫馨小工具。

## 專案功能
- 多用戶支援：邀請家人一起照顧寵物
- 照護日誌：記錄飲食、飲水、貓砂、梳理、給藥、保健品
- 體重追蹤：追蹤寵物體重變化
- 每日狀態：一目了然的照顧完成度
- 多寵物支援：可照顧多隻寵物
- 支援多種寵物類型：貓、狗、魚、鴨、兔、鼠、蜥蜴

## 技術棧
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS
- **Backend**: Firebase Firestore (雲端資料同步)
- **Authentication**: Firebase Auth (Google OAuth + Email/Password)

## 本地開發

**前置需求:** Node.js (建議 v20+)

1. **安裝依賴:**
   ```bash
   npm install
   ```

2. **環境變數設定:**
   - 複製 `.env.example` (如果有的話) 或直接建立 `.env.local`。
   - 確保 `.env.local` 包含正確的 Firebase 設定。

3. **啟動開發伺服器:**
   ```bash
   npm run dev
   ```
   伺服器預設運行在 [http://localhost:3000/Catlog/](http://localhost:3000/Catlog/)。

## 部署與自動化

### 部署到 GitHub Pages
本專案已配置 GitHub Actions。
1. 將變更推送到 `main` 分支。
2. `.github/workflows/deploy.yml` 會自動構建並部署。
3. 請確保在 Repository 設定中將 Pages Source 設定為 `gh-pages` 分支。

## 專案結構
- `pages/`: 頁面元件 (首頁、新增日誌、設定、登入、註冊)
- `components/`: 通用元件
- `context/`: React Context (AuthContext, PetContext)
- `services/`: Firebase 與 API 介面
- `types.ts`: TypeScript 定義
