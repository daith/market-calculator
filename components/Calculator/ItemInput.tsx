'use client';

import { Dialog } from '@headlessui/react';
import { useState } from 'react';

interface ItemInputProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (name: string) => void;
}

export default function ItemInput({ isOpen, onClose, onAddItem }: ItemInputProps) {
  const [inputName, setInputName] = useState('');

  const handleConfirm = () => {
    if (inputName.trim()) {
      onAddItem(inputName.trim());
      setInputName('');
      onClose();
    }
  };

  const handleCancel = () => {
    setInputName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleCancel} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
          <Dialog.Title className="text-lg font-bold">輸入商品名稱</Dialog.Title>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="例如：蘋果、奶茶、鳳梨酥..."
            onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
          />
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-zinc-300 rounded hover:bg-zinc-400"
              onClick={handleCancel}
            >
              取消
            </button>
            <button
              className="px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700"
              onClick={handleConfirm}
            >
              確認
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
