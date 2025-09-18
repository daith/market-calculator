#!/bin/bash

# 山腳下園藝工具 - Google Sheets 權限修復腳本
# 使用方法: ./fix-sheets-permissions.sh [環境]
# 環境選項: dev, staging, prod

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
ENVIRONMENT=${1:-prod}

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    log_error "無效的環境參數。請使用: dev, staging, prod"
    exit 1
fi

# 設置專案資訊
case $ENVIRONMENT in
    "dev"|"staging")
        PROJECT_ID="my-trail-161fe"
        SERVICE_ACCOUNT="my-trail-161fe@appspot.gserviceaccount.com"
        ;;
    "prod")
        PROJECT_ID="vendorcalc"
        SERVICE_ACCOUNT="vendorcalc@appspot.gserviceaccount.com"
        ;;
esac

log_info "檢查 $ENVIRONMENT 環境的 Google Sheets 權限"
log_info "專案: $PROJECT_ID"
log_info "服務帳戶: $SERVICE_ACCOUNT"

echo ""
log_info "==================== 步驟 1: 啟用 Google Sheets API ===================="
echo "🌐 請在瀏覽器中打開以下連結並啟用 API："
echo "   https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=$PROJECT_ID"
echo ""
read -p "按 Enter 鍵繼續，確認已啟用 Google Sheets API..."

echo ""
log_info "==================== 步驟 2: 檢查服務帳戶設定 ===================="
echo "🔑 服務帳戶資訊："
echo "   Email: $SERVICE_ACCOUNT"
echo "   專案: $PROJECT_ID"
echo ""
echo "🌐 檢查服務帳戶設定："
echo "   https://console.cloud.google.com/iam-admin/serviceaccounts?project=$PROJECT_ID"

echo ""
log_info "==================== 步驟 3: 共享 Google Sheet ===================="
log_warning "🔧 重要：您需要將服務帳戶加入到 Google Sheet 的共享設定中"
echo ""
echo "📋 操作步驟："
echo "   1. 打開您的 Google Sheet"
echo "   2. 點擊右上角的 '共享' 按鈕"
echo "   3. 在 '邀請他人' 中輸入: $SERVICE_ACCOUNT"
echo "   4. 設定權限為 '編輯者' 或 '檢視者'"
echo "   5. 點擊 '傳送'"
echo ""
echo "📝 如果您不知道 Google Sheet URL，請檢查程式碼中的 SHEET_ID"

echo ""
log_info "==================== 步驟 4: 檢查 IAM 權限 ===================="
echo "🌐 檢查 IAM 設定："
echo "   https://console.cloud.google.com/iam-admin/iam?project=$PROJECT_ID"
echo ""
echo "✅ 確保服務帳戶有以下角色之一："
echo "   - Editor"
echo "   - Service Account Token Creator"
echo "   - 自定義角色包含 sheets.* 權限"

echo ""
log_info "==================== 步驟 5: 測試權限 ===================="
echo "🧪 測試建議："
echo "   1. 運行健康檢查 API"
echo "   2. 嘗試簡單的 API 調用"
echo "   3. 檢查 Functions 日誌"

echo ""
log_info "==================== 快速測試命令 ===================="
echo "# 測試 API 健康檢查"
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "curl https://asia-east1-vendorcalc.cloudfunctions.net/api/health"
else
    echo "curl https://asia-east1-my-trail-161fe.cloudfunctions.net/api/health"
fi
echo ""
echo "# 查看詳細錯誤日誌"
echo "./check-functions-logs.sh $ENVIRONMENT"

echo ""
log_info "==================== 常見問題排除 ===================="
echo "❓ 如果仍然有權限問題："
echo ""
echo "1. 🔍 檢查 Google Sheet ID 是否正確"
echo "   - 確認程式碼中的 SHEET_ID 變數"
echo "   - URL 格式: https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit"
echo ""
echo "2. 🔑 重新生成服務帳戶金鑰"
echo "   - 到 IAM > 服務帳戶 > $SERVICE_ACCOUNT"
echo "   - 新增金鑰 > 建立新金鑰 > JSON"
echo "   - 替換 functions/src/config/google-credentials.json"
echo ""
echo "3. ⏰ 等待權限生效"
echo "   - 權限變更可能需要幾分鐘生效"
echo "   - 嘗試重新部署 Functions"
echo ""
echo "4. 🧹 清除快取並重新部署"
echo "   - cd functions"
echo "   - npm run build"
echo "   - firebase deploy --only functions"

echo ""
log_success "🎯 權限修復指南完成！"
log_info "如果問題仍然存在，請檢查上述每個步驟並確保正確配置。" 