'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Redirect according to role
      const role = data.user.role;
      if (role === 'TECHNICIAN') {
        router.push('/technician');
      } else if (role === 'ACCOUNTANT') {
        router.push('/finance');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillTestCredentials = (testEmail) => {
    setEmail(testEmail);
    setPassword('Test@12345');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center text-white font-black text-3xl mx-auto shadow-lg shadow-sky-500/30">
          L
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-white tracking-tight">Lift AMC Pro</h2>
        <p className="mt-1 text-sm text-slate-400">Maintenance & Operations System</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl sm:rounded-2xl border border-slate-100 sm:px-10">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm text-slate-900"
                  placeholder="user@test.local"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-sky-600 hover:text-sky-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
              Quick Test Login Accounts (Dev Only)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillTestCredentials('superadmin@test.local')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 rounded font-medium text-slate-700 text-left truncate"
              >
                SUPER ADMIN
              </button>
              <button
                type="button"
                onClick={() => fillTestCredentials('admin@test.local')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 rounded font-medium text-slate-700 text-left truncate"
              >
                ADMIN
              </button>
              <button
                type="button"
                onClick={() => fillTestCredentials('manager@test.local')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 rounded font-medium text-slate-700 text-left truncate"
              >
                SERVICE MANAGER
              </button>
              <button
                type="button"
                onClick={() => fillTestCredentials('technician@test.local')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 rounded font-medium text-slate-700 text-left truncate"
              >
                TECHNICIAN
              </button>
              <button
                type="button"
                onClick={() => fillTestCredentials('accountant@test.local')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 rounded font-medium text-slate-700 text-left truncate"
              >
                ACCOUNTANT
              </button>
              <button
                type="button"
                onClick={() => fillTestCredentials('customer@test.local')}
                className="px-2 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 rounded font-medium text-slate-700 text-left truncate"
              >
                CUSTOMER
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">Password: Test@12345</p>
          </div>
        </div>
      </div>
    </div>
  );
}
