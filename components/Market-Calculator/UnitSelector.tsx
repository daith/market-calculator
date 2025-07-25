'use client';

import { Dialog } from '@headlessui/react';
import { useState } from 'react';

interface UnitSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUnit: (unit: string) => void;
  currentUnit?: string;
}

const COMMON_UNITS = [
  '個', '包', '瓶', '罐', '盒', '袋', '條', '片', '塊', '支',
  '公斤', '公克', '台斤', '兩', '磅',
  '公升', '毫升', '杯', '碗',
  '公尺', '公分', '公里', '英吋', '英呎',
  '組', '套', '對', '打', '箱'
];

export default function UnitSelector({ isOpen, onClose, onSelectUnit, currentUnit }: UnitSelectorProps) {
  const [customUnit, setCustomUnit] = useState('');

  const handleSelectUnit = (unit: string) => {
    onSelectUnit(unit);
    onClose();
  };

  const handleCustomUnit = () => {
    if (customUnit.trim()) {
      onSelectUnit(customUnit.trim());
      setCustomUnit('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white p-6 rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
          <Dialog.Title className="text-lg font-bold mb-4">選擇單位</Dialog.Title>
          
          <div className="space-y-4">
            {/* 常用單位 */}
            <div>
              <h3 className="text-sm font-medium text-zinc-600 mb-2">常用單位</h3>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {COMMON_UNITS.map((unit) => (
                  <button
                    key={unit}
                    onClick={() => handleSelectUnit(unit)}
                    className={`p-2 text-sm rounded border hover:bg-zinc-50 ${
                      currentUnit === unit ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-zinc-200'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            {/* 自定義單位 */}
            <div>
              <h3 className="text-sm font-medium text-zinc-600 mb-2">自定義單位</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 border rounded p-2 text-sm"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="輸入自定義單位"
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomUnit()}
                />
                <button
                  onClick={handleCustomUnit}
                  disabled={!customUnit.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-zinc-300 disabled:cursor-not-allowed"
                >
                  確定
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              className="px-4 py-2 bg-zinc-300 rounded hover:bg-zinc-400"
              onClick={onClose}
            >
              取消
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 