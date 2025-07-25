'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../../app/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
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

  // 如果未登录，不显示内容（会被重定向）
  if (!user) {
    return null;
  }

  // 如果已登录，显示受保护的内容
  return <>{children}</>;
} 