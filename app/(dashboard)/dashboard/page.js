'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Wrench,
  FileText,
  AlertTriangle,
  CalendarCheck,
  Receipt,
  CreditCard,
  PlusCircle,
  Clock,
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, dashRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/dashboard'),
        ]);

        const meData = await meRes.json();
        const dashData = await dashRes.json();

        if (meData.authenticated) setUser(meData.user);
        if (dashData.success) setStats(dashData.stats);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading operational dashboard metrics..." />;

  const role = user?.role || 'CUSTOMER';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operational Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status monitor for lift assets, AMC contracts, and maintenance dispatches.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {role === 'CUSTOMER' && (
            <Link
              href="/complaints?new=true"
              className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Raise Breakdown Complaint</span>
            </Link>
          )}
          {['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER'].includes(role) && (
            <Link
              href="/amc/new"
              className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New AMC Contract</span>
            </Link>
          )}
        </div>
      </div>

      {/* Operational Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Lifts</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{stats?.totalLifts || 0}</span>
            <Link href="/lifts" className="text-xs font-semibold text-sky-600 hover:underline">
              View all
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active AMC</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{stats?.activeAmc || 0}</span>
            <Link href="/amc" className="text-xs font-semibold text-sky-600 hover:underline">
              View contracts
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">AMC Expiring Soon</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">{stats?.upcomingAmcExpiry || 0}</span>
            <span className="text-xs text-slate-400">within 30 days</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Open Complaints</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-600">{stats?.openComplaints || 0}</span>
            <Link href="/complaints" className="text-xs font-semibold text-rose-600 hover:underline">
              View SLA
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Services</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{stats?.pendingServices || 0}</span>
            <Link href="/services" className="text-xs font-semibold text-sky-600 hover:underline">
              View schedule
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Invoices</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{stats?.pendingInvoices || 0}</span>
            <Link href="/invoices" className="text-xs font-semibold text-sky-600 hover:underline">
              View finance
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm col-span-1 sm:col-span-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Outstanding Balance Due</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">₹{(stats?.outstandingAmount || 0).toLocaleString('en-IN')}</span>
            <span className="text-xs text-slate-400 font-medium">Auto-calculated balance</span>
          </div>
        </div>
      </div>
    </div>
  );
}
