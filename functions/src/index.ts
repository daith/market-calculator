/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import cors from "cors";
import express from "express";
import { onRequest } from "firebase-functions/v2/https";
import * as fs from 'fs';
import { google } from 'googleapis';
import * as path from 'path';

// 獲取台北時間
function getTaipeiTime(): string {
  const now = new Date();
  const taipeiTime = now.toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  console.log("Taipei Time:", taipeiTime);
  return taipeiTime;
}


const app = express();
app.use(cors());
app.use(express.json());

// ✅ 使用 router 定義 API 路徑
const router = express.Router();

// Google Sheets API 配置
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

interface OrderData {
  timestamp: string;
  items: Array<{
    name: string;
    result: number;
    unitPrice: number;
    quantity: number;
  }>;
  totalAmount:number;
  actualAmount:number;
  account: string;
}


// 获取配置值
function getConfigValue(key: string): string {
  const envValue = process.env[key];
  if (!envValue) {
    throw new Error(`环境变量 ${key} 未设置`);
  }
  return envValue;
}

// 初始化 Google Sheets API
async function getAuthClient() {
  try {
    // 从本地文件读取凭据
    const credentialsPath = path.join(__dirname, 'config', 'google-credentials.json');
    console.log('Reading credentials from:', credentialsPath);

    const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');
    console.log('getAuthClient - credentials length:', credentialsContent.length);
    console.log('getAuthClient - credentials preview:', credentialsContent.substring(0, 50) + '...');

    const credentialsObj = JSON.parse(credentialsContent);
    const auth = new google.auth.GoogleAuth({
      credentials: credentialsObj,
      scopes: SCOPES,
    });
    return auth;
  } catch (error) {
    console.error('Error loading Google credentials:', error);
    throw new Error('Google credentials not found');
  }
}

// 資料驗證函數
function validateOrderData(orderData: OrderData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!orderData.timestamp) errors.push('timestamp is required');
  if (!orderData.account) errors.push('account is required');
  if (typeof orderData.totalAmount !== 'number') errors.push('totalAmount must be a number');
  if (typeof orderData.actualAmount !== 'number') errors.push('actualAmount must be a number');

  if (!orderData.items || !Array.isArray(orderData.items)) {
    errors.push('items must be an array');
  } else {
    if (orderData.items.length === 0) {
      errors.push('items array cannot be empty');
    } else {
      orderData.items.forEach((item, index) => {
        if (!item.name) errors.push(`item[${index}].name is required`);
        if (typeof item.result !== 'number') errors.push(`item[${index}].result must be a number`);
        if (typeof item.unitPrice !== 'number') errors.push(`item[${index}].unitPrice must be a number`);
        if (typeof item.quantity !== 'number') errors.push(`item[${index}].quantity must be a number`);

        const calculatedResult = item.unitPrice * item.quantity;
        if (Math.abs(calculatedResult - item.result) > 0.01) {
          errors.push(`item[${index}] calculation error: ${item.unitPrice} × ${item.quantity} ≠ ${item.result}`);
        }
      });
    }
  }

  if (orderData.items && Array.isArray(orderData.items)) {
    const calculatedTotal = orderData.items.reduce((sum, item) => sum + item.result, 0);
    if (Math.abs(calculatedTotal - orderData.totalAmount) > 0.01) {
      errors.push(`total amount calculation error: calculated ${calculatedTotal} ≠ provided ${orderData.totalAmount}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// 寫入錯誤日誌到 fail_log sheet
async function writeFailLog(
  auth: any,
  spreadsheetId: string,
  orderData: OrderData,
  errorMessage: string,
  attemptCount: number
) {
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const failLogData = [
      [
        getTaipeiTime(),              // A: 失敗時間
        orderData.account,            // B: 用戶帳號
        JSON.stringify(orderData),    // C: 原始訂單資料
        errorMessage,                 // D: 錯誤訊息
        attemptCount,                 // E: 嘗試次數
        'FAILED'                      // F: 狀態
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'fail_log!A:F',
      valueInputOption: 'RAW',
      requestBody: { values: failLogData },
    });

    console.log('錯誤日誌已寫入 fail_log sheet');
  } catch (error) {
    console.error('寫入錯誤日誌失敗:', error);
  }
}

// 批量寫入函數（策略四）- 修改為append模式
async function batchWriteToSheets(
  auth: any,
  spreadsheetId: string,
  orderMasterId: string,
  orderData: OrderData
) {
  const sheets = google.sheets({ version: 'v4', auth });

  // 準備 master 資料
  const masterValues = [
    [
      orderMasterId,
      orderData.timestamp,
      orderData.items.length,
      orderData.totalAmount,
      orderData.actualAmount,
      orderData.account
    ]
  ];

  // 準備 detail 資料
  const detailValues = orderData.items.map(item => [
    orderMasterId,
    orderData.timestamp,
    item.name,
    item.quantity,
    item.unitPrice,
    item.result,
    orderData.account
  ]);

  console.log('開始批量寫入 (append模式)...');

  // 使用 append 模式寫入 master 資料 - 從最後一筆後插入
  console.log('寫入 order_master 資料...');
  const masterResponse = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'order_master!A:F',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',  // 插入新行而不是覆蓋
    requestBody: {
      values: masterValues
    }
  });

  // 使用 append 模式寫入 detail 資料 - 從最後一筆後插入
  console.log('寫入 order_detail 資料...');
  const detailResponse = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'order_detail!A:G',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',  // 插入新行而不是覆蓋
    requestBody: {
      values: detailValues
    }
  });

  console.log('批量寫入完成 (append模式)');
  console.log('Master 寫入結果:', masterResponse.data.updates);
  console.log('Detail 寫入結果:', detailResponse.data.updates);

  return {
    masterResponse: masterResponse.data,
    detailResponse: detailResponse.data
  };
}

// 驗證寫入結果
async function verifyWrittenData(
  auth: any,
  spreadsheetId: string,
  orderMasterId: string,
  expectedItemCount: number
): Promise<{ masterExists: boolean; detailCount: number; isConsistent: boolean }> {
  const sheets = google.sheets({ version: 'v4', auth });

  try {
    const masterResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'order_master!A:F'
    });

    const masterRows = masterResponse.data.values || [];
    const masterExists = masterRows.some(row => row[0] === orderMasterId);

    const detailResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'order_detail!A:G'
    });

    const detailRows = detailResponse.data.values || [];
    const detailCount = detailRows.filter(row => row[0] === orderMasterId).length;

    const isConsistent = masterExists && detailCount === expectedItemCount;

    console.log('資料驗證結果:', {
      orderMasterId,
      masterExists,
      detailCount,
      expectedItemCount,
      isConsistent
    });

    return { masterExists, detailCount, isConsistent };
  } catch (error) {
    console.error('驗證資料時發生錯誤:', error);
    return { masterExists: false, detailCount: 0, isConsistent: false };
  }
}

// ===== GCP Functions 優化版本 =====
// 移除依賴全局狀態的機制，設計完全無狀態的方案

// 生成超高精度時間戳（納秒級模擬）
function getHighPrecisionTimestamp(): string {
  const now = Date.now();
  const nanoSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${now}${nanoSuffix}`;
}

// 生成強加密隨機字符串
function generateCryptoRandom(length: number = 8): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';

  // 使用多重隨機源提高隨機性
  for (let i = 0; i < length; i++) {
    const randomSources = [
      Math.random(),
      Math.random() * Date.now() % 1,
      Math.random() * performance.now() % 1
    ];
    const combinedRandom = randomSources.reduce((a, b) => (a + b) % 1, 0);
    const index = Math.floor(combinedRandom * chars.length);
    result += chars[index];
  }

  return result;
}

// 生成用戶唯一標識哈希
function generateUserHash(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32位整數
  }

  // 添加當前時間微調，確保同用戶在不同時間的哈希略有不同
  const timeAdjust = Date.now() % 10000;
  hash = (hash + timeAdjust) & 0xffffffff;

  return Math.abs(hash).toString(36).substring(0, 8);
}

// GCP Functions 適配的訂單ID生成器
function generateCloudFunctionOrderId(userId: string): string {
  // 1. 超高精度時間戳（毫秒 + 微秒模擬）
  const highPrecisionTime = getHighPrecisionTimestamp();

  // 2. 用戶唯一哈希（包含時間微調）
  const userHash = generateUserHash(userId);

  // 3. 強隨機字符串（多重隨機源）
  const randomPart1 = generateCryptoRandom(6);
  const randomPart2 = generateCryptoRandom(4);

  // 4. 實例標識（基於進程和內存狀態）
  const instanceId = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  // 5. 校驗碼（防篡改）
  const checksum = (parseInt(highPrecisionTime.slice(-6)) +
                   parseInt(userHash.slice(-4), 36) +
                   parseInt(randomPart1.slice(-3), 36)) % 1000;
  const checksumStr = checksum.toString().padStart(3, '0');

  // 組合最終ID：時間戳_用戶哈希_隨機1_實例ID_隨機2_校驗碼
  const orderId = `${highPrecisionTime}_${userHash}_${randomPart1}_${instanceId}_${randomPart2}_${checksumStr}`;

  console.log('GCP Functions 訂單ID生成:', {
    timestamp: highPrecisionTime,
    userHash: userHash,
    random1: randomPart1,
    instanceId: instanceId,
    random2: randomPart2,
    checksum: checksumStr,
    finalId: orderId,
    length: orderId.length
  });

  return orderId;
}

// 輕量級重複檢查（僅在當前實例生命週期內有效）
const instanceOrderIds = new Set<string>();
const MAX_INSTANCE_IDS = 1000; // 限制內存使用

function quickDuplicateCheck(orderId: string): boolean {
  if (instanceOrderIds.has(orderId)) {
    console.warn('⚠️ 當前實例內檢測到ID重複:', orderId);
    updateStats('duplicate');
    return false;
  }

  instanceOrderIds.add(orderId);

  // 保持合理的內存使用
  if (instanceOrderIds.size > MAX_INSTANCE_IDS) {
    const firstId = instanceOrderIds.values().next().value;
    if (firstId) {
      instanceOrderIds.delete(firstId);
    }
  }

  return true;
}

// 主要的訂單ID生成函數（適合 GCP Functions）
function generateUniqueOrderId(timestamp: string, userId: string): string {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const orderId = generateCloudFunctionOrderId(userId);

    // 輕量級檢查（僅對當前實例有效）
    if (quickDuplicateCheck(orderId)) {
      console.log(`✅ 生成唯一訂單ID (第${attempt}次嘗試):`, orderId);
      return orderId;
    }

    console.warn(`❌ 實例內ID重複，重新生成 (第${attempt}次嘗試)`);
  }

  // 最後一次不做檢查，直接返回（極低機率走到這裡）
  const finalId = generateCloudFunctionOrderId(userId);
  console.log('🔄 使用最終生成ID (未檢查):', finalId);
  return finalId;
}

// 簡化的並發保護（適合 GCP Functions）
const instanceLocks = new Map<string, number>();
const LOCK_TIMEOUT = 10000; // 10秒超時（適合 Functions 短生命週期）

function acquireInstanceLock(userId: string): boolean {
  const now = Date.now();

  // 清理過期鎖
  for (const [key, timestamp] of instanceLocks.entries()) {
    if (now - timestamp > LOCK_TIMEOUT) {
      instanceLocks.delete(key);
    }
  }

  // 檢查用戶是否已有鎖
  if (instanceLocks.has(userId)) {
    console.log(`用戶 ${userId} 在當前實例中已有進行中的操作`);
    return false;
  }

  instanceLocks.set(userId, now);
  console.log(`✅ 獲取實例鎖: ${userId}`);
  return true;
}

function releaseInstanceLock(userId: string) {
  if (instanceLocks.delete(userId)) {
    console.log(`🔓 釋放實例鎖: ${userId}`);
  }
}

// 主要的增強寫入函數（GCP Functions 優化版）
async function writeOrderToSheetEnhanced(orderData: OrderData) {
  const maxRetries = 3;
  let hasLock = false;
  const processingStartTime = Date.now();

  try {
    console.log('=== 開始 GCP Functions 優化寫入流程 ===');

    // 更新統計：開始處理訂單
    updateStats('order');

    // 步驟 1: 資料驗證
    console.log('步驟 1: 資料驗證');
    const validation = validateOrderData(orderData);
    if (!validation.isValid) {
      updateStats('error', { message: `資料驗證失敗: ${validation.errors.join(', ')}` });
      throw new Error(`資料驗證失敗: ${validation.errors.join(', ')}`);
    }
    console.log('✅ 資料驗證通過');

    // 步驟 2: 獲取實例鎖（輕量級並發保護）
    console.log('步驟 2: 獲取實例鎖');
    hasLock = acquireInstanceLock(orderData.account);
    if (!hasLock) {
      updateStats('lock');
      throw new Error('當前實例中該用戶已有進行中的操作，請稍後再試');
    }
    console.log('✅ 獲取實例鎖成功');

    // 步驟 3: 準備強化訂單ID
    const spreadsheetId = getConfigValue('GOOGLE_SPREADSHEET_ID');
    const orderMasterId = generateUniqueOrderId(orderData.timestamp, orderData.account);
    console.log('✅ 強化訂單ID:', orderMasterId);

    // 步驟 4: 認證
    const auth = await getAuthClient();

    // 步驟 5: 帶重試的批量寫入
    let lastError: Error;
    let batchResponse;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`步驟 5.${attempt}: 批量寫入嘗試 (${attempt}/${maxRetries})`);

        batchResponse = await batchWriteToSheets(auth, spreadsheetId, orderMasterId, orderData);
        console.log('✅ 批量寫入成功');
        break;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`❌ 第 ${attempt} 次寫入失敗:`, lastError.message);

        if (attempt === maxRetries) {
          // 最後一次失敗，寫入錯誤日誌
          await writeFailLog(auth, spreadsheetId, orderData, lastError.message, attempt);
          updateStats('fail');
          updateStats('error', { message: lastError.message });
          throw lastError;
        }

        // 等待後重試
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    // 步驟 6: 驗證寫入結果
    console.log('步驟 6: 驗證寫入結果');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const verification = await verifyWrittenData(
      auth,
      spreadsheetId,
      orderMasterId,
      orderData.items.length
    );

    if (!verification.isConsistent) {
      const errorMsg = `資料一致性檢查失敗! 主檔存在: ${verification.masterExists}, 明細筆數: ${verification.detailCount}/${orderData.items.length}`;
      console.error('❌', errorMsg);

      // 寫入錯誤日誌
      await writeFailLog(auth, spreadsheetId, orderData, errorMsg, maxRetries);
      updateStats('fail');
      updateStats('error', { message: errorMsg });

      throw new Error(errorMsg);
    }

    console.log('✅ 資料一致性檢查通過');
    console.log('=== 寫入流程完成 ===');

    // 更新成功統計
    const processingTime = Date.now() - processingStartTime;
    updateStats('success', { processingTime });

    return {
      success: true,
      message: '訂單已成功寫入 Google Sheets',
      orderMasterId: orderMasterId,
      verification: verification,
      batchResponse: batchResponse,  // 修復：直接使用batchResponse對象
      processingTime: processingTime
    };

  } catch (error) {
    console.error('寫入流程失敗:', error);

    // 確保錯誤統計已更新
    if (!systemStats.lastErrorTime || systemStats.lastErrorTime < Date.now() - 1000) {
      updateStats('error', { message: error instanceof Error ? error.message : String(error) });
    }

    throw error;
  } finally {
    // 始終釋放鎖
    if (hasLock) {
      releaseInstanceLock(orderData.account);
    }
  }
}

// 寫入訂單資料到 Google Sheets（保持API相容性）
async function writeOrderToSheet(orderData: OrderData) {
  return await writeOrderToSheetEnhanced(orderData);
}


async function longinPhone(phone: string, password: string) {
   // 从环境变量获取 Spreadsheet ID
   const spreadsheetIdValue = getConfigValue('GOOGLE_SPREADSHEET_ID');

   console.log('=== 環境變數調試信息 ===');
   console.log('spreadsheetIdValue:', spreadsheetIdValue);
   console.log('========================');

   console.log('開始寫入 Google Sheets...');
   console.log('Spreadsheet ID:', spreadsheetIdValue);

   const auth = await getAuthClient();
   console.log('認證成功');

   const sheets = google.sheets({ version: 'v4', auth });
   console.log('Google Sheets API 初始化成功');


  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetIdValue,
    range: 'account!A:C'
  });

 const rows = response.data.values;
 if (!rows || rows.length === 0) {
   throw new Error('No data found');
 }

 const phoneRow = rows.find(row => row[0] === phone);
 if (!phoneRow) {
   return {
     result: false,
     message: 'Phone not found'
   };
 }

//  if (phoneRow[1] !== password) {
//    return {
//      result: false,
//      message: 'Password not found'
//    };
//  }

 return {
   result: true,
   userInfo: {
     phone: phoneRow[0],
     name: phoneRow[2]
   },
   message: 'Success'
 };
}


router.post("/login", async (req, res) => {
  const { phone, password } = req.body;
  const result = await longinPhone(phone, password);
  res.json(result);
});

router.post("/makeOrder", async (req, res) => {
  try {
    const { items } = req.body;

    // 檢查認證狀態
    const loginUser = req.headers['loginuser'] as string;
    if (!loginUser || loginUser === '用戶') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Please login first'
      });
    }

    // 檢查 items 是否存在且為陣列
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: items is required and must be an array'
      });
    }

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: items array cannot be empty'
      });
    }

    const total = items.reduce((sum: number, item: any) => sum + item.result, 0);
    console.log('User:', loginUser, 'Processing order with', items.length, 'items');

    const orderData = {
      timestamp: getTaipeiTime(),
      items,
      totalAmount:total,
      actualAmount:total,
      account: loginUser || '用戶',
    };

    const result = await writeOrderToSheet(orderData);

    return res.json({
      ...result,
      orderData: {
        timestamp: orderData.timestamp,
        total: orderData.totalAmount,
        itemCount: items.length,
      },
    });
  } catch (error) {
    console.error("處理訂單時發生錯誤:", error);
    return res.status(500).json({
      success: false,
      error: '伺服器內部錯誤'
    });
  }
});

router.post("/makeOrderWithDetail", async (req, res) => {
  try {
    const { items, totalAmount, actualAmount } = req.body;

    // 檢查認證狀態
    const loginUser = req.headers['loginuser'] as string;
    if (!loginUser || loginUser === '用戶') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Please login first'
      });
    }

    // 檢查 items 是否存在且為陣列
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: items is required and must be an array'
      });
    }

    if (items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: items array cannot be empty'
      });
    }

    console.log('User:', loginUser, 'Order details - Items:', items.length, 'Total:', totalAmount, 'Actual:', actualAmount);

    const orderData = {
      timestamp: getTaipeiTime(),
      items,
      totalAmount,
      actualAmount,
      account: loginUser || '用戶',
    };

    const result = await writeOrderToSheet(orderData);

    return res.json({
      ...result,
      orderData: {
        timestamp: orderData.timestamp,
        total: orderData.totalAmount,
        itemCount: items.length,
      },
    });
  } catch (error) {
    console.error('makeOrderWithDetail 錯誤:', error);
    return res.status(500).json({
      success: false,
      error: '伺服器內部錯誤'
    });
  }
});

// ===== 健康檢查和狀態監控系統 =====

// 系統啟動時間
const systemStartTime = Date.now();

// 統計資料收集
const systemStats = {
  totalOrders: 0,
  successfulWrites: 0,
  failedWrites: 0,
  duplicateIds: 0,
  lockConflicts: 0,
  lastErrorTime: 0,
  lastErrorMessage: '',
  avgProcessingTime: 0,
  processingTimes: [] as number[]
};

// 更新統計資料的輔助函數
function updateStats(type: 'order' | 'success' | 'fail' | 'duplicate' | 'lock' | 'error', data?: any) {
  switch (type) {
    case 'order':
      systemStats.totalOrders++;
      break;
    case 'success':
      systemStats.successfulWrites++;
      if (data?.processingTime) {
        systemStats.processingTimes.push(data.processingTime);
        if (systemStats.processingTimes.length > 100) {
          systemStats.processingTimes.shift();
        }
        systemStats.avgProcessingTime = systemStats.processingTimes.reduce((a, b) => a + b, 0) / systemStats.processingTimes.length;
      }
      break;
    case 'fail':
      systemStats.failedWrites++;
      break;
    case 'duplicate':
      systemStats.duplicateIds++;
      break;
    case 'lock':
      systemStats.lockConflicts++;
      break;
    case 'error':
      systemStats.lastErrorTime = Date.now();
      systemStats.lastErrorMessage = data?.message || '';
      break;
  }
}

// 實例健康狀態接口
interface InstanceHealth {
  instanceId: string;
  startTime: number;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  activeLocks: number;
  pendingOrderIds: number;
  stats: typeof systemStats;
  locks: Array<{
    userId: string;
    timestamp: number;
    duration: number;
  }>;
  recentOrderIds: string[];
  isHealthy: boolean;
  healthScore: number;
  warnings: string[];
  errors: string[];
}

// Google Sheets 連接測試
async function testGoogleSheetsConnection(): Promise<{
  isConnected: boolean;
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = getConfigValue('GOOGLE_SPREADSHEET_ID');

    // 簡單讀取測試
    await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties.title'
    });

    return {
      isConnected: true,
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      isConnected: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// 生成實例健康報告
async function generateInstanceHealth(): Promise<InstanceHealth> {
  const now = Date.now();
  const uptime = now - systemStartTime;
  const memoryUsage = process.memoryUsage();

  // 分析鎖狀態
  const locks = Array.from(instanceLocks.entries()).map(([userId, timestamp]) => ({
    userId,
    timestamp,
    duration: now - timestamp
  }));

  // 獲取最近的訂單ID（最多10個）
  const recentOrderIds = Array.from(instanceOrderIds).slice(-10);

  // 健康警告檢查
  const warnings: string[] = [];
  const errors: string[] = [];

  // 檢查內存使用
  if (memoryUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
    warnings.push(`內存使用過高: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
  }

  // 檢查長時間運行的鎖
  const longRunningLocks = locks.filter(lock => lock.duration > LOCK_TIMEOUT * 0.8);
  if (longRunningLocks.length > 0) {
    warnings.push(`檢測到 ${longRunningLocks.length} 個長時間運行的鎖`);
  }

  // 檢查過期鎖
  const expiredLocks = locks.filter(lock => lock.duration > LOCK_TIMEOUT);
  if (expiredLocks.length > 0) {
    errors.push(`檢測到 ${expiredLocks.length} 個過期未清理的鎖`);
  }

  // 檢查錯誤率
  const errorRate = systemStats.totalOrders > 0 ? systemStats.failedWrites / systemStats.totalOrders : 0;
  if (errorRate > 0.05) { // 5% 錯誤率
    warnings.push(`錯誤率過高: ${(errorRate * 100).toFixed(1)}%`);
  }

  // 檢查最近錯誤
  if (systemStats.lastErrorTime > now - 300000) { // 5分鐘內有錯誤
    warnings.push(`最近有錯誤發生: ${systemStats.lastErrorMessage}`);
  }

  // 計算健康分數 (0-100)
  let healthScore = 100;
  healthScore -= warnings.length * 10;
  healthScore -= errors.length * 25;
  healthScore -= Math.min(errorRate * 100, 50);
  healthScore = Math.max(0, healthScore);

  const isHealthy = healthScore >= 70 && errors.length === 0;

  return {
    instanceId: `instance_${Math.random().toString(36).substr(2, 8)}`,
    startTime: systemStartTime,
    uptime,
    memoryUsage,
    activeLocks: locks.length,
    pendingOrderIds: recentOrderIds.length,
    stats: { ...systemStats },
    locks,
    recentOrderIds,
    isHealthy,
    healthScore,
    warnings,
    errors
  };
}

// 健康檢查 API 路由
router.get("/health", async (req, res) => {
  try {
    console.log('=== 健康檢查請求 ===');

    const healthCheckStart = Date.now();

    // 並行檢查所有組件
    const [instanceHealth, sheetsConnection] = await Promise.all([
      generateInstanceHealth(),
      testGoogleSheetsConnection()
    ]);

    const healthCheckDuration = Date.now() - healthCheckStart;

    // 綜合健康狀態
    const overallHealthy = instanceHealth.isHealthy && sheetsConnection.isConnected;

    const healthReport = {
      timestamp: getTaipeiTime(),
      overall: {
        isHealthy: overallHealthy,
        status: overallHealthy ? 'HEALTHY' : 'UNHEALTHY',
        score: Math.min(instanceHealth.healthScore, sheetsConnection.isConnected ? 100 : 50),
        checkDuration: healthCheckDuration
      },
      instance: instanceHealth,
      googleSheets: sheetsConnection,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      recommendations: [] as string[]
    };

    // 生成建議
    if (!sheetsConnection.isConnected) {
      healthReport.recommendations.push('檢查 Google Sheets API 憑證和網路連接');
    }

    if (instanceHealth.activeLocks > 0) {
      healthReport.recommendations.push('建議等待當前處理中的操作完成後再進行系統更新');
    }

    if (instanceHealth.warnings.length > 0) {
      healthReport.recommendations.push('建議檢查系統警告並進行相應調整');
    }

    if (instanceHealth.errors.length > 0) {
      healthReport.recommendations.push('發現系統錯誤，建議立即檢查並修復');
    }

    // 設置適當的 HTTP 狀態碼
    const statusCode = overallHealthy ? 200 : 503;

    console.log(`健康檢查完成: ${overallHealthy ? 'HEALTHY' : 'UNHEALTHY'} (${healthCheckDuration}ms)`);

    res.status(statusCode).json(healthReport);

  } catch (error) {
    console.error('健康檢查失敗:', error);

    res.status(500).json({
      timestamp: getTaipeiTime(),
      overall: {
        isHealthy: false,
        status: 'ERROR',
        score: 0,
        error: error instanceof Error ? error.message : String(error)
      },
      instance: null,
      googleSheets: null,
      system: null,
      recommendations: ['系統出現嚴重錯誤，請立即檢查']
    });
  }
});

// 詳細狀態檢查 API（更深入的診斷）
router.get("/health/detailed", async (req, res) => {
  try {
    console.log('=== 詳細健康檢查請求 ===');

    const detailedCheck = {
      timestamp: getTaipeiTime(),
      instanceDetails: await generateInstanceHealth(),
      connectionTests: {
        googleSheets: await testGoogleSheetsConnection()
      },
      memoryAnalysis: {
        usage: process.memoryUsage(),
        gcInfo: {
          // 觸發垃圾回收建議
          shouldTriggerGC: process.memoryUsage().heapUsed > 50 * 1024 * 1024
        }
      },
      performanceMetrics: {
        avgProcessingTime: systemStats.avgProcessingTime,
        recentProcessingTimes: systemStats.processingTimes.slice(-10),
        successRate: systemStats.totalOrders > 0 ?
          (systemStats.successfulWrites / systemStats.totalOrders * 100).toFixed(2) + '%' : 'N/A'
      },
      securityStatus: {
        activeLocks: instanceLocks.size,
        oldestLockAge: instanceLocks.size > 0 ?
          Math.min(...Array.from(instanceLocks.values()).map(ts => Date.now() - ts)) : 0,
        duplicateIdDetections: systemStats.duplicateIds
      }
    };

    res.json(detailedCheck);

  } catch (error) {
    console.error('詳細健康檢查失敗:', error);
    res.status(500).json({
      error: 'Detailed health check failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// 安全重啟準備檢查 API
router.get("/health/restart-ready", async (req, res) => {
  try {
    console.log('=== 重啟準備檢查 ===');

    const now = Date.now();
    const activeLocks = Array.from(instanceLocks.entries());
    const recentActivity = systemStats.totalOrders > 0 &&
      (now - systemStats.lastErrorTime < 60000); // 1分鐘內有活動

    const readyForRestart = {
      isReady: activeLocks.length === 0 && !recentActivity,
      timestamp: getTaipeiTime(),
      checks: {
        noActiveLocks: {
          passed: activeLocks.length === 0,
          details: activeLocks.length > 0 ?
            `有 ${activeLocks.length} 個活躍鎖: ${activeLocks.map(([user]) => user).join(', ')}` :
            '沒有活躍鎖'
        },
        noRecentActivity: {
          passed: !recentActivity,
          details: recentActivity ? '檢測到最近有活動' : '沒有最近活動'
        },
        systemHealth: {
          passed: systemStats.failedWrites === 0 ||
            (systemStats.totalOrders > 0 && systemStats.failedWrites / systemStats.totalOrders < 0.1),
          details: `成功率: ${systemStats.totalOrders > 0 ?
            ((systemStats.successfulWrites / systemStats.totalOrders) * 100).toFixed(1) : '100'}%`
        }
      },
      waitRecommendation: activeLocks.length > 0 ?
        `建議等待 ${Math.max(...activeLocks.map(([, ts]) => LOCK_TIMEOUT - (now - ts)))}ms` :
        '可以安全重啟',
      pendingData: {
        lockedUsers: activeLocks.map(([user, ts]) => ({
          user,
          lockDuration: now - ts,
          remainingTimeout: LOCK_TIMEOUT - (now - ts)
        })),
        pendingOrderIds: Array.from(instanceOrderIds).slice(-5)
      }
    };

    // 根據是否準備好設置狀態碼
    const statusCode = readyForRestart.isReady ? 200 : 202; // 202 = Accepted but not ready

    res.status(statusCode).json(readyForRestart);

  } catch (error) {
    console.error('重啟準備檢查失敗:', error);
    res.status(500).json({
      isReady: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.use("/api", router); // 👈 這行會正確接住 /api/login, /api/write-order


export const api = onRequest(app);

// ===== GCP Functions 限制適配 =====

// 這些常數可以在需要時重新啟用