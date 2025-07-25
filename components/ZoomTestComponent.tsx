import { useEffect, useState } from 'react';

export default function ZoomTestComponent() {
  const [deviceInfo, setDeviceInfo] = useState<{
    userAgent: string;
    isIOS: boolean;
    isAndroid: boolean;
    viewportWidth: number;
    viewportHeight: number;
  } | null>(null);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOS = /iP(ad|hone|od)/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    
    setDeviceInfo({
      userAgent,
      isIOS,
      isAndroid,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });

    const handleResize = () => {
      setDeviceInfo(prev => prev ? {
        ...prev,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      } : null);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [testInputs, setTestInputs] = useState({
    small: '',
    normal: '',
    large: '',
  });

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-bold mb-3 text-lg">🔍 跨設備縮放測試</h3>
      
      {/* 設備資訊 */}
      {deviceInfo && (
        <div className="mb-4 text-sm bg-white p-3 rounded border">
          <div className="font-semibold mb-2">設備資訊:</div>
          <div>設備類型: {deviceInfo.isIOS ? 'iOS' : deviceInfo.isAndroid ? 'Android' : '其他'}</div>
          <div>視窗尺寸: {deviceInfo.viewportWidth} × {deviceInfo.viewportHeight}</div>
          <div className="text-xs text-gray-500 mt-1">
            UA: {deviceInfo.userAgent.substring(0, 50)}...
          </div>
        </div>
      )}

      {/* 測試輸入框 */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            小字體輸入框 (原本12px，已強制16px):
          </label>
          <input
            type="text"
            value={testInputs.small}
            onChange={(e) => setTestInputs(prev => ({ ...prev, small: e.target.value }))}
            placeholder="測試iOS是否縮放"
            className="w-full border p-2 rounded"
            style={{ fontSize: '12px' }} // 這會被CSS覆蓋為16px
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            標準輸入框 (16px):
          </label>
          <input
            type="text"
            value={testInputs.normal}
            onChange={(e) => setTestInputs(prev => ({ ...prev, normal: e.target.value }))}
            placeholder="正常大小輸入框"
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            大字體輸入框 (18px):
          </label>
          <input
            type="text"
            value={testInputs.large}
            onChange={(e) => setTestInputs(prev => ({ ...prev, large: e.target.value }))}
            placeholder="大字體輸入框"
            className="w-full border p-2 rounded text-lg"
          />
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <div className="font-semibold mb-1">測試重點:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>點擊任何輸入框時，iOS Safari 不應該自動縮放頁面</li>
          <li>虛擬鍵盤彈出時，頁面布局應該保持穩定</li>
          <li>雙擊任何區域都不應該觸發縮放</li>
          <li>所有設備的行為應該一致</li>
        </ul>
      </div>
    </div>
  );
} 