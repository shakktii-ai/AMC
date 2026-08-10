'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Search, Eye } from 'lucide-react';
import Badge from '@/components/ui/Badge.js';
import LoadingSpinner from '@/components/ui/LoadingSpinner.js';

export default function AmcPage() {
  const [amcs, setAmcs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAmcs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/amc');
      const data = await res.json();
      if (data.success) setAmcs(data.amcs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAmcs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Annual Maintenance Contracts (AMC)</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage comprehensive, non-comprehensive contracts, and automated PPM generation.</p>
        </div>
        <Link
          href="/amc/new"
          className="inline-flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New AMC Contract</span>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching AMC contracts..." />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-4">Contract #</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Plan & Interval</th>
                <th className="p-4">Contract Period</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Dynamic Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {amcs.map((a) => (
                <tr key={a._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-sky-600">{a.contractNumber}</td>
                  <td className="p-4 font-bold text-slate-900">{a.customerId?.name}</td>
                  <td className="p-4 text-xs">
                    <span className="font-semibold text-slate-800">{a.planType}</span>
                    <div className="text-slate-400">{a.ppmInterval} PPM</div>
                  </td>
                  <td className="p-4 text-xs text-slate-600">
                    {new Date(a.startDate).toLocaleDateString()} to {new Date(a.endDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-bold text-slate-900">₹{a.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    <Badge variant={a.computedStatus === 'ACTIVE' ? 'success' : a.computedStatus === 'EXPIRING_SOON' ? 'warning' : 'danger'}>
                      {a.computedStatus}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/amc/${a._id}`}
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
