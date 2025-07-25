#!/bin/bash

# 山腳下園藝工具 - Firebase Functions 錯誤查詢腳本
# 使用方法: ./check-functions-logs.sh [環境] [時間範圍]
# 環境選項: dev, staging, prod
# 時間範圍: 1h, 6h, 1d, 3d (預設: 1h)

set -e

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
TIME_RANGE=${2:-1h}

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    log_error "無效的環境參數。請使用: dev, staging, prod"
    exit 1
fi

# 設置 Firebase 專案
case $ENVIRONMENT in
    "dev"|"staging")
        FIREBASE_PROJECT="my-trail-161fe"
        ;;
    "prod")
        FIREBASE_PROJECT="vendorcalc"
        ;;
esac

log_info "查詢 $ENVIRONMENT 環境的 Functions 錯誤 (專案: $FIREBASE_PROJECT)"
log_info "時間範圍: $TIME_RANGE"

# 檢查 Firebase CLI
command -v firebase >/dev/null 2>&1 || {
    log_error "Firebase CLI 未安裝。請執行: npm install -g firebase-tools"
    exit 1
}

# 切換到正確的專案
log_info "切換到 Firebase 專案: $FIREBASE_PROJECT"
firebase use "$FIREBASE_PROJECT" || {
    log_error "無法切換到專案 $FIREBASE_PROJECT"
    exit 1
}

echo ""
log_info "==================== Functions 狀態 ===================="

# 檢查 Functions 狀態
firebase functions:list 2>/dev/null || {
    log_warning "無法獲取 Functions 列表"
}

echo ""
log_info "==================== 最近錯誤日誌 ===================="

# 查看最近的錯誤日誌
firebase functions:log --limit 50 --since "$TIME_RANGE" 2>/dev/null | grep -E "(ERROR|Error|error|FATAL|Fatal|fatal)" || {
    log_success "在過去 $TIME_RANGE 內沒有發現錯誤！"
}

echo ""
log_info "==================== 所有最近日誌 ===================="

# 查看所有最近日誌
firebase functions:log --limit 20 --since "$TIME_RANGE" 2>/dev/null || {
    log_warning "無法獲取日誌"
}

echo ""
log_info "==================== 有用的命令 ===================="
echo "📋 更多查詢命令："
echo "  查看即時日誌:    firebase functions:log --limit 100"
echo "  查看特定函數:    firebase functions:log --only functions:[FUNCTION_NAME]"
echo "  查看更長時間:    firebase functions:log --since 6h"
echo ""
echo "🌐 在線查看："
echo "  Firebase Console: https://console.firebase.google.com/project/$FIREBASE_PROJECT/functions"
echo "  Cloud Logging:    https://console.cloud.google.com/logs/query?project=$FIREBASE_PROJECT"
echo ""
echo "📊 健康檢查："
if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "staging" ]; then
    echo "  API Health: https://asia-east1-$FIREBASE_PROJECT.cloudfunctions.net/api/health"
else
    echo "  API Health: https://asia-east1-$FIREBASE_PROJECT.cloudfunctions.net/api/health"
fi

echo ""
log_success "日誌查詢完成！"

# 提供快速除錯提示
echo ""
log_info "🔧 常見錯誤除錯："
echo "  1. 記憶體不足 → 檢查日誌中的 'out of memory'"
echo "  2. 超時錯誤   → 檢查日誌中的 'timeout'"
echo "  3. 權限錯誤   → 檢查日誌中的 'permission'"
echo "  4. 依賴錯誤   → 檢查日誌中的 'module not found'"
echo "  5. 語法錯誤   → 檢查日誌中的 'syntax error'" 