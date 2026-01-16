<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 小賀log (Catlog)

這是一個用來記錄「小賀」生活點滴的 Web 應用程式。

## 專案功能
- 錄入照護日誌（飲食、飲水、貓砂、梳理、給藥）
- 體重追蹤
- 隨機小賀稱號生成
- 支援多位照護者 (RURU, CCL)

## 技術棧
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS
- **Backend**: Firebase Firestore (雲端資料同步)
- **AI**: Google Gemini API (處理特定邏輯)

## 本地開發

**前置需求:** Node.js (建議 v20+)

1. **安裝依賴:**
   ```bash
   npm install
   ```

2. **環境變數設定:**
   - 複製 `.env.example` (如果有的話) 或直接建立 `.env.local`。
   - 確保 `.env.local` 包含正確的 Firebase 與 Gemini API 設定。

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
- `src/`: 核心源碼
- `services/`: Firebase 與 Gemini API 介面
- `pages/`: 頁面元件 (首頁、新增日誌、設定)
- `components/`: 通用元件
- `types.ts`: TypeScript 定義
