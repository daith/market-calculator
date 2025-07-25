# GCP Functions 配置指南

## 📁 配置文件說明

### 1. `firebase.json` - Firebase 專案配置
- 包含 Functions 和 Hosting 設定
- 設定記憶體、超時等資源限制
- 配置模擬器端口

### 2. `gcp-functions-config.yaml` - 詳細 GCP Functions 配置
- 完整的生產環境配置模板
- 包含監控、告警、成本優化設定
- 支援多環境配置 (dev/staging/prod)

### 3. `functions/env.example` - 環境變數範例
- 包含所有必要的環境變數
- 效能調優參數設定
- 詳細的配置說明

### 4. `deploy-functions.sh` - 自動化部署腳本
- 支援多環境部署 (dev/staging/prod)
- 自動建置和測試
- 部署後健康檢查

## 🚀 快速開始

### 步驟 1: 設置環境變數
```bash
# 複製環境變數範例
cd functions
cp env.example .env

# 編輯配置 (必須設置 GOOGLE_SPREADSHEET_ID)
nano .env
```

### 步驟 2: 安裝依賴
```bash
# 安裝 Functions 依賴
cd functions
npm install

# 安裝開發工具 (如果需要)
npm install -g firebase-tools
```

### 步驟 3: 本地測試
```bash
# 啟動模擬器
npm run serve

# 測試健康檢查
npm run test:health
```

### 步驟 4: 部署
```bash
# 開發環境部署
npm run deploy:dev

# 測試環境部署
npm run deploy:staging

# 生產環境部署
npm run deploy:prod

# 或使用腳本直接部署
./deploy-config.sh prod
```

## 📊 資源配置 (針對同時最多3位用戶極致優化)

### 開發環境
- 記憶體: 256MB
- 超時: 30秒
- 最大實例: 1個 (個人開發足夠)
- 最小實例: 0個 (冷啟動節省成本)

### 測試環境
- 記憶體: 256MB (降低記憶體節省成本)
- 超時: 45秒
- 最大實例: 1個 (3位用戶測試足夠)
- 最小實例: 0個

### 生產環境
- 記憶體: 512MB
- 超時: 60秒
- 最大實例: 2個 (3位用戶極致優化)
- 最小實例: 0個 (冷啟動節省成本)

## 🔧 可用的 npm 腳本

```bash
# 建置
npm run build              # 編譯 TypeScript
npm run build:watch        # 監聽模式建置

# 開發
npm run serve              # 啟動模擬器
npm run shell              # Functions shell
npm run start              # 等同於 shell

# 部署
npm run deploy             # 基本部署
npm run deploy:dev         # 開發環境
npm run deploy:staging     # 測試環境
npm run deploy:prod        # 生產環境

# 日誌
npm run logs               # 查看日誌
npm run logs:tail          # 即時日誌

# 測試
npm run test:health        # 健康檢查測試

# 設置
npm run setup:env          # 設置環境變數
```

## 🔍 健康檢查 API

部署後可以使用以下端點進行監控：

### 基本健康檢查
```bash
curl https://your-function-url/api/health
```

### 詳細狀態檢查
```bash
curl https://your-function-url/api/health/detailed
```

### 重啟準備檢查
```bash
curl https://your-function-url/api/health/restart-ready
```

## 📈 監控指標

系統會自動收集以下指標：
- 總訂單數
- 成功/失敗寫入數
- 平均處理時間
- 記憶體使用情況
- 重複ID檢測次數
- 鎖衝突次數

## ⚡ 效能優化

### 記憶體管理
- 自動清理過期鎖
- 限制統計資料數量
- 記憶體使用監控

### API 配額保護
- Google Sheets 調用頻率限制
- 健康檢查間隔控制
- 超時保護機制

### 冷啟動優化
- 生產環境保持熱實例
- 最小化依賴載入
- 快速健康檢查

## 🚨 故障排除

### 1. 部署失敗
```bash
# 檢查 Node.js 版本
node -v  # 需要 20+

# 檢查 Firebase CLI
firebase --version

# 檢查專案設定
firebase projects:list
firebase use your-project-id
```

### 2. 健康檢查失敗
```bash
# 檢查 Functions 日誌
firebase functions:log

# 檢查本地模擬器
npm run serve
curl http://localhost:5001/your-project/us-central1/api/health
```

### 3. 記憶體問題
```bash
# 查看詳細健康檢查
curl https://your-function-url/api/health/detailed

# 檢查記憶體使用情況
```

### 4. API 配額超限
- 檢查 Google Sheets API 配額
- 調整 SHEET_CHECK_INTERVAL 環境變數
- 查看 Google Cloud Console API 使用情況

## 💰 成本控制

### 優化建議
1. 開發/測試環境使用 `min_instances: 0`
2. 適當設定 `max_instances` 避免意外擴容
3. 使用 `idle_timeout` 自動回收資源
4. 監控月度費用並設定預算告警

### 預估成本 (月費) - 同時最多3位用戶極致優化
- 開發環境: $1-5 USD (超低成本)
- 測試環境: $2-8 USD (記憶體降低+實例減少)  
- 生產環境: $5-12 USD (極致優化)

### 成本節省對比
- **原設置(10位用戶)**: $20-50 USD/月
- **10位用戶優化**: $8-20 USD/月
- **3位用戶極致優化**: $5-12 USD/月  
- **總節省**: 75-80% 成本降低

### 3位用戶負載分析
- **同時使用**: 最多3人，通常1-2人
- **並發請求**: 1-2個/秒，峰值3-5個/秒
- **實例需求**: 1個實例日常足夠，2個實例100%安全

## 🔒 安全注意事項

1. **環境變數保護**
   - 不要提交 `.env` 檔案到版本控制
   - 使用 Firebase Functions 環境配置

2. **API 安全**
   - 所有 API 強制使用 HTTPS
   - 實施適當的輸入驗證

3. **服務帳戶**
   - 使用最小權限原則
   - 定期輪換服務帳戶金鑰

## 📞 支援

如有問題請查看：
1. Firebase Functions 文件
2. Google Cloud Functions 文件
3. 專案 README.md
4. 系統健康檢查 API