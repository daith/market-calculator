# 單實例生產環境測試計劃

## 🧪 測試 MAX_INSTANCES = 1 的影響

### 測試前準備
1. **備份當前配置**
2. **設置監控告警**
3. **準備快速回退方案**

### 測試步驟

#### 第1步: 修改配置
```bash
# 編輯 deploy-config.sh
# 將 prod 環境的 MAX_INSTANCES 改為 1
```

#### 第2步: 部署測試
```bash
# 部署到生產環境
./deploy-config.sh prod
```

#### 第3步: 監控指標 (測試1週)
- **回應時間**: 應該在 1-5 秒內
- **錯誤率**: 應該 < 1%
- **用戶回饋**: 詢問用戶是否感覺變慢
- **成本**: 記錄實際費用

#### 第4步: 壓力測試
```bash
# 模擬3位用戶同時使用
curl -X POST https://your-url/api/makeOrderWithDetail &
curl -X POST https://your-url/api/makeOrderWithDetail &
curl -X POST https://your-url/api/makeOrderWithDetail &
```

### 決策標準

#### ✅ 繼續使用單實例 (如果符合)
- 回應時間 < 5秒
- 無錯誤發生
- 用戶沒有抱怨
- 成本明顯降低

#### ❌ 恢復雙實例 (如果出現)
- 經常超時 (>10秒)
- 錯誤率 > 2%
- 用戶抱怨系統變慢
- 頻繁的排隊等待

### 快速回退
```bash
# 如果有問題，立即恢復到2個實例
# 編輯配置文件，改回 MAX_INSTANCES="2"
./deploy-config.sh prod
```

### 預期結果
對於3位用戶來說，單實例很可能完全足夠，
但建議先測試1-2週確認用戶體驗可接受。 