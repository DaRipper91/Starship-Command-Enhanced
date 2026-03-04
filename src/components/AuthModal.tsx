import { X } from 'lucide-react';
import React, { useState } from 'react';

import { useToast } from '../contexts/ToastContext';
import { fetchJson } from '../lib/api';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (userId: number, username: string) => void;
}

export function AuthModal({ onClose, onLoginSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = isLogin ? '/api/login' : '/api/register';
    const payload = isLogin
      ? { username, password }
      : { username, email, password };

    try {
      const data = await fetchJson<{ user_id: number }>(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        'Authentication failed',
      );

      if (isLogin) {
        addToast('Logged in successfully', 'success');
        onLoginSuccess(data.user_id, username);
      } else {
        addToast('Registered successfully. Please log in.', 'success');
        setIsLogin(true);
      }
    } catch (err: unknown) {
      addToast(
        err instanceof Error ? err.message : 'An error occurred',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-800/50 p-4">
        <h2 className="text-lg font-bold text-white">
          {isLogin ? 'Log In' : 'Register'}
        </h2>
        <button
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : isLogin ? 'Log In' : 'Register'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-500 hover:underline"
          >
            {isLogin ? 'Register' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
}
