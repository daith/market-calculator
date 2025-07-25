#!/bin/bash

# 山腳下園藝工具 - Firebase Hosting 部署配置腳本
# 使用方法: ./deploy-host.sh [環境]
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

log_info "開始部署到 Firebase Hosting 的 $ENVIRONMENT 環境..."

# 設置環境變數
case $ENVIRONMENT in
    "dev")
        FIREBASE_PROJECT="my-trail-161fe"
        NEXT_PUBLIC_ENV="development"
        NEXT_PUBLIC_API_URL="https://asia-east1-my-trail-161fe.cloudfunctions.net/api"
        BUILD_COMMAND="npm run build"
        OUTPUT_DIR="out"
        HOSTING_TARGET="default"
        ;;
    "staging")
        FIREBASE_PROJECT="my-trail-161fe"
        NEXT_PUBLIC_ENV="staging"
        NEXT_PUBLIC_API_URL="https://asia-east1-my-trail-161fe.cloudfunctions.net/api"
        BUILD_COMMAND="npm run build"
        OUTPUT_DIR="out"
        HOSTING_TARGET="staging"
        ;;
    "prod")
        FIREBASE_PROJECT="vendorcalc"
        NEXT_PUBLIC_ENV="production"
        NEXT_PUBLIC_API_URL="https://asia-east1-vendorcalc.cloudfunctions.net/api"
        BUILD_COMMAND="npm run build"
        OUTPUT_DIR="out"
        HOSTING_TARGET="default"
        ;;
esac

# 檢查必要工具
command -v node >/dev/null 2>&1 || {
    log_error "Node.js 未安裝"
    exit 1
}

command -v npm >/dev/null 2>&1 || {
    log_error "npm 未安裝"
    exit 1
}

# 檢查 Node.js 版本
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "需要 Node.js 18 或更高版本，當前版本: $(node -v)"
    exit 1
fi

# 檢查 Firebase CLI
command -v firebase >/dev/null 2>&1 || {
    log_error "Firebase CLI 未安裝。請執行: npm install -g firebase-tools"
    exit 1
}

# 檢查項目檔案
if [ ! -f "package.json" ]; then
    log_error "package.json 不存在"
    exit 1
fi

if [ ! -f "next.config.ts" ]; then
    log_error "next.config.ts 不存在"
    exit 1
fi

if [ ! -f "firebase.json" ]; then
    log_error "firebase.json 不存在"
    exit 1
fi

# 切換到 Firebase 專案
log_info "切換到 Firebase 專案: $FIREBASE_PROJECT"
firebase use "$FIREBASE_PROJECT" || {
    log_error "無法切換到專案 $FIREBASE_PROJECT，請檢查專案是否存在"
    exit 1
}

# 安裝依賴
log_info "安裝依賴..."
npm ci

# 設置環境變數檔案
log_info "設置環境變數..."
cat > .env.local << EOF
NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV
NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
EOF

# 執行建置前檢查
log_info "執行建置前檢查..."

# 運行 lint
if npm run lint >/dev/null 2>&1; then
    log_success "Lint 檢查通過"
else
    log_warning "Lint 檢查有警告，繼續建置..."
fi

# 運行測試（如果存在）
if grep -q '"test"' package.json; then
    log_info "運行測試..."
    npm test || {
        log_warning "測試失敗，但繼續部署"
    }
fi

# 建置應用
log_info "建置 Next.js 應用..."
$BUILD_COMMAND || {
    log_error "建置失敗"
    exit 1
}

log_success "建置完成"

# 詢問確認（生產環境）
if [ "$ENVIRONMENT" = "prod" ]; then
    log_warning "即將部署到生產環境！"
    read -p "確定要繼續嗎？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "部署已取消"
        exit 0
    fi
fi

# Firebase Hosting 部署
log_info "部署到 Firebase Hosting..."

case $ENVIRONMENT in
    "dev")
        log_info "部署到開發環境..."
        firebase deploy --only hosting || {
            log_error "Firebase Hosting 部署失敗"
            exit 1
        }
        ;;
    "staging")
        log_info "部署到測試環境..."
        if [ "$HOSTING_TARGET" != "default" ]; then
            firebase deploy --only hosting:$HOSTING_TARGET || {
                log_error "Firebase Hosting 部署失敗"
                exit 1
            }
        else
            firebase deploy --only hosting || {
                log_error "Firebase Hosting 部署失敗"
                exit 1
            }
        fi
        ;;
    "prod")
        log_info "部署到生產環境..."
        firebase deploy --only hosting || {
            log_error "Firebase Hosting 部署失敗"
            exit 1
        }
        ;;
esac

# 獲取部署 URL
if [ "$HOSTING_TARGET" != "default" ] && [ "$ENVIRONMENT" = "staging" ]; then
    DEPLOY_URL="https://$HOSTING_TARGET-$FIREBASE_PROJECT.web.app"
else
    DEPLOY_URL="https://$FIREBASE_PROJECT.web.app"
fi

# 部署後測試
if [ -n "$DEPLOY_URL" ]; then
    log_info "執行部署後測試..."
    
    # 等待部署完成
    sleep 10
    
    # 測試健康檢查
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL" || echo "000")
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_success "部署後測試通過 (HTTP $HTTP_CODE)"
    else
        log_warning "部署後測試返回 HTTP $HTTP_CODE"
        log_info "這可能是正常的，請手動檢查網站"
    fi
fi

# 清理
log_info "清理暫存檔案..."
rm -f .env.local

# 部署完成
log_success "部署到 Firebase Hosting 的 $ENVIRONMENT 環境完成！"

# 顯示有用資訊
log_info "部署資訊："
echo "  - 環境: $ENVIRONMENT"
echo "  - Firebase 專案: $FIREBASE_PROJECT"
echo "  - Hosting 目標: $HOSTING_TARGET"
echo "  - Node.js: $(node -v)"
echo "  - 建置時間: $(date)"

if [ -n "$DEPLOY_URL" ]; then
    echo ""
    log_info "網站 URL:"
    echo "  - 主要網站: $DEPLOY_URL"
    echo "  - 登入頁面: $DEPLOY_URL/login"
    echo "  - 計算器: $DEPLOY_URL/calculator"
    echo "  - 市場計算器: $DEPLOY_URL/market-calculator"
    
    echo ""
    log_info "Firebase 管理:"
    echo "  - Firebase 控制台: https://console.firebase.google.com/project/$FIREBASE_PROJECT"
    echo "  - Hosting 設定: https://console.firebase.google.com/project/$FIREBASE_PROJECT/hosting"
fi

echo ""
log_success "🎉 部署成功完成！"

# 如果是開發環境，提供額外的調試資訊
if [ "$ENVIRONMENT" = "dev" ]; then
    echo ""
    log_info "開發提示："
    echo "  - 本地開發: npm run dev"
    echo "  - 建置檢查: npm run build"
    echo "  - 型別檢查: npm run type-check"
    echo "  - Firebase 本地: firebase serve --only hosting"
    echo "  - Firebase 預覽: firebase hosting:channel:deploy preview"
    echo "  - 專案狀態: firebase projects:list"
fi 