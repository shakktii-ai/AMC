'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Receipt, CreditCard, Plus, TrendingUp, AlertTriangle } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function FinanceDashboardPage() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [iRes, pRes] = await Promise.all([fetch('/api/invoices'), fetch('/api/payments')]);
        const iData = await iRes.json();
        const pData = await pRes.json();

        if (iData.success) setInvoices(iData.invoices);
        if (pData.success) setPayments(pData.payments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading finance & billing data..." />;

  const totalBilled = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  const totalCollected = payments.reduce((acc, p) => acc + (p.amountPaid || 0), 0);
  const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance & Billing Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Invoices, GST calculations, payment collection, and receipts.</p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400">Total Billed</span>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{totalBilled.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400">Total Payments Collected</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">₹{totalCollected.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400">Outstanding Balance Due</span>
          <div className="text-2xl font-black text-rose-600 mt-1">₹{totalOutstanding.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Recent Invoices</h3>
          <Link href="/invoices" className="text-xs font-semibold text-sky-600">
            View All Invoices →
          </Link>
        </div>
        <div className="divide-y text-sm">
          {invoices.slice(0, 5).map((inv) => (
            <div key={inv._id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</div>
                <div className="text-xs text-slate-500">{inv.customerId?.name} • Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <Badge variant={inv.status === 'PAID' ? 'success' : 'danger'}>{inv.status}</Badge>
                <div className="text-sm font-bold text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
