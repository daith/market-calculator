// src/app/calculator/page.tsx

'use client';

import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import ItemCalculator from '@/components/Calculator/ItemCalculator';
import ItemInput from '@/components/Calculator/ItemInput';
import ItemList from '@/components/Calculator/ItemList';
import { useState } from 'react';
import { useAuth } from '../auth';

interface Item {
  name: string;
  expression: string;
  result: number;
  unit: string;
  unitPrice: number;
  quantity: number;
}

// 計算機狀態類型
type CalculatorState = 'idle' | 'calculating' | 'editing';

function CalculatorPageContent() {
  const [items, setItems] = useState<Item[]>([]);
  const [itemNames, setItemNames] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<string>('');
  const [calculatorState, setCalculatorState] = useState<CalculatorState>('idle');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const { user, logout } = useAuth();

  // 重置到初始狀態
  const resetToInitial = () => {
    setCalculatorState('idle');
    setCurrentItem('');
    setEditingItem(null);
  };

  const handleAddItem = (name: string) => {
    // 生成唯一的商品名稱（如果重複則添加編號）
    let uniqueName = name;
    let counter = 1;
    
    while (itemNames.includes(uniqueName)) {
      uniqueName = `${name} (${counter})`;
      counter++;
    }
    
    // 添加到商品名稱列表
    setItemNames([...itemNames, uniqueName]);
    
    // 設置為當前商品並進入計算狀態
    setCurrentItem(uniqueName);
    setCalculatorState('calculating');
    setEditingItem(null);
  };

  const handleCalculate = (name: string, expression: string, result: number, unit: string, unitPrice: number, quantity: number) => {
    const existingItemIndex = items.findIndex(item => item.name === name);
    
    if (existingItemIndex >= 0) {
      // 更新現有項目
      const updatedItems = [...items];
      updatedItems[existingItemIndex] = { name, expression, result, unit, unitPrice, quantity };
      setItems(updatedItems);
    } else {
      // 添加新項目
      setItems([...items, { name, expression, result, unit, unitPrice, quantity }]);
    }
  };

  const handleConfirmOrder = async () => {
    if (items.length === 0) {
      alert('沒有商品可以確認訂單');
      return;
    }

    try {
      // 顯示載入狀態
      const confirmButton = document.querySelector('button[onclick*="handleConfirmOrder"]');
      if (confirmButton) {
        confirmButton.textContent = '處理中...';
        confirmButton.setAttribute('disabled', 'true');
      }

      // 發送訂單到 Firebase Functions API
      const apiUrl =
        process.env.NODE_ENV === 'production'
          ? 'https://api-awdqlpezfa-uc.a.run.app/api'
          : '/api';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ 訂單已成功寫入 Google Sheets！\n\n訂單編號: ${result.orderMasterId}\n商品數量: ${result.orderData.itemCount}\n總計: $${result.orderData.total.toFixed(2)}`);
        // 清空資料並回到初始狀態
        setItems([]);
        setItemNames([]);
        resetToInitial();
      } else {
        throw new Error(result.error || '寫入失敗');
      }
    } catch (error) {
      console.error('確認訂單失敗:', error);
      alert(`❌ 確認訂單失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      // 恢復按鈕狀態
      const confirmButton = document.querySelector('button[onclick*="handleConfirmOrder"]');
      if (confirmButton) {
        confirmButton.textContent = '確定訂單';
        confirmButton.removeAttribute('disabled');
      }
    }
  };

  const handleActivateCalculator = (name: string) => {
    setCurrentItem(name);
    setCalculatorState('calculating');
  };

  const handleEditName = (oldName: string, newName: string) => {
    // 生成唯一的新名稱
    let uniqueNewName = newName;
    let counter = 1;
    
    while (itemNames.includes(uniqueNewName) && uniqueNewName !== oldName) {
      uniqueNewName = `${newName} (${counter})`;
      counter++;
    }
    
    // 更新商品名稱列表
    const updatedItemNames = itemNames.map(name => 
      name === oldName ? uniqueNewName : name
    );
    setItemNames(updatedItemNames);

    // 更新商品項目列表
    const updatedItems = items.map(item => 
      item.name === oldName ? { ...item, name: uniqueNewName } : item
    );
    setItems(updatedItems);

    // 如果編輯的是當前商品，更新當前商品名稱
    if (currentItem === oldName) {
      setCurrentItem(uniqueNewName);
    }
  };

  const handleCalculationComplete = () => {
    // 退出计算模式，清空当前商品名字
    setCalculatorState('idle');
    setCurrentItem(''); // 清空商品名字
    setEditingItem(null); // 清空编辑状态
  };

  const handleItemClick = (itemName: string) => {
    // 找到要編輯的商品
    const itemToEdit = items.find(item => item.name === itemName);
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      setCurrentItem(itemName);
      setCalculatorState('editing');
    }
  };

  const handleDeleteItem = (itemName: string) => {
    setItems(prevItems => prevItems.filter(item => item.name !== itemName));
    setItemNames(prevNames => prevNames.filter(name => name !== itemName));
    
    // 如果刪除的是當前正在編輯的商品，回到初始狀態
    if (currentItem === itemName) {
      resetToInitial();
    }
  };

  // 當計算機正在使用時禁用加入商品按鈕
  const canAddItem = calculatorState === 'idle';

  // 獲取初始數據（編輯模式時）
  const getInitialData = () => {
    if (calculatorState === 'editing' && editingItem) {
      return {
        unit: editingItem.unit,
        unitPrice: editingItem.unitPrice,
        quantity: editingItem.quantity
      };
    }
    return undefined;
  };

  // 狀態顯示文字
  const getStateDisplayText = () => {
    switch (calculatorState) {
      case 'idle':
        return '🟢 閒置狀態 (idle)';
      case 'calculating':
        return '🔵 計算中 (calculating) - ' + currentItem;
      case 'editing':
        return '🟡 編輯中 (editing) - ' + currentItem;
      default:
        return '❓ 未知狀態';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-50">
      {/* 狀態顯示區域 */}
      <div className="hidden">
        <div className="text-sm font-mono">
          <div className="font-bold text-blue-600">📊 當前狀態:</div>
          <div className="mt-1">{getStateDisplayText()}</div>
          <div className="mt-1 text-gray-600">
            加入商品按鈕: {canAddItem ? '✅ 可點擊' : '❌ 禁用'} | 
            商品數量: {itemNames.length} | 
            當前商品: {currentItem || '無'}
          </div>
        </div>
      </div>

      {/* 頂部標題和按鈕區域 */}
      <div className="flex-shrink-0 p-6 pb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-zinc-800">商品計算器</h1>
          <span className="text-sm text-zinc-500">歡迎，{user?.name}</span>
        </div>
        <div className="flex gap-2">
          <button
            className={`px-6 py-3 rounded-lg font-medium ${
              canAddItem 
                ? 'bg-zinc-800 text-white hover:bg-zinc-700' 
                : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
            }`}
            onClick={() => canAddItem && setShowModal(true)}
            disabled={!canAddItem}
          >
            加入商品
          </button>
          <button
            className="px-4 py-3 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700"
            onClick={logout}
          >
            登出
          </button>
        </div>
      </div>

      <div className="flex-1 px-6 pb-6 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* 商品清單側邊欄 */}
        <div className="lg:col-span-1 min-h-0">
          <ItemList 
            items={items} 
            onConfirmOrder={handleConfirmOrder}
            onItemClick={handleItemClick}
            onDeleteItem={handleDeleteItem}
          />
        </div>

        {/* 計算器區域 */}
        <div className="lg:col-span-3 min-h-0">
          <ItemCalculator
            itemName={currentItem || '未選擇商品'}
            onCalculate={handleCalculate}
            isActive={calculatorState !== 'idle'}
            onActivate={() => {
              if (canAddItem && !currentItem) {
                setShowModal(true);
              } else if (currentItem) {
                // 如果已有当前商品，重新激活计算器
                setCalculatorState('calculating');
              }
            }}
            onEditName={handleEditName}
            onCalculationComplete={handleCalculationComplete}
            isEditMode={calculatorState === 'editing'}
            initialData={getInitialData()}
          />
        </div>
      </div>

      {/* 商品輸入模態框 */}
      <ItemInput
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAddItem={handleAddItem}
      />
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