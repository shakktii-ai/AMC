import React from 'react';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar.js';
import Navbar from '@/components/layout/Navbar.js';
import { getAuthUser } from '@/lib/auth.js';

export default async function DashboardLayout({ children }) {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar user={user} />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
