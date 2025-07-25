'use client';

import { useState } from 'react';

interface Item {
  name: string;
  expression: string;
  result: number;
  unit: string;
  unitPrice: number;
  quantity: number;
}

interface ItemListProps {
  items: Item[];
  onConfirmOrder: () => void;
  onItemClick: (itemName: string) => void;
  onDeleteItem: (itemName: string) => void;
}

export default function ItemList({ items, onConfirmOrder, onItemClick, onDeleteItem }: ItemListProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const total = items.reduce((sum, item) => sum + item.result, 0);

  const handleItemClick = (itemName: string) => {
    setSelectedItem(itemName);
  };

  const handleEdit = () => {
    if (selectedItem) {
      onItemClick(selectedItem);
      setSelectedItem(null);
    }
  };

  const handleDelete = () => {
    if (selectedItem) {
      if (confirm(`確定要刪除商品 "${selectedItem}" 嗎？`)) {
        onDeleteItem(selectedItem);
      }
      setSelectedItem(null);
    }
  };

  const handleCancel = () => {
    setSelectedItem(null);
  };

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-4 h-full flex flex-col">
      <h2 className="text-xl font-bold flex-shrink-0">商品清單</h2>
      
      {items.length === 0 ? (
        <div className="text-zinc-500 text-center py-8 flex-1 flex items-center justify-center">
          尚無商品，請點擊「加入商品」開始計算
        </div>
      ) : (
        <>
          <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
            {items.map((item, idx) => (
              <div 
                key={idx} 
                className={`flex justify-between items-center p-3 bg-zinc-50 rounded cursor-pointer hover:bg-zinc-100 transition-colors ${
                  selectedItem === item.name ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => handleItemClick(item.name)}
              >
                <div className="text-sm flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-zinc-500 text-xs">
                    {item.quantity} {item.unit} × ${item.unitPrice.toFixed(2)} = {item.expression}
                  </div>
                </div>
                <div className="font-bold text-green-600">
                  ${item.result.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t pt-4 flex-shrink-0">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>總計:</span>
              <span className="text-green-600">${total.toFixed(2)}</span>
            </div>
          </div>
          
          <button
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium flex-shrink-0"
            onClick={onConfirmOrder}
          >
            確定訂單
          </button>
        </>
      )}

      {/* 操作選單 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4 text-center">
              選擇操作
            </h3>
            <p className="text-sm text-zinc-600 mb-6 text-center">
              商品：{selectedItem}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleEdit}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                ✏️ 編輯商品
              </button>
              
              <button
                onClick={handleDelete}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium"
              >
                🗑️ 刪除商品
              </button>
              
              <button
                onClick={handleCancel}
                className="w-full bg-zinc-300 text-zinc-700 py-3 rounded-lg hover:bg-zinc-400 font-medium"
              >
                ❌ 取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
