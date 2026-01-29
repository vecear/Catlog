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

## 設定資料架構

PetLog 的設定分為兩種類型：**個人設定** 和 **共享設定**。

### 個人設定 (儲存於 `UserProfile`)

這些設定僅影響當前使用者，不會影響其他共同照顧人的介面：

| 設定項目 | 欄位名稱 | 說明 |
|---------|---------|------|
| 項目順序 | `actionOrders` | 紀錄頁面的項目排列順序 (per-pet) |
| 隱藏項目 | `hiddenActions` | 紀錄頁面中隱藏的項目 (per-pet) |
| 照顧者順序 | `caregiverOrders` | 照顧者顯示順序 (per-pet) |
| 首頁卡片設定 | `homeCardSettings` | 首頁卡片顯示/隱藏設定 (per-pet) |

#### 首頁卡片設定 (`HomeCardSettings`)

```typescript
interface HomeCardSettings {
  showScoreboard: boolean;       // 愛的積分卡片顯示/隱藏
  showTodayTasks: boolean;       // 今日任務卡片顯示/隱藏
  hiddenTodayTaskItems?: string[]; // 今日任務中隱藏的子項目
  showWeightChart: boolean;      // 體重變化卡片顯示/隱藏
  weightChartType: 'days' | 'entries'; // 體重圖表顯示模式
  weightChartValue: number;      // 顯示的天數或筆數
  monthlyLogsDefaultDays: number; // 月份紀錄預設展開天數 (3/5/7/0=全部)
}
```

### 共享設定 (儲存於 `Pet`)

這些設定會影響所有共同照顧人：

| 設定項目 | 欄位名稱 | 說明 |
|---------|---------|------|
| 項目名稱 | `actionLabels` | 自訂項目名稱 (如：飼料 -> 給罐罐) |

### 設定頁面分類

| 頁面 | 路徑 | 內容 |
|-----|------|------|
| 個人資料 | `/settings/profile` | 使用者名稱、顏色、帳號綁定 |
| 寵物資料 | `/settings/pet` | 寵物資訊、照顧者管理 |
| 介面設定 | `/settings/interface` | 項目順序、首頁卡片設定 |
