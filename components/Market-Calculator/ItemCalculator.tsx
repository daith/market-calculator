'use client';

import { Dialog } from '@headlessui/react';
import { useEffect, useState } from 'react';
import UnitSelector from './UnitSelector';

interface ItemCalculatorProps {
  itemName: string;
  onCalculate: (name: string, expression: string, result: number, unit: string, unitPrice: number, quantity: number) => void;
  isActive: boolean;
  onActivate: () => void;
  onEditName: (oldName: string, newName: string) => void;
  onCalculationComplete?: () => void;
  initialExpression?: string;
  isEditMode?: boolean;
  initialData?: {
    unit: string;
    unitPrice: number;
    quantity: number;
  };
}

export default function ItemCalculator({ 
  itemName, 
  onCalculate, 
  isActive, 
  onActivate,
  onEditName,
  onCalculationComplete,
  initialExpression = '',
  isEditMode = false,
  initialData
}: ItemCalculatorProps) {
  const [expression, setExpression] = useState(initialExpression);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [unit, setUnit] = useState(initialData?.unit || '個');
  const [unitPrice, setUnitPrice] = useState(initialData?.unitPrice || 0);
  const [quantity, setQuantity] = useState(initialData?.quantity || 1);
  const [showUnitSelector, setShowUnitSelector] = useState(false);
  const [currentInputMode, setCurrentInputMode] = useState<'unitPrice' | 'quantity' | null>(null);
  const [isFirstInput, setIsFirstInput] = useState(true);

  // 當進入編輯模式時，清空表達式
  useEffect(() => {
    if (isEditMode) {
      setExpression('');
    }
  }, [isEditMode]);

  // 當有初始數據時，設置到狀態中
  useEffect(() => {
    if (initialData) {
      setUnit(initialData.unit);
      setUnitPrice(initialData.unitPrice);
      setQuantity(initialData.quantity);
    }
  }, [initialData]);

  // 當商品名稱改變時，重置為默認值（除非有初始數據）
  useEffect(() => {
    if (!initialData) {
      setUnit('個');
      setUnitPrice(0);
      setQuantity(1);
    }
  }, [itemName, initialData]);

  const handleButtonClick = (val: string) => {
    if (isActive && currentInputMode) {
      if (isFirstInput) {
        // 第一次輸入時直接替換整個表達式
        setExpression(val);
        setIsFirstInput(false);
      } else {
        // 後續輸入追加
        setExpression((prev) => prev + val);
      }
    }
  };

  const handleClear = () => {
    if (isActive && currentInputMode) {
      setExpression('');
      setIsFirstInput(true);
    }
  };

  const handleCancel = () => {
    if (isActive) {
      setExpression('');
      setCurrentInputMode(null);
      setIsFirstInput(true);
      // 不重置价格、单位和数量，保持当前值
      // 通知父組件計算已完成，回到初始狀態
      onCalculationComplete?.();
    }
  };

  const handleEqual = () => {
    if (!isActive || !currentInputMode) return;
    
    try {
      const result = eval(expression);
      
      if (currentInputMode === 'unitPrice') {
        setUnitPrice(result);
      } else if (currentInputMode === 'quantity') {
        setQuantity(result);
      }
      
      setExpression('');
      setCurrentInputMode(null);
      setIsFirstInput(true);
    } catch {
      alert('運算錯誤');
    }
  };

  const handleConfirm = () => {
    if (!isActive) return;
    
    const totalPrice = unitPrice * quantity;
    onCalculate(itemName, `${unitPrice} × ${quantity}`, totalPrice, unit, unitPrice, quantity);
    setExpression('');
    setCurrentInputMode(null);
    setIsFirstInput(true);
    // 通知父組件計算已完成，回到初始狀態
    onCalculationComplete?.();
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(itemName);
    setShowEditModal(true);
  };

  const handleConfirmEdit = () => {
    if (editName.trim() && editName.trim() !== itemName) {
      onEditName(itemName, editName.trim());
    }
    setShowEditModal(false);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
  };

  const handleUnitClick = () => {
    if (isActive) {
      setShowUnitSelector(true);
    }
  };

  const handleUnitPriceClick = () => {
    if (isActive) {
      setCurrentInputMode('unitPrice');
      setExpression(unitPrice.toString());
      setIsFirstInput(true); // 重置为第一次输入状态
    }
  };

  const handleQuantityClick = () => {
    if (isActive) {
      setCurrentInputMode('quantity');
      setExpression(quantity.toString());
      setIsFirstInput(true); // 重置为第一次输入状态
    }
  };

  // 檢查是否可以點擊確定按鈕
  const canConfirm = isActive && unit && unitPrice > 0 && quantity > 0;

  return (
    <>
      <div className={`bg-white rounded-xl shadow p-4 space-y-4 ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
        {/* 標題和按鈕區域 */}
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center cursor-pointer"
            onClick={onActivate}
          >
            <h3 className={`text-lg font-bold ${isActive ? 'text-blue-600' : 'text-zinc-400'}`}>
              商品計算器 - {itemName}
            </h3>
            {isActive && (
              <button
                onClick={handleEditClick}
                className="p-1 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded ml-2"
                title="編輯商品名稱"
              >
                ✏️
              </button>
            )}
          </div>
          
          {/* 確定和取消按鈕 */}
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={`px-4 py-2 rounded font-medium ${
                canConfirm 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
              }`}
            >
              確定
            </button>
            <button
              onClick={handleCancel}
              disabled={!isActive}
              className={`px-4 py-2 rounded font-medium ${
                isActive 
                  ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' 
                  : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
              }`}
            >
              取消
            </button>
          </div>
        </div>

        {/* 商品信息顯示區域 */}
        <div className="bg-blue-50 p-3 rounded space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-600">單位:</span>
            <span className="font-medium">{unit}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-600">單位價格:</span>
            <span className="font-medium">${unitPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-600">購買數量:</span>
            <span className="font-medium">{quantity}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between items-center font-bold text-green-600">
              <span>總價:</span>
              <span>${(unitPrice * quantity).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 操作按鈕區域 */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleUnitClick}
            disabled={!isActive}
            className={`p-3 rounded font-medium ${
              isActive 
                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
            }`}
          >
            單位: {unit}
          </button>
          <button
            onClick={handleUnitPriceClick}
            disabled={!isActive}
            className={`p-3 rounded font-medium ${
              isActive 
                ? currentInputMode === 'unitPrice'
                  ? 'bg-green-100 text-green-800 border-2 border-green-300'
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
            }`}
          >
            價格: ${unitPrice.toFixed(2)}
          </button>
          <button
            onClick={handleQuantityClick}
            disabled={!isActive}
            className={`p-3 rounded font-medium ${
              isActive 
                ? currentInputMode === 'quantity'
                  ? 'bg-green-100 text-green-800 border-2 border-green-300'
                  : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
            }`}
          >
            數量: {quantity}
          </button>
        </div>

        {/* 計算機顯示區域 */}
        {currentInputMode && (
          <div className="bg-zinc-100 p-3 rounded text-right text-lg font-mono min-h-[2.5rem] flex items-center justify-end">
            {expression || '0'}
          </div>
        )}

        {/* 計算機按鈕區域 */}
        {currentInputMode && (
          <div className="grid grid-cols-4 gap-2 text-lg text-center">
            {["1","2","3","+","4","5","6","-","7","8","9","*"].map((btn) => (
              <button
                key={btn}
                onClick={() => handleButtonClick(btn)}
                className="p-3 rounded border bg-zinc-200 hover:bg-zinc-300"
              >
                {btn}
              </button>
            ))}
            <div className="col-span-2">
              <button
                className="w-full p-3 rounded border bg-zinc-200 hover:bg-zinc-300"
                onClick={() => handleButtonClick('0')}
              >
                0
              </button>
            </div>
            <button
              onClick={() => handleButtonClick('.')}
              className="p-3 rounded border bg-zinc-200 hover:bg-zinc-300"
            >
              .
            </button>
            <button
              onClick={() => handleButtonClick('/')}
              className="p-3 rounded border bg-zinc-200 hover:bg-zinc-300"
            >
              /
            </button>
            <div className="col-span-2">
              <button
                className="w-full p-3 bg-red-100 text-red-800 rounded hover:bg-red-200"
                onClick={handleClear}
              >
                清除
              </button>
            </div>
            <div className="col-span-2">
              <button
                className="w-full p-3 rounded border bg-zinc-200 hover:bg-zinc-300"
                onClick={handleEqual}
              >
                =
              </button>
            </div>
          </div>
        )}

        {/* 非輸入模式的計算機顯示 */}
        {!currentInputMode && (
          <>
            <div className="bg-zinc-100 p-3 rounded text-right text-lg font-mono min-h-[2.5rem] flex items-center justify-end text-zinc-400">
              0
            </div>
            <div className="grid grid-cols-4 gap-2 text-lg text-center">
              {["1","2","3","+","4","5","6","-","7","8","9","*"].map((btn) => (
                <button
                  key={btn}
                  disabled={true}
                  className="p-3 rounded border bg-zinc-100 text-zinc-400 cursor-not-allowed"
                >
                  {btn}
                </button>
              ))}
              <div className="col-span-2">
                <button
                  className="w-full p-3 rounded border bg-zinc-100 text-zinc-400 cursor-not-allowed"
                  disabled={true}
                >
                  0
                </button>
              </div>
              <button
                disabled={true}
                className="p-3 rounded border bg-zinc-100 text-zinc-400 cursor-not-allowed"
              >
                .
              </button>
              <button
                disabled={true}
                className="p-3 rounded border bg-zinc-100 text-zinc-400 cursor-not-allowed"
              >
                /
              </button>
              <div className="col-span-2">
                <button
                  className="w-full p-3 bg-zinc-100 text-zinc-400 rounded cursor-not-allowed"
                  disabled={true}
                >
                  清除
                </button>
              </div>
              <div className="col-span-2">
                <button
                  className="w-full p-3 rounded border bg-zinc-100 text-zinc-400 cursor-not-allowed"
                  disabled={true}
                >
                  =
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 編輯商品名稱模態框 */}
      <Dialog open={showEditModal} onClose={handleCancelEdit} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
            <Dialog.Title className="text-lg font-bold">編輯商品名稱</Dialog.Title>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="輸入新的商品名稱"
              onKeyPress={(e) => e.key === 'Enter' && handleConfirmEdit()}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-zinc-300 rounded hover:bg-zinc-400"
                onClick={handleCancelEdit}
              >
                取消
              </button>
              <button
                className="px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700"
                onClick={handleConfirmEdit}
              >
                確認
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* 單位選擇器 */}
      <UnitSelector
        isOpen={showUnitSelector}
        onClose={() => setShowUnitSelector(false)}
        onSelectUnit={setUnit}
        currentUnit={unit}
      />
    </>
  );
} 