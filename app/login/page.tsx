// src/app/login/page.tsx

'use client';

import LoginForm from '@/components/Auth/LoginForm';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../auth';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // 如果已登录，重定向到计算器页面
      router.push('/calculator');
    }
  }, [user, isLoading, router]);

  // 如果已登录，显示加载状态（会被重定向）
  if (isLoading || user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-800 mx-auto mb-4"></div>
          <p className="text-zinc-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-zinc-100 flex flex-col items-center justify-center p-4">
      {/* 跨設備縮放測試組件 - 開發測試用 */}
      <div className="w-full max-w-4xl mb-6">
      </div>

      <LoginForm />
    </div>
  );
}