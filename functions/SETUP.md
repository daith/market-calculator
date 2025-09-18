# Firebase Functions 环境变量设置

## 需要设置的环境变量

您的 Firebase Functions 需要以下环境变量才能正常工作：

### 1. GOOGLE_SPREADSHEET_ID
您的 Google Sheets 的 ID。可以从 Google Sheets URL 中获取：
```
https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit
```

### 2. GOOGLE_CREDENTIALS
Google Service Account 的完整 JSON 凭据。这应该是一个完整的 JSON 字符串。

## 设置步骤

### 步骤 1：创建 Google Service Account
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择您的项目
3. 进入 "IAM 和管理" > "服务账户"
4. 点击 "创建服务账户"
5. 填写服务账户名称和描述
6. 创建并下载 JSON 密钥文件

### 步骤 2：设置 Google Sheets 权限
1. 打开您的 Google Sheets
2. 点击 "共享" 按钮
3. 添加您的服务账户邮箱（在 JSON 文件中找到 `client_email`）
4. 给予 "编辑者" 权限

### 步骤 3：设置 Firebase 环境变量

#### 方法 A：使用 Firebase CLI 配置（推荐）

使用 Firebase CLI 设置环境变量：

```bash
# 设置 Spreadsheet ID
firebase functions:config:set google.spreadsheet_id="YOUR_SPREADSHEET_ID"

# 设置 Google 凭据（需要将 JSON 文件内容转换为单行）
firebase functions:config:set google.credentials="$(cat lib/google-credentials.json | tr -d '\n')"
```

#### 方法 B：使用环境变量

如果您更喜欢使用环境变量，可以在部署时设置：

```bash
# 设置环境变量
export GOOGLE_SPREADSHEET_ID="your_spreadsheet_id_here"
export GOOGLE_CREDENTIALS="$(cat path/to/your/service-account-key.json | tr -d '\n')"

# 部署
firebase deploy --only functions
```

### 步骤 4：部署 Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

## 本地开发

如果您需要在本地测试，可以创建 `.env` 文件：

```bash
# 在 functions 目录中创建 .env 文件
echo "GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here" > .env
echo "GOOGLE_CREDENTIALS=$(cat path/to/your/service-account-key.json | tr -d '\n')" >> .env
```

## 验证配置

部署后，您可以通过以下方式验证配置：

```bash
# 查看当前配置
firebase functions:config:get
```

## 故障排除

如果遇到权限错误：
1. 确保服务账户有访问 Google Sheets 的权限
2. 确保 Google Sheets API 已启用
3. 检查环境变量是否正确设置

如果遇到 "配置未找到" 错误：
1. 确保所有环境变量都已正确设置
2. 重新部署 Functions
3. 检查 Firebase 控制台中的环境变量配置

如果遇到 JSON 解析错误：
1. 确保 GOOGLE_CREDENTIALS 是有效的 JSON 格式
2. 确保 JSON 内容没有换行符（使用 `tr -d '\n'` 处理）
3. 检查 JSON 文件是否完整且未损坏 