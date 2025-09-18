'use client';

import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface User {
  phone: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  checkAuthStatus: () => Promise<boolean>;
  handleApiError: (response: Response) => boolean; // 新增：處理 API 錯誤
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 檢查認證狀態的函數
  const checkAuthStatus = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // 發送一個簡單的測試請求來檢查後端是否正常
      // 這裡我們用已知會返回錯誤的請求來測試連線狀態
      const response = await fetch('https://api-awdqlpezfa-uc.a.run.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: 'test', password: 'test' }),
      });
      
      // 如果服務器響應，說明後端是可用的
      // 不管返回成功或失敗，只要能收到響應就說明服務正常
      return response.ok || response.status === 400; // 400 也表示服務器正常運行
    } catch (error) {
      console.error('認證狀態檢查失敗 - 後端服務可能不可用:', error);
      return false;
    }
  };

  // 清理認證狀態的函數
  const clearAuthState = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('lastLoginTime');
  };

  // 登出並導向登入頁面
  const logout = () => {
    clearAuthState();
    router.push('/login');
  };

  // 自動登出（避免在 useEffect 中的循環問題）
  const autoLogout = (reason: string) => {
    console.warn(reason);
    clearAuthState();
    // 使用 setTimeout 避免在 useEffect 中直接調用 router.push
    setTimeout(() => {
      router.push('/login');
    }, 100);
  };

  // 通用 API 錯誤處理函數
  const handleApiError = (response: Response): boolean => {
    if (response.status === 401 || response.status === 403) {
      console.warn('API 返回認證失效，自動導向登入頁面');
      autoLogout('Token 已過期或無效');
      return true; // 表示已處理錯誤
    }
    return false; // 表示沒有處理錯誤，調用者需要自行處理
  };

  useEffect(() => {
    // 检查本地存储中的登录状态
    const savedUser = localStorage.getItem('user');
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    
    if (savedUser && lastLoginTime) {
      try {
        const userData = JSON.parse(savedUser);
        const loginTime = parseInt(lastLoginTime);
        const now = Date.now();
        setUser(userData);
        // 檢查是否超過一天（24小時）
        // const ONE_DAY = 12 * 60 * 60 * 1000;
        // if (now - loginTime < ONE_DAY) {
        //   setUser(userData);
          
        //   // 異步檢查後端狀態
        //   checkAuthStatus().then(isValid => {
        //     if (!isValid) {
        //       autoLogout('後端認證狀態失效，自動導向登入頁面');
        //     }
        //   });
        // } else {
        //   // 超過時限，自動導向登入頁面
        //   autoLogout('登入時間已過期，自動導向登入頁面');
        // }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('lastLoginTime');
      }
    }
    setIsLoading(false);
  }, []);

  // 定期檢查認證狀態（每30分鐘）
  // useEffect(() => {
  //   if (!user) return;

  //   const interval = setInterval(async () => {
  //     const isValid = await checkAuthStatus();
  //     if (!isValid) {
  //       autoLogout('定期檢查發現認證狀態失效，自動導向登入頁面');
  //     }
  //   }, 30 * 60 * 1000); // 30分鐘檢查一次

  //   return () => clearInterval(interval);
  // }, [user]);

  const login = async (phone: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('https://api-awdqlpezfa-uc.a.run.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      
      if (!res.ok) {
        throw new Error('登入請求失敗');
      }
      
      const data = await res.json();
      if (data.result && data.userInfo) {
        const userData = { phone: data.userInfo.phone, name: data.userInfo.name };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('lastLoginTime', Date.now().toString());
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('登入過程發生錯誤:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, checkAuthStatus, handleApiError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 