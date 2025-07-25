'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './auth';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // 如果已登录，重定向到计算器页面
        router.push('/calculator');
      } else {
        // 如果未登录，重定向到登录页面
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-800 mx-auto mb-4"></div>
          <p className="text-zinc-600">載入中...</p>
        </div>
      </div>
    );
  }

  return null;
}
