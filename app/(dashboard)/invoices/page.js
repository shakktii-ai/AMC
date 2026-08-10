'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Receipt, Plus, Search, Eye } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invoices');
      const data = await res.json();
      if (data.success) setInvoices(data.invoices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500 mt-0.5">AMC, Service, and Other Invoices with state GST calculations.</p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading invoice records..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Type</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Balance Due</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-sky-600">{inv.invoiceNumber}</td>
                  <td className="p-4">
                    <Badge variant="info">{inv.type}</Badge>
                  </td>
                  <td className="p-4 font-bold text-slate-900">{inv.customerId?.name || 'Customer'}</td>
                  <td className="p-4 text-xs text-slate-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="p-4 font-bold text-rose-600">₹{(inv.balanceDue || 0).toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    <Badge variant={inv.computedStatus === 'PAID' ? 'success' : inv.computedStatus === 'OVERDUE' ? 'danger' : 'warning'}>
                      {inv.computedStatus}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/invoices/${inv._id}`}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 p-2 rounded-lg border border-sky-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
