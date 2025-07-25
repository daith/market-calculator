# 🌱 山腳下園藝工具 - 市場計算器

一個專為園藝工具供應商設計的智能市場計算系統，提供精確的成本分析和訂單管理功能。

## ✨ 主要功能

### 📊 計算器模組
- **項目計算器** - 單項商品成本計算與利潤分析
- **批量計算** - 多項商品統一計算處理
- **市場計算器** - 市場價格分析與競爭力評估
- **單位轉換** - 支援多種計量單位轉換

### 🔐 用戶管理
- **登入認證** - 安全的用戶登入系統
- **保護路由** - 確保敏感數據安全
- **多用戶支援** - 最多支援 3 位用戶同時使用

### 📱 響應式設計
- **移動端優化** - 支援手機和平板設備
- **深色模式** - 護眼的深色主題
- **現代化 UI** - 基於 Tailwind CSS 的美觀界面

## 🚀 快速開始

### 環境需求
- Node.js 18+ 
- npm 或 yarn
- Firebase CLI (用於部署)

### 本地開發

```bash
# 克隆專案
git clone [your-repo-url]
cd market-calculator

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

在瀏覽器中打開 [http://localhost:3000](http://localhost:3000) 查看結果。

### 環境配置

創建 `.env.local` 文件：

```env
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_API_URL=https://asia-east1-my-trail-161fe.cloudfunctions.net/api
```

## 🏗️ 專案結構

```
market-calculator/
├── app/                          # Next.js App Router
│   ├── calculator/              # 基礎計算器頁面
│   └── login/                   # 登入頁面
├── components/                  # React 元件
│   ├── Auth/                    # 認證相關元件
│   ├── Calculator/              # 計算器元件
├── functions/                   # Firebase Cloud Functions
├── public/                      # 靜態資源
└── styles/                      # 樣式文件
```

## 📦 部署

### Firebase Hosting 部署

使用我們的自動化部署腳本：

```bash
# 部署到開發環境
./deploy-host.sh dev

# 部署到測試環境  
./deploy-host.sh staging

# 部署到生產環境
./deploy-host.sh prod
```

### Firebase Functions 部署

```bash
# 部署後端 API
./deploy-functions.sh dev
./deploy-functions.sh staging  
./deploy-functions.sh prod
```

### 手動部署

```bash
# 建置專案
npm run build

# Firebase 部署
firebase deploy --only hosting
```

## 🔧 可用腳本

- `npm run dev` - 啟動開發伺服器
- `npm run build` - 建置生產版本
- `npm run start` - 啟動生產伺服器
- `npm run lint` - 執行代碼檢查
- `npm run type-check` - 執行 TypeScript 類型檢查

## 🌐 線上環境

### 開發環境
- **前端：** https://my-trail-161fe.web.app
- **API：** https://asia-east1-my-trail-161fe.cloudfunctions.net/api

### 生產環境  
- **前端：** https://vendorcalc.web.app
- **API：** https://asia-east1-vendorcalc.cloudfunctions.net/api

## 🛠️ 技術棧

### 前端
- **Framework：** Next.js 15 (App Router)
- **語言：** TypeScript
- **樣式：** Tailwind CSS
- **狀態管理：** React Hooks
- **認證：** 自定義認證系統

### 後端
- **運行時：** Node.js 20
- **平台：** Firebase Cloud Functions
- **資料庫：** Google Sheets API
- **部署：** Firebase Hosting

### 開發工具
- **包管理：** npm
- **代碼檢查：** ESLint
- **類型檢查：** TypeScript
- **部署：** 自動化 Bash 腳本

## 📱 頁面導覽

- `/` - 首頁
- `/login` - 用戶登入
- `/calculator` - 基礎計算器

## 🔐 API 端點

- `GET /api/health` - 健康檢查
- `POST /api/login` - 用戶登入
- `POST /api/makeOrderWithDetail` - 創建訂單

## 🚦 效能優化

- **記憶體限制：** 512Mi (生產環境)
- **最大實例數：** 1 (3位用戶優化)
- **冷啟動優化：** 最小實例數 0
- **響應時間：** < 60s

## 🤝 貢獻指南

1. Fork 此專案
2. 創建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 創建 Pull Request

## 📄 授權

此專案為私有專案，僅供山腳下園藝工具內部使用。

## 🐛 問題回報

如發現問題，請創建 [Issue](../../issues) 或聯繫開發團隊。

## 📞 Deploy 前準備

1. Firebase -> Pay as You Go 方案開好
2. GCP 專案開好
- 開立 Google Sheet API
- 設定 專案所用 Account
- 替換 GOOGLE_SPREADSHEET_ID = google sheet id  .env 
- 替換 google-credentials.json for 目前未來 app 用的帳號 資料
- 設定 Cloud Functions Admin 給目前上傳 deploy 帳號

執行./deploy-functions.sh prod

看  https://console.firebase.google.com/u/0/project/vendorcalc/functions
取的 function URL 後
去 app 上面換掉 function 域名 以及 google sheet url



---