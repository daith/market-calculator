#!/bin/bash

# 山腳下園藝工具 - GCP Functions 部署配置腳本
# 使用方法: ./deploy-config.sh [環境]
# 環境選項: dev, staging, prod

set -e  # 錯誤時退出

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數：輸出彩色訊息
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 檢查參數
ENVIRONMENT=${1:-dev}
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    log_error "無效的環境參數。請使用: dev, staging, prod"
    exit 1
fi

log_info "開始部署到 $ENVIRONMENT 環境..."

# 設置環境變數
case $ENVIRONMENT in
    "dev")
        FIREBASE_PROJECT="my-trail-161fe"      # 使用實際的專案名稱
        MEMORY="256Mi"
        TIMEOUT="30s"
        MAX_INSTANCES="1"          # 開發環境：1個實例足夠
        MIN_INSTANCES="0"
        ;;
    "staging")
        FIREBASE_PROJECT="my-trail-161fe"      # 使用實際的專案名稱
        MEMORY="256Mi"             # 測試環境降低記憶體節省成本
        TIMEOUT="45s"
        MAX_INSTANCES="1"          # 測試環境：1個實例 (3位用戶足夠)
        MIN_INSTANCES="0"
        ;;
    "prod")
        FIREBASE_PROJECT="vendorcalc"      # 使用實際的專案名稱
        MEMORY="512Mi"
        TIMEOUT="60s"
        MAX_INSTANCES="1"          # 生產環境：1個實例 (3位用戶極致優化)
        MIN_INSTANCES="0"          # 冷啟動節省成本
        ;;
esac

# 檢查必要工具
command -v firebase >/dev/null 2>&1 || {
    log_error "Firebase CLI 未安裝。請執行: npm install -g firebase-tools"
    exit 1
}

command -v node >/dev/null 2>&1 || {
    log_error "Node.js 未安裝"
    exit 1
}

# 檢查 Node.js 版本
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 20 ]; then
    log_error "需要 Node.js 20 或更高版本，當前版本: $(node -v)"
    exit 1
fi

# 檢查環境文件
if [ ! -f "functions/.env" ]; then
    log_warning "functions/.env 不存在，將使用預設設置"
    if [ -f "functions/.env.example" ]; then
        log_info "複製 .env.example 為 .env..."
        cp functions/.env.example functions/.env
        log_warning "請編輯 functions/.env 並填入正確的配置值"
    fi
fi

# 切換到 Firebase 專案
log_info "切換到 Firebase 專案: $FIREBASE_PROJECT"
firebase use "$FIREBASE_PROJECT" || {
    log_error "無法切換到專案 $FIREBASE_PROJECT，請檢查專案是否存在"
    exit 1
}

# 安裝依賴
log_info "安裝 Functions 依賴..."
cd functions
npm ci --production=false
cd ..

# 建置 Functions
log_info "建置 Functions..."
cd functions
npm run build
cd ..

# 設置 Functions 運行時配置
log_info "設置 Functions 配置..."

# 創建臨時配置檔案
cat > functions/runtime.yaml << EOF
# Runtime configuration for $ENVIRONMENT
runtime: nodejs20
memory: $MEMORY
timeout: $TIMEOUT
maxInstances: $MAX_INSTANCES
minInstances: $MIN_INSTANCES
availableMemoryMb: $(echo $MEMORY | sed 's/Mi//')
environmentVariables:
  NODE_ENV: $ENVIRONMENT
  MEMORY_LIMIT_WARNING: "50"
  MEMORY_LIMIT_CRITICAL: "100"
  HEALTH_CHECK_TIMEOUT: "15000"
  SHEET_CHECK_INTERVAL: "30000"
EOF

# 執行部署前檢查
log_info "執行部署前檢查..."

# 檢查語法
cd functions
npm run build || {
    log_error "Functions 建置失敗"
    exit 1
}
cd ..

# 檢查 Firebase 設定
firebase functions:config:get >/dev/null 2>&1 || {
    log_warning "無法取得 Firebase 配置，請確認權限設定"
}

# 詢問確認
if [ "$ENVIRONMENT" = "prod" ]; then
    log_warning "即將部署到生產環境！"
    read -p "確定要繼續嗎？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
fi

# 執行部署
log_info "開始部署 Functions..."
firebase deploy --only functions || {
    log_error "Functions 部署失敗"
    exit 1
}

# 部署後測試
log_info "執行部署後測試..."

# 從firebase functions:list獲取Function URL
log_info "正在獲取Function URL..."

# 使用更可靠的方法獲取URL
FUNCTION_URL=$(firebase functions:list 2>/dev/null | grep "https://" | awk '{print $NF}' | head -1)

# 如果上面的方法失敗，嘗試其他方法
if [ -z "$FUNCTION_URL" ]; then
    log_warning "無法自動獲取Function URL，請手動測試"
    log_info "您可以手動測試健康檢查："
    echo "  curl https://[your-function-url]/api/health"
else
    log_info "測試健康檢查端點: $FUNCTION_URL/api/health"
    
    # 等待 Functions 初始化
    sleep 5
    
    # 測試健康檢查
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FUNCTION_URL/api/health" || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "健康檢查通過 (HTTP $HTTP_CODE)"
    else
        log_warning "健康檢查返回 HTTP $HTTP_CODE"
        log_info "這可能是正常的，因為Function可能還在冷啟動中"
    fi
fi

# 清理臨時檔案
rm -f functions/runtime.yaml

# 部署完成
log_success "部署到 $ENVIRONMENT 環境完成！"

# 嘗試再次獲取Function URL (如果之前失敗)
if [ -z "$FUNCTION_URL" ]; then
    FUNCTION_URL=$(firebase functions:list 2>/dev/null | grep "https://" | awk '{print $NF}' | head -1)
fi

# 顯示有用資訊
log_info "部署資訊："
echo "  - 環境: $ENVIRONMENT"
echo "  - 記憶體: $MEMORY"
echo "  - 超時: $TIMEOUT"
echo "  - 最大實例數: $MAX_INSTANCES"
echo "  - 最小實例數: $MIN_INSTANCES"

if [ -n "$FUNCTION_URL" ]; then
    echo ""
    log_info "API 端點："
    echo "  - 健康檢查: $FUNCTION_URL/api/health"
    echo "  - 詳細檢查: $FUNCTION_URL/api/health/detailed"
    echo "  - 重啟檢查: $FUNCTION_URL/api/health/restart-ready"
    echo "  - 登入: $FUNCTION_URL/api/login"
    echo "  - 訂單: $FUNCTION_URL/api/makeOrderWithDetail"
else
    echo ""
    log_warning "無法自動獲取Function URL"
    log_info "請使用以下命令查看您的Function URL："
    echo "  firebase functions:list"
fi

echo ""
log_success "🎉 部署成功完成！"