'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Bell, User } from 'lucide-react';
import Badge from '../ui/Badge.js';

export default function Navbar({ user }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'purple';
      case 'ADMIN':
        return 'info';
      case 'SERVICE_MANAGER':
        return 'warning';
      case 'TECHNICIAN':
        return 'success';
      case 'ACCOUNTANT':
        return 'info';
      case 'CUSTOMER':
      default:
        return 'default';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center space-x-3">
        <h2 className="text-lg font-bold text-slate-800">
          Welcome back, <span className="text-sky-600">{user?.name || 'User'}</span>
        </h2>
        {user?.role && (
          <Badge variant={getRoleBadgeVariant(user.role)}>
            {user.role.replace('_', ' ')}
          </Badge>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <User className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700">{user?.email}</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 text-sm text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
