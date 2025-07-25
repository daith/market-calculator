// src/app/calculator/page.tsx

'use client';

import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth';


interface Item {
  name: string;
  result: number;
  unit: string;
  unitPrice: number;
  quantity: number;
}

function CalculatorPageContent() {
  const [items, setItems] = useState<Item[]>([]);
  const [itemName, setItemName] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [inputStep, setInputStep] = useState<'name' | 'unitPrice' | 'quantity'>('unitPrice');
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemIndex, setDeleteItemIndex] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [isListExpanded, setIsListExpanded] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [actualAmount, setActualAmount] = useState('');
  const { user, logout, handleApiError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckoutDetailsExpanded, setIsCheckoutDetailsExpanded] = useState(false);

  // 更新當前時間
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeString);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 防止 Modal 顯示時的背景滾動
  useEffect(() => {
    if (showNameModal || showDeleteModal || showSuccessModal || showLoadingModal || showCheckoutModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [showNameModal, showDeleteModal, showSuccessModal, showLoadingModal, showCheckoutModal]);

  // 處理數字鍵盤輸入
  const handleKeypadInput = (val: string) => {
    if (inputStep === 'unitPrice') {
      setUnitPrice(unitPrice + val);
    } else if (inputStep === 'quantity') {
      setQuantity(quantity + val);
    }
  };

  const handleBackspace = () => {
    if (inputStep === 'unitPrice') {
      setUnitPrice(unitPrice.slice(0, -1));
    } else if (inputStep === 'quantity') {
      setQuantity(quantity.slice(0, -1));
    }
  };

  const handleAC = () => {
    setItemName('');
    setUnitPrice('');
    setQuantity('');
    setInputStep('unitPrice');
  };

  // 品項彈窗確認
  const handleNameConfirm = () => {
    setItemName(tempName);
    setTempName('');
    setShowNameModal(false);
  };

  // 點選品項欄位
  const handleNameClick = () => {
    setTempName(itemName);
    setShowNameModal(true);
  };

  // 刪除 result-sector 商品
  const handleDeleteItem = (idx: number) => {
    setDeleteItemIndex(idx);
    setShowDeleteModal(true);
  };

  // 確認刪除商品
  const confirmDeleteItem = () => {
    if (deleteItemIndex !== null) {
      setItems(prev => prev.filter((_, i) => i !== deleteItemIndex));
    }
    setShowDeleteModal(false);
    setDeleteItemIndex(null);
  };

  // 取消刪除
  const cancelDeleteItem = () => {
    setShowDeleteModal(false);
    setDeleteItemIndex(null);
  };

  // + 按鈕送出
  const handleSubmit = async (actualAmountInput?: string) => {
    if (items.length === 0) return;
    
    // 驗證所有商品資料有效性
    const invalidItem = items.find(item => 
      !item.name || 
      item.name.trim() === '' || 
      isNaN(item.unitPrice) || 
      isNaN(item.quantity) || 
      isNaN(item.result) ||
      item.unitPrice <= 0 || 
      item.quantity <= 0
    );
    
    if (invalidItem) {
      alert('發現無效的商品資料，請檢查後重試');
      return;
    }
    
    setIsSubmitting(true);
    setShowLoadingModal(true);
    try {
      // 這裡用 placeholder API，請根據實際情況修改
      const apiUrl = process.env.NODE_ENV === 'production' ? 'https://api-ivnwhyjnvq-uc.a.run.app/api/makeOrderWithDetail' : 'https://api-ivnwhyjnvq-uc.a.run.app/api/makeOrderWithDetail';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'loginUser': user?.phone || '用戶' },
        body: JSON.stringify({ 
          items, 
          totalAmount: total,
          actualAmount: actualAmountInput ? parseFloat(actualAmountInput) : total
        }),
      });
      
      if (!response.ok) {
        // 使用通用錯誤處理函數
        if (handleApiError(response)) {
          setShowLoadingModal(false);
          return; // 錯誤已被處理，直接返回
        }
        throw new Error(`送出失敗 (${response.status})`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '送出失敗');
      }
      
      // 成功後清空所有狀態
      setItems([]);
      setItemName('');
      setUnitPrice('');
      setQuantity('');
      setInputStep('unitPrice');
      setActualAmount('');
      setShowLoadingModal(false);
      setShowSuccessModal(true);
    } catch (e) {
      setShowLoadingModal(false);
      const errorMessage = e instanceof Error ? e.message : '送出失敗，請稍後再試';
      
      // 如果是網路錯誤，提示可能需要重新登入
      if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
        alert('網路連線異常，可能需要重新登入後再試');
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 合計
  const total = items.reduce((sum, item) => sum + item.result, 0);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      
      <div className="flex flex-col h-full">
        {/* result-sector */}
        <section className="p-4 border-b bg-white" id="result-sector">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-lg">商品清單</div>
            <button 
              onClick={() => setIsListExpanded(!isListExpanded)}
              className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
            >
              {isListExpanded ? '收合' : '展開'}
              <span className="text-xs">
                {isListExpanded ? '▲' : '▼'}
              </span>
            </button>
          </div>
          
          {isListExpanded && (
            <>
              {/* 表頭 */}
              <div className="flex items-center gap-2 text-xs text-gray-500 border-b border-gray-200 pb-1 mb-2">
                <span className="w-4">#</span>
                <span className="flex-1">品名</span>
                <span className="w-12 text-right">單價</span>
                <span className="w-12 text-right">數量</span>
                <span className="w-16 text-right">總價</span>
                <span className="w-12 text-center">操作</span>
              </div>
              <div
                className="space-y-1 overflow-y-auto"
                style={{ height: 'calc(4 * 2rem + 0.5rem)' }}
              >
                {items.length === 0 && <div className="text-zinc-400">尚無品項</div>}
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm min-h-[2rem] border-b border-gray-100 py-1">
                    <span className="w-4 text-zinc-500 text-xs">{idx + 1}</span>
                    <span className="flex-1 truncate">{item.name}</span>
                    <span className="w-12 text-right">{item.unitPrice}</span>
                    <span className="w-12 text-right">{item.quantity}</span>
                    <span className="w-24 text-center text-xs text-gray-500">{item.result}</span>
                    <button className="px-2 py-1 bg-red-200 text-red-700 rounded text-xs hover:bg-red-300" onClick={() => handleDeleteItem(idx)}>刪除</button>
                  </div>
                ))}
              </div>
            </>
          )}
          
          <div className="border-t mt-2 pt-2">
            <div className="flex justify-between items-center font-bold text-lg mb-2">
              <span>合計</span>
              <span>{total}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
              <span>商品總數: {items.length} 項</span>
              {items.length > 0 && (
                <button 
                  onClick={() => {
                    setActualAmount(total.toString());
                    setShowCheckoutModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  結算
                </button>
              )}
            </div>
          </div>
        </section>
        {/* calculator-sector */}
        <section className="flex flex-col items-center py-6 bg-white" id="calculator-sector">
          <div className="max-w-xl w-full flex flex-col items-center">
           
            {/* 計算機顯示屏風格 */}
            <div className="w-full max-w-md mb-2">
              <div className="bg-zinc-900 rounded-lg p-1 shadow-lg min-h-[2rem] border-1 border-zinc-800">
                {/* 品項提示（小字） */}
                {itemName && (
                  <div className="text-green-500 text-sm mb-1 font-mono">
                    {itemName}
                  </div>
                )}
                
                {/* 主顯示區域 - 計算式 */}
                <div className="text-green-400 font-mono text-right">
                  <div className="text-4xl font-bold">
                    {(() => {
                      if (unitPrice && quantity) {
                        return `${unitPrice} × ${quantity} = ${parseFloat(unitPrice) * parseFloat(quantity)}`;
                      } else if (unitPrice && inputStep === 'quantity') {
                        return `${unitPrice} × ${quantity || '?'}`;
                      } else if (unitPrice) {
                        return `${unitPrice} × ?`;
                      } else if (quantity && inputStep === 'unitPrice') {
                        return `? × ${quantity}`;
                      } else if (inputStep === 'quantity') {
                        return `數量: ${quantity || ''}`;
                      } else if (inputStep === 'unitPrice') {
                        return `單價: ${unitPrice || ''}`;
                      } else if (inputStep === 'name') {
                        return itemName || '請輸入品項';
                      } else {
                        return '0';
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
            {/* 計算機數字鍵盤（7 8 9 品項 / 4 5 6 單價 / 1 2 3 數量 / ac 0 < +） */}
            <div className="grid grid-cols-4 gap-4 w-full max-w-md mt-4">
              {/* 第一行 */}
              <button className="py-5 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-blue-50 transition" onClick={() => handleKeypadInput('7')}>7</button>
              <button className="py-5 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-blue-50 transition" onClick={() => handleKeypadInput('8')}>8</button>
              <button className="py-5 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-blue-50 transition" onClick={() => handleKeypadInput('9')}>9</button>
              <button className="py-5 bg-zinc-200 rounded-xl shadow-md text-base font-semibold hover:bg-blue-100 transition" onClick={handleNameClick}>品項</button>
              {/* 第二行 */}
              <button className="py-5 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-blue-50 transition" onClick={() => handleKeypadInput('4')}>4</button>
              <button className="py-5 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-blue-50 transition" onClick={() => handleKeypadInput('5')}>5</button>
              <button className="py-5 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-blue-50 transition" onClick={() => handleKeypadInput('6')}>6</button>
              <button className="py-5 bg-zinc-200 rounded-xl shadow-md text-base font-semibold hover:bg-blue-100 transition" onClick={() => setInputStep('unitPrice')}>單價</button>
              {/* 第三行 */}
              <button className="py-5 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-blue-50 transition" onClick={() => handleKeypadInput('1')}>1</button>
              <button className="py-5 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-blue-50 transition" onClick={() => handleKeypadInput('2')}>2</button>
              <button className="py-5 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-blue-50 transition" onClick={() => handleKeypadInput('3')}>3</button>
              <button className="py-5 bg-zinc-200 rounded-xl shadow-md text-base font-semibold hover:bg-blue-100 transition" onClick={() => setInputStep('quantity')}>X</button>
              {/* 第四行 */}
              <button className="py-5 bg-red-200 rounded-xl shadow-md text-lg font-bold hover:bg-red-300 transition" onClick={handleAC}>AC</button>
              <button className="py-5 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-blue-50 transition" onClick={() => handleKeypadInput('0')}>0</button>
              <button className="py-5 bg-yellow-200 rounded-xl shadow-md text-lg font-bold hover:bg-yellow-300 transition" onClick={handleBackspace}>{'<'}</button>
              <button
                className="py-5 bg-blue-600 text-white rounded-xl shadow-lg text-2xl font-bold hover:bg-blue-700 transition"
                onClick={() => { 
                  if (unitPrice && quantity) {
                    // 新增商品
                    const unitPriceNum = parseFloat(unitPrice);
                    const quantityNum = parseFloat(quantity);
                    
                    // 驗證數字是否有效
                    if (isNaN(unitPriceNum) || isNaN(quantityNum) || unitPriceNum <= 0 || quantityNum <= 0) {
                      alert('請輸入有效的單價和數量');
                      return;
                    }
                    
                    setItems(prev => ([
                      ...prev,
                      {
                        name: itemName || '-',
                        result: unitPriceNum * quantityNum,
                        unit: '',
                        unitPrice: unitPriceNum,
                        quantity: quantityNum,
                      },
                    ]));
                    setItemName('');
                    setUnitPrice('');
                    setQuantity('');
                    setInputStep('unitPrice');
                  }
                }}
              >
               ＝
              </button>
            </div>
          </div>
          {/* 品項輸入 Modal */}
          {showNameModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 overflow-hidden">
              <div className="bg-white rounded-lg p-6 w-80 max-w-[90vw] shadow-lg flex flex-col">
                <div className="font-bold mb-2">輸入品項名稱</div>
                <input
                  className="border p-2 rounded mb-4"
                  type="text"
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  placeholder="請輸入品項名稱"
                />
                <div className="flex gap-2 justify-end">
                  <button className="px-4 py-2 rounded bg-zinc-300" onClick={() => setShowNameModal(false)}>取消</button>
                  <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleNameConfirm}>確認</button>
                </div>
              </div>
            </div>
          )}
          {/* 刪除確認彈窗 */}
          {showDeleteModal && deleteItemIndex !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-80 shadow-lg flex flex-col">
                <div className="font-bold mb-2">確認刪除</div>
                <p>您確定要刪除商品「{items[deleteItemIndex]?.name}」嗎？</p>
                <div className="flex gap-2 justify-end mt-4">
                  <button className="px-4 py-2 rounded bg-zinc-300" onClick={cancelDeleteItem}>取消</button>
                  <button className="px-4 py-2 rounded bg-red-600 text-white" onClick={confirmDeleteItem}>確認</button>
                </div>
              </div>
            </div>
          )}
          {/* 成功提示彈窗 */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-80 shadow-lg flex flex-col">
                <div className="font-bold mb-2 text-green-600">✅ 操作成功</div>
                <p className="mb-4">已成功寫入 Google Sheet!</p>
                <div className="flex justify-end">
                  <button 
                    className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700" 
                    onClick={() => setShowSuccessModal(false)}
                  >
                    確認
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* 處理中彈窗 */}
          {showLoadingModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-80 shadow-lg flex flex-col items-center">
                <div className="font-bold mb-4 text-blue-600">📤 處理中</div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p>資料正在寫入 Google Sheet，請稍候...</p>
                </div>
              </div>
            </div>
          )}
          {/* 結算確認彈窗 */}
          {showCheckoutModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-start justify-center z-50 overflow-hidden pt-16">
              <div className="bg-white rounded-lg p-6 w-80 max-w-[90vw] shadow-lg flex flex-col">
                <div className="font-bold mb-4 text-green-600">💰 結算確認</div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span>商品總數:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{items.length} 項</span>
                      <button 
                        onClick={() => setIsCheckoutDetailsExpanded(!isCheckoutDetailsExpanded)}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                      >
                        {isCheckoutDetailsExpanded ? '收合' : '明細'}
                      </button>
                    </div>
                  </div>
                  
                  {/* 明細列表 - 可開合 */}
                  {isCheckoutDetailsExpanded && (
                    <div className="border rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-500 mb-2 grid grid-cols-6 gap-1">
                        <span>品名</span>
                        <span className="text-right">單價</span>
                        <span className="text-right">數量</span>
                        <span className="text-right col-span-2">小計</span>
                        <span></span>
                      </div>
                      <div 
                        className="space-y-1 overflow-y-auto pr-1"
                        style={{ maxHeight: '10rem' }} // 約5列的高度
                      >
                        {items.map((item, idx) => (
                          <div key={idx} className="text-xs grid grid-cols-6 gap-1 py-1 border-b border-gray-200 last:border-b-0">
                            <span className="truncate" title={item.name}>{item.name}</span>
                            <span className="text-right">{item.unitPrice}</span>
                            <span className="text-right">{item.quantity}</span>
                            <span className="text-right col-span-2">${item.result}</span>
                            <span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>預計總金額:</span>
                    <span className="font-semibold">${total}</span>
                  </div>
                  <div className="border-t pt-3">
                    <label className="block text-sm font-medium mb-2">實收金額:</label>
                    <input
                      type="number"
                      className="w-full border p-2 rounded"
                      value={actualAmount}
                      onChange={e => setActualAmount(e.target.value)}
                      placeholder="請輸入實收金額"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <button 
                    className="px-4 py-2 rounded bg-zinc-300" 
                    onClick={() => setShowCheckoutModal(false)}
                  >
                    取消
                  </button>
                  <button 
                    className="px-4 py-2 rounded bg-green-600 text-white" 
                    onClick={async () => {
                      setShowCheckoutModal(false);
                      await handleSubmit(actualAmount);
                    }}
                    disabled={!actualAmount}
                  >
                    確認結算
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
      {/* linked-sector */}
      <section className="flex justify-between items-center px-4 py-3 bg-white border-t" id="linked-sector">
        <a
          href="https://docs.google.com/spreadsheets/d/1QbkQtHoazOFKiBgJWA4vGRFD7vnh7UE2-6fjJNvOViI/edit?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow"
        >
          表單
        </a>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <div>歡迎 {user?.name || user?.phone || '用戶'} 登入使用</div>
            <div className="text-xs">{currentTime}</div>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 shadow"
          >
            登出
          </button>
        </div>
      </section>
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <ProtectedRoute>
      <CalculatorPageContent />
    </ProtectedRoute>
  );
} 