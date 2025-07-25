// src/app/calculator/page.tsx

'use client';

import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth';

interface Item {
  name: string;
  expression: string;
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
  const [inputStep, setInputStep] = useState<'name' | 'unitPrice' | 'quantity'>('name');
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemIndex, setDeleteItemIndex] = useState<number | null>(null);
  const { user, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setInputStep('name');
  };

  // 品項彈窗確認
  const handleNameConfirm = () => {
    // 若三欄皆有內容，先存上一筆
    if (itemName || unitPrice || quantity) {
      if (unitPrice && quantity) {
        const unitPriceNum = parseFloat(unitPrice);
        const quantityNum = parseFloat(quantity);
        setItems(prev => ([
          ...prev,
          {
            name: itemName,
            expression: `${unitPrice}*${quantity}`,
            result: unitPriceNum * quantityNum,
            unit: '',
            unitPrice: unitPriceNum,
            quantity: quantityNum,
          },
        ]));
      }
      setUnitPrice('');
      setQuantity('');
    }
    setItemName(tempName);
    setTempName('');
    setShowNameModal(false);
    setInputStep('unitPrice');
  };

  // 點選品項欄位
  const handleNameClick = () => {
    setTempName('');
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
  const handleSubmit = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    try {

      // 顯示載入狀態
      const confirmButton = document.querySelector('button[onclick*="handleSubmit"]');
      if (confirmButton) {
        confirmButton.textContent = '處理中...';
        confirmButton.setAttribute('disabled', 'true');
      }
      // 這裡用 placeholder API，請根據實際情況修改
      const apiUrl = process.env.NODE_ENV === 'production' ? 'https://api-awdqlpezfa-uc.a.run.app/api/makeOrder' : 'https://api-awdqlpezfa-uc.a.run.app/api/makeOrder';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'loginUser': user?.phone || '用戶' },
        body: JSON.stringify({ items }),
      });
      if (!response.ok) throw new Error('送出失敗');
      // 成功後清空所有狀態
      setItems([]);
      setItemName('');
      setUnitPrice('');
      setQuantity('');
      setInputStep('name');
      alert('已成功寫入 Google Sheet!');
    } catch (e) {
      alert('送出失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  // result-plane 內容
  let resultPlaneLine1 = `商品 - {${itemName || ''}}`;
  let resultPlaneLine2 = '';
  if (inputStep === 'unitPrice') {
    resultPlaneLine2 = unitPrice;
  } else if (inputStep === 'quantity') {
    resultPlaneLine2 = quantity;
  }

  // 合計
  const total = items.reduce((sum, item) => sum + item.result, 0);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      <div className="flex-1 flex flex-col">
        {/* result-sector */}
        <section className="p-4 border-b bg-white" id="result-sector">
          <div className="font-bold text-lg mb-2">商品清單</div>
          <div
            className="space-y-2 overflow-y-auto"
            style={{ height: 'calc(4 * 2rem + 0.5rem)' }} // 每個 item 約 2.5rem 高，留 0.5rem 間距
          >
            {items.length === 0 && <div className="text-zinc-400">尚無品項</div>}
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1 text-base min-h-[1rem]">
                <span className="w-6 text-zinc-500">{idx + 1}</span>
                <span className="flex-1">{item.name}</span>
                <span className="w-32 text-right">{item.unitPrice} × {item.quantity} =</span>
                <span className="w-16 text-right font-semibold">{item.result}</span>
                <button className="ml-2 px-2 py-1 bg-red-200 text-red-700 rounded" onClick={() => handleDeleteItem(idx)}>刪除</button>
              </div>
            ))}
          </div>
          <div className="border-t mt-2 pt-2 flex justify-between font-bold text-lg">
            <span>合計</span>
            <span>{total}</span>
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
                        return `${unitPrice} × ${quantity}`;
                      } else if (unitPrice) {
                        return unitPrice;
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
              <button className="py-5 bg-zinc-200 rounded-xl shadow-md text-base font-semibold hover:bg-blue-100 transition" onClick={() => setInputStep('quantity')}>數量</button>
              {/* 第四行 */}
              <button className="py-5 bg-red-200 rounded-xl shadow-md text-lg font-bold hover:bg-red-300 transition" onClick={handleAC}>AC</button>
              <button className="py-5 bg-white rounded-xl shadow-md text-xl font-bold hover:bg-blue-50 transition" onClick={() => handleKeypadInput('0')}>0</button>
              <button className="py-5 bg-yellow-200 rounded-xl shadow-md text-lg font-bold hover:bg-yellow-300 transition" onClick={handleBackspace}>{'<'}</button>
              <button
                className="py-5 bg-blue-600 text-white rounded-xl shadow-lg text-2xl font-bold hover:bg-blue-700 transition"
                onClick={async () => { handleSubmit()}}
                disabled={isSubmitting}
              >
                +
              </button>
            </div>
          </div>
          {/* 品項輸入 Modal */}
          {showNameModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-80 shadow-lg flex flex-col">
                <div className="font-bold mb-2">輸入品項名稱</div>
                <input
                  className="border p-2 rounded mb-4"
                  type="text"
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  autoFocus
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
        </section>
      </div>
      {/* linked-sector */}
      <section className="flex justify-between items-center px-4 py-3 bg-white border-t" id="linked-sector">
        <a
          href="https://docs.google.com/spreadsheets/d/placeholder"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow"
        >
          檢視雲端表單(另開視窗)
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