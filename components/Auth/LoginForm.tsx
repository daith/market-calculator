'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from '../../app/auth';

export default function LoginForm() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const success = await login(phone, password);
      if (success) {
        router.push('/calculator');
      } else {
        setError('手機號碼錯誤');
      }
    } catch (error) {
      setError('登入失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center text-zinc-800">登入 山腳下園藝 工具 v0.1.0</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded-md text-sm text-center">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label className="block text-sm font-medium text-zinc-700">手機號碼</label>
          <input
            type="phone"
            className="mt-1 w-full rounded-md border border-zinc-300 p-2 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        {/* <div>
          <label className="block text-sm font-medium text-zinc-700">密碼</label>
          <input
            type="password"
            className="mt-1 w-full rounded-md border border-zinc-300 p-2 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div> */}

        <button
          type="submit"
          className="w-full bg-zinc-800 text-white py-2 rounded-md hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? '登入中...' : '登入'}
        </button>
      </form>

      <p className="text-xs text-center text-zinc-500">僅限內部測試使用</p>
    </div>
  );
}